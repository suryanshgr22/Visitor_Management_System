const jwt = require('jsonwebtoken');
const Host = require('../models/Host');
const Visitor = require('../models/Visitor');
const {generateQRCode} = require('../utils/generateQRCode');
const dayjs = require('dayjs');

const loginHost = async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: 'Login ID and password are required' });
  }

  try {
    const host = await Host.findOne({ username });

    if (!host || !(await host.matchPassword(password))) {
      return res.status(401).json({ message: 'Invalid login credentials' });
    }

    const token = jwt.sign(
      { id: host._id, role: 'host' },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    res.status(200).json({
      message: 'Host login successful',
      token,
      host: {
        id: host._id,
        name: host.name,
        email: host.email,
      },
    });
  } catch (err) {
    res.status(500).json({ message: 'Login failed', error: err.message });
  }
};


const addVisitor = async (req, res) => {
  const {
    fullname,
    purpose,
    email,
    contact,
    photo, // optional
    expectedCheckInFrom,
    expectedCheckInTo
  } = req.body;

  if (!fullname || !purpose || !expectedCheckInFrom || !expectedCheckInTo) {
    return res.status(400).json({
      message: 'Required fields: fullname, purpose, expectedCheckInFrom, expectedCheckInTo',
    });
  }

  try {
    const hostId = req.user.id;
    const host = await Host.findById(hostId);
    if (!host) return res.status(404).json({ message: 'Host not found' });

    // Convert to Date objects
    const fromDate = new Date(expectedCheckInFrom);
    const toDate = new Date(expectedCheckInTo);

    // Normalize to start and end of day for daily check
    const startOfDay = new Date(fromDate.setHours(0, 0, 0, 0));
    const endOfDay = new Date(fromDate.setHours(23, 59, 59, 999));

    // Count pre-approved visitors on that day for the host
    const existingPreApprovals = await Visitor.countDocuments({
      hostEmployee: hostId,
      preApproved: true,
      expectedCheckInFrom: { $lt: endOfDay },
      expectedCheckInTo: { $gt: startOfDay },
    });

    if (existingPreApprovals >= host.preApprovalLimit) {
      return res.status(400).json({
        message: `Pre-approval limit of ${host.preApprovalLimit} reached for this date.`,
      });
    }

    const newVisitor = new Visitor({
      fullname,
      purpose,
      email,
      contact,
      photo,
      hostEmployee: hostId,
      preApproved: true,
      expectedCheckInFrom: new Date(expectedCheckInFrom),
      expectedCheckInTo: new Date(expectedCheckInTo),
      status: 'Approved',
    });

    await newVisitor.save();

    await Host.findByIdAndUpdate(hostId, {
      $push: { preApproved: newVisitor._id },
    });

    res.status(201).json({
      message: 'Visitor added and pre-approved successfully.',
      visitor: {
        id: newVisitor._id,
        fullname: newVisitor.fullname,
        email: newVisitor.email,
        purpose: newVisitor.purpose,
        contact: newVisitor.contact,
        expectedCheckInFrom: newVisitor.expectedCheckInFrom,
        expectedCheckInTo: newVisitor.expectedCheckInTo,
        status: newVisitor.status,
        preApproved: newVisitor.preApproved,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: 'Failed to pre-approve visitor.',
      error: err.message,
    });
  }
};

const getAllVisitors = async (req, res) => {
  const hostId = req.user.id;
  try {
    const visitors = await Visitor.find({ hostEmployee: hostId }).sort({ createdAt: -1 });
    res.status(200).json({ visitors });
  } catch (err) {
    res.status(500).json({ message: 'Error fetching visitors', error: err.message });
  }
};



const getPreApprovedVisitors = async (req, res) => {
  const hostId = req.user.id;

  try {
    const host = await Host.findById(hostId).populate({
      path: 'preApproved',
      options: { sort: { expectedCheckInFrom: 1 } },
    });

    if (!host) return res.status(404).json({ message: 'Host not found' });

    res.status(200).json({ visitors: host.preApproved });
  } catch (err) {
    res.status(500).json({ message: 'Error fetching pre-approved visitors', error: err.message });
  }
};

const pendingReq = async (req, res) => {
  const hostId = req.user.id;

  try {
    const host = await Host.findById(hostId).populate('visitRequestQueue');

    if (!host) {
      return res.status(404).json({ message: 'Host not found' });
    }

    res.status(200).json({
      message: 'Pending visit requests fetched',
      visitors: host.visitRequestQueue,
    });
  } catch (err) {
    res.status(500).json({
      message: 'Error fetching pending requests',
      error: err.message,
    });
  }
};


const approve = async (req, res) => {
  const hostId = req.user.id;
  const { visitorId } = req.body;

  if (!visitorId) {
    return res.status(400).json({ message: 'visitorId is required' });
  }

  try {
    const host = await Host.findById(hostId);
    const visitor = await Visitor.findById(visitorId);

    if (!host || !visitor) {
      return res.status(404).json({ message: 'Host or Visitor not found' });
    }

    // Update status
    visitor.status = 'Approved';
    await visitor.save();

    // Remove from queue
    host.visitRequestQueue = host.visitRequestQueue.filter(
      (id) => id.toString() !== visitorId
    );
    await host.save();

    res.status(200).json({ message: 'Visitor approved' });
  } catch (err) {
    res.status(500).json({ message: 'Error approving visitor', error: err.message });
  }
};



const decline = async (req, res) => {
  const hostId = req.user.id;
  const { visitorId } = req.body;

  if (!visitorId) {
    return res.status(400).json({ message: 'visitorId is required' });
  }

  try {
    const host = await Host.findById(hostId);
    const visitor = await Visitor.findById(visitorId);

    if (!host || !visitor) {
      return res.status(404).json({ message: 'Host or Visitor not found' });
    }

    // Update visitor status
    visitor.status = 'Declined';
    await visitor.save();

    // Remove visitor from visitRequestQueue
    host.visitRequestQueue = host.visitRequestQueue.filter(
      (id) => id.toString() !== visitorId
    );
    await host.save();

    res.status(200).json({ message: 'Visitor declined' });
  } catch (err) {
    res.status(500).json({ message: 'Error declining visitor', error: err.message });
  }
};

const generateQRForHost = async (req, res) => {
  const hostId = req.user.id;
  const { visitorId } = req.body;

  if (!visitorId) {
    return res.status(400).json({ message: 'visitorId is required' });
  }

  try {
    const visitor = await Visitor.findById(visitorId).populate('hostEmployee');

    if (!visitor) {
      return res.status(404).json({ message: 'Visitor not found' });
    }

    if (!visitor.hostEmployee || visitor.hostEmployee._id.toString() !== hostId) {
      return res.status(403).json({ message: 'You are not authorized to generate QR for this visitor' });
    }

    if (!visitor.preApproved) {
      return res.status(400).json({ message: 'QR can only be generated for pre-approved visitors' });
    }

    if (visitor.status !== 'Approved') {
      return res.status(400).json({ message: 'Visitor is not approved yet' });
    }

    if (visitor.badge && visitor.badge.qrCode) {
      return res.status(200).json({
        message: 'QR code already generated',
        badgeData: {
          fullname: visitor.fullname,
          host: visitor.hostEmployee?.name || 'N/A',
          purpose: visitor.purpose,
          time: dayjs(visitor.badge.issuedAt).format('YYYY-MM-DD HH:mm'),
          photo: visitor.photo,
          qrCode: visitor.badge.qrCode,
        }
      });
    }

    const qrPayload = visitor._id.toString();
    const qrCodeURL = await generateQRCode(qrPayload);

    visitor.badge = {
      qrCode: qrCodeURL,
      issuedAt: new Date(),
    };

    await visitor.save();

    res.status(200).json({
      message: 'QR code generated successfully',
      badgeData: {
        fullname: visitor.fullname,
        host: visitor.hostEmployee?.name || 'N/A',
        purpose: visitor.purpose,
        time: dayjs().format('YYYY-MM-DD HH:mm'),
        photo: visitor.photo,
        qrCode: qrCodeURL,
      }
    });
  } catch (err) {
    res.status(500).json({ message: 'Error generating QR code', error: err.message });
  }
};


module.exports = {
    loginHost,
    addVisitor,
    getAllVisitors,
    getPreApprovedVisitors,
    pendingReq,
    approve,
    decline,
    generateQRForHost 
}

const Gate = require('../models/Gate');
const jwt = require('jsonwebtoken');
const Visitor = require('../models/Visitor');
const Host = require('../models/Host');
const {generateQRCode} = require('../utils/generateQRCode');
const dayjs = require('dayjs');

const JWT_SECRET = process.env.JWT_SECRET;

const loginGate = async (req, res) => {
  const { loginId, password } = req.body;

  if (!loginId || !password) {
    return res.status(400).json({ message: 'Please provide loginId and password' });
  }

  try {
    const gate = await Gate.findOne({ loginId });

    if (!gate || !(await gate.matchPassword(password))) {
      return res.status(401).json({ message: 'Invalid login credentials' });
    }

    const token = jwt.sign(
      { id: gate._id, role: 'gate' },
      JWT_SECRET,
      { expiresIn: '1d' }
    );

    res.status(200).json({
      message: 'Gate login successful',
      token,
      gate: {
        id: gate._id,
        name: gate.name,
        loginId: gate.loginId
      }
    });
  } catch (err) {
    res.status(500).json({ message: 'Server Error', error: err.message });
  }
};

const addVisitor = async (req, res) => {
  try {
    const {
      fullname,
      email,
      contact,
      purpose,
      organisation,
      employeeId,
      hostEmployee,
      photo,
      gateId
    } = req.body;

    // Check required fields
    if (!fullname || !purpose || !hostEmployee || !photo || !gateId) {
      return res.status(400).json({ message: 'Missing required fields' });
    }
    console.log("Gate Id recieved : ", gateId)
    if (!email && !contact) {
      return res.status(400).json({ message: 'Either email or contact is required' });
    }

    // Verify host exists
    const host = await Host.findById(hostEmployee);
    const gate = await Gate.findById(gateId);
    if (!host) {
      return res.status(404).json({ message: 'Host not found' });
    }
    if(!gate){
      return res.status(404).json({ message: 'Host not found' });
    }

    const newVisitor = new Visitor({
      fullname,
      email,
      contact,
      purpose,
      organisation,
      employeeId,
      hostEmployee,
      photo,
      gate: gate._id
    });

    await newVisitor.save();

    res.status(201).json({
      message: 'Visitor added successfully',
      visitor: newVisitor
    });

  } catch (error) {
    console.error('Error adding visitor:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const checkIn = async (req, res) => {
  const { visitorId } = req.body;
  if (!visitorId) return res.status(400).json({ message: 'visitorId is required' });

  try {
    const visitor = await Visitor.findById(visitorId);
    if (!visitor) return res.status(404).json({ message: 'Visitor not found' });

    if (visitor.status === 'Checked-in')
      return res.status(400).json({ message: 'Visitor already checked-in' });

    if (visitor.status !== 'Approved')
      return res.status(400).json({ message: 'Visitor is not approved for entry' });

    // ✅ New check: Ensure badge is issued before check-in
    if (!visitor.badge || !visitor.badge.qrCode) {
      return res.status(400).json({ message: 'Badge not generated for the visitor yet' });
    }

    // ✅ Handle pre-approved timing constraints
    if (visitor.preApproved) {
      const now = new Date();
      const from = new Date(visitor.expectedCheckInFrom);
      const to = new Date(visitor.expectedCheckInTo);

      if (now < from || now > to) {
        return res.status(400).json({
          message: `Visitor must check in between ${from.toLocaleString()} and ${to.toLocaleString()}`
        });
      }
    }

    visitor.checkIn = new Date();
    visitor.status = 'Checked-in';
    await visitor.save();

    res.status(200).json({ message: 'Visitor checked-in',  info: {
      fullname: visitor.fullname,
      photo: visitor.photo,
      email: visitor.email,
      contact: visitor.contact,
      purpose: visitor.purpose,
      organisation: visitor.organisation
    } });
  } catch (err) {
    res.status(500).json({ message: 'Error during check-in', error: err.message });
  }
};



const checkOut = async (req, res) => {
  const { visitorId } = req.body;
  if (!visitorId) return res.status(400).json({ message: 'visitorId is required' });

  try {
    const visitor = await Visitor.findById(visitorId);
    if (!visitor) return res.status(404).json({ message: 'Visitor not found' });

    if (visitor.status === 'Checked-out')
      return res.status(400).json({ message: 'Visitor already checked-out' });

    if (visitor.status !== 'Checked-in')
      return res.status(400).json({ message: 'Visitor is not checked-in yet' });

    visitor.checkOut = new Date();
    visitor.status = 'Checked-out';
    await visitor.save();

    res.status(200).json({ message: 'Visitor checked-out', 
      info: {
        fullname: visitor.fullname,
        photo: visitor.photo,
        email: visitor.email,
        contact: visitor.contact,
        purpose: visitor.purpose,
        organisation: visitor.organisation
      }
     });
  } catch (err) {
    res.status(500).json({ message: 'Error during check-out', error: err.message });
  }
};


const reqApproval = async (req, res) => {
  const { visitorId, gateId } = req.body;
  console.log('Request approval called with:', { visitorId, gateId });

  if (!visitorId) {
    console.log('Missing visitorId in request');
    return res.status(400).json({ message: 'visitorId is required' });
  }

  try {
    console.log('Finding visitor:', visitorId);
    const visitor = await Visitor.findById(visitorId).populate('hostEmployee');
    if (!visitor) {
      console.log('Visitor not found:', visitorId);
      return res.status(404).json({ message: 'Visitor not found' });
    }
    console.log('Visitor found:', visitor);

    console.log('Finding host:', visitor.hostEmployee._id);
    const host = await Host.findById(visitor.hostEmployee._id);
    if (!host) {
      console.log('Host not found:', visitor.hostEmployee._id);
      return res.status(404).json({ message: 'Host not found' });
    }
    console.log('Host found:', host);

    // Add to host's visitRequestQueue if not already there
    if (!host.visitRequestQueue.includes(visitor._id)) {
      console.log('Adding visitor to host queue');
      host.visitRequestQueue.push(visitor._id);
      await host.save();
      console.log('Host queue updated');
    } else {
      console.log('Visitor already in host queue');
    }

    // Update visitor status
    console.log('Updating visitor status to Waiting');
    visitor.status = 'Waiting';
    await visitor.save();
    console.log('Visitor status updated');

    // 🔔 Real-time notify host via socket
    const hostSocket = req.hostSockets.get(host._id.toString());
    if (hostSocket) {
      console.log('Sending socket notification to host');
      hostSocket.emit('newApprovalRequest', {
        message: 'New visitor approval request',
        visitorId: visitor._id.toString(),
      });
      console.log('Socket notification sent');
    } else {
      console.log('Host socket not found');
    }

    console.log('Approval request processed successfully');
    res.status(200).json({ message: 'Approval request sent to host' });
  } catch (err) {
    console.error('Error in reqApproval:', err);
    res.status(500).json({ message: 'Error sending approval request', error: err.message });
  }
};

const generateQR = async (req, res) => {
  const { visitorId } = req.body;

  if (!visitorId) {
    return res.status(400).json({ message: 'visitorId is required' });
  }

  try {
    const visitor = await Visitor.findById(visitorId).populate('hostEmployee');

    if (!visitor) {
      return res.status(404).json({ message: 'Visitor not found' });
    }

    if (visitor.status !== 'Approved') {
      return res.status(400).json({ message: 'Visitor is not approved yet' });
    }

    // Generate QR with just the visitor ID
    const qrPayload = visitor._id.toString();
    const qrCodeURL = await generateQRCode(qrPayload);

    // Save badge
    visitor.badge = {
      qrCode: qrCodeURL,
      issuedAt: new Date(),
    };
    await visitor.save();

    res.status(200).json({
      message: 'QR code generated',
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

const getTodaysVisitors = async (req, res) => {
  try {
    // Get today's date range (00:00 to 23:59)
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const visitors = await Visitor.find({
      createdAt: { $gte: startOfDay, $lte: endOfDay }
    })
      .populate('hostEmployee', 'fullname email') // optional: to include host details
      .sort({ createdAt: -1 }); // newest first

    res.status(200).json(visitors);
  } catch (error) {
    console.error("Error fetching today's visitors:", error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
const hosts = async (req, res) => {
  try {
    const allHosts = await Host.find().select('-password');
    res.status(200).json({ hosts: allHosts });
  } catch (err) {
    console.error('Fetch Hosts Error:', err.message);
    res.status(500).json({ message: 'Server error while fetching hosts' });
  }
};

module.exports = {
  loginGate,
  addVisitor,
  checkIn,
  checkOut,
  reqApproval,
  generateQR,
  getTodaysVisitors,
  hosts
}
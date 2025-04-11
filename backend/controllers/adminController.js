// controllers/adminController.js
const Host = require('../models/Host');
const Admin = require('../models/Admin');
const Visitor = require('../models/Visitor');
const Gate = require('../models/Gate');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

// Environment secret key 
const JWT_SECRET = process.env.JWT_SECRET || 'your_default_secret';

const loginAdmin = async (req, res) => {
  try {
    const { username, password } = req.body;

    // Validate input
    if (!username || !password) {
      return res.status(400).json({ message: 'Username and password required' });
    }

    // Check if admin exists
    const admin = await Admin.findOne({ username });
    if (!admin) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Compare password
    const isMatch = await admin.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Generate token
    const token = jwt.sign(
      { id: admin._id, role: 'admin' },
      JWT_SECRET,
      { expiresIn: '1d' }
    );

    // Send token
    res.status(200).json({
      message: 'Admin login successful',
      token,
      admin: {
        id: admin._id,
        name: admin.name,
        username: admin.username
      }
    });

  } catch (err) {
    console.error('Login error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
};



const addAdmin = async (req, res) => {
    try {
      const { name, username, password } = req.body;
  
      // Basic validation
      if (!name || !username || !password) {
        return res.status(400).json({ message: 'All fields are required' });
      }
  
      // Check if username already exists
      const existingAdmin = await Admin.findOne({ username });
      if (existingAdmin) {
        return res.status(409).json({ message: 'Username already taken' });
      }
  
      // Create new admin
      const newAdmin = new Admin({
        name,
        username,
        password
      });
  
      await newAdmin.save();
  
      res.status(201).json({
        message: 'Admin created successfully',
        admin: {
          id: newAdmin._id,
          name: newAdmin.name,
          username: newAdmin.username
        }
      });
  
    } catch (err) {
      console.error('Add Admin Error:', err.message);
      res.status(500).json({ message: 'Server error while creating admin' });
    }
  };
  
const addHost = async (req, res) => {
    try {
      const { name, department, employeeId, username, password, contact } = req.body;  
      if (!name || !username || !password) {
        return res.status(400).json({ message: 'Name, username, and password are required' });
      }  
      const existingHost = await Host.findOne({ username });
      if (existingHost) {
        return res.status(409).json({ message: 'Host username already exists' });
      }  
      const newHost = new Host({
        name,
        department,
        employeeId,
        username,
        password,
        contact
      }); 
      await newHost.save();  
      res.status(201).json({
        message: 'Host added successfully',
        host: {
          id: newHost._id,
          name: newHost.name,
          username: newHost.username,
          department: newHost.department
        }
      });
    } catch (err) {
      console.error('Add Host Error:', err.message);
      res.status(500).json({ message: 'Server error while adding host' });
    }
  };

  
  // Delete Host
  const deleteHost = async (req, res) => {
    try {
      const { hostId } = req.body; 
      const host = await Host.findById(hostId);
      if (!host) {
        return res.status(404).json({ message: 'Host not found' });
      }  
      await Host.findByIdAndDelete(hostId);
      res.status(200).json({ message: 'Host deleted successfully' });
    } catch (err) {
      console.error('Delete Host Error:', err.message);
      res.status(500).json({ message: 'Server error while deleting host' });
    }
  };

  

// Add Gate
const addGate = async (req, res) => {
  try {
    const { name, loginId, password } = req.body;

    if (!name || !loginId || !password) {
      return res.status(400).json({ message: 'Name, login ID, and password are required' });
    }

    const existingGate = await Gate.findOne({ loginId });
    if (existingGate) {
      return res.status(409).json({ message: 'Gate login ID already exists' });
    }

    const newGate = new Gate({
      name,
      loginId,
      password
    });

    await newGate.save();

    res.status(201).json({
      message: 'Gate added successfully',
      gate: {
        id: newGate._id,
        name: newGate.name,
        loginId: newGate.loginId
      }
    });
  } catch (err) {
    console.error('Add Gate Error:', err.message);
    res.status(500).json({ message: 'Server error while adding gate' });
  }
};

// Delete Gate
const deleteGate = async (req, res) => {
  try {
    const { gateId } = req.body;

    const gate = await Gate.findById(gateId);
    if (!gate) {
      return res.status(404).json({ message: 'Gate not found' });
    }

    await Gate.findByIdAndDelete(gateId);
    res.status(200).json({ message: 'Gate deleted successfully' });
  } catch (err) {
    console.error('Delete Gate Error:', err.message);
    res.status(500).json({ message: 'Server error while deleting gate' });
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

  const gates = async (req, res) => {
    try {
      const allGates = await Gate.find().select('-password');
      res.status(200).json({ gates: allGates });
    } catch (err) {
      console.error('Fetch Gates Error:', err.message);
      res.status(500).json({ message: 'Server error while fetching gates' });
    }
  };
  
  const setLimitForHost = async (req, res) => {
    try {
      const { hostId, limit } = req.body;
  
      if (!hostId || typeof limit !== 'number' || limit < 1) {
        return res.status(400).json({ message: 'hostId and valid limit are required' });
      }
  
      const host = await Host.findById(hostId);
      if (!host) {
        return res.status(404).json({ message: 'Host not found' });
      }
  
      host.preApprovalLimit = limit;
      await host.save();
  
      res.status(200).json({
        message: 'Pre-approval limit updated for the host',
        hostId,
        limit
      });
    } catch (err) {
      console.error('Set Limit For Host Error:', err.message);
      res.status(500).json({ message: 'Server error while setting limit for host' });
    }
  };

  const setLimitForAllHosts = async (req, res) => {
    try {
      const { limit } = req.body;
  
      if (typeof limit !== 'number' || limit < 1) {
        return res.status(400).json({ message: 'A valid limit is required' });
      }
  
      const result = await Host.updateMany({}, { preApprovalLimit: limit });
  
      res.status(200).json({
        message: 'Pre-approval limit updated for all hosts',
        modifiedCount: result.modifiedCount || result.nModified // compatible with different mongoose versions
      });
    } catch (err) {
      console.error('Set Limit For All Hosts Error:', err.message);
      res.status(500).json({ message: 'Server error while updating limit for all hosts' });
    }
  };

const visitors = async (req, res) => {
    try {
      const visitors = await Visitor.find().populate('hostEmployee', 'name email');
      res.status(200).json({ visitors });
    } catch (err) {
      res.status(500).json({ message: 'Error fetching visitors', error: err.message });
    }
  };



  module.exports = {
    loginAdmin,
    addAdmin,
    addHost,
    deleteHost,
    addGate,
    deleteGate,
    hosts,
    gates,
    setLimitForHost,
    setLimitForAllHosts,
    visitors
  };



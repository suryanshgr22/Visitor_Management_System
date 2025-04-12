// routes/gate.js

const express = require('express');
const router = express.Router();
const {
  loginGate,
  addVisitor,
  reqApproval,
  generateQR,
  checkIn,
  checkOut,
  getTodaysVisitors,
  hosts
} = require('../controllers/gateController');
const Visitor = require('../models/Visitor');

const authenticate = require('../middlewares/authenticate');
const requireRole = require('../middlewares/requireRole');
const { checkVisitorCache, cacheVisitorResponse } = require('../middleware/visitorCache');
const { getCacheStats, setVisitorCache, flushCache } = require('../config/redis');

// Public routes
router.post('/login', loginGate);

// Public cache test endpoints
router.get('/cache/public/status', async (req, res) => {
  try {
    const stats = await getCacheStats();
    return res.status(200).json({
      success: true,
      message: 'Cache status retrieved',
      stats
    });
  } catch (error) {
    console.error('Error getting cache stats:', error);
    return res.status(500).json({ 
      success: false,
      message: 'Server error', 
      error: error.message 
    });
  }
});

router.post('/cache/public/test', async (req, res) => {
  try {
    const testData = {
      id: 'test-' + Date.now(),
      message: 'This is a test cache entry',
      timestamp: new Date()
    };
    
    await setVisitorCache('test-key', testData);
    
    return res.status(200).json({
      success: true,
      message: 'Test data cached successfully',
      data: testData
    });
  } catch (error) {
    console.error('Error in test caching:', error);
    return res.status(500).json({ 
      success: false,
      message: 'Server error', 
      error: error.message 
    });
  }
});

// Protected routes - Gate only
router.use(authenticate, requireRole('gate'));

router.get('/test',(req,res)=>{
    res.send("worked!");
})
router.post('/addVisitor', addVisitor);
router.post('/requestApproval', reqApproval);
router.post('/generateQR', generateQR);
router.put('/checkin', checkIn);
router.put('/checkout', checkOut);
router.get('/todaysVisitors', getTodaysVisitors);
router.get('/hosts', hosts);

// Cache-related endpoints for testing (protected)
router.get('/cache/status', async (req, res) => {
  try {
    const stats = await getCacheStats();
    return res.status(200).json({
      success: true,
      message: 'Cache status retrieved',
      stats
    });
  } catch (error) {
    console.error('Error getting cache stats:', error);
    return res.status(500).json({ 
      success: false,
      message: 'Server error', 
      error: error.message 
    });
  }
});

router.post('/cache/flush', async (req, res) => {
  try {
    await flushCache();
    return res.status(200).json({
      success: true,
      message: 'Cache flushed successfully'
    });
  } catch (error) {
    console.error('Error flushing cache:', error);
    return res.status(500).json({ 
      success: false,
      message: 'Server error', 
      error: error.message 
    });
  }
});

// Test endpoint to manually cache a visitor
router.post('/cache/test/:id', async (req, res) => {
  try {
    const visitorId = req.params.id;
    const visitor = await Visitor.findById(visitorId);
    
    if (!visitor) {
      return res.status(404).json({ 
        success: false,
        message: 'Visitor not found' 
      });
    }
    
    // Manual caching
    const visitorData = {
      _id: visitor._id,
      fullname: visitor.fullname,
      status: visitor.status,
      purpose: visitor.purpose,
      cachedAt: new Date()
    };
    
    await setVisitorCache(visitorId, visitorData);
    
    return res.status(200).json({
      success: true,
      message: 'Test visitor cached successfully',
      visitor: visitorData
    });
  } catch (error) {
    console.error('Error in test caching:', error);
    return res.status(500).json({ 
      success: false,
      message: 'Server error', 
      error: error.message 
    });
  }
});

// Add route to get visitor by ID with caching
router.get('/visitor/:id', checkVisitorCache, cacheVisitorResponse, async (req, res) => {
  try {
    const visitorId = req.params.id;
    const visitor = await Visitor.findById(visitorId).populate('hostEmployee', 'name department');
    
    if (!visitor) {
      return res.status(404).json({ 
        success: false,
        message: 'Visitor not found' 
      });
    }
    
    return res.status(200).json({
      success: true,
      message: 'Visitor details retrieved successfully',
      visitor
    });
  } catch (error) {
    console.error('Error fetching visitor details:', error);
    return res.status(500).json({ 
      success: false,
      message: 'Server error', 
      error: error.message 
    });
  }
});

module.exports = router;

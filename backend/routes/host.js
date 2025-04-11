const express = require('express');
const router = express.Router();
const authenticate = require('../middlewares/authenticate');
const requireRole = require('../middlewares/requireRole');
const { 
    loginHost, addVisitor, getAllVisitors, getPreApprovedVisitors, pendingReq, approve, decline, generateQRForHost
} = require('../controllers/hostController');

// Auth
router.post('/login', loginHost);


// // Visitor Management by Host
router.use(authenticate, requireRole('host'));

router.post('/visitor/add', addVisitor);
router.get('/visitors', getAllVisitors);
router.get('/preApproved', getPreApprovedVisitors);
router.get('/pendingReq', pendingReq);
router.put('/approve', approve);
router.put('/decline', decline);
router.post('/generate-qr', generateQRForHost);
module.exports = router;

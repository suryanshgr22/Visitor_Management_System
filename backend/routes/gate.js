// routes/gate.js

const express = require('express');
const router = express.Router();
const {
  loginGate,
  addVisitor,
  reqApproval,
  generateQR,
  checkIn,
  checkOut
} = require('../controllers/gateController');

const authenticate = require('../middlewares/authenticate');
const requireRole = require('../middlewares/requireRole');

// Public login route
router.post('/login', loginGate);

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


module.exports = router;

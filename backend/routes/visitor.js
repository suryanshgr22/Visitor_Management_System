const express = require('express');
const router = express.Router();
const { 
    addVisitor, reqApproval, printBadge, 
    entry, exit 
} = require('../controllers/visitorController');

// router.post('/add', addVisitor);
// router.post('/request-approval', reqApproval);
// router.post('/print-badge', printBadge);
// router.put('/entry', entry);
// router.put('/exit', exit);


module.exports = router;

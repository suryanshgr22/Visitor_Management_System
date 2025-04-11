const express = require('express');
const router = express.Router();
const authenticate = require('../middlewares/authenticate');
const requireRole = require('../middlewares/requireRole');
const { 
    loginAdmin, addAdmin, 
    addHost, deleteHost, hosts, setLimitForHost,
    setLimitForAllHosts,
    addGate, deleteGate, gates, visitors
} = require('../controllers/adminController');

// login
router.post('/login', loginAdmin);


router.use(authenticate); // Auth middleware for everything below
router.use(requireRole('admin')); // Role-based check for admin only

router.post('/add', addAdmin); 

// // Host Management
router.post('/host/add', addHost);
router.delete('/host/delete', deleteHost);
router.get('/hosts', hosts);

router.put('/setLimit', setLimitForHost);     // individual host limit
router.put('/setLimitAll', setLimitForAllHosts); // all hosts at once



// // Gate Management
router.post('/gate/add', addGate);
router.delete('/gate/delete', deleteGate);
router.get('/gates', gates);
router.get('/visitors', visitors);


module.exports = router;

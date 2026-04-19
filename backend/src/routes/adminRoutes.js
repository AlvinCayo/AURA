const express = require('express');
const { getSystemUsers, getSystemLogs, toggleUserStatus, getSystemStats, approveBusiness, rejectBusiness } = require('../controllers/adminController');

const router = express.Router();

router.get('/users', getSystemUsers);
router.get('/logs', getSystemLogs);
router.get('/stats', getSystemStats);
router.put('/status/:id', toggleUserStatus);
router.put('/approve/:id', approveBusiness);
router.put('/reject/:id', rejectBusiness);

module.exports = router;
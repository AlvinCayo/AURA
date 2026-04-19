const express = require('express');
const { createAppointment, getClientAppointments } = require('../controllers/appointmentController');

const router = express.Router();

router.post('/create', createAppointment);
router.get('/client/:clientId', getClientAppointments);

module.exports = router;
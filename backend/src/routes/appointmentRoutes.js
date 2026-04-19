const express = require('express');
const { createAppointment, getClientAppointments, getBusinessAppointments, updateAppointmentStatus } = require('../controllers/appointmentController');

const router = express.Router();

router.post('/create', createAppointment);
router.get('/client/:clientId', getClientAppointments);
router.get('/business/:businessId', getBusinessAppointments);
router.put('/status/:id', updateAppointmentStatus);

module.exports = router;
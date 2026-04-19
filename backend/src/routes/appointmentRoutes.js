const express = require('express');
const { createAppointment, getClientAppointments, getBusinessAppointments, updateAppointmentStatus, payAppointment } = require('../controllers/appointmentController');

const router = express.Router();

router.post('/create', createAppointment);
router.get('/client/:clientId', getClientAppointments);
router.get('/business/:businessId', getBusinessAppointments);
router.put('/status/:id', updateAppointmentStatus);
router.put('/pay/:id', payAppointment);

module.exports = router;
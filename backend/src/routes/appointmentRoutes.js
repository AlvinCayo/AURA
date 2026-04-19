const express = require('express');
const router = express.Router();
const { 
  createAppointment, getClientAppointments, getBusinessAppointments, 
  updateAppointmentStatus, payAppointment, getBookedSlots 
} = require('../controllers/appointmentController');

router.post('/create', createAppointment);
router.get('/client/:clientId', getClientAppointments);
router.get('/business/:businessId', getBusinessAppointments);
router.put('/status/:id', updateAppointmentStatus);
router.put('/pay/:id', payAppointment);

// NUEVA RUTA
router.get('/booked/:businessId', getBookedSlots);

module.exports = router;
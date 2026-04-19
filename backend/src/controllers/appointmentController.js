const client = require('../config/db');

async function createAppointment(req, res) {
  try {
    const { client_id, business_id, service_id, appointment_date, price } = req.body;
    
    const servicePrice = parseFloat(price);
    const reservationFee = servicePrice * 0.10; // 10% de reserva
    const totalPrice = servicePrice + reservationFee;

    const queryText = `
      INSERT INTO appointments (client_id, business_id, service_id, appointment_date, status, total_price, reservation_fee)
      VALUES ($1, $2, $3, $4, 'solicitada', $5, $6)
      RETURNING *;
    `;
    const valores = Array.of(client_id, business_id, service_id, appointment_date, totalPrice, reservationFee);
    const result = await client.query(queryText, valores);
    res.status(201).json({ success: true, data: result.rows.shift() });
  } catch {
    res.status(500).json({ success: false, error: 'Error al crear la cita' });
  }
}

async function getClientAppointments(req, res) {
  try {
    const { clientId } = req.params;
    const queryText = `
      SELECT a.*, s.name as service_name, u.first_name as business_name 
      FROM appointments a
      JOIN services s ON a.service_id = s.id
      JOIN users u ON a.business_id = u.id
      WHERE a.client_id = $1
      ORDER BY a.appointment_date DESC
    `;
    const result = await client.query(queryText, Array.of(clientId));
    res.status(200).json({ success: true, data: Object.assign({}, result.rows) });
  } catch {
    res.status(500).json({ success: false, error: 'Error al obtener citas del cliente' });
  }
}

async function getBusinessAppointments(req, res) {
  try {
    const { businessId } = req.params;
    const queryText = `
      SELECT a.*, s.name as service_name, u.first_name as client_name, u.last_name as client_last_name
      FROM appointments a
      JOIN services s ON a.service_id = s.id
      JOIN users u ON a.client_id = u.id
      WHERE a.business_id = $1
      ORDER BY a.appointment_date ASC
    `;
    const result = await client.query(queryText, Array.of(businessId));
    res.status(200).json({ success: true, data: Object.assign({}, result.rows) });
  } catch {
    res.status(500).json({ success: false, error: 'Error al obtener agenda del negocio' });
  }
}

async function updateAppointmentStatus(req, res) {
  try {
    const { id } = req.params;
    const { status } = req.body; // 'confirmada', 'cancelada', 'completada'
    const queryText = 'UPDATE appointments SET status = $1 WHERE id = $2 RETURNING *';
    const result = await client.query(queryText, Array.of(status, id));
    res.status(200).json({ success: true, data: result.rows.shift() });
  } catch {
    res.status(500).json({ success: false, error: 'Error al actualizar estado' });
  }
}

async function payAppointment(req, res) {
  try {
    const { id } = req.params;
    const { amount_paid } = req.body; // El cliente envía cuánto pagó
    const queryText = "UPDATE appointments SET status = 'confirmada', paid_amount = $1 WHERE id = $2 RETURNING *";
    const result = await client.query(queryText, Array.of(amount_paid, id));
    res.status(200).json({ success: true, data: result.rows.shift() });
  } catch {
    res.status(500).json({ success: false, error: 'Error al procesar pago' });
  }
}

module.exports = { createAppointment, getClientAppointments, getBusinessAppointments, updateAppointmentStatus, payAppointment };
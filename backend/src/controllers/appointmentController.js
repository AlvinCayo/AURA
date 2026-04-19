const client = require('../config/db');

async function createAppointment(req, res) {
  try {
    const { client_id, business_id, service_id, appointment_date } = req.body;
    const queryText = `
      INSERT INTO appointments (client_id, business_id, service_id, appointment_date)
      VALUES ($1, $2, $3, $4)
      RETURNING *;
    `;
    const valores = Array.of(client_id, business_id, service_id, appointment_date);
    const result = await client.query(queryText, valores);
    res.status(201).json(result.rows.shift());
  } catch {
    res.status(500).json({ success: false, error: 'Fallo al agendar reserva' });
  }
}

async function getClientAppointments(req, res) {
  try {
    const { clientId } = req.params;
    const queryText = `SELECT * FROM appointments WHERE client_id = $1`;
    const valores = Array.of(clientId);
    const result = await client.query(queryText, valores);
    res.status(200).json(result.rows);
  } catch {
    res.status(500).json({ success: false, error: 'Fallo al obtener reservas' });
  }
}

module.exports = {
  createAppointment,
  getClientAppointments
};
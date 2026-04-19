const client = require('../config/db');

// --- MOTOR DE NOTIFICACIONES PUSH ---
async function sendPushNotification(expoPushToken, title, body) {
  if (!expoPushToken) return;
  try {
    await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ to: expoPushToken, sound: 'default', title, body })
    });
  } catch (error) {
    console.error('Error enviando push:', error);
  }
}

async function createAppointment(req, res) {
  try {
    const { client_id, business_id, service_id, appointment_date, price } = req.body;
    const servicePrice = parseFloat(price);
    const reservationFee = servicePrice * 0.10;
    const totalPrice = servicePrice + reservationFee;

    const queryText = `
      INSERT INTO appointments (client_id, business_id, service_id, appointment_date, status, total_price, reservation_fee)
      VALUES ($1, $2, $3, $4, 'solicitada', $5, $6)
      RETURNING *;
    `;
    const result = await client.query(queryText, [client_id, business_id, service_id, appointment_date, totalPrice, reservationFee]);
    
    // --- NOTIFICAR AL NEGOCIO QUE HAY UNA NUEVA CITA ---
    const userRes = await client.query('SELECT push_token FROM users WHERE id = $1', [business_id]);
    if (userRes.rows[0]?.push_token) {
      sendPushNotification(
        userRes.rows[0].push_token, 
        '¡Nueva Solicitud de Cita! 📅', 
        'Un cliente acaba de solicitar un horario. Ingresa a AURA para confirmarlo.'
      );
    }

    res.status(201).json({ success: true, data: result.rows[0] });
  } catch {
    res.status(500).json({ success: false, error: 'Error al crear la cita' });
  }
}

async function updateAppointmentStatus(req, res) {
  try {
    const { id } = req.params;
    const { status } = req.body; 
    const queryText = 'UPDATE appointments SET status = $1 WHERE id = $2 RETURNING *';
    const result = await client.query(queryText, [status, id]);

    // --- NOTIFICAR AL CLIENTE SOBRE SU SOLICITUD ---
    if (status === 'aceptada' || status === 'rechazada') {
      const clientRes = await client.query('SELECT u.push_token FROM users u JOIN appointments a ON u.id = a.client_id WHERE a.id = $1', [id]);
      if (clientRes.rows[0]?.push_token) {
        const title = status === 'aceptada' ? '¡Cita Aceptada! 🎉' : 'Cita Rechazada ❌';
        const body = status === 'aceptada' 
          ? 'El centro aceptó tu solicitud. Ingresa a la app para pagar el 10% y asegurar tu lugar.' 
          : 'El centro no pudo aceptar la cita por falta de espacio. Intenta con otro horario.';
        sendPushNotification(clientRes.rows[0].push_token, title, body);
      }
    }

    res.status(200).json({ success: true, data: result.rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Error al actualizar estado' });
  }
}

// ... Las demás funciones se mantienen intactas
async function getClientAppointments(req, res) {
  try {
    const { clientId } = req.params;
    const queryText = `SELECT a.*, s.name as service_name, u.first_name as business_name FROM appointments a JOIN services s ON a.service_id = s.id JOIN users u ON a.business_id = u.id WHERE a.client_id = $1 ORDER BY a.appointment_date DESC`;
    const result = await client.query(queryText, [clientId]);
    res.status(200).json({ success: true, data: Object.assign({}, result.rows) });
  } catch { res.status(500).json({ success: false, error: 'Error' }); }
}

async function getBusinessAppointments(req, res) {
  try {
    const { businessId } = req.params;
    const queryText = `SELECT a.*, s.name as service_name, u.first_name as client_name, u.last_name as client_last_name FROM appointments a JOIN services s ON a.service_id = s.id JOIN users u ON a.client_id = u.id WHERE a.business_id = $1 ORDER BY a.appointment_date ASC`;
    const result = await client.query(queryText, [businessId]);
    res.status(200).json({ success: true, data: Object.assign({}, result.rows) });
  } catch { res.status(500).json({ success: false, error: 'Error' }); }
}

async function payAppointment(req, res) {
  try {
    const { id } = req.params;
    const { amount_paid } = req.body;
    const queryText = "UPDATE appointments SET status = 'confirmada', paid_amount = $1 WHERE id = $2 RETURNING *";
    const result = await client.query(queryText, [amount_paid, id]);
    res.status(200).json({ success: true, data: result.rows[0] });
  } catch { res.status(500).json({ success: false, error: 'Error al procesar pago' }); }
}

async function getBookedSlots(req, res) {
  try {
    const { businessId } = req.params;
    const queryText = `SELECT a.appointment_date, s.duration_minutes FROM appointments a JOIN services s ON a.service_id = s.id WHERE a.business_id = $1 AND a.status IN ('solicitada', 'aceptada', 'confirmada') AND a.appointment_date >= NOW() - INTERVAL '1 day'`;
    const result = await client.query(queryText, [businessId]);
    res.status(200).json({ success: true, data: result.rows });
  } catch (error) { res.status(500).json({ success: false, error: 'Error al obtener horarios' }); }
}

module.exports = { createAppointment, getClientAppointments, getBusinessAppointments, updateAppointmentStatus, payAppointment, getBookedSlots };
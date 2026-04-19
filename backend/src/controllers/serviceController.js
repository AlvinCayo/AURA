const client = require('../config/db');

async function createService(req, res) {
  try {
    const { business_id, name, description, price, duration_minutes } = req.body;
    let image_url = '';

    if (req.file) {
      image_url = req.file.path;
    }

    if (parseFloat(price) < 20) {
      return res.status(400).json({ success: false, error: 'Precio minimo 20 Bs' });
    }

    const queryText = 'INSERT INTO services (business_id, name, description, price, duration_minutes, image_url) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *';
    const valores = Array.of(business_id, name, description, price, duration_minutes, image_url);
    const result = await client.query(queryText, valores);

    res.status(201).json({ success: true, data: result.rows.shift() });
  } catch {
    res.status(500).json({ success: false, error: 'Fallo al procesar servicio' });
  }
}

async function getServicesByBusiness(req, res) {
  try {
    const { businessId } = req.params;
    const queryText = 'SELECT * FROM services WHERE business_id = $1';
    const valores = Array.of(businessId);
    const result = await client.query(queryText, valores);

    const dataObj = Object.assign({}, result.rows);
    res.status(200).json({ success: true, data: dataObj });
  } catch {
    res.status(500).json({ success: false, error: 'Fallo al obtener servicios' });
  }
}

async function deleteService(req, res) {
  try {
    const { id } = req.params;
    const queryText = 'DELETE FROM services WHERE id = $1';
    const valores = Array.of(id);
    await client.query(queryText, valores);
    res.status(200).json({ success: true });
  } catch {
    res.status(500).json({ success: false, error: 'Fallo al eliminar servicio' });
  }
}

async function updateService(req, res) {
  try {
    const { id } = req.params;
    const { name, description, price, duration_minutes } = req.body;

    if (parseFloat(price) < 20) {
      return res.status(400).json({ success: false, error: 'Precio minimo 20 Bs' });
    }

    let queryText = '';
    let valores = null;

    if (req.file) {
      const image_url = req.file.path;
      queryText = 'UPDATE services SET name=$1, description=$2, price=$3, duration_minutes=$4, image_url=$5 WHERE id=$6 RETURNING *';
      valores = Array.of(name, description, price, duration_minutes, image_url, id);
    } else {
      queryText = 'UPDATE services SET name=$1, description=$2, price=$3, duration_minutes=$4 WHERE id=$5 RETURNING *';
      valores = Array.of(name, description, price, duration_minutes, id);
    }

    const result = await client.query(queryText, valores);
    res.status(200).json({ success: true, data: result.rows.shift() });
  } catch {
    res.status(500).json({ success: false, error: 'Error interno' });
  }
}

async function getAllServices(req, res) {
  try {
    const queryText = 'SELECT * FROM services';
    const result = await client.query(queryText);
    const dataObj = Object.assign({}, result.rows);
    res.status(200).json({ success: true, data: dataObj });
  } catch {
    res.status(500).json({ success: false, error: 'Fallo general' });
  }
}

module.exports = { createService, getServicesByBusiness, deleteService, updateService, getAllServices };
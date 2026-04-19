const client = require('../config/db');

async function logUserActivity(userId, action) {
  const queryText = 'INSERT INTO activity_logs (user_id, action) VALUES ($1, $2)';
  const values = [userId, action];
  await client.query(queryText, values);
}

// Marcadores para mantener tus funciones de auth originales
async function registerUser(req, res) { /* Código en authController */ }
async function loginUser(req, res) { /* Código en authController */ }

async function getUserProfile(req, res) {
  const userId = req.params.id;
  const userRole = req.params.role;
  // Agregamos las nuevas columnas a la consulta de negocio
  const qClient = 'SELECT first_name, last_name, phone, profile_picture FROM client_profiles WHERE user_id = $1';
  const qBusiness = 'SELECT representative_name, representative_last_name, phone, profile_picture, license_pdf_url, is_approved, shop_photos, latitude, longitude, address_notes FROM business_profiles WHERE user_id = $1';
  
  const isBusiness = userRole === 'centro' || userRole === 'business';
  const queryText = isBusiness ? qBusiness : qClient;

  try {
    const result = await client.query(queryText, [userId]);
    if (result.rowCount > 0) {
      res.json({ success: true, profile: result.rows[0] });
    } else {
      res.status(404).json({ success: false });
    }
  } catch (error) {
    res.status(500).json({ success: false });
  }
}

async function updateProfilePhoto(req, res) {
  const userId = req.params.id;
  const { role, photoUrl } = req.body;
  const qClient = 'UPDATE client_profiles SET profile_picture = $1 WHERE user_id = $2';
  const qBusiness = 'UPDATE business_profiles SET profile_picture = $1 WHERE user_id = $2';
  const queryText = (role === 'centro' || role === 'business') ? qBusiness : qClient;

  try {
    await client.query(queryText, [photoUrl, userId]);
    await logUserActivity(userId, 'Fotografia de perfil actualizada');
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false });
  }
}

// Función de actualización mejorada para ambos roles
async function updateProfile(req, res) {
  const userId = req.params.id;
  const { role, firstName, lastName, phone, address_notes, latitude, longitude } = req.body;
  const isBusiness = role === 'centro' || role === 'business';

  const queryClient = 'UPDATE client_profiles SET first_name = $1, last_name = $2, phone = $3 WHERE user_id = $4';
  const queryBusiness = `
    UPDATE business_profiles 
    SET representative_name = $1, representative_last_name = $2, phone = $3, 
        address_notes = $4, latitude = $5, longitude = $6 
    WHERE user_id = $7`;

  try {
    if (isBusiness) {
      await client.query(queryBusiness, [firstName, lastName, phone, address_notes, latitude, longitude, userId]);
    } else {
      await client.query(queryClient, [firstName, lastName, phone, userId]);
    }
    await logUserActivity(userId, 'Perfil actualizado');
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Error al actualizar perfil' });
  }
}

async function deactivateAccount(req, res) {
  const userId = req.params.id;
  try {
    await client.query('UPDATE users SET is_active = FALSE WHERE id = $1', [userId]);
    await logUserActivity(userId, 'Cuenta desactivada');
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false });
  }
}

async function uploadNewLicense(req, res) {
  const userId = req.params.id;
  const { licenseUrl } = req.body;
  try {
    await client.query('UPDATE business_profiles SET license_pdf_url = $1 WHERE user_id = $2', [licenseUrl, userId]);
    await logUserActivity(userId, 'Nueva licencia de funcionamiento subida');
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false });
  }
}

async function updateBusinessProfile(req, res) {
  try {
    const { id } = req.params;
    const { opening_time, closing_time, working_days } = req.body;
    const queryText = "UPDATE users SET opening_time = $1, closing_time = $2, working_days = $3 WHERE id = $4 RETURNING *";
    const result = await client.query(queryText, [opening_time, closing_time, working_days, id]);
    res.status(200).json({ success: true, data: result.rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Error al actualizar horarios' });
  }
}

async function getAllBusinesses(req, res) {
  try {
    const queryText = "SELECT id, first_name, profile_picture, opening_time, closing_time, working_days FROM users WHERE role = 'business' OR role = 'centro'";
    const result = await client.query(queryText);
    res.status(200).json({ success: true, data: Object.assign({}, result.rows) });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Error al obtener negocios' });
  }
}

// Nueva función para fotos del local
async function updateShopPhotos(req, res) {
  const userId = req.params.id;
  const { photos } = req.body; // Array de URLs
  try {
    await client.query('UPDATE business_profiles SET shop_photos = $1 WHERE user_id = $2', [photos, userId]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false });
  }
}

module.exports = {
  registerUser,
  loginUser,
  getUserProfile,
  updateProfilePhoto,
  updateProfile,
  deactivateAccount,
  uploadNewLicense,
  updateBusinessProfile,
  getAllBusinesses,
  updateShopPhotos
};
const client = require('../config/db');

async function logUserActivity(userId, action) {
  const queryText = 'INSERT INTO activity_logs (user_id, action) VALUES ($1, $2)';
  const values = { a: userId, b: action };
  await client.query(queryText, Object.values(values));
}

async function getUserProfile(req, res) {
  const userId = req.params.id;
  const userRole = req.params.role;

  const qClient = 'SELECT first_name, last_name, phone, profile_picture FROM client_profiles WHERE user_id = $1';
  const qBusiness = 'SELECT representative_name, representative_last_name, phone, profile_picture, license_pdf_url, is_approved FROM business_profiles WHERE user_id = $1';

  const isBusiness = userRole === 'centro';
  const queryText = isBusiness ? qBusiness : qClient;
  const values = { a: userId };

  try {
    const result = await client.query(queryText, Object.values(values));
    const { rowCount, rows } = result;

    if (rowCount > 0) {
      const { 0: profile } = rows;
      res.json({ success: true, profile });
    } else {
      res.status(404).json({ success: false });
    }
  } catch (error) {
    res.status(500).json({ success: false });
  }
}

async function updateProfilePhoto(req, res) {
  const userId = req.params.id;
  const role = req.body.role;
  const photoUrl = req.body.photoUrl;

  const qClient = 'UPDATE client_profiles SET profile_picture = $1 WHERE user_id = $2';
  const qBusiness = 'UPDATE business_profiles SET profile_picture = $1 WHERE user_id = $2';

  const isBusiness = role === 'centro';
  const queryText = isBusiness ? qBusiness : qClient;
  const values = { a: photoUrl, b: userId };

  try {
    await client.query(queryText, Object.values(values));
    await logUserActivity(userId, 'Fotografia de perfil actualizada');
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false });
  }
}

async function updateProfile(req, res) {
  const userId = req.params.id;
  const role = req.body.role;
  const firstName = req.body.firstName;
  const lastName = req.body.lastName;
  const phone = req.body.phone;

  const isBusiness = role === 'centro';
  const queryClient = 'UPDATE client_profiles SET first_name = $1, last_name = $2, phone = $3 WHERE user_id = $4';
  const queryBusiness = 'UPDATE business_profiles SET representative_name = $1, representative_last_name = $2, phone = $3 WHERE user_id = $4';

  const queryText = isBusiness ? queryBusiness : queryClient;
  const values = { a: firstName, b: lastName, c: phone, d: userId };

  try {
    await client.query(queryText, Object.values(values));
    await logUserActivity(userId, 'Perfil modificado');
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false });
  }
}

async function deactivateAccount(req, res) {
  const userId = req.params.id;
  const queryText = 'UPDATE users SET is_active = FALSE WHERE id = $1';
  const values = { a: userId };

  try {
    await client.query(queryText, Object.values(values));
    await logUserActivity(userId, 'Cuenta desactivada');
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false });
  }
}

async function uploadNewLicense(req, res) {
  const userId = req.params.id;
  const licenseUrl = req.body.licenseUrl;
  const queryText = 'UPDATE business_profiles SET license_pdf_url = $1 WHERE user_id = $2';
  const values = { a: licenseUrl, b: userId };
  try {
    await client.query(queryText, Object.values(values));
    await logUserActivity(userId, 'Nueva licencia de funcionamiento subida');
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false });
  }
}

module.exports = { getUserProfile, updateProfilePhoto, updateProfile, deactivateAccount, logUserActivity, uploadNewLicense };
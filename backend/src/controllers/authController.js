const client = require('../config/db');

async function registerClient(req, res) {
  const { email, password, firstName, lastName, birthDate, gender, phone } = req.body;
  const userQuery = 'INSERT INTO users (email, password, role) VALUES ($1, $2, $3) RETURNING id';
  const userValues = { a: email, b: password, c: 'usuario' };

  try {
    await client.query('BEGIN');
    const userResult = await client.query(userQuery, Object.values(userValues));
    const { id: userId } = userResult.rows[0];

    const profileQuery = 'INSERT INTO client_profiles (user_id, first_name, last_name, birth_date, gender, phone) VALUES ($1, $2, $3, $4, $5, $6)';
    const profileValues = { a: userId, b: firstName, c: lastName, d: birthDate, e: gender, f: phone };
    
    await client.query(profileQuery, Object.values(profileValues));
    await client.query('COMMIT');
    res.status(201).json({ success: true, userId });
  } catch (error) {
    await client.query('ROLLBACK');
    res.status(500).json({ success: false, error: error.message });
  }
}

async function registerBusiness(req, res) {
  const { email, password, repName, repLastName, birthDate, gender, phone, licenseUrl, zone, street, buildingNumber, businessCategory } = req.body;
  const userQuery = 'INSERT INTO users (email, password, role) VALUES ($1, $2, $3) RETURNING id';
  const userValues = { a: email, b: password, c: 'centro' };

  try {
    await client.query('BEGIN');
    const userResult = await client.query(userQuery, Object.values(userValues));
    const { id: userId } = userResult.rows[0];

    const profileQuery = 'INSERT INTO business_profiles (user_id, representative_name, representative_last_name, birth_date, gender, phone, license_pdf_url, zone, street, building_number, business_category) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)';
    const profileValues = { a: userId, b: repName, c: repLastName, d: birthDate, e: gender, f: phone, g: licenseUrl, h: zone, i: street, j: buildingNumber, k: businessCategory };

    await client.query(profileQuery, Object.values(profileValues));
    await client.query('COMMIT');
    res.status(201).json({ success: true, userId });
  } catch (error) {
    await client.query('ROLLBACK');
    res.status(500).json({ success: false, error: error.message });
  }
}

async function loginUser(req, res) {
  const { email, password } = req.body;
  const queryText = 'SELECT id, role FROM users WHERE email = $1 AND password = $2';
  const values = { a: email, b: password };

  try {
    const result = await client.query(queryText, Object.values(values));
    const { rowCount, rows } = result;

    if (rowCount > 0) {
      const { 0: user } = rows;
      res.json({ success: true, user });
    } else {
      res.status(401).json({ success: false });
    }
  } catch (error) {
    res.status(500).json({ success: false });
  }
}

async function resetPassword(req, res) {
  const { email, phone, newPassword } = req.body;
  const verifyQuery = 'SELECT u.id FROM users u JOIN client_profiles p ON u.id = p.user_id WHERE u.email = $1 AND p.phone = $2';
  const verifyValues = { a: email, b: phone };
  
  try {
    const verifyResult = await client.query(verifyQuery, Object.values(verifyValues));
    if (verifyResult.rowCount > 0) {
      const { id: userId } = verifyResult.rows[0];
      const updateQuery = 'UPDATE users SET password = $1 WHERE id = $2';
      const updateValues = { a: newPassword, b: userId };
      await client.query(updateQuery, Object.values(updateValues));
      res.json({ success: true });
    } else {
      res.status(404).json({ success: false });
    }
  } catch (error) {
    res.status(500).json({ success: false });
  }
}

module.exports = { registerClient, registerBusiness, loginUser, resetPassword };
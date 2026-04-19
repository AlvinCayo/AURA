const client = require('../config/db');

async function getSystemUsers(req, res) {
  const queryText = 'SELECT u.id, u.email, u.role, u.is_active, COALESCE(c.first_name, b.representative_name) AS first_name, COALESCE(c.last_name, b.representative_last_name) AS last_name, COALESCE(c.phone, b.phone) AS phone, COALESCE(c.profile_picture, b.profile_picture) AS profile_picture, b.license_pdf_url, b.is_approved FROM users u LEFT JOIN client_profiles c ON u.id = c.user_id LEFT JOIN business_profiles b ON u.id = b.user_id';
  try {
    const result = await client.query(queryText);
    res.json({ success: true, users: result.rows });
  } catch (error) {
    res.status(500).json({ success: false });
  }
}

async function getSystemLogs(req, res) {
  const queryText = 'SELECT u.email, a.action, a.created_at FROM activity_logs a JOIN users u ON a.user_id = u.id ORDER BY a.created_at DESC LIMIT 50';
  try {
    const result = await client.query(queryText);
    res.json({ success: true, logs: result.rows });
  } catch (error) {
    res.status(500).json({ success: false });
  }
}

async function toggleUserStatus(req, res) {
  const userId = req.params.id;
  const status = req.body.isActive;
  const queryText = 'UPDATE users SET is_active = $1 WHERE id = $2';
  try {
    await client.query(queryText, [status, userId]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false });
  }
}

async function approveBusiness(req, res) {
  const userId = req.params.id;
  const queryText = 'UPDATE business_profiles SET is_approved = TRUE WHERE user_id = $1';
  try {
    await client.query(queryText, [userId]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false });
  }
}

async function rejectBusiness(req, res) {
  const userId = req.params.id;
  const queryText = 'UPDATE business_profiles SET is_approved = FALSE, license_pdf_url = NULL WHERE user_id = $1';
  try {
    await client.query(queryText, [userId]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false });
  }
}

async function getSystemStats(req, res) {
  try {
    const ageQuery = 'SELECT AVG(EXTRACT(YEAR FROM age(COALESCE(c.birth_date, b.birth_date)))) as avg_age FROM users u LEFT JOIN client_profiles c ON u.id = c.user_id LEFT JOIN business_profiles b ON u.id = b.user_id WHERE COALESCE(c.birth_date, b.birth_date) IS NOT NULL';
    const ageResult = await client.query(ageQuery);
    const avgAge = ageResult.rows[0]?.avg_age ? Math.round(ageResult.rows[0].avg_age) : 0;

    const zoneQuery = 'SELECT zone as name, COUNT(*) as count FROM business_profiles WHERE zone IS NOT NULL GROUP BY zone';
    const zoneResult = await client.query(zoneQuery);

    const genderQuery = 'SELECT COALESCE(c.gender, b.gender) as name, COUNT(*) as count FROM users u LEFT JOIN client_profiles c ON u.id = c.user_id LEFT JOIN business_profiles b ON u.id = b.user_id WHERE COALESCE(c.gender, b.gender) IS NOT NULL GROUP BY COALESCE(c.gender, b.gender)';
    const genderResult = await client.query(genderQuery);

    const roleQuery = 'SELECT role as name, COUNT(*) as count FROM users GROUP BY role';
    const roleResult = await client.query(roleQuery);

    res.json({ success: true, avgAge, zones: zoneResult.rows, genders: genderResult.rows, roles: roleResult.rows });
  } catch (error) {
    res.status(500).json({ success: false });
  }
}

module.exports = { getSystemUsers, getSystemLogs, toggleUserStatus, approveBusiness, rejectBusiness, getSystemStats };
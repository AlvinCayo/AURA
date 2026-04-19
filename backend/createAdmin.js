const client = require('./src/config/db');

async function seedAdmin() {
  const queryText = 'INSERT INTO users (email, password, role) VALUES ($1, $2, $3)';
  const values = { a: 'admin@aura.com.bo', b: 'admin123', c: 'administrador' };

  try {
    await client.query(queryText, Object.values(values));
    process.exit(0);
  } catch (error) {
    process.exit(1);
  }
}

seedAdmin();
const client = require('./src/config/db');

async function updateDatabase() {
  const queryText = 'ALTER TABLE business_profiles ADD COLUMN IF NOT EXISTS is_approved BOOLEAN DEFAULT FALSE';
  try {
    await client.query(queryText);
    process.exit(0);
  } catch (error) {
    process.exit(1);
  }
}

updateDatabase();
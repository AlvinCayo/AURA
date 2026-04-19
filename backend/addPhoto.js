const client = require('./src/config/db');

async function addPhotoColumn() {
  const queryText = 'ALTER TABLE client_profiles ADD COLUMN IF NOT EXISTS profile_picture TEXT; ALTER TABLE business_profiles ADD COLUMN IF NOT EXISTS profile_picture TEXT;';

  try {
    await client.query(queryText);
    process.exit(0);
  } catch (error) {
    process.exit(1);
  }
}

addPhotoColumn();
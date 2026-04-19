const client = require('./src/config/db');

async function fixDatabase() {
  const queryText = `
    DROP TABLE IF EXISTS client_profiles CASCADE;
    DROP TABLE IF EXISTS business_profiles CASCADE;
    DROP TABLE IF EXISTS users CASCADE;

    CREATE TABLE users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        role TEXT NOT NULL,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE client_profiles (
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        first_name TEXT,
        last_name TEXT,
        birth_date DATE,
        gender TEXT,
        phone TEXT,
        profile_picture TEXT
    );

    CREATE TABLE business_profiles (
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        representative_name TEXT,
        representative_last_name TEXT,
        birth_date DATE,
        gender TEXT,
        phone TEXT,
        license_pdf_url TEXT,
        zone TEXT,
        street TEXT,
        building_number TEXT,
        business_category TEXT,
        profile_picture TEXT
    );
  `;

  try {
    await client.query(queryText);
    process.exit(0);
  } catch (error) {
    process.exit(1);
  }
}

fixDatabase();
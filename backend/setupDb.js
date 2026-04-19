const client = require('./src/config/db');

async function createTables() {
  const queryText = `
    DO $$ 
    BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
            CREATE TYPE user_role AS ENUM ('usuario', 'centro', 'administrador');
        END IF;
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'gender_type') THEN
            CREATE TYPE gender_type AS ENUM ('masculino', 'femenino', 'otro');
        END IF;
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'business_type') THEN
            CREATE TYPE business_type AS ENUM ('salon', 'barberia', 'unisex');
        END IF;
    END $$;

    CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        role user_role DEFAULT 'usuario',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS client_profiles (
        user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
        first_name TEXT NOT NULL,
        last_name TEXT NOT NULL,
        birth_date DATE NOT NULL,
        gender gender_type NOT NULL,
        phone TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS business_profiles (
        user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
        representative_name TEXT NOT NULL,
        representative_last_name TEXT NOT NULL,
        birth_date DATE NOT NULL,
        gender gender_type NOT NULL,
        phone TEXT NOT NULL,
        license_pdf_url TEXT NOT NULL,
        zone TEXT NOT NULL,
        street TEXT NOT NULL,
        building_number TEXT NOT NULL,
        business_category business_type NOT NULL,
        is_approved BOOLEAN DEFAULT FALSE
    );
  `;

  try {
    await client.query(queryText);
    console.log('Tablas y tipos creados correctamente en tu base de datos');
    process.exit(0);
  } catch (error) {
    console.error('Error en la creacion de tablas:', error.message);
    process.exit(1);
  }
}

createTables();
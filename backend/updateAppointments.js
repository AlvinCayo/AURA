const client = require('./src/config/db');

async function updateDatabase() {
  const queryText = `
    CREATE TABLE IF NOT EXISTS services (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        business_id UUID REFERENCES users(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        description TEXT,
        price DECIMAL NOT NULL,
        duration_minutes INT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS appointments (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        client_id UUID REFERENCES users(id) ON DELETE CASCADE,
        business_id UUID REFERENCES users(id) ON DELETE CASCADE,
        service_id UUID REFERENCES services(id) ON DELETE CASCADE,
        appointment_date TIMESTAMP WITH TIME ZONE NOT NULL,
        status TEXT DEFAULT 'pendiente'
    );
  `;

  try {
    await client.query(queryText);
    process.exit(0);
  } catch {
    process.exit(1);
  }
}

updateDatabase();
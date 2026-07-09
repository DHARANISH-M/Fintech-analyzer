import pg from 'pg';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const { Pool } = pg;

// Establish database configuration
const pool = new Pool({
  host: process.env.PGHOST,
  port: process.env.PGPORT ? parseInt(process.env.PGPORT, 10) : 5432,
  user: process.env.PGUSER,
  password: process.env.PGPASSWORD,
  database: process.env.PGDATABASE,
});

// Helper for running queries
export const query = (text: string, params?: any[]) => pool.query(text, params);

export const initializeDb = async () => {
  const client = await pool.connect();
  try {
    console.log('Connecting to PostgreSQL database...');
    
    // Enable pgcrypto extension for UUID generation if not exists
    await client.query('CREATE EXTENSION IF NOT EXISTS "pgcrypto";');

    // Create users table if not exists (using the user's base schema)
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(100) NOT NULL,
        email VARCHAR(150) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);



    // Create refresh_tokens table if not exists
    await client.query(`
      CREATE TABLE IF NOT EXISTS refresh_tokens (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        token VARCHAR(500) NOT NULL,
        expires_at TIMESTAMPTZ NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    // Create statements table if not exists
    await client.query(`
      CREATE TABLE IF NOT EXISTS statements (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        filename VARCHAR(255) NOT NULL,
        bank_name VARCHAR(150),
        account_number_last4 VARCHAR(4),
        period_from DATE,
        period_to DATE,
        raw_extraction JSONB,
        status VARCHAR(20) DEFAULT 'processing' 
          CHECK (status IN ('processing', 'completed', 'failed')),
        uploaded_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    // Create transactions table if not exists
    await client.query(`
      CREATE TABLE IF NOT EXISTS transactions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        statement_id UUID NOT NULL REFERENCES statements(id) ON DELETE CASCADE,
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        txn_date DATE NOT NULL,
        description TEXT,
        txn_type VARCHAR(10) NOT NULL CHECK (txn_type IN ('DEBIT', 'CREDIT')),
        amount NUMERIC(12,2) NOT NULL CHECK (amount > 0),
        balance NUMERIC(12,2),
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    // Create indices if they don't exist
    await client.query('CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);');
    await client.query('CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user_id ON refresh_tokens(user_id);');
    await client.query('CREATE INDEX IF NOT EXISTS idx_statements_user_id ON statements(user_id);');
    await client.query('CREATE INDEX IF NOT EXISTS idx_transactions_statement_id ON transactions(statement_id);');
    await client.query('CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);');
    await client.query('CREATE INDEX IF NOT EXISTS idx_transactions_txn_date ON transactions(txn_date);');
    await client.query('CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(txn_type);');

    // Run grants if bank_app_user exists
    try {
      await client.query('GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO bank_app_user;');
      await client.query('GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO bank_app_user;');
    } catch (grantErr) {
      console.warn('Could not grant privileges (role bank_app_user might not exist):', grantErr.message);
    }

    // Seed default Demo User if not exists
    try {
      const demoCheck = await client.query('SELECT id FROM users WHERE email = $1', ['test@example.com']);
      if (demoCheck.rows.length === 0) {
        const bcrypt = await import('bcrypt');
        const hash = await bcrypt.default.hash('password123', 10);
        await client.query(
          `INSERT INTO users (name, email, password_hash) 
           VALUES ('Demo User', 'test@example.com', $1)`,
          [hash]
        );
        console.log('PostgreSQL: Seeded Demo User (test@example.com / password123)');
      }
    } catch (seedErr) {
      console.error('PostgreSQL: Failed to seed Demo User:', seedErr.message);
    }

    console.log('PostgreSQL database initialized successfully.');
  } catch (error) {
    console.error('Error initializing PostgreSQL database:', error);
    throw error;
  } finally {
    client.release();
  }
};

export default pool;

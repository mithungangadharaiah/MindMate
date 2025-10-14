const { Pool } = require('pg');
const LocalDatabase = require('../services/localDatabase');

let pool = null;
let localDb = null;
let useLocalDb = false;

// Try to connect to PostgreSQL first
async function initializeDatabase() {
  try {
    // Try PostgreSQL connection
    pool = new Pool({
      connectionString: process.env.DATABASE_URL || 'postgresql://mindmate:password@localhost:5432/mindmate',
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
      connectionTimeoutMillis: 5000, // 5 second timeout
    });

    // Test the connection
    await pool.query('SELECT NOW()');
    console.log('✅ Connected to PostgreSQL database');
    useLocalDb = false;
    
    pool.on('error', (err) => {
      console.error('Database connection error:', err);
      console.log('🔄 Switching to local file database...');
      switchToLocalDatabase();
    });

  } catch (error) {
    console.log('⚠️  PostgreSQL not available, using local file database for demo');
    await switchToLocalDatabase();
  }
}

async function switchToLocalDatabase() {
  useLocalDb = true;
  localDb = new LocalDatabase();
  await localDb.init();
  console.log('✅ Local file database initialized');
}

function getDatabase() {
  if (useLocalDb) {
    return localDb;
  }
  return pool;
}

function isUsingLocalDb() {
  return useLocalDb;
}

module.exports = {
  initializeDatabase,
  getDatabase,
  isUsingLocalDb,
  pool: () => pool,
  localDb: () => localDb
};
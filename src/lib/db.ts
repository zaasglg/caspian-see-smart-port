import mysql, { type Pool, type ResultSetHeader, type RowDataPacket } from 'mysql2/promise';

declare global {
  // eslint-disable-next-line no-var
  var __caspianMysqlPool: Pool | undefined;
  // eslint-disable-next-line no-var
  var __caspianMysqlReady: Promise<void> | undefined;
}

function createPool() {
  return mysql.createPool({
    host: process.env.MYSQL_HOST || '127.0.0.1',
    port: Number(process.env.MYSQL_PORT || 8889),
    user: process.env.MYSQL_USER || 'root',
    password: process.env.MYSQL_PASSWORD || 'root',
    database: process.env.MYSQL_DATABASE || 'hackathon',
    waitForConnections: true,
    connectionLimit: 10,
    namedPlaceholders: true,
  });
}

export function getPool(): Pool {
  if (!global.__caspianMysqlPool) {
    global.__caspianMysqlPool = createPool();
  }
  return global.__caspianMysqlPool;
}

async function ensureSchema() {
  const pool = getPool();
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id VARCHAR(64) PRIMARY KEY,
      email VARCHAR(255) NOT NULL UNIQUE,
      name VARCHAR(255) NOT NULL,
      password_hash VARCHAR(128) NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS vessels (
      id VARCHAR(64) PRIMARY KEY,
      user_id VARCHAR(64) NOT NULL,
      name VARCHAR(255) NOT NULL,
      cargo_type ENUM('Oil', 'Grain', 'Container') NOT NULL,
      draft DECIMAL(6,2) NOT NULL,
      eta_min INT NOT NULL,
      cargo_tons INT NOT NULL,
      lat DOUBLE NOT NULL,
      lon DOUBLE NOT NULL,
      preferred_berth VARCHAR(32) NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_vessels_user (user_id),
      CONSTRAINT fk_vessels_user
        FOREIGN KEY (user_id) REFERENCES users(id)
        ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
}

export async function dbReady() {
  if (!global.__caspianMysqlReady) {
    global.__caspianMysqlReady = ensureSchema();
  }
  await global.__caspianMysqlReady;
}

export type { ResultSetHeader, RowDataPacket };

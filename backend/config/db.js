require("dotenv").config();
const { Pool } = require("pg");

const pool = new Pool(
  process.env.DATABASE_URL
    ? {
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
      }
    : {
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        port: parseInt(process.env.DB_PORT || "5432"),
        ssl: process.env.DB_SSL === "true" ? { rejectUnauthorized: false } : false
      }
);

/**
 * Wraps pg's query to return [rows, result] matching the mysql2 pattern
 * used throughout the codebase — minimises the number of files that need changing.
 */
async function query(sql, params = []) {
  // pg uses $1,$2 placeholders — convert from ? style
  let i = 0;
  const pgSql = sql.replace(/\?/g, () => `$${++i}`);
  const result = await pool.query(pgSql, params);
  return [result.rows, result];
}

/**
 * Returns a client for transaction use.
 * Mimics the mysql2 connection interface so actionService.js works unchanged.
 */
async function getConnection() {
  const client = await pool.connect();

  return {
    query: async (sql, params = []) => {
      let i = 0;
      const pgSql = sql.replace(/\?/g, () => `$${++i}`);
      const result = await client.query(pgSql, params);
      return [result.rows, result];
    },
    beginTransaction: () => client.query("BEGIN"),
    commit: () => client.query("COMMIT"),
    rollback: () => client.query("ROLLBACK"),
    release: () => client.release()
  };
}

console.log("PostgreSQL connection pool created");

module.exports = { query, getConnection };

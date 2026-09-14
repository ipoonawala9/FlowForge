const db = require("../config/db");
const bcrypt = require("bcryptjs");

async function createUser(email, password, name, phone) {
  const hashedPassword = await bcrypt.hash(password, 10);
  // derive a display name from email prefix if not provided
  const displayName = (name && name.trim()) || email.split("@")[0];

  const [rows] = await db.query(
    "INSERT INTO users (email, password, name, phone) VALUES ($1, $2, $3, $4) RETURNING id",
    [email, hashedPassword, displayName, phone || null]
  );
  return { id: rows[0].id, email, name: displayName };
}

async function findUserByEmail(email) {
  const [rows] = await db.query("SELECT * FROM users WHERE email = $1", [email]);
  return rows[0];
}

async function findUserById(id) {
  const [rows] = await db.query(
    "SELECT id, email, name, phone, created_at FROM users WHERE id = $1",
    [id]
  );
  return rows[0];
}

async function updatePassword(id, hashedPassword) {
  await db.query("UPDATE users SET password = $1 WHERE id = $2", [hashedPassword, id]);
}

async function updateProfile(id, { name, phone }) {
  await db.query(
    "UPDATE users SET name = $1, phone = $2 WHERE id = $3",
    [name, phone || null, id]
  );
}

module.exports = { createUser, findUserByEmail, findUserById, updatePassword, updateProfile };
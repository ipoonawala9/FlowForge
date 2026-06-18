const db = require("../config/db");
const bcrypt = require("bcryptjs");

async function createUser(email, password) {

    const hashedPassword = await bcrypt.hash(password, 10);

    const [result] = await db.query(
        "INSERT INTO users (email, password) VALUES (?, ?)",
        [email, hashedPassword]
    );

    return {
        id: result.insertId,
        email
    };
}

async function findUserByEmail(email) {

    const [rows] = await db.query(
        "SELECT * FROM users WHERE email = ?",
        [email]
    );

    return rows[0];
}

async function findUserById(id) {
    const [rows] = await db.query(
        "SELECT id, email, created_at FROM users WHERE id = ?",
        [id]
    );
    return rows[0];
}

async function updatePassword(id, hashedPassword) {
    await db.query(
        "UPDATE users SET password = ? WHERE id = ?",
        [hashedPassword, id]
    );
}

module.exports = {
    createUser,
    findUserByEmail,
    findUserById,
    updatePassword
};
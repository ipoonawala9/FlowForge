const db = require("../config/db");

async function getAllWorkflows(userId) {

    const [rows] = await db.query(
        "SELECT * FROM workflows WHERE user_id = ?",
        [userId]
    );

    return rows;
}

async function getWorkflowById(id) {

    const [rows] = await db.query(
        "SELECT * FROM workflows WHERE id = ?",
        [id]
    );

    return rows[0];
}

async function createWorkflow(name, userId) {

    const [result] = await db.query(
        "INSERT INTO workflows (name, user_id) VALUES (?, ?)",
        [name, userId]
    );

    return {
        id: result.insertId,
        name
    };
}

async function deleteWorkflow(id) {

    const [result] = await db.query(
        "DELETE FROM workflows WHERE id = ?",
        [id]
    );

    return result.affectedRows > 0;
}

async function getWorkflowByIdForUser(workflowId, userId) {

    const [rows] = await db.query(
        "SELECT * FROM workflows WHERE id = ? AND user_id = ?",
        [workflowId, userId]
    );

    return rows[0];
}

async function getRunsByWorkflow(workflowId) {
    const [rows] = await db.query(
        `SELECT * FROM workflow_runs WHERE workflow_id = ? ORDER BY id DESC`,
        [workflowId]
    );
    return rows;
}

async function renameWorkflow(id, name) {
    await db.query(
        "UPDATE workflows SET name = ? WHERE id = ?",
        [name, id]
    );
}

module.exports = {
    getAllWorkflows,
    getWorkflowById,
    createWorkflow,
    renameWorkflow,
    deleteWorkflow,
    getWorkflowByIdForUser,
    getRunsByWorkflow
};
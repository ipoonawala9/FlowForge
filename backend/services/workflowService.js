const db = require("../config/db");

async function getAllWorkflows(userId) {
  const [rows] = await db.query("SELECT * FROM workflows WHERE user_id = $1 ORDER BY created_at DESC", [userId]);
  return rows;
}

async function getWorkflowById(id) {
  const [rows] = await db.query("SELECT * FROM workflows WHERE id = $1", [id]);
  return rows[0];
}

async function createWorkflow(name, userId) {
  const [rows] = await db.query(
    "INSERT INTO workflows (name, user_id) VALUES ($1, $2) RETURNING id",
    [name, userId]
  );
  return { id: rows[0].id, name };
}

async function renameWorkflow(id, name) {
  await db.query("UPDATE workflows SET name = $1 WHERE id = $2", [name, id]);
}

async function deleteWorkflow(id) {
  const [, result] = await db.query("DELETE FROM workflows WHERE id = $1", [id]);
  return result.rowCount > 0;
}

async function getWorkflowByIdForUser(workflowId, userId) {
  const [rows] = await db.query(
    "SELECT * FROM workflows WHERE id = $1 AND user_id = $2",
    [workflowId, userId]
  );
  return rows[0];
}

async function getRunsByWorkflow(workflowId) {
  const [rows] = await db.query(
    "SELECT * FROM workflow_runs WHERE workflow_id = $1 ORDER BY id DESC",
    [workflowId]
  );
  return rows;
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

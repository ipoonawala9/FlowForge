const db = require("../config/db");

async function startStep(runId, nodeId, actionType, inputConfig, attempt = 1) {
  const [rows] = await db.query(
    `INSERT INTO workflow_run_steps (run_id, node_id, action_type, status, input_config, attempt)
     VALUES (?, ?, ?, 'running', ?, ?)
     RETURNING id`,
    [runId, nodeId, actionType, JSON.stringify(inputConfig || {}), attempt]
  );
  return rows[0].id;
}

async function completeStep(stepId, outputResult) {
  await db.query(
    `UPDATE workflow_run_steps
     SET status = 'success', output_result = ?, completed_at = NOW()
     WHERE id = ?`,
    [JSON.stringify(outputResult || {}), stepId]
  );
}

async function failStep(stepId, errorMessage) {
  await db.query(
    `UPDATE workflow_run_steps
     SET status = 'failed', error_message = ?, completed_at = NOW()
     WHERE id = ?`,
    [String(errorMessage).slice(0, 2000), stepId]
  );
}

async function markRetrying(stepId, errorMessage) {
  await db.query(
    `UPDATE workflow_run_steps SET status = 'retrying', error_message = ? WHERE id = ?`,
    [String(errorMessage).slice(0, 2000), stepId]
  );
}

async function getStepsByRun(runId) {
  const [rows] = await db.query(
    "SELECT * FROM workflow_run_steps WHERE run_id = ? ORDER BY id ASC",
    [runId]
  );
  return rows;
}

module.exports = { startStep, completeStep, failStep, markRetrying, getStepsByRun };
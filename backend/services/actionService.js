const db = require("../config/db");

async function getActionsByWorkflow(workflowId) {
  const [rows] = await db.query(
    `SELECT * FROM workflow_actions WHERE workflow_id = ? ORDER BY sequence_order ASC`,
    [workflowId]
  );
  return rows;
}

async function getEdgesByWorkflow(workflowId) {
  const [rows] = await db.query(
    `SELECT * FROM workflow_edges WHERE workflow_id = ?`,
    [workflowId]
  );
  return rows;
}

/**
 * Replaces all actions and edges for a workflow atomically.
 * actions: [{ node_id, action_type, action_config, sequence_order }]
 * edges:   [{ source_node_id, target_node_id, branch }]
 */
async function replaceActionsAndEdges(workflowId, actions, edges = []) {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    await conn.query("DELETE FROM workflow_edges WHERE workflow_id = ?", [workflowId]);
    await conn.query("DELETE FROM workflow_actions WHERE workflow_id = ?", [workflowId]);

    for (const action of actions) {
      await conn.query(
        `INSERT INTO workflow_actions (workflow_id, node_id, action_type, action_config, sequence_order)
         VALUES (?, ?, ?, ?, ?)`,
        [workflowId, action.node_id, action.action_type, JSON.stringify(action.action_config), action.sequence_order]
      );
    }

    for (const edge of edges) {
      await conn.query(
        `INSERT INTO workflow_edges (workflow_id, source_node_id, target_node_id, branch)
         VALUES (?, ?, ?, ?)`,
        [workflowId, edge.source_node_id, edge.target_node_id, edge.branch || "default"]
      );
    }

    await conn.commit();
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

// kept for backward compat with createAction route
async function createAction(workflowId, actionType, actionConfig, sequenceOrder) {
  const nodeId = `node_${Date.now()}`;
  const [result] = await db.query(
    `INSERT INTO workflow_actions (workflow_id, node_id, action_type, action_config, sequence_order)
     VALUES (?, ?, ?, ?, ?)`,
    [workflowId, nodeId, actionType, JSON.stringify(actionConfig), sequenceOrder]
  );
  return { id: result.insertId, workflow_id: workflowId, node_id: nodeId, action_type: actionType, action_config: actionConfig, sequence_order: sequenceOrder };
}

module.exports = {
  createAction,
  getActionsByWorkflow,
  getEdgesByWorkflow,
  replaceActionsAndEdges,
};

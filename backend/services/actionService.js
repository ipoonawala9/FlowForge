const db = require("../config/db");

async function getActionsByWorkflow(workflowId) {
  const [rows] = await db.query(
    "SELECT * FROM workflow_actions WHERE workflow_id = $1 ORDER BY sequence_order ASC",
    [workflowId]
  );
  return rows;
}

async function getEdgesByWorkflow(workflowId) {
  const [rows] = await db.query(
    "SELECT * FROM workflow_edges WHERE workflow_id = $1",
    [workflowId]
  );
  return rows;
}

async function replaceActionsAndEdges(workflowId, actions, edges = []) {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    // Use ? placeholders throughout — db.getConnection()'s query wrapper
    // converts ? → $N before sending to pg, so mixing $1 here would produce $$1.
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

async function createAction(workflowId, actionType, actionConfig, sequenceOrder) {
  const nodeId = `node_${Date.now()}`;
  const [rows] = await db.query(
    `INSERT INTO workflow_actions (workflow_id, node_id, action_type, action_config, sequence_order)
     VALUES ($1, $2, $3, $4, $5) RETURNING id`,
    [workflowId, nodeId, actionType, JSON.stringify(actionConfig), sequenceOrder]
  );
  return {
    id: rows[0].id,
    workflow_id: workflowId,
    node_id: nodeId,
    action_type: actionType,
    action_config: actionConfig,
    sequence_order: sequenceOrder
  };
}

module.exports = { createAction, getActionsByWorkflow, getEdgesByWorkflow, replaceActionsAndEdges };
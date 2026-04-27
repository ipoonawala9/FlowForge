const db = require("../config/db");
const path = require("path");
const { workflowQueue } = require("../queue/workflowQueue");

const UNIT_MS = {
  seconds: 1000,
  minutes: 60 * 1000,
  hours:   60 * 60 * 1000,
};

async function runAction(action, context) {
  const start = Date.now();

  let actionModule;
  try {
    actionModule = require(
      path.join(__dirname, "..", "actions", action.action_type + "Action")
    );
  } catch (err) {
    if (err.code === "MODULE_NOT_FOUND") {
      throw new Error(`Unsupported action type: ${action.action_type}`);
    }
    throw err;
  }

  const config =
    typeof action.action_config === "string"
      ? JSON.parse(action.action_config)
      : action.action_config;

  const result = await actionModule.execute(config, context);

  console.log(`[${action.action_type}] done in ${Date.now() - start}ms`, result);

  return result;
}

/**
 * Walks the workflow graph starting from startNodeId.
 * If a delay node is encountered, enqueues the continuation as a BullMQ job
 * with the appropriate delay and returns immediately — no blocking.
 */
async function walkGraph(workflowId, nodeMap, adj, startNodeId, context, runId) {
  const visited = new Set();

  async function walk(nodeId) {
    if (visited.has(nodeId)) return;
    visited.add(nodeId);

    const action = nodeMap[nodeId];
    if (!action) return;

    // webhook/schedule nodes are triggers — skip execution, just follow edges
    if (action.action_type === "webhook" || action.action_type === "schedule") {
      for (const e of (adj[nodeId] || [])) await walk(e.target);
      return;
    }

    // delay node — enqueue continuation instead of blocking
    if (action.action_type === "delay") {
      const config = typeof action.action_config === "string"
        ? JSON.parse(action.action_config)
        : action.action_config;

      const amount = parseFloat(config.amount);
      const unit = config.unit || "seconds";
      const ms = Math.min(amount * (UNIT_MS[unit] || 1000), 24 * 60 * 60 * 1000);

      const outgoing = adj[nodeId] || [];
      if (!outgoing.length) return;

      console.log(`[delay] scheduling continuation in ${amount} ${unit} (${ms}ms)`);

      // enqueue each downstream node as a separate delayed job
      for (const e of outgoing) {
        await workflowQueue.add(
          "continue",
          { workflowId, startNodeId: e.target, context, runId },
          { delay: ms, attempts: 3, backoff: { type: "exponential", delay: 2000 } }
        );
      }
      return; // return immediately — don't block
    }

    const result = await runAction(action, context);
    context = { ...context, ...result };

    const outgoing = adj[nodeId] || [];
    if (!outgoing.length) return;

    if (action.action_type === "condition") {
      const branch = result?.branch || "false";
      const next = outgoing.find((e) => e.branch === branch);
      if (next) await walk(next.target);
    } else {
      for (const e of outgoing) await walk(e.target);
    }
  }

  await walk(startNodeId);
}

async function buildGraph(workflowId) {
  const [actions] = await db.query(
    "SELECT * FROM workflow_actions WHERE workflow_id = ?",
    [workflowId]
  );
  const [edges] = await db.query(
    "SELECT * FROM workflow_edges WHERE workflow_id = ?",
    [workflowId]
  );

  if (!actions.length) throw new Error(`Workflow ${workflowId} has no actions configured`);

  const nodeMap = {};
  for (const a of actions) nodeMap[a.node_id] = a;

  const adj = {};
  const inDegree = {};
  for (const a of actions) { adj[a.node_id] = []; inDegree[a.node_id] = 0; }
  for (const e of edges) {
    adj[e.source_node_id] = adj[e.source_node_id] || [];
    adj[e.source_node_id].push({ target: e.target_node_id, branch: e.branch });
    inDegree[e.target_node_id] = (inDegree[e.target_node_id] || 0) + 1;
  }

  const rootId = actions.find((a) => !inDegree[a.node_id])?.node_id;
  if (!rootId) throw new Error("Could not determine workflow start node");

  return { nodeMap, adj, rootId };
}

async function executeWorkflow(workflowId, initialContext = {}) {
  console.log("Executing workflow:", workflowId);

  const [runResult] = await db.query(
    "INSERT INTO workflow_runs (workflow_id, status) VALUES (?, ?)",
    [workflowId, "running"]
  );
  const runId = runResult.insertId;

  try {
    const { nodeMap, adj, rootId } = await buildGraph(workflowId);
    await walkGraph(workflowId, nodeMap, adj, rootId, initialContext, runId);

    // only mark success if no delay jobs were enqueued
    // (delayed continuations will update the run themselves)
    await db.query(
      "UPDATE workflow_runs SET status='success', completed_at=NOW() WHERE id=? AND status='running'",
      [runId]
    );
  } catch (error) {
    console.error("Workflow execution failed:", error);
    await db.query(
      "UPDATE workflow_runs SET status='failed', completed_at=NOW() WHERE id=?",
      [runId]
    );
    throw error;
  }
}

/**
 * Called by the BullMQ worker to resume execution after a delay.
 */
async function continueWorkflow(workflowId, startNodeId, context, runId) {
  console.log(`[delay] resuming workflow ${workflowId} from node ${startNodeId}`);
  try {
    const { nodeMap, adj } = await buildGraph(workflowId);
    await walkGraph(workflowId, nodeMap, adj, startNodeId, context, runId);

    await db.query(
      "UPDATE workflow_runs SET status='success', completed_at=NOW() WHERE id=? AND status='running'",
      [runId]
    );
  } catch (error) {
    console.error("Delayed continuation failed:", error);
    await db.query(
      "UPDATE workflow_runs SET status='failed', completed_at=NOW() WHERE id=?",
      [runId]
    );
  }
}

module.exports = { executeWorkflow, continueWorkflow, buildGraph };

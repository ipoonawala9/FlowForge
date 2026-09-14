const db = require("../config/db");
const path = require("path");
const { workflowQueue } = require("../queue/workflowQueue");
const { interpolateConfig } = require("./interpolate");
const runStepService = require("./runStepService");

const UNIT_MS = {
  seconds: 1000,
  minutes: 60 * 1000,
  hours: 60 * 60 * 1000,
};

// Action types where retrying on failure makes sense — transient network/API
// failures are common here. Condition/delay nodes never reach runAction so
// they're not listed; this is purely about external-call action types.
const RETRYABLE_ACTION_TYPES = new Set(["sendEmail", "whatsapp", "httpRequest"]);
const MAX_ATTEMPTS = 3;
const BASE_BACKOFF_MS = 1000; // 1s, then 2s, then 4s

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Run a single action node, with automatic retries for transient failures
 * on network-dependent action types. Every attempt is logged as a
 * workflow_run_steps row so failures are visible with full context.
 */
async function runAction(action, context, runId) {
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

  const rawConfig =
    typeof action.action_config === "string"
      ? JSON.parse(action.action_config)
      : action.action_config || {};

  const config = interpolateConfig(rawConfig, context);

  const shouldRetry = RETRYABLE_ACTION_TYPES.has(action.action_type);
  const maxAttempts = shouldRetry ? MAX_ATTEMPTS : 1;

  let lastError;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const start = Date.now();
    const stepId = await runStepService.startStep(runId, action.node_id, action.action_type, config, attempt);

    try {
      const result = await actionModule.execute(config, context);
      await runStepService.completeStep(stepId, result);
      console.log(`[${action.action_type}] done in ${Date.now() - start}ms (attempt ${attempt})`);
      return result;
    } catch (err) {
      lastError = err;
      const isLastAttempt = attempt === maxAttempts;

      if (isLastAttempt) {
        await runStepService.failStep(stepId, err.message);
        console.error(`[${action.action_type}] failed after ${attempt} attempt(s):`, err.message);
      } else {
        await runStepService.markRetrying(stepId, err.message);
        const backoff = BASE_BACKOFF_MS * Math.pow(2, attempt - 1);
        console.warn(`[${action.action_type}] attempt ${attempt} failed, retrying in ${backoff}ms:`, err.message);
        await sleep(backoff);
      }
    }
  }

  throw lastError;
}

/**
 * Walks the workflow graph, threading context through each node.
 * Each action's output merges into context for downstream nodes to use.
 * Delay nodes pause execution by enqueuing a BullMQ job rather than blocking.
 */
async function walkGraph(workflowId, nodeMap, adj, startNodeId, context, runId) {
  const visited = new Set();

  async function walk(nodeId) {
    if (visited.has(nodeId)) return;
    visited.add(nodeId);

    const action = nodeMap[nodeId];
    if (!action) return;

    if (action.action_type === "webhook" || action.action_type === "schedule") {
      for (const e of adj[nodeId] || []) await walk(e.target);
      return;
    }

    if (action.action_type === "delay") {
      const rawConfig =
        typeof action.action_config === "string"
          ? JSON.parse(action.action_config)
          : action.action_config || {};

      const amount = parseFloat(rawConfig.amount) || 1;
      const unit = rawConfig.unit || "seconds";
      const ms = Math.min(amount * (UNIT_MS[unit] || 1000), 24 * 60 * 60 * 1000);

      const outgoing = adj[nodeId] || [];
      if (!outgoing.length) return;

      console.log(`[delay] pausing workflow ${workflowId} for ${amount} ${unit} (${ms}ms)`);

      for (const e of outgoing) {
        await workflowQueue.add(
          "continue",
          { workflowId, startNodeId: e.target, context, runId },
          { delay: ms, attempts: 3, backoff: { type: "exponential", delay: 2000 } }
        );
      }
      return;
    }

    const result = await runAction(action, context, runId);
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
  for (const a of actions) {
    adj[a.node_id] = [];
    inDegree[a.node_id] = 0;
  }
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
  console.log(`[execute] starting workflow ${workflowId}`);

  const [rows] = await db.query(
    "INSERT INTO workflow_runs (workflow_id, status) VALUES (?, ?) RETURNING id",
    [workflowId, "running"]
  );
  const runId = rows[0].id;

  await db.query(
    `DELETE FROM workflow_runs
     WHERE workflow_id = ?
       AND id NOT IN (
         SELECT id FROM workflow_runs WHERE workflow_id = ? ORDER BY id DESC LIMIT 100
       )`,
    [workflowId, workflowId]
  );

  try {
    const { nodeMap, adj, rootId } = await buildGraph(workflowId);
    await walkGraph(workflowId, nodeMap, adj, rootId, initialContext, runId);

    await db.query(
      "UPDATE workflow_runs SET status='success', completed_at=NOW() WHERE id=? AND status='running'",
      [runId]
    );
  } catch (error) {
    console.error(`[execute] workflow ${workflowId} failed:`, error.message);
    await db.query(
      "UPDATE workflow_runs SET status='failed', completed_at=NOW() WHERE id=?",
      [runId]
    );
    throw error;
  }
}

async function continueWorkflow(workflowId, startNodeId, context, runId) {
  console.log(`[queue] resuming workflow ${workflowId} from node ${startNodeId}`);
  try {
    const { nodeMap, adj } = await buildGraph(workflowId);
    await walkGraph(workflowId, nodeMap, adj, startNodeId, context, runId);

    await db.query(
      "UPDATE workflow_runs SET status='success', completed_at=NOW() WHERE id=? AND status='running'",
      [runId]
    );
  } catch (error) {
    console.error(`[queue] continuation failed:`, error.message);
    await db.query(
      "UPDATE workflow_runs SET status='failed', completed_at=NOW() WHERE id=?",
      [runId]
    );
  }
}

module.exports = { executeWorkflow, continueWorkflow, buildGraph };
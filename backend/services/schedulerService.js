const cron = require("node-cron");
const db = require("../config/db");
const { executeWorkflow } = require("./executionService");

// in-memory map of workflowId -> cron task
const activeTasks = new Map();

function registerJob(workflowId, cronExpression) {
  // cancel existing job for this workflow if any
  if (activeTasks.has(workflowId)) {
    activeTasks.get(workflowId).stop();
    activeTasks.delete(workflowId);
  }

  if (!cron.validate(cronExpression)) {
    console.error(`[scheduler] invalid cron expression for workflow ${workflowId}: ${cronExpression}`);
    return;
  }

  const task = cron.schedule(cronExpression, async () => {
    console.log(`[scheduler] firing workflow ${workflowId} (${cronExpression})`);
    try {
      await db.query(
        "UPDATE workflow_schedules SET last_run_at = NOW() WHERE workflow_id = ?",
        [workflowId]
      );
      await executeWorkflow(workflowId, {});
    } catch (err) {
      console.error(`[scheduler] workflow ${workflowId} failed:`, err.message);
    }
  });

  activeTasks.set(workflowId, task);
  console.log(`[scheduler] registered workflow ${workflowId} → "${cronExpression}"`);
}

function removeJob(workflowId) {
  if (activeTasks.has(workflowId)) {
    activeTasks.get(workflowId).stop();
    activeTasks.delete(workflowId);
    console.log(`[scheduler] removed workflow ${workflowId}`);
  }
}

// called once on server startup — loads all active schedules from DB
async function initScheduler() {
  try {
    const [schedules] = await db.query(
      "SELECT workflow_id, cron_expression FROM workflow_schedules WHERE is_active = 1"
    );
    for (const s of schedules) {
      registerJob(s.workflow_id, s.cron_expression);
    }
    console.log(`[scheduler] loaded ${schedules.length} schedule(s)`);
  } catch (err) {
    console.error("[scheduler] failed to init:", err.message);
  }
}

module.exports = { initScheduler, registerJob, removeJob };

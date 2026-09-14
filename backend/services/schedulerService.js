const cron = require("node-cron");
const db = require("../config/db");
const { workflowQueue } = require("../queue/workflowQueue");

// in-memory map of workflowId -> cron task
// (only the scheduling mechanism lives here; actual execution goes through BullMQ)
const activeTasks = new Map();

/**
 * Register a cron job for a workflow.
 * When the cron fires, it pushes a "scheduled-run" job into BullMQ rather than
 * calling executeWorkflow directly. This means:
 *   - Runs survive server restarts (BullMQ persists jobs in Redis)
 *   - Failed runs are automatically retried (3 attempts, exponential backoff)
 *   - Run history is visible in the queue
 */
function registerJob(workflowId, cronExpression) {
  // cancel existing job for this workflow if any
  if (activeTasks.has(workflowId)) {
    activeTasks.get(workflowId).stop();
    activeTasks.delete(workflowId);
  }

  if (!cron.validate(cronExpression)) {
    console.error(
      `[scheduler] invalid cron expression for workflow ${workflowId}: "${cronExpression}"`
    );
    return;
  }

  const task = cron.schedule(cronExpression, async () => {
    console.log(`[scheduler] enqueuing workflow ${workflowId} (${cronExpression})`);
    try {
      // stamp last_run_at immediately so the dashboard shows recent activity
      await db.query(
        "UPDATE workflow_schedules SET last_run_at = NOW() WHERE workflow_id = ?",
        [workflowId]
      );

      // push through BullMQ — persistent, retryable, observable
      await workflowQueue.add(
        "scheduled-run",
        { workflowId, context: { trigger: "schedule", scheduledAt: new Date().toISOString() } },
        {
          attempts: 3,
          backoff: { type: "exponential", delay: 5000 },
          removeOnComplete: { count: 200 },
          removeOnFail: { count: 100 },
        }
      );
    } catch (err) {
      console.error(`[scheduler] failed to enqueue workflow ${workflowId}:`, err.message);
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

/**
 * Called once on server startup — reloads all active schedules from the DB.
 * Because execution goes through BullMQ, any runs missed during downtime
 * won't be double-fired; they're simply skipped until the next cron tick.
 */
async function initScheduler() {
  try {
    const [schedules] = await db.query(
      "SELECT workflow_id, cron_expression FROM workflow_schedules WHERE is_active = TRUE"
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
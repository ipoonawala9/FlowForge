const { Worker } = require("bullmq");
const { connection } = require("./workflowQueue");
const { continueWorkflow, executeWorkflow } = require("../services/executionService");

const worker = new Worker(
  "workflow",
  async (job) => {
    if (job.name === "scheduled-run") {
      // fired by schedulerService — full workflow execution from the root
      const { workflowId, context } = job.data;
      console.log(`[worker] scheduled-run for workflow ${workflowId}`);
      await executeWorkflow(workflowId, context || {});

    } else if (job.name === "continue") {
      // fired by a delay node — resume from a mid-graph node
      const { workflowId, startNodeId, context, runId } = job.data;
      await continueWorkflow(workflowId, startNodeId, context, runId);

    } else {
      console.warn(`[worker] unknown job type: ${job.name}`);
    }
  },
  {
    connection,
    concurrency: 5,
  }
);

worker.on("completed", (job) => {
  console.log(`[worker] job ${job.id} (${job.name}) completed`);
});

worker.on("failed", (job, err) => {
  console.error(`[worker] job ${job.id} (${job.name}) failed: ${err.message}`);
});

worker.on("error", (err) => {
  console.error("[worker] worker error:", err.message);
});

module.exports = worker;
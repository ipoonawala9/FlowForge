const { Worker } = require("bullmq");
const { connection } = require("./workflowQueue");
const { continueWorkflow } = require("../services/executionService");

const worker = new Worker(
  "workflow",
  async (job) => {
    const { workflowId, startNodeId, context, runId } = job.data;
    await continueWorkflow(workflowId, startNodeId, context, runId);
  },
  {
    connection,
    concurrency: 5
  }
);

worker.on("completed", (job) => {
  console.log(`[queue] job ${job.id} completed`);
});

worker.on("failed", (job, err) => {
  console.error(`[queue] job ${job.id} failed:`, err.message);
});

module.exports = worker;

const { Queue } = require("bullmq");
const IORedis = require("ioredis");

const connection = new IORedis({
  host: process.env.REDIS_HOST || "localhost",
  port: parseInt(process.env.REDIS_PORT || "6379"),
  maxRetriesPerRequest: null
});

// one queue for all workflow jobs
const workflowQueue = new Queue("workflow", { connection });

module.exports = { workflowQueue, connection };

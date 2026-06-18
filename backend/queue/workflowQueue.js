const { Queue } = require("bullmq");
const IORedis = require("ioredis");

const connection = process.env.REDIS_URL
  ? new IORedis(process.env.REDIS_URL, { maxRetriesPerRequest: null })
  : new IORedis({
      host: process.env.REDIS_HOST || "localhost",
      port: parseInt(process.env.REDIS_PORT || "6379"),
      maxRetriesPerRequest: null
    });

const workflowQueue = new Queue("workflow", { connection });

module.exports = { workflowQueue, connection };

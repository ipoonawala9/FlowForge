require("dotenv").config();
const db = require("./config/db");
require("./queue/worker");
const { initScheduler } = require("./services/schedulerService");
const app = require("./app");

const PORT = process.env.PORT || 3000;

async function start() {
  // verify DB is reachable before accepting traffic
  try {
    await db.query("SELECT 1");
    console.log("Database connection verified");
  } catch (err) {
    console.error("FATAL: Cannot connect to database:", err.message);
    process.exit(1);
  }

  app.listen(PORT, async () => {
    console.log(`Server running on port ${PORT}`);
    await initScheduler();
  });
}

start();
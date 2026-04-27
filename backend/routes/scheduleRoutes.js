const express = require("express");
const router = express.Router();
const cron = require("node-cron");
const db = require("../config/db");
const authenticate = require("../middleware/authMiddleware");
const { registerJob, removeJob } = require("../services/schedulerService");
const workflowService = require("../services/workflowService");

// GET /workflows/:id/schedule
router.get("/:id/schedule", authenticate, async (req, res) => {
  try {
    const workflowId = parseInt(req.params.id);
    const [rows] = await db.query(
      "SELECT * FROM workflow_schedules WHERE workflow_id = ?",
      [workflowId]
    );
    res.json({ schedule: rows[0] || null });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch schedule" });
  }
});

// POST /workflows/:id/schedule  — body: { cron_expression }
router.post("/:id/schedule", authenticate, async (req, res) => {
  try {
    const workflowId = parseInt(req.params.id);
    const { cron_expression } = req.body;

    if (!cron_expression) {
      return res.status(400).json({ message: "cron_expression is required" });
    }

    if (!cron.validate(cron_expression)) {
      return res.status(400).json({ message: "Invalid cron expression" });
    }

    const workflow = await workflowService.getWorkflowByIdForUser(workflowId, req.userId);
    if (!workflow) return res.status(403).json({ message: "Unauthorized" });

    await db.query(
      `INSERT INTO workflow_schedules (workflow_id, cron_expression)
       VALUES (?, ?)
       ON DUPLICATE KEY UPDATE cron_expression = VALUES(cron_expression), is_active = 1`,
      [workflowId, cron_expression]
    );

    registerJob(workflowId, cron_expression);

    res.json({ success: true, message: "Schedule saved" });
  } catch (err) {
    console.error("[schedule] save error:", err.message);
    res.status(500).json({ message: "Failed to save schedule", detail: err.message });
  }
});

// DELETE /workflows/:id/schedule
router.delete("/:id/schedule", authenticate, async (req, res) => {
  try {
    const workflowId = parseInt(req.params.id);

    const workflow = await workflowService.getWorkflowByIdForUser(workflowId, req.userId);
    if (!workflow) return res.status(403).json({ message: "Unauthorized" });

    await db.query(
      "UPDATE workflow_schedules SET is_active = 0 WHERE workflow_id = ?",
      [workflowId]
    );

    removeJob(workflowId);

    res.json({ success: true, message: "Schedule removed" });
  } catch (err) {
    res.status(500).json({ message: "Failed to remove schedule" });
  }
});

module.exports = router;

const express = require("express");
const router = express.Router();
const db = require("../config/db");
const executionService = require("../services/executionService");

// secure route — endpoint + secret in URL
router.post("/webhook/:endpoint/:secret", async (req, res) => {
  try {
    const { endpoint, secret } = req.params;

    const [actions] = await db.query(
      `SELECT workflow_id FROM workflow_actions
       WHERE action_type = 'webhook'
       AND action_config->>'endpoint' = $1
       AND action_config->>'secret' = $2`,
      [endpoint, secret]
    );

    if (!actions.length) {
      return res.status(404).json({ message: "No workflow found for this endpoint" });
    }

    await executionService.executeWorkflow(actions[0].workflow_id, req.body || {});
    res.json({ message: "Workflow executed" });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Webhook execution failed" });
  }
});

// backwards compatible route — no secret
router.post("/webhook/:endpoint", async (req, res) => {
  try {
    const { endpoint } = req.params;

    const [actions] = await db.query(
      `SELECT workflow_id FROM workflow_actions
       WHERE action_type = 'webhook'
       AND action_config->>'endpoint' = $1`,
      [endpoint]
    );

    if (!actions.length) {
      return res.status(404).json({ message: "No workflow found for this endpoint" });
    }

    await executionService.executeWorkflow(actions[0].workflow_id, req.body || {});
    res.json({ message: "Workflow executed" });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Webhook execution failed" });
  }
});

module.exports = router;

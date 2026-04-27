const express = require("express");
const router = express.Router();

const db = require("../config/db");
const executionService = require("../services/executionService");

router.post("/webhook/:endpoint", async (req, res) => {

  try {

    const endpoint = req.params.endpoint;

    // webhook endpoint is stored in action_config of a webhook-type action node
    const [actions] = await db.query(
      `SELECT workflow_id FROM workflow_actions
       WHERE action_type = 'webhook'
       AND JSON_UNQUOTE(JSON_EXTRACT(action_config, '$.endpoint')) = ?`,
      [endpoint]
    );

    if (!actions.length) {
      return res.status(404).json({ message: "No workflow found for this endpoint" });
    }

    const workflowId = actions[0].workflow_id;

    // pass the request body as initial context so condition nodes can evaluate it
    await executionService.executeWorkflow(workflowId, req.body || {});

    res.json({ message: "Workflow executed" });

  } catch (error) {

    console.error(error);
    res.status(500).json({ message: "Webhook execution failed" });

  }

});

module.exports = router;

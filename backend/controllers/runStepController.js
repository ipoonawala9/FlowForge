const workflowService = require("../services/workflowService");
const runStepService = require("../services/runStepService");
const db = require("../config/db");

/**
 * GET /workflows/:id/runs/:runId/steps
 * Returns per-node execution detail for a single run — input config,
 * output result, errors, and attempt count for each node.
 * Ownership is enforced: the workflow must belong to the requesting user.
 */
async function getRunSteps(req, res) {
  try {
    const workflowId = parseInt(req.params.id);
    const runId = parseInt(req.params.runId);

    const workflow = await workflowService.getWorkflowByIdForUser(workflowId, req.userId);
    if (!workflow) return res.status(403).json({ message: "Unauthorized" });

    // confirm the run actually belongs to this workflow (defense against ID guessing)
    const [runRows] = await db.query(
      "SELECT id FROM workflow_runs WHERE id = ? AND workflow_id = ?",
      [runId, workflowId]
    );
    if (!runRows.length) return res.status(404).json({ message: "Run not found" });

    const steps = await runStepService.getStepsByRun(runId);
    res.json({ success: true, steps });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Failed to fetch run steps" });
  }
}

module.exports = { getRunSteps };
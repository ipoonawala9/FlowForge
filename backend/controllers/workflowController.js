const workflowService = require("../services/workflowService");

async function getWorkflows(req, res) {
  try {
    const workflows = await workflowService.getAllWorkflows(req.userId);
    res.json(workflows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Database error" });
  }
}

async function createWorkflow(req, res) {
  try {
    const [rows] = await require("../config/db").query(
      "SELECT COUNT(*) as count FROM workflows WHERE user_id = ?",
      [req.userId]
    );
    if (rows[0].count >= 20) {
      return res.status(400).json({ message: "Workflow limit reached (20 max). Delete an existing workflow to create a new one." });
    }
    const workflow = await workflowService.createWorkflow(req.body.name, req.userId);
    res.json(workflow);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Workflow creation failed" });
  }
}

async function getWorkflowById(req, res) {
  try {
    const id = parseInt(req.params.id);
    const workflow = await workflowService.getWorkflowById(id);

    if (!workflow) {
      return res.status(404).json({ message: "Workflow not found" });
    }

    // use req.userId — set by authMiddleware
    if (workflow.user_id !== req.userId) {
      return res.status(403).json({ message: "Access denied" });
    }

    res.json(workflow);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Database error" });
  }
}

async function deleteWorkflow(req, res) {
  try {
    const id = parseInt(req.params.id);

    // fetch first to verify ownership
    const workflow = await workflowService.getWorkflowById(id);

    if (!workflow) {
      return res.status(404).json({ message: "Workflow not found" });
    }

    if (workflow.user_id !== req.userId) {
      return res.status(403).json({ message: "Access denied" });
    }

    await workflowService.deleteWorkflow(id);

    res.json({ message: "Workflow deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Database error" });
  }
}

async function getWorkflowRuns(req, res) {
  try {
    const runs = await workflowService.getRunsByWorkflow(parseInt(req.params.id));
    res.json({ success: true, runs });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Failed to fetch runs" });
  }
}

module.exports = {
  getWorkflows,
  createWorkflow,
  getWorkflowById,
  deleteWorkflow,
  getWorkflowRuns
};

const express = require("express");
const router = express.Router();

const authenticate = require("../middleware/authMiddleware");
const {
  getWorkflows,
  createWorkflow,
  getWorkflowById,
  renameWorkflow,
  deleteWorkflow,
  getWorkflowRuns
} = require("../controllers/workflowController");

const { createWorkflowValidation } = require("../validators/workflowValidator");
const validateRequest = require("../middleware/validateRequest");
const executionService = require("../services/executionService");

router.get("/", authenticate, getWorkflows);
router.post("/", authenticate, createWorkflowValidation, validateRequest, createWorkflow);
router.get("/:id", authenticate, getWorkflowById);
router.patch("/:id", authenticate, renameWorkflow);
router.delete("/:id", authenticate, deleteWorkflow);
router.get("/:id/runs", authenticate, getWorkflowRuns);
router.post("/:id/execute", authenticate, async (req, res) => {
  try {
    const workflowId = parseInt(req.params.id);
    const workflow = await require("../services/workflowService").getWorkflowByIdForUser(workflowId, req.userId);
    if (!workflow) return res.status(403).json({ message: "Unauthorized" });
    await executionService.executeWorkflow(workflowId, {});
    res.json({ success: true, message: "Workflow executed" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message || "Execution failed" });
  }
});

module.exports = router;

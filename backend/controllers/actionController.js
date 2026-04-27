const actionService = require("../services/actionService");
const workflowService = require("../services/workflowService");


// ----------------------
// CREATE SINGLE ACTION
// ----------------------
async function createAction(req, res) {

  try {

    const workflowId = parseInt(req.params.id);
    const { action_type, action_config, sequence_order } = req.body;

    if (!action_type) {
      return res.status(400).json({
        success: false,
        message: "action_type is required"
      });
    }

    // ownership validation
    const workflow = await workflowService.getWorkflowByIdForUser(
      workflowId,
      req.userId
    );

    if (!workflow) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized workflow access"
      });
    }

    const action = await actionService.createAction(
      workflowId,
      action_type,
      action_config,
      sequence_order
    );

    res.json({
      success: true,
      action
    });

  } catch (err) {

    console.error("Create action error:", err);

    res.status(500).json({
      success: false,
      message: "Database error"
    });

  }
}


// ----------------------
// GET ACTIONS (CRITICAL FIX)
// ----------------------
async function getActions(req, res) {

  try {

    const workflowId = parseInt(req.params.id);

    // ownership validation
    const workflow = await workflowService.getWorkflowByIdForUser(
      workflowId,
      req.userId
    );

    if (!workflow) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized workflow access"
      });
    }

    const actions = await actionService.getActionsByWorkflow(workflowId);
    const edges = await actionService.getEdgesByWorkflow(workflowId);

    res.json({
      success: true,
      actions: actions || [],
      edges: edges || []
    });

  } catch (err) {

    console.error("Get actions error:", err);

    res.status(500).json({
      success: false,
      message: "Database error"
    });

  }
}


// ----------------------
// SAVE BULK ACTIONS
// ----------------------
async function saveActions(req, res) {

  try {

    const workflowId = parseInt(req.params.id);
    const { actions, edges = [] } = req.body;

    const workflow = await workflowService.getWorkflowByIdForUser(workflowId, req.userId);

    if (!workflow) {
      return res.status(403).json({ success: false, message: "Unauthorized workflow access" });
    }

    await actionService.replaceActionsAndEdges(workflowId, actions, edges);

    res.json({
      success: true,
      message: "Actions saved"
    });

  } catch (err) {

    console.error("Save actions error:", err);

    res.status(500).json({
      success: false,
      message: "Database error"
    });

  }

}

module.exports = {
  createAction,
  getActions,
  saveActions
};
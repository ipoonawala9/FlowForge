const triggerService = require("../services/triggerService");
const workflowService = require("../services/workflowService");

async function createTrigger(req, res) {

    try {

        const workflowId = parseInt(req.params.id);
        const { trigger_type, trigger_config } = req.body;

        if (!trigger_type) {
            return res.status(400).json({
                message: "trigger_type is required"
            });
        }

        
        const workflow = await workflowService.getWorkflowByIdForUser(
            workflowId,
            req.userId
        );

        if (!workflow) {
            return res.status(403).json({
                message: "Unauthorized workflow access"
            });
        }

        const trigger = await triggerService.createTrigger(
            workflowId,
            trigger_type,
            trigger_config
        );

        res.json(trigger);

    } catch (err) {

        console.error(err);

        res.status(500).json({
            message: "Database error"
        });

    }
}

async function getTriggers(req, res) {

    try {

        const workflowId = parseInt(req.params.id);

        
        const workflow = await workflowService.getWorkflowByIdForUser(
            workflowId,
            req.userId
        );

        if (!workflow) {
            return res.status(403).json({
                message: "Unauthorized workflow access"
            });
        }

        const triggers = await triggerService.getTriggersByWorkflow(workflowId);

        res.json(triggers);

    } catch (err) {

        console.error(err);

        res.status(500).json({
            message: "Database error"
        });

    }
}

module.exports = {
    createTrigger,
    getTriggers
};
const db = require("../config/db");

async function createTrigger(workflowId, triggerType, triggerConfig) {

    const [rows] = await db.query(
        `INSERT INTO workflow_triggers 
        (workflow_id, trigger_type, trigger_config)
        VALUES (?, ?, ?)
        RETURNING id`,
        [workflowId, triggerType, JSON.stringify(triggerConfig)]
    );

    return {
        id: rows[0].id,
        workflow_id: workflowId,
        trigger_type: triggerType,
        trigger_config: triggerConfig
    };
}

async function getTriggersByWorkflow(workflowId) {

    const [rows] = await db.query(
        "SELECT * FROM workflow_triggers WHERE workflow_id = ?",
        [workflowId]
    );

    return rows;
}

module.exports = {
    createTrigger,
    getTriggersByWorkflow
};
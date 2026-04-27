const { body } = require("express-validator");

const createWorkflowValidation = [
  body("name")
    .notEmpty()
    .withMessage("Workflow name is required")
];

module.exports = {
  createWorkflowValidation
};
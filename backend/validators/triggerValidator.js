const { body } = require("express-validator");

const createTriggerValidation = [
  body("trigger_type")
    .notEmpty()
    .withMessage("trigger_type is required")
];

module.exports = {
  createTriggerValidation
};
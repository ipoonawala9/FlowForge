const { body } = require("express-validator");

const createActionValidation = [
  body("action_type")
    .notEmpty()
    .withMessage("action_type is required")
];

module.exports = {
  createActionValidation
};
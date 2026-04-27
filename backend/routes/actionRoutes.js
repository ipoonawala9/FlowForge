const express = require("express");
const router = express.Router();

const authenticate = require("../middleware/authMiddleware");
const validateRequest = require("../middleware/validateRequest");

const actionController = require("../controllers/actionController");

const {
    createAction,
    getActions,
    saveActions
} = actionController;

const {
    createActionValidation
} = require("../validators/actionValidator");

router.post(
    "/workflows/:id/actions",
    authenticate,
    createActionValidation,
    validateRequest,
    createAction
);

router.get(
    "/workflows/:id/actions",
    authenticate,
    getActions
);

router.post(
    "/workflows/:id/actions/bulk",
    authenticate,
    saveActions
);

module.exports = router;
const express = require("express");
const router = express.Router();

const authenticate = require("../middleware/authMiddleware");
const validateRequest = require("../middleware/validateRequest");

const {
    createTrigger,
    getTriggers
} = require("../controllers/triggerController");

const {
    createTriggerValidation
} = require("../validators/triggerValidator");


router.post(
    "/workflows/:id/triggers",
    authenticate,
    createTriggerValidation,
    validateRequest,
    createTrigger
);

router.get(
    "/workflows/:id/triggers",
    authenticate,
    getTriggers
);

module.exports = router;
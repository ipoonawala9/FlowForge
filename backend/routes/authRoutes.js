const express = require("express");
const router = express.Router();

const authController = require("../controllers/authController");

const {
    registerValidation,
    loginValidation
} = require("../validators/authValidator");

const validateRequest = require("../middleware/validateRequest");

router.post(
    "/auth/register",
    registerValidation,
    validateRequest,
    authController.register
);

router.post(
    "/auth/login",
    loginValidation,
    validateRequest,
    authController.login
);

module.exports = router;
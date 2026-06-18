const express = require("express");
const router = express.Router();

const authController = require("../controllers/authController");
const authenticate = require("../middleware/authMiddleware");
const { registerValidation, loginValidation } = require("../validators/authValidator");
const validateRequest = require("../middleware/validateRequest");

router.post("/auth/register", registerValidation, validateRequest, authController.register);
router.post("/auth/login", loginValidation, validateRequest, authController.login);
router.get("/auth/me", authenticate, authController.me);
router.put("/auth/password", authenticate, authController.changePassword);

module.exports = router;

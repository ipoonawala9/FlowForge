const express = require("express");
const cors = require("cors");
const passport = require("passport");

const workflowRoutes = require("./routes/workflowRoutes");
const triggerRoutes = require("./routes/triggerRoutes");
const actionRoutes = require("./routes/actionRoutes");
const webhookRoutes = require("./routes/webhookRoutes");
const authRoutes = require("./routes/authRoutes");
const scheduleRoutes = require("./routes/scheduleRoutes");
const googleAuthRoutes = require("./routes/googleAuthRoutes");

const logger = require("./middleware/logger");
const errorHandler = require("./middleware/errorHandler");
const { authLimiter, apiLimiter } = require("./middleware/rateLimiter");

const app = express();

app.use(cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    credentials: true
}));

app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));
app.use(passport.initialize());

app.use(logger);
app.use(apiLimiter);

app.get("/", (req, res) => {
    res.send("FlowForge Backend Running");
});

app.use(googleAuthRoutes);
app.use(authLimiter, authRoutes);
app.use("/workflows", workflowRoutes);
app.use("/workflows", scheduleRoutes);
app.use(triggerRoutes);
app.use(actionRoutes);
app.use(webhookRoutes);

app.use(errorHandler);

module.exports = app;
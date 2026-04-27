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
const rateLimiter = require("./middleware/rateLimiter");

const app = express();

app.use(cors({
    origin: "http://localhost:5173",
    credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(passport.initialize());

app.use(logger);
app.use(rateLimiter);

app.get("/", (req, res) => {
    res.send("FlowForge Backend Running");
});

app.use(googleAuthRoutes);
app.use(authRoutes);
app.use("/workflows", workflowRoutes);
app.use("/workflows", scheduleRoutes);
app.use(triggerRoutes);
app.use(actionRoutes);
app.use(webhookRoutes);

app.use(errorHandler);

module.exports = app;
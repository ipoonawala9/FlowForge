const rateLimit = require("express-rate-limit");

// strict limiter for login/register — prevents brute force
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { message: "Too many attempts, please try again in 15 minutes" },
  standardHeaders: true,
  legacyHeaders: false
});

// general limiter for all other API routes
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { message: "Too many requests, please try again later" },
  standardHeaders: true,
  legacyHeaders: false
});

module.exports = { authLimiter, apiLimiter };

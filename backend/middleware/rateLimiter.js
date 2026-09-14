const rateLimit = require("express-rate-limit");

// Brute-force protection for login and register ONLY.
// Deliberately NOT applied to /auth/me or /auth/password —
// those are authenticated routes, not credential-guessing surfaces.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === "production" ? 10 : 0,
  skip: () => process.env.NODE_ENV !== "production",
  message: { message: "Too many attempts, please try again in 15 minutes" },
  standardHeaders: true,
  legacyHeaders: false
});

// General API limiter — disabled in dev, active in prod.
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === "production" ? 100 : 0,
  skip: () => process.env.NODE_ENV !== "production"
});

module.exports = { authLimiter, apiLimiter };
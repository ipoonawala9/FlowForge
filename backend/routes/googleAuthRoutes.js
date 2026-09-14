const express = require("express");
const router = express.Router();
const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const jwt = require("jsonwebtoken");
const db = require("../config/db");
const { sendWelcomeEmail } = require("../services/emailService");

// configure Google strategy
passport.use(new GoogleStrategy(
  {
    clientID:     process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL:  process.env.GOOGLE_CALLBACK_URL
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
      const email = profile.emails?.[0]?.value;
      if (!email) return done(new Error("No email from Google profile"));

      const displayName = profile.displayName || email.split("@")[0];

      // find existing user or create one
      const [rows] = await db.query("SELECT * FROM users WHERE email = ?", [email]);

      let user = rows[0];
      let isNewUser = false;

      if (!user) {
        // create user with a random unusable password (they'll always use Google)
        const [insertRows] = await db.query(
          "INSERT INTO users (email, password, name) VALUES (?, ?, ?) RETURNING id",
          [email, `google_oauth_${profile.id}`, displayName]
        );
        user = { id: insertRows[0].id, email, name: displayName };
        isNewUser = true;
      }

      if (isNewUser) {
        // fire welcome email in background — don't block login on SMTP
        sendWelcomeEmail({ name: user.name, email: user.email }).catch((err) =>
          console.warn("[welcome email] failed to send:", err.message)
        );
      }

      return done(null, user);
    } catch (err) {
      return done(err);
    }
  }
));

// initiate Google login
router.get("/auth/google",
  passport.authenticate("google", { scope: ["profile", "email"], session: false })
);

// Google callback — issue JWT and redirect to frontend
router.get("/auth/google/callback",
  passport.authenticate("google", { session: false, failureRedirect: `${process.env.FRONTEND_URL}/?error=oauth_failed` }),
  (req, res) => {
    const token = jwt.sign(
      { userId: req.user.id },
      process.env.JWT_SECRET,
      { expiresIn: "24h" }
    );
    // redirect to frontend with token in query param — frontend stores it
    res.redirect(`${process.env.FRONTEND_URL}/auth/callback?token=${token}`);
  }
);

module.exports = router;
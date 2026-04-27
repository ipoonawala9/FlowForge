const express = require("express");
const router = express.Router();
const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const jwt = require("jsonwebtoken");
const db = require("../config/db");

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

      // find existing user or create one
      const [rows] = await db.query("SELECT * FROM users WHERE email = ?", [email]);

      let user = rows[0];

      if (!user) {
        // create user with a random unusable password (they'll always use Google)
        const [result] = await db.query(
          "INSERT INTO users (email, password) VALUES (?, ?)",
          [email, `google_oauth_${profile.id}`]
        );
        user = { id: result.insertId, email };
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

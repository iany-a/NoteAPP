const express = require('express');
const router = express.Router();
const passport = require('passport');
const MicrosoftStrategy = require('passport-microsoft').Strategy;
const { User } = require('../models');
const jwt = require('jsonwebtoken');

// 1. STRATEGY CONFIG (Keep this as is)
passport.use(new MicrosoftStrategy({
    clientID: process.env.MICROSOFT_CLIENT_ID,
    clientSecret: process.env.MICROSOFT_CLIENT_SECRET,
    callbackURL: process.env.CALLBACK_URL,
    scope: ['user.read']
  },
  async (accessToken, refreshToken, profile, done) => {
    const email = profile.emails[0].value;
    if (!email.endsWith('@stud.ase.ro')) {
      return done(null, false, { message: 'Only ASE student emails allowed' });
    }
    try {
      const [user] = await User.findOrCreate({
        where: { microsoftId: profile.id },
        defaults: { email: email, name: profile.displayName }
      });
      return done(null, user);
    } catch (err) {
      return done(err, null);
    }
  }
));

// 2. THE LOGIN ROUTES
router.get('/microsoft', passport.authenticate('microsoft'));

router.get('/microsoft/callback', 
  passport.authenticate('microsoft', { session: false }), // We don't use sessions anymore!
  (req, res) => {
    // Generate the token using the SECRET from your .env
    const token = jwt.sign(
      { id: req.user.id, email: req.user.email }, 
      process.env.SESSION_SECRET, // Make sure this matches verifyToken
      { expiresIn: '24h' }
    );

    // Redirect to dashboard with the token in the URL
    // Note: I changed this to /dashboard since we are putting the logic there
    res.redirect(`${process.env.FRONTEND_URL}/dashboard?token=${token}`);
  }
);

// 3. THE "ME" ROUTE
// This route is now called by your Frontend with the Authorization header
router.get('/me', (req, res) => {
  // If the verifyToken middleware in server.js worked, req.user will exist
  if (req.user) {
    res.status(200).json(req.user);
  } else {
    res.status(401).json({ message: "Not authenticated - No token found" });
  }
});

// 4. LOGOUT (Simplified for JWT)
router.get('/logout', (req, res) => {
  // With JWT, logout mostly happens on the Frontend by deleting the token
  res.status(200).json({ message: "Logged out successfully" });
});

module.exports = router;
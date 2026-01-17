const express = require('express');
const router = express.Router(); // 1. Initialize the router
const passport = require('passport');
const MicrosoftStrategy = require('passport-microsoft').Strategy;
const { User } = require('../models');

// 2. Passport Serialization (REQUIRED for sessions)
passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findByPk(id);
    done(null, user);
  } catch (err) {
    done(err, null);
  }
});

// 3. Your Strategy Logic
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
        defaults: {
          email: email,
          name: profile.displayName
        }
      });
      return done(null, user);
    } catch (err) {
      return done(err, null);
    }
  }
));

// 4. THE ACTUAL ROUTES (The part Express was missing)
router.get('/microsoft', passport.authenticate('microsoft'));

router.get('/microsoft/callback', 
  passport.authenticate('microsoft', { failureRedirect: '/login' }),
  (req, res) => {
    // Explicitly save the session before redirecting
    req.session.save((err) => {
      if (err) {
        console.error(err);
        return res.redirect('/login');
      }
      res.redirect(process.env.FRONTEND_URL + '/dashboard');
    });
  }
);

// Helper route to check if user is logged in
router.get('/login/success', (req, res) => {
  if (req.user) {
    res.status(200).json({ user: req.user });
  } else {
    res.status(401).json({ message: "Not authenticated" });
  }
});

// Logout route
router.get('/logout', (req, res) => {
  req.logout(() => {
    res.redirect(`${process.env.FRONTEND_URL}/`);
  });
});

router.get('/me', (req, res) => {
  if (req.user) {
    res.status(200).json(req.user);
  } else {
    res.status(401).json({ message: "Not authenticated" });
  }
});



// 5. EXPORT THE ROUTER (Not passport)
module.exports = router;
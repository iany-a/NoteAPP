const passport = require('passport');
const MicrosoftStrategy = require('passport-microsoft').Strategy;
const { User } = require('../models');

passport.use(new MicrosoftStrategy({
    clientID: process.env.MICROSOFT_CLIENT_ID,
    clientSecret: process.env.MICROSOFT_CLIENT_SECRET,
    callbackURL: "http://localhost:5000/auth/microsoft/callback",
    scope: ['user.read']
  },
  async (accessToken, refreshToken, profile, done) => {
    const email = profile.emails[0].value;

    // RULE: Only allow ASE institutional emails
    if (!email.endsWith('@stud.ase.ro')) {
      return done(null, false, { message: 'Only ASE student emails allowed' });
    }

    try {
      // Find or create the user in your relational DB
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
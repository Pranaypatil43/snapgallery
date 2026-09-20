const passport = require('passport');
const { Strategy: GoogleStrategy } = require('passport-google-oauth20');
const User = require('../models/User');

if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  passport.use(
    new GoogleStrategy(
      {
        clientID:     process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL:  `${process.env.BACKEND_URL || 'http://localhost:5000'}/api/auth/google/callback`,
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          const email = profile.emails?.[0]?.value;
          if (!email) return done(new Error('No email returned from Google'), null);

          // 1. Already linked by googleId
          let user = await User.findOne({ googleId: profile.id });
          if (user) return done(null, user);

          // 2. Email already exists — link Google to that existing account
          user = await User.findOne({ email });
          if (user) {
            user.googleId = profile.id;
            await user.save();
            return done(null, user);
          }

          // 3. No existing account — only allow if this is the very first user (admin setup)
          const count = await User.countDocuments();
          if (count > 0) {
            // Not the first user — block Google sign-up.
            // Team members must be created by Admin via the invite flow.
            return done(null, false, { message: 'no_account' });
          }

          // First user ever — create as admin
          user = await User.create({
            name:     profile.displayName || email.split('@')[0],
            email,
            googleId: profile.id,
            role:     'admin',
          });
          return done(null, user);
        } catch (err) {
          return done(err, null);
        }
      }
    )
  );
} else {
  console.warn('Google OAuth credentials not configured. Google sign-in is disabled.');
}

// Minimal session serialisation — we only use sessions briefly during the OAuth redirect
passport.serializeUser((user, done) => done(null, user._id.toString()));
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (err) {
    done(err, null);
  }
});

module.exports = passport;

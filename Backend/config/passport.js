const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const GitHubStrategy = require('passport-github2').Strategy;
const User = require('../models/User');

// Serialize user for session
passport.serializeUser((user, done) => {
  done(null, user.id);
});

// Deserialize user from session
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

// Google Strategy
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: `${process.env.OAUTH_CALLBACK_URL}/auth/google/callback`,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        // Check if user exists by email or providerId
        let user = await User.findOne({ 
          $or: [
            { email: profile.emails[0].value },
            { providerId: profile.id, provider: 'google' }
          ]
        });

        if (!user) {
          // Create new user
          user = await User.create({
            email: profile.emails[0].value,
            username: profile.displayName || profile.emails[0].value.split('@')[0],
            password: Math.random().toString(36).slice(-8), // Random password (won't be used)
            provider: 'google',
            providerId: profile.id,
          });
        } else {
          // Update existing user with OAuth info if not set
          if (!user.provider || !user.providerId) {
            user.provider = 'google';
            user.providerId = profile.id;
            await user.save();
          }
        }

        done(null, user);
      } catch (error) {
        console.error('Google OAuth error:', error);
        done(error, null);
      }
    }
  )
);

// GitHub Strategy
passport.use(
  new GitHubStrategy(
    {
      clientID: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
      callbackURL: `${process.env.OAUTH_CALLBACK_URL}/auth/github/callback`,
      scope: ['user:email'],
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails && profile.emails[0] ? profile.emails[0].value : `${profile.username}@github.com`;
        
        // Check if user exists by email or providerId
        let user = await User.findOne({ 
          $or: [
            { email },
            { providerId: profile.id, provider: 'github' }
          ]
        });

        if (!user) {
          user = await User.create({
            email,
            username: profile.username || profile.displayName,
            password: Math.random().toString(36).slice(-8),
            provider: 'github',
            providerId: profile.id,
          });
        } else {
          // Update existing user with OAuth info if not set
          if (!user.provider || !user.providerId) {
            user.provider = 'github';
            user.providerId = profile.id;
            await user.save();
          }
        }

        done(null, user);
      } catch (error) {
        console.error('GitHub OAuth error:', error);
        done(error, null);
      }
    }
  )
);

module.exports = passport;

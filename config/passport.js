const GitHubStrategy = require('passport-github2').Strategy;
const User = require('../models/userAuthModel');
const passport = require('passport');
const axios = require('axios');

passport.use(
    new GitHubStrategy(
        {
            clientID: process.env.GITHUB_CLIENT_ID,
            clientSecret: process.env.GITHUB_CLIENT_SECRET,
            callbackURL: `${process.env.BACKEND_URL}/api/v1/auth/github/callback`,
            scope: ['user:email'],
        },
        async (accessToken, refreshToken, profile, done) => {
            try {
                let email = profile.emails?.[0]?.value;

                if (!email) {
                    const { data } = await axios.get('https://api.github.com/user/emails', {
                        headers: { Authorization: `token ${accessToken}` },
                    });
                    const primary = data.find((e) => e.primary && e.verified);
                    if (primary) email = primary.email;
                }

                if (!email) return done(new Error('No verified email found'), null);

                let user = await User.findOne({ email });
                if (!user) {
                    user = await User.create({
                        name: profile.displayName || profile.username,
                        email,
                        password: crypto.randomBytes(20).toString('hex'),
                        isVerified: true,
                    });
                }

                return done(null, user);
            } catch (err) {
                return done(err);
            }
        }
    )
);

module.exports = passport;
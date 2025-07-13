const GitHubStrategy = require('passport-github2').Strategy;
const User = require('../models/userAuthModel');
const passport = require('passport');
const axios = require('axios');
const crypto = require("crypto");
const bcrypt = require("bcryptjs");

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
                console.log("✅ GitHub profile:", profile);

                let email = profile.emails?.[0]?.value;

                if (!email) {
                    const { data } = await axios.get('https://api.github.com/user/emails', {
                        headers: { Authorization: `token ${accessToken}` },
                    });
                    const primary = data.find((e) => e.primary && e.verified);
                    if (primary) email = primary.email;
                }

                if (!email) {
                    console.error("🛑 No verified email found");
                    return done(new Error('No verified email found'), null);
                }

                let user = await User.findOne({ email });

                if (!user) {
                    const rawPassword = crypto.randomBytes(12).toString("hex");
                    const hashedPassword = await bcrypt.hash(rawPassword, 12);

                    user = await User.create({
                        name: profile.displayName || profile.username || 'GitHub User',
                        email,
                        password: hashedPassword,
                        isVerified: true,
                    });

                    console.log("New GitHub user created:", user.email);
                } else {
                    console.log("Existing GitHub user found:", user.email);
                }

                return done(null, user);
            } catch (err) {
                console.error("Error in GitHub Strategy:", err);
                return done(err);
            }
        }
    )
);

module.exports = passport;

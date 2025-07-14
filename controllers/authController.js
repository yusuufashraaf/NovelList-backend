const axios = require('axios');
const { OAuth2Client } = require('google-auth-library');
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const { validationResult } = require('express-validator');
const bcrypt = require("bcryptjs");
const sendEmail = require("../utils/sendEmail");
const User = require("../models/userAuthModel");

// @desc signup validator
// @route POST /api/v1/auth/signup
// @access public

exports.signup = async (req, res) => {
    try {
        // ✅ Step 1: Validate request input
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            const errorMessages = errors.array().map((err) => err.msg);
            return res.status(400).json({
                status: "fail",
                message: "Signup failed due to validation errors.",
                errors: errorMessages, // all detailed validation messages
            });
        }

        const { name, email, password } = req.body;

        // ✅ Step 2: Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({
                status: "fail",
                message: "User with this email already exists",
            });
        }

        // ✅ Step 3: Generate email verification token
        const otp = crypto.randomBytes(20).toString("hex");
        const hashedOtp = crypto.createHash("sha256").update(otp).digest("hex");

        // ✅ Step 4: Create user in pending (unverified) state
        const newUser = await User.create({
            name,
            email,
            password,
            verifyEmailToken: hashedOtp,
            verifyEmailExpires: Date.now() + 10 * 60 * 1000, // 10 minutes
        });

        // ✅ Step 5: Send verification email
        const verifyUrl = `${process.env.FRONTEND_URL}/verify-email/${otp}`;
        await sendEmail({
            email,
            subject: "Verify your email",
            message: `Hi ${name}, please verify your email by clicking this link:\n${verifyUrl}\n\nThis link will expire in 10 minutes.`,
        });

        // ✅ Step 6: Respond success
        res.status(200).json({
            status: "pending",
            message: "Verification email sent. Please confirm to complete signup.",
        });

    } catch (error) {
        console.error("Signup Error:", error.message);

        res.status(500).json({
            status: "error",
            message: "Internal Server Error",
        });
    }
};

exports.verifyEmail = async (req, res) => {
    const otp = req.params.otp;
    const hashedOtp = crypto.createHash("sha256").update(otp).digest("hex");

    const user = await User.findOne({
        verifyEmailToken: hashedOtp,
        verifyEmailExpires: { $gt: Date.now() },
    });

    if (!user) {
        return res.status(400).json({
            status: "fail",
            message: "Invalid or expired verification link"
        });
    }

    user.verifyEmailToken = undefined;
    user.verifyEmailExpires = undefined;
    user.isVerified = true;
    await user.save();

    res.status(200).json({
        status: "success",
        message: "Email verified successfully, you can now log in"
    });
};


// @desc login validator
// @route POST /api/v1/auth/login
// @access public
exports.login = async (req, res, next) => {
    // 1 -> check email and password
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({
            status: "fail",
            message: "Please provide email and password"
        });
    }

    // 2 -> check if user exists
    const user = await User.findOne({ email }).select("+password");

    if (!user || !user.active) {
        return res.status(401).json({
            status: "fail",
            message: "Invalid email or password"
        });
    }

    // 3 -> check if password is correct
    const isPasswordCorrect = await bcrypt.compare(password, user.password);
    if (!isPasswordCorrect) {
        return res.status(401).json({
            status: "fail",
            message: "Invalid email or password"
        });
    }

    // 4 -> Check if email is verified
    if (!user.isVerified) {
        return res.status(403).json({
            status: "fail",
            message: "Please verify your email before logging in"
        });
    }

    // 5 -> send token
    const token = jwt.sign({
        id: user._id,
        name: user.name,
        email: user.email,
    }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN
    });

    // 6 -> send response
    res.status(200).json({
        status: "success",
        token,
        data: {
            user
        }
    });
};

//This is for authentication
exports.protect = async (req, res, next) => {
    let token;
    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith("Bearer")
    ) {
        token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
        return res.status(401).json({
            status: "fail",
            message: "You are not logged in! Please log in to get access."
        });
    }

    try {
        // 2-> verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // 3-> check if user exists
        const currentUser = await User.findById(decoded.id);
        if (!currentUser) {
            return res.status(401).json({
                status: "fail",
                message: "User belonging to this token does not exist."
            });
        }

        // 4-> optional: check if password changed after token was issued
        if (currentUser.changedPasswordAfter && currentUser.changedPasswordAfter(decoded.iat)) {
            return res.status(401).json({
                status: "fail",
                message: "User recently changed password. Please log in again."
            });
        }

        req.user = currentUser;
        next();
    } catch (err) {
        return res.status(401).json({
            status: "fail",
            message: "Invalid or expired token",
            error: err.message
        });
    }
};

exports.getMe = (req, res) => {
    res.status(200).json({
        status: "success",
        data: {
            user: {
                _id: req.user._id,
                name: req.user.name,
                email: req.user.email,
                createdAt: req.user.createdAt,
                role: req.user.role
            }
        }
    });
};

//This is for authorization
exports.allowedTo = (...roles) => {
    return (req, res, next) => {
        //Check if user role is allowed
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                status: "fail",
                message: "You do not have permission to perform this action"
            });
        }
        next();
    };
};

// @desc Forget Password
// @route POST /api/v1/auth/forgotPassword
// @access Public
exports.forgotPassword = async (req, res, next) => {
    try {
        // 1. Find user by email
        const user = await User.findOne({ email: req.body.email });
        if (!user) {
            return res.status(404).json({
                status: "fail",
                message: `There is no user with this email address ${req.body.email}`,
            });
        }

        // 2. Cooldown check: must wait 1 minute between sending emails
        const ONE_MINUTE = 60 * 1000;
        const now = Date.now();

        if (user.lastEmailSentAt && now - user.lastEmailSentAt.getTime() < ONE_MINUTE) {
            return res.status(429).json({
                status: "fail",
                message: "You must wait 1 minute before requesting another password reset email.",
            });
        }

        // 3. Generate 6-digit reset code & hash it
        const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
        const hashResetCode = crypto.createHash("sha256").update(resetCode).digest("hex");

        // 4. Save hashed reset code, expiration, and reset verification flag
        user.passwordResetCode = hashResetCode;
        user.passwordResetExpires = Date.now() + 10 * 60 * 1000; // expires in 10 minutes
        user.passwordResetVerified = false;
        await user.save();

        // 5. Send reset code email
        const resetURL = `${req.protocol}://${req.get("host")}/api/v1/auth/resetPassword/${resetCode}`;
        await sendEmail({
            email: user.email,
            subject: "Your password reset token (valid for 10 minutes)",
            message: `Forgot your password? Use this reset code: ${resetCode}\n\nOr reset your password here: ${resetURL}\n\nIf you didn't forget your password, please ignore this email!`,
        });

        // 6. Save timestamp of last successful email sent
        user.lastEmailSentAt = new Date();
        await user.save();

        // 7. Send success response
        res.status(200).json({
            status: "success",
            message: "Reset code sent to email!",
        });
    } catch (err) {
        // Rollback on error
        if (user) {
            user.passwordResetCode = undefined;
            user.passwordResetExpires = undefined;
            user.passwordResetVerified = undefined;
            await user.save();
        }

        res.status(500).json({
            status: "fail",
            message: "There was an error sending the email. Try again later!",
            error: err.message,
        });
    }
};

// @desc Verify Password Reset Code
// @route PATCH /api/v1/auth/verifyPasswordResetCode
// @access Public
exports.verifyPasswordResetCode = async (req, res, next) => {
    try {
        const { email, resetCode } = req.body;

        if (!email || !resetCode) {
            return res.status(400).json({
                status: "fail",
                message: "Email and reset code are required",
            });
        }

        const now = Date.now();
        const ONE_MINUTE = 60 * 1000;

        // Hash provided reset code
        const hashResetCode = crypto.createHash("sha256").update(resetCode).digest("hex");

        // Find user by email and matching reset code that is not expired
        const user = await User.findOne({
            email: email.toLowerCase(),
            passwordResetCode: hashResetCode,
            passwordResetExpires: { $gt: now },
        });

        // If no user found, handle failed attempt cooldown per email
        if (!user) {
            // Find user by email to track failed attempts
            const anyUser = await User.findOne({ email: email.toLowerCase() });
            if (anyUser) {
                const lastAttempt = anyUser.lastPasswordResetVerifyAttempt
                    ? anyUser.lastPasswordResetVerifyAttempt.getTime()
                    : 0;

                if (now - lastAttempt < ONE_MINUTE) {
                    const waitTime = Math.ceil((ONE_MINUTE - (now - lastAttempt)) / 1000);
                    return res.status(429).json({
                        status: "fail",
                        message: `Please wait ${waitTime} seconds before trying again.`,
                    });
                }

                // Save last attempt timestamp on failed try
                anyUser.lastPasswordResetVerifyAttempt = new Date();
                await anyUser.save();
            }

            return res.status(400).json({
                status: "fail",
                message: "Invalid or expired password reset code",
            });
        }

        // Check cooldown on repeated attempts even if code is valid
        const lastAttempt = user.lastPasswordResetVerifyAttempt
            ? user.lastPasswordResetVerifyAttempt.getTime()
            : 0;

        if (now - lastAttempt < ONE_MINUTE) {
            const waitTime = Math.ceil((ONE_MINUTE - (now - lastAttempt)) / 1000);
            return res.status(429).json({
                status: "fail",
                message: `Please wait ${waitTime} seconds before trying again.`,
            });
        }

        // If all good, mark code as verified and save attempt timestamp
        user.passwordResetVerified = true;
        user.lastPasswordResetVerifyAttempt = new Date();
        await user.save();

        res.status(200).json({
            status: "success",
            message: "Reset code verified successfully",
        });
    } catch (err) {
        res.status(500).json({
            status: "error",
            message: "Internal Server Error",
            error: err.message,
        });
    }
};

// @desc Reset Password
// @route PATCH /api/v1/auth/resetPassword
// @access Public
exports.resetPassword = async (req, res, next) => {
    const user = await User.findOne({
        passwordResetVerified: true,
        passwordResetExpires: { $gt: Date.now() },
    });

    if (!user || !user.passwordResetVerified) {
        return res.status(400).json({
            status: "fail",
            message: "Invalid or expired password reset code",
        });
    }

    user.password = req.body.password;
    user.passwordResetCode = undefined;
    user.passwordResetExpires = undefined;
    user.passwordResetVerified = undefined;
    await user.save();

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN,
    });

    res.status(200).json({
        status: "success",
        token,
        data: {
            user,
        },
    });
};

exports.logout = (req, res) => {
    // No need to do anything server-side for stateless JWT logout
    res.status(200).json({
        status: "success",
        message: "Logged out successfully"
    });
};

// @desc Google Sign-In
// @route POST /api/v1/auth/google
// @access Public
exports.googleSignIn = async (req, res) => {
    try {
        const { token } = req.body;
        const ticket = await client.verifyIdToken({
            idToken: token,
            audience: process.env.GOOGLE_CLIENT_ID,
        });

        const { email, name } = ticket.getPayload();

        let user = await User.findOne({ email });

        if (!user) {
            user = await User.create({
                name,
                email,
                password: crypto.randomBytes(20).toString('hex'),
                isVerified: true
            });
        }

        const jwtToken = jwt.sign({
            id: user._id,
            name: user.name,
            email: user.email,
        }, process.env.JWT_SECRET, {
            expiresIn: process.env.JWT_EXPIRES_IN
        });

        res.status(200).json({
            status: 'success',
            token: jwtToken,
            data: {
                user: {
                    id: user._id,
                    name: user.name,
                    email: user.email,
                    role: user.role
                }
            }
        });
    } catch (error) {
        res.status(401).json({
            status: 'fail',
            message: 'Google authentication failed',
            error: error.message
        });
    }
};

// @desc GitHub Sign-In
// @route POST /api/v1/auth/github
// @access Public
exports.githubSignIn = async (req, res) => {
    const { code } = req.body;

    if (!code) {
        return res.status(400).json({ status: 'fail', message: 'Code is required' });
    }

    try {
        const tokenRes = await axios.post(
            'https://github.com/login/oauth/access_token',
            {
                client_id: process.env.GITHUB_CLIENT_ID,
                client_secret: process.env.GITHUB_CLIENT_SECRET,
                code,
                redirect_uri: `${process.env.FRONTEND_URL}/login`,
            },
            {
                headers: {
                    Accept: 'application/json',
                },
            }
        );

        const accessToken = tokenRes.data.access_token;

        if (!accessToken) {
            return res.status(401).json({
                status: 'fail',
                message: 'Access token not received from GitHub',
                githubError: tokenRes.data,
            });
        }

        const userRes = await axios.get('https://api.github.com/user', {
            headers: { Authorization: `Bearer ${accessToken}` },
        });

        const emailRes = await axios.get('https://api.github.com/user/emails', {
            headers: { Authorization: `Bearer ${accessToken}` },
        });

        const emailObj = emailRes.data.find(e => e.primary && e.verified);
        const email = emailObj ? emailObj.email : null;

        if (!email) {
            return res.status(400).json({ status: 'fail', message: 'No verified email found in GitHub account' });
        }

        const { name, login } = userRes.data;

        let user = await User.findOne({ email });
        if (!user) {
            const rawPassword = crypto.randomBytes(12).toString('hex');
            const hashedPassword = await bcrypt.hash(rawPassword, 12);
            user = await User.create({
                name: name || login,
                email,
                // password: hashedPassword,
                isVerified: true,
                oauthProvider: 'github',
            });
        }

        const jwtToken = jwt.sign({
            id: user._id,
            name: user.name,
            email: user.email,
        }, process.env.JWT_SECRET, {
            expiresIn: process.env.JWT_EXPIRES_IN
        });

        return res.status(200).json({
            status: 'success',
            token: jwtToken,
            data: {
                user: {
                    id: user._id,
                    name: user.name,
                    email: user.email,
                    role: user.role,
                },
            },
        });
    } catch (error) {
        console.error('[GitHub SIGN-IN] Error:', error?.response?.data || error.message);
        return res.status(401).json({
            status: 'fail',
            message: 'GitHub authentication failed',
            error: error?.response?.data || error.message,
        });
    }
};



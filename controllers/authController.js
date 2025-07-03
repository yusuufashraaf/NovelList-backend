const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const User = require("../models/userAuthModel");

// @desc signup validator
// @route POST /api/v1/auth/signup
// @access public
exports.signup = async (req, res, next) => {
    //1-> create user
    const user = await User.create({
        name: req.body.name,
        email: req.body.email,
        password: req.body.password
    });
    //2-> create jwt token
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN
    });
    //3-> send response
    res.status(201).json({
        status: "success",
        token,
        data: {
            user
        }
    });
};

// @desc login validator
// @route POST /api/v1/auth/login
// @access public
exports.login = async (req, res, next) => {
    //1-> check email and password
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({
            status: "fail",
            message: "Please provide email and password"
        });
    }
    //2-> check if user exist
    const user = await User.findOne({ email }).select("+password");
    if (!user) {
        return res.status(401).json({
            status: "fail",
            message: "Invalid email or password"
        });
    }
    //3-> check if password is correct
    const isPasswordCorrect = await bcrypt.compare(password, user.password);
    if (!isPasswordCorrect) {
        return res.status(401).json({
            status: "fail",
            message: "Invalid email or password"
        });
    }
    //4-> send token
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN
    });
    //5-> send response
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
        return res.status(200).json({
            status: "success",
            data: {
                user: {
                    id: currentUser._id,
                    name: currentUser.name,
                    email: currentUser.email,
                    role: currentUser.role
                }
            }
        });
    } catch (err) {
        return res.status(401).json({
            status: "fail",
            message: "Invalid or expired token",
            error: err.message
        });
    }
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

exports.forgetPassword = async (req, res, next) => {
    //1-> get user based on POSTed email
    const user = await User.findOne({ email: req.body.email });
    if (!user) {
        return res.status(404).json({
            status: "fail",
            message: `There is no user with this email address ${req.body.email}`
        });
    }
    //2-> generate the random reset code (6 digits) if user exist and save it in database after hash
    const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
    const hashResetCode = crypto.createHash("sha256").update(resetCode).digest("hex");
    await user.save({ validateBeforeSave: false });
    //3-> send it to user's email
    //4-> send response
    res.status(200).json({
        status: "success",
        message: "Token sent to email!"
    });
};
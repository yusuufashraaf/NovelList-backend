const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const jwt = require("jsonwebtoken");
const util = require("util");
const jwtVerify = util.promisify(jwt.verify);

const userAuthSchema = new mongoose.Schema({
    name: {
        type: String,
        trim: true,
        required: [true, "Name is required"],
    },
    email: {
        type: String,
        required: [true, "Email is required"],
        unique: true,
        lowercase: true,
    },
    password: {
        type: String,
        // required: function () {
        //     return !this.oauthProvider;
        // },
        required: [true, "Password is required"],
        minlength: [6, "Password must be at least 6 characters"],
        select: false
    },
    role: {
        type: String,
        enum: ["user", "admin"],
        default: "user",
    },
    active: {
        type: Boolean,
        default: true,
    },
    verifyEmailToken: String,
    verifyEmailExpires: Date,
    isVerified: {
        type: Boolean,
        default: false
    },
    passwordChangedAt: Date,
    passwordResetCode: String,
    passwordResetExpires: Date,
    passwordResetVerified: Boolean,
    lastEmailSentAt: Date,
    lastPasswordResetVerifyAttempt: Date
}, {
    timestamps: true,
});

// Hash password before saving if it's modified
userAuthSchema.pre("save", async function (next) {
    if (!this.isModified("password")) return next();

    this.password = await bcrypt.hash(this.password, 12);

    // Set passwordChangedAt only if not a new document
    if (!this.isNew) {
        this.passwordChangedAt = Date.now() - 1000;
    }

    next();
});

// Compare entered password with hashed one
userAuthSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

// Check if password was changed after the token was issued
userAuthSchema.methods.changedPasswordAfter = function (JWTTimestamp) {
    if (this.passwordChangedAt) {
        const changedTimestamp = parseInt(this.passwordChangedAt.getTime() / 1000, 10);
        return changedTimestamp > JWTTimestamp;
    }
    return false;
};


userAuthSchema.statics.verifyUser = async function (token) {
    const User = this;
    try {
        const { id } = await jwtVerify(token, process.env.JWT_SECRET);
        return await User.findById(id);
    } catch (err) {
        const Errr = new Error("You are not Authorized");
        Errr.status = 401;
        throw Errr;
    }

}
userAuthSchema.statics.verifyAdmin = async function (token) {
    const User = this;
    try {
        const { id } = await jwtVerify(token, process.env.JWT_SECRET);
        const admin = await User.findById(id);

        if (!admin || admin.role !== "admin") {
            const err = new Error("You are not authorized");
            err.status = 401;
            throw err;
        }
        return admin;

    } catch (error) {
        const Errr = new Error("You are not Authorized");
        Errr.status = 401;
        throw Errr;
    }
}
module.exports = mongoose.model("UserAuth", userAuthSchema);

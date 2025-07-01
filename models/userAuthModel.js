const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

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
        required: [true, "Password is required"],
        minlength: [6, "Password must be at least 6 characters"],
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
}
    , {
        timestamps: true,
    });

    userAuthSchema.pre("save", async function (next) {
        // Only run this function if password was actually modified
        if (!this.isModified("password")) return next();
        // Hashing user password
        this.password = await bcrypt.hash(this.password, 12);
        next();
    });

    userAuthSchema.methods.matchPassword = async function (enteredPassword) {
        return await bcrypt.compare(enteredPassword, this.password);
    };

module.exports = mongoose.model("UserAuth", userAuthSchema);
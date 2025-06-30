const mongoose = require("mongoose");

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

module.exports = mongoose.model("UserAuth", userAuthSchema);
const User = require("../models/userAuthModel");
const bcrypt = require("bcryptjs");

//get all users for only admin
// route: /api/v1/users method: get
exports.getAllUsers = async (req, res) => {
    try {
        const users = await User.find();
        res.status(200).json(users);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

//get user by id for only admin
//route: /api/v1/users/:id method: get
exports.getUserById = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }
        res.status(200).json(user);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

//create user for only admin
//route: /api/v1/users method: post
exports.createUser = async (req, res) => {
    try {
        const user = await User.create(req.body);
        res.status(201).json(user);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

//update user by id for only admin
//route: /api/v1/users/:id method: patch
exports.updateUser = async (req, res) => {
    try {
        const user = await User.findByIdAndUpdate(req.params.id,
            {
                name: req.body.name,
                email: req.body.email,
                role: req.body.role
            },
            {
                new: true,
            });
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }
        res.status(200).json(user);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// exports.changePassword = async (req, res) => {
//     try {
//         const hashedPassword = await bcrypt.hash(req.body.newPassword, 12);
//         const user = await User.findByIdAndUpdate(
//             req.params.id,
//             { password: hashedPassword },
//             { new: true }
//         );
//         if (!user) return res.status(404).json({ error: 'User not found' });
//         res.status(200).json({ message: 'Password changed successfully' });
//     } catch (error) {
//         res.status(500).json({ error: error.message });
//     }
// };

exports.changePassword = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('+password');
    if (!user) return res.status(404).json({ error: 'User not found' });

    user.password = req.body.newPassword;

    await user.save(); // ✅ This triggers pre('save') and updates passwordChangedAt

    res.status(200).json({ message: 'Password changed successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


//delete user by id for only admin
//route: /api/v1/users/:id method: delete
exports.deleteUser = async (req, res) => {
    try {
        const user = await User.findByIdAndDelete(req.params.id);
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }
        res.status(200).json({ message: "User deleted successfully" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.loginUser = async (req, res) => {
    try {
        const user = req.user; // already validated and attached
        res.status(200).json({ message: 'Login successful', user });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.registerUser = async (req, res) => {
    try {
        const user = await User.create(req.body);
        res.status(201).json(user);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
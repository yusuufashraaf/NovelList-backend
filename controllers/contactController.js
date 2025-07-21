const Contact = require('../models/contactModel');
const jwt = require('jsonwebtoken');
const User = require('../models/userAuthModel');

exports.submitMessage = async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];

        if (!token) {
            return res.status(401).json({ status: 'fail', message: 'No token provided' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        const user = await User.findById(decoded.id);
        if (!user) {
            return res.status(404).json({ status: 'fail', message: 'User not found' });
        }

        const { message } = req.body;

        if (!message || message.trim().length < 10) {
            return res.status(400).json({
                status: 'fail',
                message: 'Message is required and must be at least 10 characters',
            });
        }

        const newMessage = await Contact.create({
            name: user.name,
            email: user.email,
            message,
        });

        res.status(201).json({
            status: 'success',
            message: 'Your message has been submitted',
            data: newMessage,
        });
    } catch (error) {
        res.status(500).json({ status: 'error', message: 'Server Error' });
    }
};

exports.getAllMessages = async (req, res) => {
    try {
        const messages = await Contact.find().sort({ createdAt: -1 });
        res.status(200).json({
            status: 'success',
            results: messages.length,
            data: messages
        });
    } catch (error) {
        res.status(500).json({ status: 'error', message: 'Server Error' });
    }
};
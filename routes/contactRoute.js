const express = require('express');
const { submitMessage, getAllMessages } = require('../controllers/contactController');
const { protect, allowedTo } = require("../controllers/authController");

const router = express.Router();

router.post('/', protect, submitMessage);
router.get('/', protect, allowedTo('admin'), getAllMessages);

module.exports = router;
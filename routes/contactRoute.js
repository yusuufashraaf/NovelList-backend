const express = require('express');
const { submitMessage } = require('../controllers/contactController');
const { protect } = require("../controllers/authController");

const router = express.Router();

router.post('/', protect, submitMessage);

module.exports = router;
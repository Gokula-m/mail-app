const express = require('express');
const router = express.Router();
const requireAuth = require('../middleware/requireAuth');
const { sendEmail } = require('../controllers/emailController');

router.post('/', requireAuth, sendEmail);

module.exports = router;
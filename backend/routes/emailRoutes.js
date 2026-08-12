const express = require('express');
const router = express.Router();
const requireAuth = require('../middleware/requireAuth');
const { sendEmail, getInbox, getSent } = require('../controllers/emailController');

router.post('/', requireAuth, sendEmail);
router.get('/inbox', requireAuth, getInbox);
router.get('/sent', requireAuth, getSent);

module.exports = router;
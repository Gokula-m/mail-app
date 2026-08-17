const express = require('express');
const router = express.Router();
const requireAuth = require('../middleware/requireAuth');
const { getProfile, changePassword } = require('../controllers/profileController');

router.get('/', requireAuth, getProfile);
router.patch('/password', requireAuth, changePassword);

module.exports = router;
const express = require('express');
const router = express.Router();
const requireAuth = require('../middleware/requireAuth');
const requireAdmin = require('../middleware/requireAdmin');
const { createGroup, getMyGroups, getGroupMessages, postGroupMessage } = require('../controllers/groupController');

router.post('/', requireAuth, requireAdmin, createGroup);
router.get('/', requireAuth, getMyGroups);
router.get('/:id/messages', requireAuth, getGroupMessages);
router.post('/:id/messages', requireAuth, postGroupMessage);

module.exports = router;
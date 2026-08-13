const express = require('express');
const router = express.Router();
const requireAuth = require('../middleware/requireAuth');
const { 
  sendEmail, getInbox, getSent, getEmailById, 
  markRead, markUnread, deleteEmail, replyToEmail 
} = require('../controllers/emailController');
const upload = require('../config/multerConfig');

router.post('/', requireAuth, upload.single('attachment'), sendEmail);
router.get('/inbox', requireAuth, getInbox);
router.get('/sent', requireAuth, getSent);
router.get('/:id', requireAuth, getEmailById);
router.patch('/:id/read', requireAuth, markRead);
router.patch('/:id/unread', requireAuth, markUnread);
router.delete('/:id', requireAuth, deleteEmail);
router.post('/:id/reply', requireAuth, replyToEmail);

module.exports = router;
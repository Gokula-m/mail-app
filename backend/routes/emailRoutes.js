const express = require('express');
const router = express.Router();
const requireAuth = require('../middleware/requireAuth');
const { 
  sendEmail, getInbox, getSent, getEmailById, recallEmail, getQuickReplies, getBin,
  markRead, markUnread, deleteEmail, replyToEmail , downloadAttachment ,getDrafts, getThread
} = require('../controllers/emailController');
const upload = require('../config/multerConfig');
const { reportEmail } = require('../controllers/reportController');

router.post('/', requireAuth, upload.single('attachment'), sendEmail);
router.get('/bin', requireAuth, getBin);
router.get('/inbox', requireAuth, getInbox);
router.get('/sent', requireAuth, getSent);
router.get('/drafts', requireAuth, getDrafts);
router.get('/:id', requireAuth, getEmailById);
router.patch('/:id/read', requireAuth, markRead);
router.patch('/:id/unread', requireAuth, markUnread);
router.delete('/:id', requireAuth, deleteEmail);
router.post('/:id/reply', requireAuth, replyToEmail);
router.patch('/:id/recall', requireAuth, recallEmail);
router.get('/attachments/:id/download', requireAuth, downloadAttachment);
router.post('/:id/report', requireAuth, upload.single('document'), reportEmail);
router.get('/:id/thread', requireAuth, getThread);
router.get('/:id/quick-replies', requireAuth, getQuickReplies);
module.exports = router;
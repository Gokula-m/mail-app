const pool = require('../db/pool');
const { generateSummary, generateQuickReplies } = require('../services/aiService');
async function sendEmail(req, res) {
  const senderId = req.session.userId;
  const { receiverEmail, subject, body, expiresInHours, saveAsDraft } = req.body;

  if (!subject) {
    return res.status(400).json({ error: 'Subject is required.' });
  }

  try {
    let receiverId = null;

    if (!saveAsDraft) {
      if (!receiverEmail || !body) {
        return res.status(400).json({ error: 'Recipient and body are required to send.' });
      }
      const receiverResult = await pool.query('SELECT id FROM users WHERE email = $1', [receiverEmail]);
      if (receiverResult.rows.length === 0) {
        return res.status(404).json({ error: 'Recipient not found. They must be a registered user.' });
      }
      receiverId = receiverResult.rows[0].id;
      if (receiverId === senderId) {
        return res.status(400).json({ error: 'You cannot send an email to yourself.' });
      }
    } else if (receiverEmail) {
      const receiverResult = await pool.query('SELECT id FROM users WHERE email = $1', [receiverEmail]);
      receiverId = receiverResult.rows[0]?.id || null;
    }

    let expiresAt = null;
    if (expiresInHours) {
      expiresAt = new Date(Date.now() + expiresInHours * 60 * 60 * 1000);
    }

    const status = saveAsDraft ? 'DRAFT' : 'SENT';

    const result = await pool.query(
      `INSERT INTO emails (sender_id, receiver_id, subject, body, expires_at, status)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, sender_id, receiver_id, subject, body, status, expires_at, created_at`,
      [senderId, receiverId, subject, body || '', expiresAt, status]
    );

    const email = result.rows[0];

    // A message sent via Compose always starts a NEW thread — its own id becomes its thread_id
    await pool.query('UPDATE emails SET thread_id = $1 WHERE id = $2', [email.id, email.id]);
    email.thread_id = email.id;

    const summary = saveAsDraft ? null : await generateSummary(subject, body);
    if (summary) {
      await pool.query('UPDATE emails SET summary = $1 WHERE id = $2', [summary, email.id]);
      email.summary = summary;
    }

    if (req.file) {
      await pool.query(
        `INSERT INTO attachments (email_id, file_name, file_path, file_type, file_size)
         VALUES ($1, $2, $3, $4, $5)`,
        [email.id, req.file.originalname, req.file.path, req.file.mimetype, req.file.size]
      );
    }

    res.status(201).json({ message: saveAsDraft ? 'Draft saved.' : 'Email sent successfully.', email });

  } catch (err) {
    console.error('Send email error:', err);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
}

async function getInbox(req, res) {
  const userId = req.session.userId;
  try {
    const result = await pool.query(
      `SELECT * FROM (
         SELECT DISTINCT ON (e.thread_id)
                e.id, e.thread_id, e.subject, e.summary, e.status, e.created_at,
                COUNT(*) OVER (PARTITION BY e.thread_id) AS message_count,
                SUM(CASE WHEN e.receiver_id = $1 AND e.is_read = false THEN 1 ELSE 0 END)
                  OVER (PARTITION BY e.thread_id) AS unread_count,
                CASE WHEN e.sender_id = $1 THEN ru.name ELSE su.name END AS sender_name
         FROM emails e
         JOIN users su ON su.id = e.sender_id
         JOIN users ru ON ru.id = e.receiver_id
         WHERE e.thread_id IN (
           SELECT thread_id FROM emails WHERE receiver_id = $1 AND receiver_deleted = false
         )
         ORDER BY e.thread_id, e.created_at DESC
       ) latest
       ORDER BY latest.created_at DESC`,
      [userId]
    );
    const emails = result.rows.map(r => ({ ...r, is_read: Number(r.unread_count) === 0 }));
    res.json({ emails });
  } catch (err) {
    console.error('Get inbox error:', err);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
}

async function getSent(req, res) {
  const userId = req.session.userId;
  try {
    const result = await pool.query(
      `SELECT * FROM (
         SELECT DISTINCT ON (e.thread_id)
                e.id, e.thread_id, e.subject, e.status, e.created_at,
                COUNT(*) OVER (PARTITION BY e.thread_id) AS message_count,
                CASE WHEN e.sender_id = $1 THEN ru.name ELSE su.name END AS receiver_name
         FROM emails e
         JOIN users su ON su.id = e.sender_id
         JOIN users ru ON ru.id = e.receiver_id
         WHERE e.thread_id IN (
           SELECT thread_id FROM emails WHERE sender_id = $1 AND sender_deleted = false AND status != 'DRAFT'
         )
         ORDER BY e.thread_id, e.created_at DESC
       ) latest
       ORDER BY latest.created_at DESC`,
      [userId]
    );
    res.json({ emails: result.rows });
  } catch (err) {
    console.error('Get sent error:', err);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
}

async function getBin(req, res) {
  const userId = req.session.userId;
  try {
    const result = await pool.query(
      `SELECT * FROM (
         SELECT DISTINCT ON (e.thread_id)
                e.id, e.thread_id, e.subject, e.created_at,
                CASE WHEN e.sender_id = $1 THEN ru.name ELSE su.name END AS other_party_name
         FROM emails e
         JOIN users su ON su.id = e.sender_id
         JOIN users ru ON ru.id = e.receiver_id
         WHERE e.thread_id IN (
           SELECT thread_id FROM emails
           WHERE (sender_id = $1 AND sender_deleted = true) OR (receiver_id = $1 AND receiver_deleted = true)
         )
         AND e.thread_id NOT IN (
           SELECT thread_id FROM emails
           WHERE (sender_id = $1 AND sender_deleted = false) OR (receiver_id = $1 AND receiver_deleted = false)
         )
         ORDER BY e.thread_id, e.created_at DESC
       ) latest
       ORDER BY latest.created_at DESC`,
      [userId]
    );
    res.json({ emails: result.rows });
  } catch (err) {
    console.error('Get bin error:', err);
    res.status(500).json({ error: 'Something went wrong.' });
  }
}

async function getDrafts(req, res) {
  const userId = req.session.userId;
  try {
    const result = await pool.query(
      `SELECT id, subject, body, created_at FROM emails
       WHERE sender_id = $1 AND status = 'DRAFT' AND sender_deleted = false
       ORDER BY created_at DESC`,
      [userId]
    );
    res.json({ emails: result.rows });
  } catch (err) {
    console.error('Get drafts error:', err);
    res.status(500).json({ error: 'Something went wrong.' });
  }
}

async function getEmailById(req, res) {
  const userId = req.session.userId;
  const emailId = req.params.id;
  try {
    const result = await pool.query(
      `SELECT e.*, 
              su.name AS sender_name, su.email AS sender_email,
              ru.name AS receiver_name, ru.email AS receiver_email
       FROM emails e
       JOIN users su ON su.id = e.sender_id
       JOIN users ru ON ru.id = e.receiver_id
       WHERE e.id = $1`,
      [emailId]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Email not found.' });

    const email = result.rows[0];
    const isSender = email.sender_id === userId;
    const isReceiver = email.receiver_id === userId;
    if (!isSender && !isReceiver) {
      return res.status(403).json({ error: 'You do not have permission to view this email.' });
    }

    const isRecalled = email.status === 'RECALLED';
    const isExpired = email.expires_at && new Date(email.expires_at) < new Date();
    if (isRecalled || isExpired) {
      email.body = null;
      email.summary = null;
    }

    if (isReceiver && !email.is_read) {
      await pool.query('UPDATE emails SET is_read = true WHERE id = $1', [emailId]);
      email.is_read = true;
    }

    res.json({ email });
  } catch (err) {
    console.error('Get email by id error:', err);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
}

async function markRead(req, res) { await toggleReadStatus(req, res, true); }
async function markUnread(req, res) { await toggleReadStatus(req, res, false); }

async function toggleReadStatus(req, res, readValue) {
  const userId = req.session.userId;
  const emailId = req.params.id;
  try {
    const result = await pool.query('SELECT * FROM emails WHERE id = $1', [emailId]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Email not found.' });
    if (result.rows[0].receiver_id !== userId) {
      return res.status(403).json({ error: 'Only the recipient can change read status.' });
    }
    await pool.query('UPDATE emails SET is_read = $1 WHERE id = $2', [readValue, emailId]);
    res.json({ message: `Email marked as ${readValue ? 'read' : 'unread'}.` });
  } catch (err) {
    console.error('Toggle read status error:', err);
    res.status(500).json({ error: 'Something went wrong.' });
  }
}

async function deleteEmail(req, res) {
  const userId = req.session.userId;
  const emailId = req.params.id;
  try {
    const anchorResult = await pool.query('SELECT * FROM emails WHERE id = $1', [emailId]);
    if (anchorResult.rows.length === 0) return res.status(404).json({ error: 'Email not found.' });
    const anchor = anchorResult.rows[0];

    if (anchor.sender_id !== userId && anchor.receiver_id !== userId) {
      return res.status(403).json({ error: 'You do not have permission to delete this email.' });
    }

    const threadId = anchor.thread_id || anchor.id;

    // Hide the ENTIRE conversation from this user's view, regardless of their role per message
    await pool.query('UPDATE emails SET sender_deleted = true WHERE thread_id = $1 AND sender_id = $2', [threadId, userId]);
    await pool.query('UPDATE emails SET receiver_deleted = true WHERE thread_id = $1 AND receiver_id = $2', [threadId, userId]);

    res.json({ message: 'Conversation moved to Bin.' });
  } catch (err) {
    console.error('Delete email error:', err);
    res.status(500).json({ error: 'Something went wrong.' });
  }
}
async function replyToEmail(req, res) {
  const senderId = req.session.userId;
  const originalEmailId = req.params.id;
  const { body } = req.body;
  if (!body) return res.status(400).json({ error: 'Reply body is required.' });

  try {
    const original = await pool.query('SELECT * FROM emails WHERE id = $1', [originalEmailId]);
    if (original.rows.length === 0) return res.status(404).json({ error: 'Original email not found.' });

    const orig = original.rows[0];
    const isSender = orig.sender_id === senderId;
    const isReceiver = orig.receiver_id === senderId;
    if (!isSender && !isReceiver) {
      return res.status(403).json({ error: 'You cannot reply to an email you were not part of.' });
    }

    const replyReceiverId = isSender ? orig.receiver_id : orig.sender_id;
    const subject = orig.subject.startsWith('Re:') ? orig.subject : `Re: ${orig.subject}`;
    const threadId = orig.thread_id || orig.id; // fallback for any pre-migration row

    const result = await pool.query(
      `INSERT INTO emails (sender_id, receiver_id, subject, body, status, thread_id)
       VALUES ($1, $2, $3, $4, 'SENT', $5)
       RETURNING id, sender_id, receiver_id, subject, body, status, thread_id, created_at`,
      [senderId, replyReceiverId, subject, body, threadId]
    );

    res.status(201).json({ message: 'Reply sent.', email: result.rows[0] });
  } catch (err) {
    console.error('Reply error:', err);
    res.status(500).json({ error: 'Something went wrong.' });
  }
}

async function downloadAttachment(req, res) {
  const userId = req.session.userId;
  const attachmentId = req.params.id;
  try {
    const result = await pool.query(
      `SELECT a.*, e.sender_id, e.receiver_id, e.status, e.expires_at
       FROM attachments a JOIN emails e ON e.id = a.email_id WHERE a.id = $1`,
      [attachmentId]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Attachment not found.' });
    const att = result.rows[0];
    const isSender = att.sender_id === userId;
    const isReceiver = att.receiver_id === userId;
    if (!isSender && !isReceiver) return res.status(403).json({ error: 'You do not have permission to access this file.' });
    if (att.status === 'RECALLED') return res.status(403).json({ error: 'This email has been recalled. Attachment is no longer accessible.' });
    if (att.expires_at && new Date(att.expires_at) < new Date()) return res.status(403).json({ error: 'This email has expired. Attachment is no longer accessible.' });
    res.download(att.file_path, att.file_name);
  } catch (err) {
    console.error('Download error:', err);
    res.status(500).json({ error: 'Something went wrong.' });
  }
}

async function recallEmail(req, res) {
  const userId = req.session.userId;
  const emailId = req.params.id;
  try {
    const result = await pool.query('SELECT * FROM emails WHERE id = $1', [emailId]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Email not found.' });
    const email = result.rows[0];
    if (email.sender_id !== userId) return res.status(403).json({ error: 'Only the sender can recall this email.' });
    if (email.status === 'RECALLED') return res.status(400).json({ error: 'This email has already been recalled.' });
    await pool.query(`UPDATE emails SET status = 'RECALLED', recalled_at = NOW() WHERE id = $1`, [emailId]);
    res.json({ message: 'Email recalled. It is no longer accessible.' });
  } catch (err) {
    console.error('Recall error:', err);
    res.status(500).json({ error: 'Something went wrong.' });
  }
}

async function getThread(req, res) {
  const userId = req.session.userId;
  const emailId = req.params.id;
  try {
    const anchorResult = await pool.query('SELECT * FROM emails WHERE id = $1', [emailId]);
    if (anchorResult.rows.length === 0) return res.status(404).json({ error: 'Email not found.' });
    const anchor = anchorResult.rows[0];
    if (anchor.sender_id !== userId && anchor.receiver_id !== userId) {
      return res.status(403).json({ error: 'You do not have permission to view this conversation.' });
    }

    const threadId = anchor.thread_id || anchor.id;

    const result = await pool.query(
      `SELECT e.id, e.subject, e.body, e.status, e.expires_at, e.created_at, e.sender_id, su.name AS sender_name
       FROM emails e JOIN users su ON su.id = e.sender_id
       WHERE e.thread_id = $1
       ORDER BY e.created_at ASC`,
      [threadId]
    );

    const thread = result.rows.map(msg => {
      const isRecalled = msg.status === 'RECALLED';
      const isExpired = msg.expires_at && new Date(msg.expires_at) < new Date();
      return { ...msg, body: (isRecalled || isExpired) ? null : msg.body, recalled: isRecalled, expired: isExpired };
    });

    res.json({ thread });
  } catch (err) {
    console.error('Get thread error:', err);
    res.status(500).json({ error: 'Something went wrong.' });
  }
}

async function getQuickReplies(req, res) {
  const userId = req.session.userId;
  const emailId = req.params.id;
  try {
    const result = await pool.query('SELECT * FROM emails WHERE id = $1', [emailId]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Email not found.' });
    const email = result.rows[0];
    if (email.sender_id !== userId && email.receiver_id !== userId) {
      return res.status(403).json({ error: 'Not authorized.' });
    }
    const replies = await generateQuickReplies(email.subject, email.body || '');
    res.json({ replies });
  } catch (err) {
    console.error('Quick replies error:', err);
    res.json({ replies: ['Thanks, got it.', "I'm interested.", 'Will get back to you.'] });
  }
}
module.exports = {
  sendEmail, getInbox, getSent, getEmailById,
  markRead, markUnread, deleteEmail, replyToEmail, recallEmail, downloadAttachment, getDrafts, getThread
  , getQuickReplies , getBin
};


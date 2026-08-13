const pool = require('../db/pool');

async function sendEmail(req, res) {
  const senderId = req.session.userId;
  const { receiverEmail, subject, body } = req.body;

  if (!receiverEmail || !subject || !body) {
    return res.status(400).json({ error: 'Recipient, subject, and body are all required.' });
  }

  try {
    const receiverResult = await pool.query('SELECT id FROM users WHERE email = $1', [receiverEmail]);
    if (receiverResult.rows.length === 0) {
      return res.status(404).json({ error: 'Recipient not found. They must be a registered user.' });
    }
    const receiverId = receiverResult.rows[0].id;

    if (receiverId === senderId) {
      return res.status(400).json({ error: 'You cannot send an email to yourself.' });
    }

    const result = await pool.query(
      `INSERT INTO emails (sender_id, receiver_id, subject, body)
       VALUES ($1, $2, $3, $4)
       RETURNING id, sender_id, receiver_id, subject, body, status, created_at`,
      [senderId, receiverId, subject, body]
    );

    const email = result.rows[0];

    // NEW: if a file was uploaded, save its metadata
    if (req.file) {
      await pool.query(
        `INSERT INTO attachments (email_id, file_name, file_path, file_type, file_size)
         VALUES ($1, $2, $3, $4, $5)`,
        [email.id, req.file.originalname, req.file.path, req.file.mimetype, req.file.size]
      );
    }

    res.status(201).json({ message: 'Email sent successfully.', email });

  } catch (err) {
    console.error('Send email error:', err);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
}

async function getInbox(req, res) {
  const userId = req.session.userId;

  try {
    const result = await pool.query(
      `SELECT e.id, e.subject, e.body, e.is_read, e.status, e.created_at,
              u.name AS sender_name, u.email AS sender_email
       FROM emails e
       JOIN users u ON u.id = e.sender_id
       WHERE e.receiver_id = $1 AND e.receiver_deleted = false
       ORDER BY e.created_at DESC`,
      [userId]
    );
    res.json({ emails: result.rows });
  } catch (err) {
    console.error('Get inbox error:', err);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
}

async function getSent(req, res) {
  const userId = req.session.userId;

  try {
    const result = await pool.query(
      `SELECT e.id, e.subject, e.body, e.is_read, e.status, e.created_at,
              u.name AS receiver_name, u.email AS receiver_email
       FROM emails e
       JOIN users u ON u.id = e.receiver_id
       WHERE e.sender_id = $1 AND e.sender_deleted = false
       ORDER BY e.created_at DESC`,
      [userId]
    );
    res.json({ emails: result.rows });
  } catch (err) {
    console.error('Get sent error:', err);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
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

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Email not found.' });
    }

    const email = result.rows[0];

    // AUTHORIZATION CHECK — this is the core of this step
    const isSender = email.sender_id === userId;
    const isReceiver = email.receiver_id === userId;

    if (!isSender && !isReceiver) {
      return res.status(403).json({ error: 'You do not have permission to view this email.' });
    }

    // If the receiver is opening it, mark it as read
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
async function markRead(req, res) {
  await toggleReadStatus(req, res, true);
}

async function markUnread(req, res) {
  await toggleReadStatus(req, res, false);
}

async function toggleReadStatus(req, res, readValue) {
  const userId = req.session.userId;
  const emailId = req.params.id;

  try {
    const result = await pool.query('SELECT * FROM emails WHERE id = $1', [emailId]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Email not found.' });
    }

    const email = result.rows[0];

    // Only the RECEIVER controls read/unread — makes sense: it's their inbox state
    if (email.receiver_id !== userId) {
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
    const result = await pool.query('SELECT * FROM emails WHERE id = $1', [emailId]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Email not found.' });
    }

    const email = result.rows[0];
    const isSender = email.sender_id === userId;
    const isReceiver = email.receiver_id === userId;

    if (!isSender && !isReceiver) {
      return res.status(403).json({ error: 'You do not have permission to delete this email.' });
    }

    // Soft-delete: only flip the flag for WHICHEVER side is asking
    if (isSender) {
      await pool.query('UPDATE emails SET sender_deleted = true WHERE id = $1', [emailId]);
    }
    if (isReceiver) {
      await pool.query('UPDATE emails SET receiver_deleted = true WHERE id = $1', [emailId]);
    }

    res.json({ message: 'Email deleted from your view.' });

  } catch (err) {
    console.error('Delete email error:', err);
    res.status(500).json({ error: 'Something went wrong.' });
  }
}
async function replyToEmail(req, res) {
  const senderId = req.session.userId;
  const originalEmailId = req.params.id;
  const { body } = req.body;

  if (!body) {
    return res.status(400).json({ error: 'Reply body is required.' });
  }

  try {
    const original = await pool.query('SELECT * FROM emails WHERE id = $1', [originalEmailId]);
    if (original.rows.length === 0) {
      return res.status(404).json({ error: 'Original email not found.' });
    }

    const orig = original.rows[0];
    const isSender = orig.sender_id === senderId;
    const isReceiver = orig.receiver_id === senderId;

    if (!isSender && !isReceiver) {
      return res.status(403).json({ error: 'You cannot reply to an email you were not part of.' });
    }

    // Reply goes to whichever party you AREN'T
    const replyReceiverId = isSender ? orig.receiver_id : orig.sender_id;
    const subject = orig.subject.startsWith('Re:') ? orig.subject : `Re: ${orig.subject}`;

    const result = await pool.query(
      `INSERT INTO emails (sender_id, receiver_id, subject, body)
       VALUES ($1, $2, $3, $4)
       RETURNING id, sender_id, receiver_id, subject, body, status, created_at`,
      [senderId, replyReceiverId, subject, body]
    );

    res.status(201).json({ message: 'Reply sent.', email: result.rows[0] });

  } catch (err) {
    console.error('Reply error:', err);
    res.status(500).json({ error: 'Something went wrong.' });
  }
}

module.exports = { 
  sendEmail, getInbox, getSent, getEmailById, 
  markRead, markUnread, deleteEmail, replyToEmail 
};

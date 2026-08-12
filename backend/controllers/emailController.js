const pool = require('../db/pool');

async function sendEmail(req, res) {
  const senderId = req.session.userId; // trusted — from the session, never from req.body
  const { receiverEmail, subject, body } = req.body;

  // Validation
  if (!receiverEmail || !subject || !body) {
    return res.status(400).json({ error: 'Recipient, subject, and body are all required.' });
  }

  try {
    // Confirm the receiver actually exists (this is our "internal-only" rule from earlier)
    const receiverResult = await pool.query(
      'SELECT id FROM users WHERE email = $1',
      [receiverEmail]
    );

    if (receiverResult.rows.length === 0) {
      return res.status(404).json({ error: 'Recipient not found. They must be a registered user.' });
    }

    const receiverId = receiverResult.rows[0].id;

    // Prevent sending an email to yourself being confusing — optional but good practice
    if (receiverId === senderId) {
      return res.status(400).json({ error: 'You cannot send an email to yourself.' });
    }

    const result = await pool.query(
      `INSERT INTO emails (sender_id, receiver_id, subject, body)
       VALUES ($1, $2, $3, $4)
       RETURNING id, sender_id, receiver_id, subject, body, status, created_at`,
      [senderId, receiverId, subject, body]
    );

    res.status(201).json({ message: 'Email sent successfully.', email: result.rows[0] });

  } catch (err) {
    console.error('Send email error:', err);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
}

module.exports = { sendEmail };
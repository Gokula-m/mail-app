const pool = require('../db/pool');

async function reportEmail(req, res) {
  const userId = req.session.userId;
  const emailId = req.params.id;
  const { reason } = req.body;

  if (!reason) {
    return res.status(400).json({ error: 'A reason is required to report an email.' });
  }

  try {
    const emailResult = await pool.query('SELECT * FROM emails WHERE id = $1', [emailId]);
    if (emailResult.rows.length === 0) {
      return res.status(404).json({ error: 'Email not found.' });
    }
    const email = emailResult.rows[0];

    if (email.sender_id !== userId && email.receiver_id !== userId) {
      return res.status(403).json({ error: 'You can only report emails you sent or received.' });
    }

    const fileName = req.file ? req.file.originalname : null;
    const filePath = req.file ? req.file.path : null;

    const result = await pool.query(
      `INSERT INTO reports (email_id, reported_by, reason, file_name, file_path)
       VALUES ($1, $2, $3, $4, $5) RETURNING id`,
      [emailId, userId, reason, fileName, filePath]
    );

    res.status(201).json({ message: 'Email reported. An admin will review it.', reportId: result.rows[0].id });
  } catch (err) {
    console.error('Report error:', err);
    res.status(500).json({ error: 'Something went wrong.' });
  }
}

async function getReports(req, res) {
  try {
    const result = await pool.query(
      `SELECT r.id, r.reason, r.status, r.created_at,
              e.id AS email_id, e.subject, e.body,
              su.name AS sender_name, su.email AS sender_email,
              ru.name AS reporter_name, ru.email AS reporter_email
       FROM reports r
       JOIN emails e ON e.id = r.email_id
       JOIN users su ON su.id = e.sender_id
       JOIN users ru ON ru.id = r.reported_by
       ORDER BY r.created_at DESC`
    );
    res.json({ reports: result.rows });
  } catch (err) {
    console.error('Get reports error:', err);
    res.status(500).json({ error: 'Something went wrong.' });
  }
}

async function getReportById(req, res) {
  const reportId = req.params.id;
  try {
    const result = await pool.query(
      `SELECT r.*, 
              e.subject, e.body,
              su.name AS sender_name, su.email AS sender_email,
              ru.name AS reporter_name, ru.email AS reporter_email
       FROM reports r
       JOIN emails e ON e.id = r.email_id
       JOIN users su ON su.id = e.sender_id
       JOIN users ru ON ru.id = r.reported_by
       WHERE r.id = $1`,
      [reportId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Report not found.' });
    }
    res.json({ report: result.rows[0] });
  } catch (err) {
    console.error('Get report by id error:', err);
    res.status(500).json({ error: 'Something went wrong.' });
  }
}

module.exports = { reportEmail, getReports, getReportById };
const pool = require('../db/pool');

async function createEvent(req, res) {
  const userId = req.session.userId;
  const { title, eventDate, notes, emailId } = req.body;

  if (!title || !eventDate) {
    return res.status(400).json({ error: 'Title and event date are required.' });
  }

  try {
    const result = await pool.query(
      `INSERT INTO calendar_events (user_id, email_id, title, event_date, notes)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [userId, emailId || null, title, eventDate, notes || null]
    );
    res.status(201).json({ message: 'Event created.', event: result.rows[0] });
  } catch (err) {
    console.error('Create event error:', err);
    res.status(500).json({ error: 'Something went wrong.' });
  }
}

async function getEvents(req, res) {
  const userId = req.session.userId;
  try {
    const result = await pool.query(
      'SELECT * FROM calendar_events WHERE user_id = $1 ORDER BY event_date ASC',
      [userId]
    );
    res.json({ events: result.rows });
  } catch (err) {
    console.error('Get events error:', err);
    res.status(500).json({ error: 'Something went wrong.' });
  }
}

async function deleteEvent(req, res) {
  const userId = req.session.userId;
  const eventId = req.params.id;

  try {
    const result = await pool.query('SELECT * FROM calendar_events WHERE id = $1', [eventId]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Event not found.' });
    }
    if (result.rows[0].user_id !== userId) {
      return res.status(403).json({ error: 'You do not have permission to delete this event.' });
    }
    await pool.query('DELETE FROM calendar_events WHERE id = $1', [eventId]);
    res.json({ message: 'Event deleted.' });
  } catch (err) {
    console.error('Delete event error:', err);
    res.status(500).json({ error: 'Something went wrong.' });
  }
}

module.exports = { createEvent, getEvents, deleteEvent };
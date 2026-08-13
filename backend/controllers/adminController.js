const pool = require('../db/pool');

async function getAllUsers(req, res) {
  try {
    const result = await pool.query(
      'SELECT id, name, email, role, is_active, created_at FROM users ORDER BY created_at DESC'
    );
    res.json({ users: result.rows });
  } catch (err) {
    console.error('Get all users error:', err);
    res.status(500).json({ error: 'Something went wrong.' });
  }
}

async function deactivateUser(req, res) {
  const targetUserId = req.params.id;
  try {
    const result = await pool.query(
      'UPDATE users SET is_active = false WHERE id = $1 RETURNING id, name, email, is_active',
      [targetUserId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found.' });
    }
    res.json({ message: 'User deactivated.', user: result.rows[0] });
  } catch (err) {
    console.error('Deactivate user error:', err);
    res.status(500).json({ error: 'Something went wrong.' });
  }
}

module.exports = { getAllUsers, deactivateUser };
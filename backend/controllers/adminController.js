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

async function toggleUserStatus(req, res) {
  const targetUserId = req.params.id;
  const { isActive } = req.body;
  try {
    const targetCheck = await pool.query('SELECT role FROM users WHERE id = $1', [targetUserId]);
    if (targetCheck.rows.length === 0) {
      return res.status(404).json({ error: 'User not found.' });
    }
    if (targetCheck.rows[0].role === 'admin') {
      return res.status(403).json({ error: 'Cannot deactivate another admin.' });
    }

    const result = await pool.query(
      'UPDATE users SET is_active = $1 WHERE id = $2 RETURNING id, name, email, is_active',
      [Boolean(isActive), targetUserId]
    );
    res.json({ message: `User status set to ${isActive ? 'active' : 'deactivated'}.`, user: result.rows[0] });
  } catch (err) {
    console.error('Toggle user status error:', err);
    res.status(500).json({ error: 'Something went wrong.' });
  }
}

async function getAdminStats(req, res) {
  try {
    const usersCount = await pool.query('SELECT COUNT(*) FROM users');
    const activeCount = await pool.query('SELECT COUNT(*) FROM users WHERE is_active = true');
    const deactivatedCount = await pool.query('SELECT COUNT(*) FROM users WHERE is_active = false');
    const emailsCount = await pool.query('SELECT COUNT(*) FROM emails');
    const pendingReportsCount = await pool.query("SELECT COUNT(*) FROM reports WHERE status = 'PENDING' OR status IS NULL");

    res.json({
      stats: {
        totalUsers: Number(usersCount.rows[0].count),
        activeUsers: Number(activeCount.rows[0].count),
        deactivatedUsers: Number(deactivatedCount.rows[0].count),
        totalEmails: Number(emailsCount.rows[0].count),
        pendingReports: Number(pendingReportsCount.rows[0].count)
      }
    });
  } catch (err) {
    console.error('Get admin stats error:', err);
    res.status(500).json({ error: 'Something went wrong.' });
  }
}

async function createAdminGroupChat(req, res) {
  const adminId = req.session.userId;
  const { name, userIds } = req.body;

  if (!name || !Array.isArray(userIds) || userIds.length === 0) {
    return res.status(400).json({ error: 'Group name and at least one user are required.' });
  }

  try {
    const groupResult = await pool.query(
      'INSERT INTO groups (name, created_by) VALUES ($1, $2) RETURNING *',
      [name, adminId]
    );
    const group = groupResult.rows[0];

    const allMembers = [...new Set([adminId, ...userIds])];
    for (const memberId of allMembers) {
      await pool.query('INSERT INTO group_members (group_id, user_id) VALUES ($1, $2)', [group.id, memberId]);
    }

    res.status(201).json({ message: 'Resolution group chat created.', group });
  } catch (err) {
    console.error('Create admin group error:', err);
    res.status(500).json({ error: 'Something went wrong.' });
  }
}

module.exports = { getAllUsers, deactivateUser, toggleUserStatus, getAdminStats, createAdminGroupChat };
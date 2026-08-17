const pool = require('../db/pool');

async function createGroup(req, res) {
  const creatorId = req.session.userId;
  const { name, memberIds } = req.body;

  if (!name) return res.status(400).json({ error: 'Group name is required.' });

  try {
    const groupResult = await pool.query(
      'INSERT INTO groups (name, created_by) VALUES ($1, $2) RETURNING *',
      [name, creatorId]
    );
    const group = groupResult.rows[0];

    const allMembers = [...new Set([creatorId, ...(memberIds || [])])];
    for (const memberId of allMembers) {
      await pool.query('INSERT INTO group_members (group_id, user_id) VALUES ($1, $2)', [group.id, memberId]);
    }

    res.status(201).json({ message: 'Group created.', group });
  } catch (err) {
    console.error('Create group error:', err);
    res.status(500).json({ error: 'Something went wrong.' });
  }
}

async function getMyGroups(req, res) {
  const userId = req.session.userId;
  try {
    const result = await pool.query(
      `SELECT g.* FROM groups g
       JOIN group_members gm ON gm.group_id = g.id
       WHERE gm.user_id = $1 ORDER BY g.created_at DESC`,
      [userId]
    );
    res.json({ groups: result.rows });
  } catch (err) {
    console.error('Get groups error:', err);
    res.status(500).json({ error: 'Something went wrong.' });
  }
}

async function getGroupMessages(req, res) {
  const userId = req.session.userId;
  const groupId = req.params.id;
  try {
    const memberCheck = await pool.query('SELECT * FROM group_members WHERE group_id = $1 AND user_id = $2', [groupId, userId]);
    if (memberCheck.rows.length === 0) return res.status(403).json({ error: 'You are not a member of this group.' });

    const result = await pool.query(
      `SELECT gm.id, gm.body, gm.created_at, gm.sender_id, u.name AS sender_name
       FROM group_messages gm JOIN users u ON u.id = gm.sender_id
       WHERE gm.group_id = $1 ORDER BY gm.created_at ASC`,
      [groupId]
    );
    res.json({ messages: result.rows });
  } catch (err) {
    console.error('Get group messages error:', err);
    res.status(500).json({ error: 'Something went wrong.' });
  }
}

async function postGroupMessage(req, res) {
  const userId = req.session.userId;
  const groupId = req.params.id;
  const { body } = req.body;

  if (!body) return res.status(400).json({ error: 'Message body is required.' });

  try {
    const memberCheck = await pool.query('SELECT * FROM group_members WHERE group_id = $1 AND user_id = $2', [groupId, userId]);
    if (memberCheck.rows.length === 0) return res.status(403).json({ error: 'You are not a member of this group.' });

    await pool.query('INSERT INTO group_messages (group_id, sender_id, body) VALUES ($1, $2, $3)', [groupId, userId, body]);
    res.status(201).json({ message: 'Message sent.' });
  } catch (err) {
    console.error('Post group message error:', err);
    res.status(500).json({ error: 'Something went wrong.' });
  }
}

module.exports = { createGroup, getMyGroups, getGroupMessages, postGroupMessage };
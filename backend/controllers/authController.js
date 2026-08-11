const bcrypt = require('bcrypt');
const pool = require('../db/pool');

async function register(req, res) {
  const { name, email, password } = req.body;

  // 1. Validation — reject bad input before doing any real work
  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Name, email, and password are all required.' });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ error: 'Please provide a valid email address.' });
  }

  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters long.' });
  }

  try {
    // 2. Check for duplicate email
    const existingUser = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existingUser.rows.length > 0) {
      return res.status(409).json({ error: 'An account with this email already exists.' });
    }

    // 3. Hash the password — 10 salt rounds is a solid default
    const passwordHash = await bcrypt.hash(password, 10);

    // 4. Insert the new user
    const result = await pool.query(
      `INSERT INTO users (name, email, password_hash)
       VALUES ($1, $2, $3)
       RETURNING id, name, email, role, created_at`,
      [name, email, passwordHash]
    );

    const newUser = result.rows[0];
    res.status(201).json({ message: 'Registration successful.', user: newUser });

  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
}

module.exports = { register };
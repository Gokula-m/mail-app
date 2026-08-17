const bcrypt = require('bcrypt');
const pool = require('../db/pool');

async function register(req, res) {
  const { name, email, password } = req.body;

  // 1. Validation — reject bad input before doing any real work
  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Name, email, and password are all required.' });
  }

const passwordRegex = /^(?=.*[0-9])(?=.*[!@#$%^&*(),.?":{}|<>]).{8,}$/;
if (!passwordRegex.test(password)) {
  return res.status(400).json({ error: 'Password must be at least 8 characters and include a number and a special character.' });
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

async function login(req, res) {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  try {
    // Look up the user by email
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);

    // Generic error for BOTH "no such user" and "wrong password" — prevents enumeration
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const user = result.rows[0];

    if (!user.is_active) {
      return res.status(403).json({ error: 'This account has been deactivated.' });
    }

    const passwordMatches = await bcrypt.compare(password, user.password_hash);

    if (!passwordMatches) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    // Credentials verified — session creation comes in the next step
    // res.json({
    //   message: 'Login successful (session not yet implemented).',
    //   user: { id: user.id, name: user.name, email: user.email, role: user.role }
    // });
    // Credentials verified — create the session
    req.session.userId = user.id;
    req.session.role = user.role; 

    res.json({
      message: 'Login successful.',
      user: { id: user.id, name: user.name, email: user.email, role: user.role }
    });

  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
}
function logout(req, res) {
  req.session.destroy((err) => {
    if (err) {
      console.error('Logout error:', err);
      return res.status(500).json({ error: 'Could not log out. Please try again.' });
    }
    res.clearCookie('connect.sid');
    res.json({ message: 'Logged out successfully.' });
  });
}
async function getMe(req, res) {
  try {
    const result = await pool.query('SELECT id, name, email, role FROM users WHERE id = $1', [req.session.userId]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'User not found.' });
    res.json({ user: result.rows[0] });
  } catch (err) {
    console.error('Get me error:', err);
    res.status(500).json({ error: 'Something went wrong.' });
  }
}
module.exports = { register, login, logout, getMe };

// module.exports = { register };
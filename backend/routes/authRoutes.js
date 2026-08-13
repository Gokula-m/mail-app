const express = require('express');
const router = express.Router();
const { register, login , logout } = require('../controllers/authController');
const requireAuth = require('../middleware/requireAuth');

router.post('/register', register);
router.post('/login', login);
router.post('/logout', logout);

// Temporary test route to prove requireAuth works
router.get('/me', requireAuth, (req, res) => {
  res.json({ message: 'You are authenticated.', userId: req.session.userId });
});

module.exports = router;
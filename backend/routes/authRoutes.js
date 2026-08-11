const express = require('express');
const router = express.Router();
const { register, login } = require('../controllers/authController');
const requireAuth = require('../middleware/requireAuth');

router.post('/register', register);
router.post('/login', login);

// Temporary test route to prove requireAuth works
router.get('/me', requireAuth, (req, res) => {
  res.json({ message: 'You are authenticated.', userId: req.session.userId });
});

module.exports = router;
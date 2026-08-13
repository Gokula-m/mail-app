const express = require('express');
const router = express.Router();
const requireAuth = require('../middleware/requireAuth');
const { createEvent, getEvents, deleteEvent } = require('../controllers/calendarController');

router.post('/', requireAuth, createEvent);
router.get('/', requireAuth, getEvents);
router.delete('/:id', requireAuth, deleteEvent);

module.exports = router;
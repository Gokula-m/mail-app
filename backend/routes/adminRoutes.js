const express = require('express');
const router = express.Router();
const requireAuth = require('../middleware/requireAuth');
const requireAdmin = require('../middleware/requireAdmin');
const { getAllUsers, deactivateUser } = require('../controllers/adminController');
const { getReports, getReportById } = require('../controllers/reportController');


router.get('/reports', requireAuth, requireAdmin, getReports);
router.get('/reports/:id', requireAuth, requireAdmin, getReportById);
router.get('/users', requireAuth, requireAdmin, getAllUsers);
router.patch('/users/:id/deactivate', requireAuth, requireAdmin, deactivateUser);


module.exports = router;
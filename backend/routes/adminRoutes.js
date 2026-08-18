const express = require('express');
const router = express.Router();
const requireAuth = require('../middleware/requireAuth');
const requireAdmin = require('../middleware/requireAdmin');
const { getAllUsers, deactivateUser, toggleUserStatus, getAdminStats, createAdminGroupChat } = require('../controllers/adminController');
const { getReports, getReportById, updateReportStatus, getPendingReportsCount } = require('../controllers/reportController');

router.get('/stats', requireAuth, requireAdmin, getAdminStats);
router.get('/reports', requireAuth, requireAdmin, getReports);
router.get('/reports/pending-count', requireAuth, requireAdmin, getPendingReportsCount);
router.get('/reports/:id', requireAuth, requireAdmin, getReportById);
router.patch('/reports/:id/status', requireAuth, requireAdmin, updateReportStatus);

router.get('/users', requireAuth, requireAdmin, getAllUsers);
router.patch('/users/:id/deactivate', requireAuth, requireAdmin, deactivateUser);
router.patch('/users/:id/toggle-status', requireAuth, requireAdmin, toggleUserStatus);

router.post('/groups/create', requireAuth, requireAdmin, createAdminGroupChat);

module.exports = router;
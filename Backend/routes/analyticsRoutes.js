// backend/routes/analyticsRoutes.js
const express = require('express');
const router = express.Router();
const { getAnalyticsData, exportAnalyticsReport } = require('../controllers/analyticsController');
const { protectAdmin } = require('../middleware/authMiddleware');

// Protect all analytics routes with admin middleware
router.use(protectAdmin);

// Route to fetch analytics data for display
// GET /api/admin/analytics/:reportType?timeRange=...
router.get('/:reportType', getAnalyticsData);

// Route to export analytics data
// GET /api/admin/analytics/export/:reportType/:format?timeRange=...
router.get('/export/:reportType/:format', exportAnalyticsReport);


module.exports = router;
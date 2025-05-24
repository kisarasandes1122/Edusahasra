const express = require('express');
const router = express.Router();
const { getAnalyticsData, exportAnalyticsReport } = require('../controllers/analyticsController');
const { protectAdmin } = require('../middleware/authMiddleware');

// Protect all analytics routes with admin middleware
router.use(protectAdmin);

// Route to fetch analytics data for display
router.get('/:reportType', getAnalyticsData); 

// Route to export analytics data
router.get('/export/:reportType/:format', exportAnalyticsReport);


module.exports = router;
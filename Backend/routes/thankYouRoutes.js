// routes/thankYouRoutes.js
const express = require('express');
const router = express.Router();
const {
    getEligibleDonationsForThanks,
    sendThankYou,
    getMyThankYous,
    getThankYouById
} = require('../controllers/thankYouController');
const { protect, protectSchool, protectAdmin } = require('../middleware/authMiddleware');

// === School Routes ===
// Get list of donations eligible for a thank you
router.get('/eligible-donations', protectSchool, getEligibleDonationsForThanks);
// Send a thank you message (handles image uploads within controller)
router.post('/', protectSchool, sendThankYou);
// Get a specific thank you sent by this school
router.get('/school/:id', protectSchool, getThankYouById); // Use shared controller, auth check inside

// === Donor Routes ===
// Get all thank you messages received by the logged-in donor
router.get('/my-thanks', protect, getMyThankYous);
// Get a specific thank you received by this donor
router.get('/donor/:id', protect, getThankYouById); // Use shared controller, auth check inside

// === Admin Routes ===
// Admin gets any specific thank you
router.get('/admin/:id', protectAdmin, getThankYouById); // Use shared controller, auth check inside


module.exports = router;
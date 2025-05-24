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
router.get('/eligible-donations', protectSchool, getEligibleDonationsForThanks);
router.post('/', protectSchool, sendThankYou);
router.get('/school/:id', protectSchool, getThankYouById); 

// === Donor Routes ===
router.get('/my-thanks', protect, getMyThankYous);
router.get('/donor/:id', protect, getThankYouById); 

// === Admin Routes ===
router.get('/admin/:id', protectAdmin, getThankYouById); 

module.exports = router;
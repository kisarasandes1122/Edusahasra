// routes/donationRoutes.js

const express = require('express');
const router = express.Router();
const {
    createDonation,
    getMyDonations,
    getSchoolDonations,
    getAdminDonations,
    getDonationById, // Controller remains the same
    updateDonationStatusByDonor,
    updateDonationStatusByAdmin,
    confirmDonationReceipt,
} = require('../controllers/donationController');
const { protect } = require('../middleware/authMiddleware');      // Donor protection
const { protectSchool } = require('../middleware/authMiddleware'); // School protection
const { protectAdmin } = require('../middleware/authMiddleware');  // Admin protection

// === Donor Routes ===
router.post('/', protect, createDonation);
router.get('/my-donations', protect, getMyDonations);
router.put('/:id/status', protect, updateDonationStatusByDonor);
// Donor gets their specific donation
router.get('/donor/:id', protect, getDonationById); // <<< CHANGED URL & uses protect

// === School Routes ===
router.get('/school-donations', protectSchool, getSchoolDonations);
router.put('/:id/confirm-receipt', protectSchool, confirmDonationReceipt);
// School gets a specific donation intended for them
router.get('/school/:id', protectSchool, getDonationById); // <<< NEW ROUTE for School

// === Admin Routes ===
router.get('/admin-view', protectAdmin, getAdminDonations);
router.put('/:id/admin-status', protectAdmin, updateDonationStatusByAdmin);
// Admin gets any specific donation
router.get('/admin/:id', protectAdmin, getDonationById); // <<< NEW ROUTE for Admin


module.exports = router;
// backend/routes/donationRoutes.js
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
const { protect } = require('../middleware/authMiddleware');    
const { protectSchool } = require('../middleware/authMiddleware'); 
const { protectAdmin } = require('../middleware/authMiddleware'); 

// === Donor Routes ===
router.post('/', protect, createDonation);
router.get('/my-donations', protect, getMyDonations);
router.put('/:id/status', protect, updateDonationStatusByDonor);
// Use the generic getDonationById controller but accessed via a donor-specific path for clarity/future specific checks
router.get('/donor/:id', protect, getDonationById); 

// === School Routes ===
router.get('/school-donations', protectSchool, getSchoolDonations);
router.put('/:id/confirm-receipt', protectSchool, confirmDonationReceipt);
// Use the generic getDonationById controller but accessed via a school-specific path
router.get('/school/:id', protectSchool, getDonationById);

// === Admin Routes ===
router.get('/admin-view', protectAdmin, getAdminDonations);
router.put('/:id/admin-status', protectAdmin, updateDonationStatusByAdmin);
// Use the generic getDonationById controller but accessed via an admin-specific path
router.get('/admin/:id', protectAdmin, getDonationById);


module.exports = router;
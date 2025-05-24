const express = require('express');
const router = express.Router();
const {
    createDonation,
    getMyDonations,
    getSchoolDonations,
    getAdminDonations,
    getDonationById, 
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
router.get('/donor/:id', protect, getDonationById); 

// === School Routes ===
router.get('/school-donations', protectSchool, getSchoolDonations);
router.put('/:id/confirm-receipt', protectSchool, confirmDonationReceipt);
router.get('/school/:id', protectSchool, getDonationById);

// === Admin Routes ===
router.get('/admin-view', protectAdmin, getAdminDonations);
router.put('/:id/admin-status', protectAdmin, updateDonationStatusByAdmin);
router.get('/admin/:id', protectAdmin, getDonationById);


module.exports = router;
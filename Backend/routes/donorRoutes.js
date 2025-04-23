const express = require('express');
const router = express.Router();
const {
    registerDonor,
    loginDonor,
    getDonorProfile,
    updateDonorProfile,
    updateDonorPassword,
    forgotPassword,
    resetPassword,
} = require('../controllers/donorController');

const { protect } = require('../middleware/authMiddleware');

router.post('/register', registerDonor);

router.post('/login', loginDonor);

router.post('/forgot-password', forgotPassword);

router.put('/reset-password/:token', resetPassword);

router.route('/profile')
    .get(protect, getDonorProfile)
    .put(protect, updateDonorProfile);

router.put('/profile/password', protect, updateDonorPassword);

module.exports = router;
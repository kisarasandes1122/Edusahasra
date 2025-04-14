const express = require('express');
const router = express.Router();
const { 
  registerDonor, 
  loginDonor, 
  getDonorProfile, 
  updateDonorProfile
} = require('../controllers/donorController');
const { protect } = require('../middleware/authMiddleware');

// Public routes
router.post('/register', registerDonor);
router.post('/login', loginDonor);

// Protected routes
router.route('/profile')
  .get(protect, getDonorProfile)
  .put(protect, updateDonorProfile);

module.exports = router;
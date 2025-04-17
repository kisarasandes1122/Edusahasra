const express = require('express');
const router = express.Router();
const { 
  registerSchool, 
  loginSchool, 
  getSchoolProfile,
  checkApprovalStatus
} = require('../controllers/schoolController');
const { protectSchool } = require('../middleware/authMiddleware');

// Public routes
router.post('/register', registerSchool);
router.post('/login', loginSchool);
router.get('/approval-status', checkApprovalStatus);

// Protected routes
router.get('/profile', protectSchool, getSchoolProfile);

module.exports = router;
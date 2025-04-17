const express = require('express');
const router = express.Router();
const { 
  registerAdmin,
  loginAdmin,
  getPendingSchools,
  getApprovedSchools,
  getSchoolDetails,
  getSchoolDocument,
  approveSchool,
  rejectSchool,
  getAdminProfile
} = require('../controllers/adminController');
const { protectAdmin, isSuperAdmin } = require('../middleware/authMiddleware');

// Public routes
router.post('/login', loginAdmin);

// Protected admin routes
router.post('/register', protectAdmin, isSuperAdmin, registerAdmin);
router.get('/profile', protectAdmin, getAdminProfile);

// School management routes
router.get('/schools/pending', protectAdmin, getPendingSchools);
router.get('/schools/approved', protectAdmin, getApprovedSchools);
router.get('/schools/:id', protectAdmin, getSchoolDetails);
router.get('/schools/:id/documents/:docId', protectAdmin, getSchoolDocument);
router.put('/schools/:id/approve', protectAdmin, approveSchool);
router.put('/schools/:id/reject', protectAdmin, rejectSchool);

module.exports = router;
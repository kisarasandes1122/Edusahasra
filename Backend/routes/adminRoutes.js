const express = require('express');
const router = express.Router();
const {
  registerAdmin,
  loginAdmin,
  getSchoolsForVerification, // Import the new function
  // Remove getPendingSchools, getApprovedSchools if replaced
  // getPendingSchools,
  // getApprovedSchools,
  getSchoolDetails,
  getSchoolDocument,
  approveSchool,
  rejectSchool,
  getAdminProfile
} = require('../controllers/adminController');
const { protectAdmin, isSuperAdmin } = require('../middleware/authMiddleware');

// Public routes
router.post('/login', loginAdmin);

// Protected admin routes (require protectAdmin middleware)
router.use(protectAdmin); // Apply protectAdmin to all routes below this line

router.post('/register', isSuperAdmin, registerAdmin); // SuperAdmin only route

router.get('/profile', getAdminProfile);

// School management routes
// Use a single route with status query parameter
router.get('/schools', getSchoolsForVerification);

// router.get('/schools/pending', getPendingSchools); // Remove if replaced
// router.get('/schools/approved', getApprovedSchools); // Remove if replaced

router.get('/schools/:id', getSchoolDetails);
router.get('/schools/:id/documents/:docId', getSchoolDocument);
router.put('/schools/:id/approve', approveSchool);
router.put('/schools/:id/reject', rejectSchool);

module.exports = router;
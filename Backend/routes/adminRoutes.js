const express = require('express');
const router = express.Router();
const {
  registerAdmin,
  loginAdmin,
  getSchoolsForVerification,
  getSchoolDetails,
  getSchoolDocument,
  approveSchool,
  rejectSchool,
  getAdminProfile,
  updateAdminProfile, // Import updateAdminProfile if you add its implementation
  updateAdminPassword, // Import the new password update function
  getAdmins,
  deleteAdmin
} = require('../controllers/adminController');
const { protectAdmin, isSuperAdmin } = require('../middleware/authMiddleware');

// Public routes
router.post('/login', loginAdmin);

// Protected admin routes (require protectAdmin middleware)
router.use(protectAdmin); // Apply protectAdmin to all routes below this line

// SuperAdmin only route to register other admins
router.post('/register', isSuperAdmin, registerAdmin);

// Get logged-in admin profile
router.get('/profile', getAdminProfile);
// Optional: Route to update non-password profile details
// router.put('/profile', updateAdminProfile); // Uncomment if you implement updateAdminProfile

// Route to update logged-in admin's password
router.put('/profile/password', updateAdminPassword); // New route for password change


// School management routes (Admin access)
router.get('/schools', getSchoolsForVerification);
router.get('/schools/:id', getSchoolDetails);
router.get('/schools/:id/documents/:docId', getSchoolDocument);
router.put('/schools/:id/approve', approveSchool);
router.put('/schools/:id/reject', rejectSchool);

// Admin User Management routes
// Route to get the list of all admins (Accessible by any Admin for table display)
// Consider making this SuperAdmin only if regular admins shouldn't see the full list.
// If needed, change protectAdmin -> isSuperAdmin here.
router.get('/admins', getAdmins);
// Route to delete an admin (SuperAdmin only)
router.delete('/admins/:id', isSuperAdmin, deleteAdmin);


module.exports = router;
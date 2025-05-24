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
  updateAdminProfile, 
  updateAdminPassword, 
  getAdmins,
  deleteAdmin
} = require('../controllers/adminController');
const { protectAdmin, isSuperAdmin } = require('../middleware/authMiddleware');

// Public routes
router.post('/login', loginAdmin);

// Protected admin routes (require protectAdmin middleware)
router.use(protectAdmin); 

// SuperAdmin only route to register other admins
router.post('/register', isSuperAdmin, registerAdmin);

// Get logged-in admin profile
router.get('/profile', getAdminProfile);


// Route to update logged-in admin's password
router.put('/profile/password', updateAdminPassword); // New route for password change


// School management routes (Admin access)
router.get('/schools', getSchoolsForVerification);
router.get('/schools/:id', getSchoolDetails);
router.get('/schools/:id/documents/:docId', getSchoolDocument);
router.put('/schools/:id/approve', approveSchool);
router.put('/schools/:id/reject', rejectSchool);


// Admin User Management routes
router.get('/admins', getAdmins);
router.delete('/admins/:id', isSuperAdmin, deleteAdmin);


module.exports = router;
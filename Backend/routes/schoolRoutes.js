const express = require('express');
const router = express.Router();

// --- Import Controller Functions AND Multer Middleware ---
const {
  registerSchool,
  loginSchool,
  getSchoolProfile,
  checkApprovalStatus,
  updateSchoolProfile,
  uploadProfileImages
} = require('../controllers/schoolController');

// --- Import Auth Middleware ---
const { protectSchool } = require('../middleware/authMiddleware');

// ==============================
// --- Public Routes ---
// ==============================
router.post('/register', registerSchool);
router.post('/login', loginSchool);
router.get('/approval-status', checkApprovalStatus);

// ==============================
// --- Protected Routes (Require School Login) ---
// ==============================
router.route('/profile')
    .get(protectSchool, getSchoolProfile)
    .put(protectSchool, uploadProfileImages, updateSchoolProfile);

module.exports = router;
const express = require('express');
const router = express.Router();

const {
  registerSchool,
  loginSchool,
  getSchoolProfile,
  checkApprovalStatus,
  updateSchoolProfile,
  uploadProfileImages,
  forgotPassword,
  resetPassword
} = require('../controllers/schoolController');

const { protectSchool } = require('../middleware/authMiddleware');


router.post('/register', registerSchool);
router.post('/login', loginSchool);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.get('/approval-status', checkApprovalStatus);


router.route('/profile')
    .get(protectSchool, getSchoolProfile)
    .put(protectSchool, uploadProfileImages, updateSchoolProfile);

module.exports = router;
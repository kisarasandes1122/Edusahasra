// routes/donationRequestRoutes.js
const express = require('express');
const router = express.Router();
const {
  createDonationRequest,
  getSchoolDonationRequests,
  getDonationRequestById,
  // updateDonationRequestStatus, // Uncomment when implemented
  deleteDonationRequest,      // Uncomment when implemented
} = require('../controllers/donationRequestController');
const { protectSchool } = require('../middleware/authMiddleware'); // School must be logged in and approved
// const { protectAdmin } = require('../middleware/authMiddleware'); // Needed for admin-specific routes if any

// === School Routes ===

// Create a new donation request
router.post('/', protectSchool, createDonationRequest);

// Get all requests made by the logged-in school
router.get('/my-requests', protectSchool, getSchoolDonationRequests);

// Get a specific request by ID (school viewing their own)
// Note: Might overlap with admin view if not careful with authorization in controller
router.get('/:id', protectSchool, getDonationRequestById);

// Delete a request (e.g., if pending)
router.delete('/:id', protectSchool, deleteDonationRequest);


module.exports = router;
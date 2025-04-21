// routes/donationRequestRoutes.js
const express = require('express');
const router = express.Router();
const {
  createDonationRequest,
  getSchoolDonationRequests,
  getDonationRequestById, // Keep the controller function
  // updateDonationRequestStatus,
  deleteDonationRequest,
  getPublicDonationRequests,
} = require('../controllers/donationRequestController');
const { protectSchool } = require('../middleware/authMiddleware'); // Keep for school-specific actions
// const { protect } = require('../middleware/authMiddleware'); // Import if you want donor protection

// === Public Routes ===
router.get('/', getPublicDonationRequests); // For listing requests

// --- CHANGE THIS ROUTE ---
// Remove protectSchool to allow public/donor access to view details
router.get('/:id', getDonationRequestById);
// --- END CHANGE ---


// === School Routes (Keep protected) ===
router.post('/create', protectSchool, createDonationRequest);
router.get('/my-requests', protectSchool, getSchoolDonationRequests);
// You might need a separate route if a school needs to get THEIR request with specific auth checks
// Example: router.get('/school/:id', protectSchool, getOwnDonationRequestById);
router.delete('/:id', protectSchool, deleteDonationRequest);
// router.put('/:id/status', protectSchool, updateDonationRequestStatus); // Example if school updates status


module.exports = router;
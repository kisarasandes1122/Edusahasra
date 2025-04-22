// routes/donationRequestRoutes.js
const express = require('express');
const router = express.Router();
const {
  createDonationRequest,
  getSchoolDonationRequests,
  getDonationRequestById,
  updateDonationRequestStatus,
  deleteDonationRequest,
  getPublicDonationRequests,
} = require('../controllers/donationRequestController');
const { protectSchool } = require('../middleware/authMiddleware');

// === Public Routes ===
// Order matters! Define more specific routes before less specific ones (like /:id)

// Route to get all public requests (no ID param)
router.get('/', getPublicDonationRequests);

// === School Routes (Keep protected) ===
// Route for the logged-in school's requests (no ID param)
router.get('/my-requests', protectSchool, getSchoolDonationRequests); // <-- Define this before /:id

// Route to create a new request (no ID param)
router.post('/create', protectSchool, createDonationRequest);


// === Routes with ID Parameter ===
// Route to get a specific request by ID (can be public/donor/school/admin depending on needs and auth checks *inside* the controller, but the route definition itself is /:id)
// Keep this after routes that might be accidentally matched by /:id (like /my-requests, /create)
router.get('/:id', getDonationRequestById); // <-- Define this AFTER /my-requests

// Route to delete a request by ID (protected for school)
router.delete('/:id', protectSchool, deleteDonationRequest); // <-- Define this AFTER /my-requests


router.put('/:id/status', protectSchool, updateDonationRequestStatus); // Example if school updates status


module.exports = router;
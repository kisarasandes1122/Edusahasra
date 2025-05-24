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


// Route to get all public requests (no ID param)
router.get('/', getPublicDonationRequests);

// === School Routes (Keep protected) ===
// Route for the logged-in school's requests (no ID param)
router.get('/my-requests', protectSchool, getSchoolDonationRequests); 

// Route to create a new request (no ID param)
router.post('/create', protectSchool, createDonationRequest);


// === Routes with ID Parameter ===
// Route to get a specific request by ID (can be public/donor/school/admin depending on needs and auth checks *inside* the controller, but the route definition itself is /:id)
router.get('/:id', getDonationRequestById); 

// Route to delete a request by ID (protected for school)
router.delete('/:id', protectSchool, deleteDonationRequest); 


router.put('/:id/status', protectSchool, updateDonationRequestStatus); 


module.exports = router;
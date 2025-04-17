// controllers/donationRequestController.js
const asyncHandler = require('express-async-handler');
const DonationRequest = require('../models/donationRequestModel');
const School = require('../models/schoolModel'); // Needed for verification

// Define the minimum threshold consistent with the frontend
const MINIMUM_THRESHOLD = 25;

// @desc    Create a new donation request
// @route   POST /api/requests
// @access  Private (School)
const createDonationRequest = asyncHandler(async (req, res) => {
  const { requestedItems, notes } = req.body;
  const schoolId = req.school._id; // Get school ID from authenticated user (protectSchool middleware)

  // --- Input Validation ---
  if (!requestedItems || !Array.isArray(requestedItems) || requestedItems.length === 0) {
    res.status(400);
    throw new Error('Requested items list cannot be empty.');
  }

  // Validate each item in the request
  const validatedItems = [];
  const categoryIds = new Set();

  for (const item of requestedItems) {
    const { categoryId, categoryNameEnglish, categoryNameSinhala, quantity } = item;

    // Check for required fields
    if (categoryId === undefined || !categoryNameEnglish || !categoryNameSinhala || quantity === undefined) {
      res.status(400);
      throw new Error(`Invalid item data provided. Each item requires categoryId, categoryNameEnglish, categoryNameSinhala, and quantity.`);
    }

    // Validate quantity type and threshold
    const numQuantity = Number(quantity);
    if (isNaN(numQuantity) || !Number.isInteger(numQuantity) || numQuantity < MINIMUM_THRESHOLD) {
      res.status(400);
      throw new Error(`Invalid quantity for item "${categoryNameEnglish}". Quantity must be a whole number and at least ${MINIMUM_THRESHOLD}.`);
    }

    // Validate categoryId type and uniqueness
    const numCategoryId = Number(categoryId);
     if (isNaN(numCategoryId) || !Number.isInteger(numCategoryId)) {
        res.status(400);
        throw new Error(`Invalid categoryId "${categoryId}". Must be a number.`);
    }
    if (categoryIds.has(numCategoryId)) {
        res.status(400);
        throw new Error(`Duplicate category ID found: ${numCategoryId}. Each category can only be requested once per request.`);
    }
    categoryIds.add(numCategoryId);


    validatedItems.push({
      categoryId: numCategoryId,
      categoryNameEnglish: String(categoryNameEnglish).trim(),
      categoryNameSinhala: String(categoryNameSinhala).trim(),
      quantity: numQuantity,
    });
  }
   // --- End Validation ---


  // Check if the school is allowed to make requests (should be covered by protectSchool middleware's approval check, but double-check)
   const school = await School.findById(schoolId);
   if (!school || !school.isApproved) {
       res.status(403);
       throw new Error('School not found or not approved to make requests.');
   }

  // Create the donation request
  const donationRequest = await DonationRequest.create({
    school: schoolId,
    requestedItems: validatedItems,
    notes: notes ? String(notes).trim() : undefined, // Sanitize and add notes if provided
    status: 'Pending', // Default status
  });

  if (donationRequest) {
    res.status(201).json({
      message: 'Donation request created successfully.',
      request: donationRequest, // Send back the created request
    });
  } else {
    res.status(500); // Or 400 depending on why creation might fail after validation
    throw new Error('Failed to create donation request.');
  }
});


// --- Placeholder for future functions ---

// @desc    Get donation requests for the logged-in school
// @route   GET /api/requests/my-requests
// @access  Private (School)
const getSchoolDonationRequests = asyncHandler(async (req, res) => {
  const schoolId = req.school._id;
  const requests = await DonationRequest.find({ school: schoolId }).sort({ createdAt: -1 }); // Sort newest first
  res.json(requests);
});

// @desc    Get a specific donation request by ID (for school or admin)
// @route   GET /api/requests/:id
// @access  Private (School or Admin - needs logic to check ownership or role)
const getDonationRequestById = asyncHandler(async (req, res) => {
    const requestId = req.params.id;
    const request = await DonationRequest.findById(requestId).populate('school', 'schoolName schoolEmail city'); // Populate school details

    if (!request) {
        res.status(404);
        throw new Error('Donation request not found.');
    }

    // Optional: Add authorization check - does the logged-in user (school/admin) have permission to view this?
    // For school: if (req.school && request.school.toString() !== req.school._id.toString()) { ... }
    // For admin: Add admin check if implementing admin view

    res.json(request);
});


// @desc    Update donation request status (Likely by Admin or potentially School for cancellation)
// @route   PUT /api/requests/:id/status
// @access  Private (Admin or School - needs specific logic)
const updateDonationRequestStatus = asyncHandler(async (req, res) => {
    // Implementation depends on who can update status and to what values
    // Example: Admin marks as 'Fulfilled', School marks as 'Cancelled'
    res.status(501).json({ message: 'Status update not implemented yet.' });
});


// @desc    Delete a donation request (Potentially by School if status is 'Pending')
// @route   DELETE /api/requests/:id
// @access  Private (School - needs specific logic)
const deleteDonationRequest = asyncHandler(async (req, res) => {
    // Implementation depends on conditions (e.g., only deletable if 'Pending')
     const requestId = req.params.id;
     const schoolId = req.school._id;

     const request = await DonationRequest.findById(requestId);

     if (!request) {
         res.status(404);
         throw new Error('Donation request not found.');
     }

     // Authorization: Ensure the school owns this request
     if (request.school.toString() !== schoolId.toString()) {
         res.status(403);
         throw new Error('Not authorized to delete this request.');
     }

     // Condition: Allow deletion only if pending?
     if (request.status !== 'Pending') {
         res.status(400);
         throw new Error(`Cannot delete request with status "${request.status}". Consider cancelling instead.`);
     }

     await request.remove(); // Or findByIdAndDelete(requestId)

    res.json({ message: 'Donation request deleted successfully.' });
});


module.exports = {
  createDonationRequest,
  getSchoolDonationRequests, // Export if implemented
  getDonationRequestById,   // Export if implemented
  updateDonationRequestStatus, // Export if implemented
  deleteDonationRequest      // Export if implemented
};
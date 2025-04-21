// backend/controllers/donationRequestController.js
const asyncHandler = require('express-async-handler');
const DonationRequest = require('../models/donationRequestModel');
const School = require('../models/schoolModel'); // Needed for verification
const mongoose = require('mongoose');

// Define the minimum threshold consistent with the frontend
const MINIMUM_THRESHOLD = 25;

// @desc    Create a new donation request
// @route   POST /api/requests/create
// @access  Private (School) - Note: Route updated in routes file example below
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
       quantityReceived: 0, // Ensure quantityReceived is initialized
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


// @desc    Get donation requests for the logged-in school
// @route   GET /api/requests/my-requests
// @access  Private (School)
const getSchoolDonationRequests = asyncHandler(async (req, res) => {
  const schoolId = req.school._id;
  const requests = await DonationRequest.find({ school: schoolId }).sort({ createdAt: -1 }); // Sort newest first
  res.json(requests);
});

// @desc    Get a specific donation request by ID (for school, donor, or admin)
// @route   GET /api/requests/:id
// @access  Public (or check auth inside if needed later)
const getDonationRequestById = asyncHandler(async (req, res) => {
    const requestId = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(requestId)) {
      res.status(400);
      throw new Error('Invalid Donation Request ID format.');
    }

    // ***** CHANGE HERE: Populate more fields from the school *****
    const request = await DonationRequest.findById(requestId)
        .populate('school', 'schoolName schoolEmail city district province description images'); // <-- Added description and images

    if (!request) {
        res.status(404);
        throw new Error('Donation request not found.');
    }

    // Optional: Add authorization check here if needed in the future
    // (e.g., if only specific users should view specific requests)
    // For now, it's public as per the routes file.

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

      if (!mongoose.Types.ObjectId.isValid(requestId)) {
        res.status(400);
        throw new Error('Invalid Donation Request ID format.');
      }

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

     // Use deleteOne() or findByIdAndDelete()
     await DonationRequest.deleteOne({ _id: requestId });

    res.json({ message: 'Donation request deleted successfully.' });
});


// @desc    Get publicly available donation requests (active, filterable, paginated)
// @route   GET /api/requests
// @access  Public
const getPublicDonationRequests = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 6; // Match frontend default
  const skip = (page - 1) * limit;

  const locationQuery = req.query.location ? req.query.location.toLowerCase() : '';
  const categoriesQuery = req.query.categories ? req.query.categories.split(',') : []; // Expect comma-separated string like "books,stationery"
  const sortBy = req.query.sortBy || 'highest'; // 'highest' or 'lowest' progress

  // --- Build Filter Criteria ---
  const filterCriteria = {
      status: { $in: ['Pending', 'Partially Fulfilled'] }, // Only show active requests
      // We need to filter based on the *school's* location
      // This requires populating school first or a more complex query/aggregation
  };

  // --- Prepare Category Matching (case-insensitive) ---
   // Updated regex for better matching, including partial words and plurals
  const categoryMatchers = categoriesQuery.map(cat => {
      switch(cat.toLowerCase().trim()) { // Normalize input
          case 'books': return /book|books|textbook|textbooks/i;
          case 'stationery': return /stationer|pen|pencil|bag|bags|notebook|notebooks|rule|eraser/i; // Expanded
          case 'uniform': return /uniform|uniforms|clothe|clothing|shoe|shoes/i; // Expanded
          case 'equipment': return /equipment|computer|computers|library|lab|projector|furniture/i; // Expanded
          case 'sportsgear': return /sport|gear|ball|bat|net|athletic/i; // Expanded
          case 'other': return /other|resource|miscellaneous|supply|supplies/i; // Expanded
          default: return new RegExp(cat.trim().replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'), 'i'); // Escape special chars & case-insensitive
      }
  });


  // --- Perform Query (Using Aggregation for location filtering and progress calculation) ---
  const aggregationPipeline = [
      // Match basic request status first (optimizes)
      { $match: { status: { $in: ['Pending', 'Partially Fulfilled'] } } },
      // Lookup school details
      {
          $lookup: {
              from: 'schools', // The actual name of the schools collection in MongoDB
              localField: 'school',
              foreignField: '_id',
              as: 'schoolDetails'
          }
      },
      // Deconstruct the schoolDetails array (should only have one element)
      { $unwind: '$schoolDetails' },
      // Match based on school location (case-insensitive)
      {
          $match: {
              ...(locationQuery && { // Only add location match if query exists
                  $or: [
                      { 'schoolDetails.city': { $regex: locationQuery, $options: 'i' } },
                      { 'schoolDetails.district': { $regex: locationQuery, $options: 'i' } },
                      { 'schoolDetails.province': { $regex: locationQuery, $options: 'i' } }
                  ]
              })
          }
      },
       // Match based on categories if specified
       ...(categoryMatchers.length > 0 ? [{
           $match: {
               'requestedItems': {
                   $elemMatch: {
                       // Check against both English and Sinhala names for broader matching
                       $or: [
                            { 'categoryNameEnglish': { $in: categoryMatchers } },
                            // Optional: Add Sinhala matching if needed and if names are predictable
                            // { 'categoryNameSinhala': { $in: categoryMatchers } } // Adjust regex if needed for Sinhala
                        ]
                    }
               }
           }
       }] : []),
      // Calculate total requested and received quantities for progress
      {
          $addFields: {
              totalQuantityRequested: { $sum: '$requestedItems.quantity' },
              totalQuantityReceived: { $sum: '$requestedItems.quantityReceived' },
              // Include school data directly in the root for easier access
              schoolInfo: {
                  _id: '$schoolDetails._id',
                  schoolName: '$schoolDetails.schoolName',
                  city: '$schoolDetails.city',
                  district: '$schoolDetails.district',
                  province: '$schoolDetails.province',
                  // ***** ADD IMAGES HERE for the list view *****
                  // Take only the first image for the card display, if available
                  firstImage: { $arrayElemAt: ['$schoolDetails.images', 0] }
                  // Add other needed school fields here (e.g., description for tooltip/preview)
                   // description: '$schoolDetails.description' // Example
              }
          }
      },
      // Calculate progress percentage (handle division by zero)
      {
          $addFields: {
              progress: {
                  $cond: {
                      if: { $gt: ['$totalQuantityRequested', 0] },
                      then: {
                          $round: [ // Round the progress
                             {
                                $multiply: [
                                    { $divide: ['$totalQuantityReceived', '$totalQuantityRequested'] },
                                    100
                                ]
                             },
                             0 // Round to 0 decimal places
                          ]
                      },
                      else: 0 // Progress is 0 if nothing was requested
                  }
              }
          }
      },
       // Remove the temporary schoolDetails field if not needed later
      { $project: { schoolDetails: 0 } },
      // --- Sorting ---
      {
          $sort: {
              progress: sortBy === 'lowest' ? 1 : -1, // 1 for ascending (lowest first), -1 for descending (highest first)
              createdAt: -1 // Secondary sort by newest
          }
      },
      // --- Pagination (must be applied *after* filtering/sorting) ---
      // We need total count *before* skip/limit for pagination metadata
      {
         $facet: {
              metadata: [ { $count: "totalRequests" } ],
              data: [ { $skip: skip }, { $limit: limit } ]
          }
      }
  ];

  const results = await DonationRequest.aggregate(aggregationPipeline);

  const requests = results[0]?.data || []; // Handle cases where results might be empty
  const totalRequests = results[0]?.metadata[0]?.totalRequests || 0;
  const totalPages = Math.ceil(totalRequests / limit);

  res.json({
      requests,
      currentPage: page,
      totalPages,
      totalRequests,
  });
});


module.exports = {
createDonationRequest,
getSchoolDonationRequests,
getDonationRequestById,
updateDonationRequestStatus,
deleteDonationRequest,
getPublicDonationRequests, // <-- Export it

};
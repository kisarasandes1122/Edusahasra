// backend/controllers/donationRequestController.js
const asyncHandler = require('express-async-handler');
const DonationRequest = require('../models/donationRequestModel');
const School = require('../models/schoolModel');
const mongoose = require('mongoose');

const MINIMUM_THRESHOLD = 25;

const checkRemainingQuantity = (request, itemsToDonate) => {
    const errors = [];
    const updates = [];

    for (const donatedItem of itemsToDonate) {
        const requestedItem = request.requestedItems.find(
            (item) => item.categoryId === donatedItem.categoryId
        );

        if (!requestedItem) {
            errors.push(`Item with category ID ${donatedItem.categoryId} not found in the original request.`);
            continue;
        }

        const remaining = requestedItem.quantity - requestedItem.quantityReceived;

        if (donatedItem.quantityDonated > remaining) {
            errors.push(
                `Cannot donate ${donatedItem.quantityDonated} of ${requestedItem.categoryNameEnglish}. Only ${remaining} remaining.`
            );
        }
    }
    return { errors };
};

// @desc    Create a new donation request
// @route   POST /api/requests/create
// @access  Private (School)
const createDonationRequest = asyncHandler(async (req, res) => {
  const { requestedItems, notes } = req.body;
  const schoolId = req.school._id;

  if (!requestedItems || !Array.isArray(requestedItems) || requestedItems.length === 0) {
    res.status(400);
    throw new Error('Requested items list cannot be empty.');
  }

  const validatedItems = [];
  const categoryIds = new Set();

  for (const item of requestedItems) {
    const { categoryId, categoryNameEnglish, categoryNameSinhala, quantity } = item;

    if (categoryId === undefined || categoryId === null || !categoryNameEnglish || !categoryNameSinhala || quantity === undefined || quantity === null) {
      res.status(400);
      throw new Error(`Invalid item data provided. Each item requires categoryId, categoryNameEnglish, categoryNameSinhala, and quantity.`);
    }

    const numQuantity = Number(quantity);
    if (isNaN(numQuantity) || !Number.isInteger(numQuantity) || numQuantity < MINIMUM_THRESHOLD) {
      res.status(400);
      throw new Error(`Invalid quantity for item "${categoryNameEnglish}". Quantity must be a whole number and at least ${MINIMUM_THRESHOLD}.`);
    }

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
       quantityReceived: 0,
    });
  }

   const school = await School.findById(schoolId);
   if (!school || !school.isApproved) {
       res.status(403);
       throw new Error('School not found or not approved to make requests.');
   }

  const donationRequest = await DonationRequest.create({
    school: schoolId,
    requestedItems: validatedItems,
    notes: notes ? String(notes).trim() : undefined,
    status: 'Pending',
  });

  if (donationRequest) {
    res.status(201).json({
      message: 'Donation request created successfully.',
      request: donationRequest,
    });
  } else {
    res.status(500);
    throw new Error('Failed to create donation request.');
  }
});

// @desc    Get donation requests for the logged-in school
// @route   GET /api/requests/my-requests
// @access  Private (School)
const getSchoolDonationRequests = asyncHandler(async (req, res) => {
  const schoolId = req.school._id;
  const requests = await DonationRequest.find({ school: schoolId }).sort({ createdAt: -1 });
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

    const request = await DonationRequest.findById(requestId)
        .populate('school', 'schoolName schoolEmail city district province description images location streetAddress postalCode');

    if (!request) {
        res.status(404);
        throw new Error('Donation request not found.');
    }

    res.json(request);
});

// @desc    Update donation request status (Likely by Admin or potentially School for cancellation)
// @route   PUT /api/requests/:id/status
// @access  Private (Admin or School - needs specific logic)
const updateDonationRequestStatus = asyncHandler(async (req, res) => {
    res.status(501).json({ message: 'Status update not implemented yet.' });
});

// @desc    Delete a donation request (Potentially by School if status is 'Pending')
// @route   DELETE /api/requests/:id
// @access  Private (School - needs specific logic)
const deleteDonationRequest = asyncHandler(async (req, res) => {
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

     if (request.school.toString() !== schoolId.toString()) {
         res.status(403);
         throw new Error('Not authorized to delete this request.');
     }

     if (request.status !== 'Pending') {
         res.status(400);
         throw new Error(`Cannot delete request with status "${request.status}". Consider cancelling instead.`);
     }

     await DonationRequest.deleteOne({ _id: requestId });

    res.json({ message: 'Donation request deleted successfully.' });
});

// @desc    Get publicly available donation requests (active, filterable, paginated)
// @route   GET /api/requests
// @access  Public
const getPublicDonationRequests = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 6;
  const skip = (page - 1) * limit;

  const locationQuery = req.query.location ? req.query.location.toLowerCase() : '';
  const categoryIdsQuery = req.query.categoryIds ? req.query.categoryIds.split(',').map(id => parseInt(id)).filter(id => !isNaN(id)) : [];
  const sortBy = req.query.sortBy || 'highest';

  const statusFilter = {
      status: { $in: ['Pending', 'Partially Fulfilled'] },
  };

  const categoryFilter = categoryIdsQuery.length > 0 ?
      { 'requestedItems.categoryId': { $in: categoryIdsQuery } } :
      {};

  const aggregationPipeline = [
      { $match: { ...statusFilter, ...categoryFilter } },

      {
          $lookup: {
              from: 'schools',
              localField: 'school',
              foreignField: '_id',
              as: 'schoolDetails'
          }
      },
      { $unwind: '$schoolDetails' },
      {
          $match: {
              ...(locationQuery && {
                  $or: [
                      { 'schoolDetails.city': { $regex: locationQuery, $options: 'i' } },
                      { 'schoolDetails.district': { $regex: locationQuery, $options: 'i' } },
                      { 'schoolDetails.province': { $regex: locationQuery, $options: 'i' } }
                  ]
              })
          }
      },
      {
          $addFields: {
              totalQuantityRequested: { $sum: '$requestedItems.quantity' },
              totalQuantityReceived: { $sum: '$requestedItems.quantityReceived' },
              schoolInfo: {
                  _id: '$schoolDetails._id',
                  schoolName: '$schoolDetails.schoolName',
                  city: '$schoolDetails.city',
                  district: '$schoolDetails.district',
                  province: '$schoolDetails.province',
                  firstImage: { $arrayElemAt: ['$schoolDetails.images', 0] }
              }
          }
      },
      {
          $addFields: {
              progress: {
                  $cond: {
                      if: { $gt: ['$totalQuantityRequested', 0] },
                      then: {
                          $round: [
                             {
                                $multiply: [
                                    { $divide: ['$totalQuantityReceived', '$totalQuantityRequested'] },
                                    100
                                ]
                             },
                             0
                          ]
                      },
                      else: 0
                  }
              }
          }
      },
      { $project: { schoolDetails: 0 } },
      {
          $sort: {
              progress: sortBy === 'lowest' ? 1 : -1,
              createdAt: -1
          }
      },
      {
         $facet: {
              metadata: [ { $count: "totalRequests" } ],
              data: [ { $skip: skip }, { $limit: limit } ]
          }
      }
  ];

  const results = await DonationRequest.aggregate(aggregationPipeline);

  const requests = results[0]?.data || []; 
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
getPublicDonationRequests, 
};
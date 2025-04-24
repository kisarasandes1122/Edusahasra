// backend/controllers/impactStoryController.js
const asyncHandler = require('express-async-handler');
const ImpactStory = require('../models/impactStoryModel');
const Donation = require('../models/donationModel'); // To validate donation linkage
const School = require('../models/schoolModel'); // To populate school details
const Admin = require('../models/adminModel'); // To populate admin details
const mongoose = require('mongoose');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// --- Multer Configuration for Impact Story Images ---
const impactStoryImageStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, '..', 'uploads', 'impact-story-images');
    fs.mkdirSync(uploadDir, { recursive: true }); // Ensure directory exists
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const safeOriginalName = file.originalname.replace(/\s+/g, '_');
    // Use school ID or donation ID for uniqueness if needed, but timestamp is usually enough
    cb(null, `${Date.now()}-${path.parse(safeOriginalName).name}${path.extname(safeOriginalName)}`);
  },
});

const impactStoryFileFilter = (req, file, cb) => {
  const filetypes = /jpeg|jpg|png|gif|webp/; // Allow common image types
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = filetypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Invalid file type for images. Only JPG, JPEG, PNG, GIF, and WEBP are allowed.'), false);
  }
};

const uploadImpactStoryImages = multer({
  storage: impactStoryImageStorage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit per image
  fileFilter: impactStoryFileFilter,
}).array('images', 10); // 'images' should match the field name in the form data, max 10 files

// --- Helper to build full image URL ---
// NOTE: This helper builds a URL string, but typically the backend should return
// the relative path (e.g., 'impact-story-images/filename.jpg') and the frontend
// concatenates it with the base URL and '/uploads/'.
// This specific helper function as written seems misplaced in a backend controller
// as it relies on `req` which isn't available globally here.
// The controllers below correctly return relative paths, and the frontend api.js
// contains the helper to construct the full URL for display.
const getFullImageUrl = (imagePath) => {
    console.warn("Backend getFullImageUrl helper called, but should usually be frontend concern.");
    if (!imagePath) return null;
     // Assuming imagePath is relative to the 'uploads' directory like 'impact-story-images/filename.jpg'
     // And your server serves /uploads statically from the 'uploads' directory
     // The frontend needs to know the base URL (e.g., http://localhost:5000)
     // and the static path prefix (e.g., /uploads)
     // This backend helper isn't the right place to build the *frontend* display URL.
     // Keeping this comment as per previous discussion.
     return `/uploads/${imagePath}`; // Frontend must handle creating the full URL using its base
};


// @desc    Get confirmed donations eligible for an impact story
// @route   GET /api/impact-stories/eligible-donations
// @access  Private (School)
const getEligibleDonationsForStories = asyncHandler(async (req, res) => {
  const schoolId = req.school._id;

  // 1. Find confirmed donations for this school
  const confirmedDonations = await Donation.find({
    school: schoolId,
    schoolConfirmation: true,
    trackingStatus: 'Received by School',
  })
    .populate('donor', 'fullName') // Populate donor info
    .select('donor itemsDonated schoolConfirmationAt createdAt')
    .lean(); // Use lean for performance

  // 2. Find donations that already have an Impact Story
  const storiedDonationIds = (await ImpactStory.find({ school: schoolId }).select('donation -_id')).map(s => s.donation.toString());
  const storiedSet = new Set(storiedDonationIds);

  // 3. Filter out donations that have already been storied AND where the donor no longer exists
  const eligibleDonations = confirmedDonations.filter(
    donation => {
        const alreadyStoried = storiedSet.has(donation._id.toString());
        const donorExists = donation.donor !== null; // Check if populated donor is not null

        // Only include donations that haven't had a story linked AND whose donor still exists
        return !alreadyStoried && donorExists;
    }
  );

  // 4. Format the response for the frontend dropdown
  const formattedEligibleList = eligibleDonations.map(donation => ({
    donationId: donation._id,
    donorName: donation.donor ? donation.donor.fullName : 'Anonymous Donor', // Safely access donor name
    donatedItemsSummary: donation.itemsDonated
      .map(item => `${item.quantityDonated} ${item.categoryNameEnglish}`)
      .join(', '),
    confirmationDate: donation.schoolConfirmationAt || donation.createdAt,
  }));

  res.json(formattedEligibleList);
});


// @desc    Create a new impact story
// @route   POST /api/impact-stories
// @access  Private (School)
const createImpactStory = asyncHandler(async (req, res) => {
  // Use multer middleware first - This is handled directly in the route definition now
  // and the controller logic proceeds after multer has processed files.

    const { donationId, title, storyText, quote, quoteAuthor } = req.body;
    const schoolId = req.school._id;

    // --- Validation ---
    if (!mongoose.Types.ObjectId.isValid(donationId)) {
      res.status(400);
      // Clean up uploaded files if validation fails
      if (req.files && req.files.length > 0) {
         req.files.forEach(file => fs.unlink(file.path, err => err && console.error("Error deleting uploaded file:", err)));
      }
      throw new Error('Invalid Donation ID format.');
    }
    if (!title || title.trim().length === 0) {
       if (req.files && req.files.length > 0) { req.files.forEach(file => fs.unlink(file.path, err => err && console.error("Error deleting uploaded file:", err))); }
      res.status(400);
      throw new Error('Title is required.');
    }
     if (!storyText || storyText.trim().length === 0) {
        if (req.files && req.files.length > 0) { req.files.forEach(file => fs.unlink(file.path, err => err && console.error("Error deleting uploaded file:", err))); }
       res.status(400);
       throw new Error('Story text is required.');
     }
     // Added required images validation based on frontend component logic
     if (!req.files || req.files.length === 0) {
        res.status(400);
        throw new Error('At least one image is required for the impact story.');
     }

     if (title.trim().length > 150) {
        if (req.files && req.files.length > 0) { req.files.forEach(file => fs.unlink(file.path, err => err && console.error("Error deleting uploaded file:", err))); }
        res.status(400);
        throw new Error('Title cannot exceed 150 characters.');
     }
      if (storyText.trim().length > 3000) {
         if (req.files && req.files.length > 0) { req.files.forEach(file => fs.unlink(file.path, err => err && console.error("Error deleting uploaded file:", err))); }
         res.status(400);
         throw new Error('Story text cannot exceed 3000 characters.');
      }
      if (quote && quote.trim().length > 500) {
          if (req.files && req.files.length > 0) { req.files.forEach(file => fs.unlink(file.path, err => err && console.error("Error deleting uploaded file:", err))); }
          res.status(400);
          throw new Error('Quote cannot exceed 500 characters.');
      }
       if (quoteAuthor && quoteAuthor.trim().length > 100) {
           if (req.files && req.files.length > 0) { req.files.forEach(file => fs.unlink(file.path, err => err && console.error("Error deleting uploaded file:", err))); }
           res.status(400);
           throw new Error('Quote author cannot exceed 100 characters.');
       }


    // Check if the donation exists, belongs to the school, and is confirmed
    const donation = await Donation.findOne({
        _id: donationId,
        school: schoolId,
        schoolConfirmation: true,
        trackingStatus: 'Received by School',
    });

    if (!donation) {
        if (req.files && req.files.length > 0) { req.files.forEach(file => fs.unlink(file.path, err => err && console.error("Error deleting uploaded file:", err))); }
        res.status(404);
        throw new Error('Selected donation not found, does not belong to this school, or is not confirmed as received.');
    }

    // Check if an impact story already exists for this donation
     const existingStory = await ImpactStory.findOne({ donation: donationId });
     if (existingStory) {
         if (req.files && req.files.length > 0) { req.files.forEach(file => fs.unlink(file.path, err => err && console.error("Error deleting uploaded file:", err))); }
         res.status(400);
         throw new Error('An impact story already exists for this donation.');
     }


    // --- Prepare Image Data ---
    const imagesData = req.files ? req.files.map(file => ({
      fileName: file.originalname,
      filePath: path.relative(path.join(__dirname, '..', 'uploads'), file.path).replace(/\\/g, '/'), // Relative path, forward slashes
      fileType: file.mimetype,
    })) : [];


    // --- Create Impact Story ---
    try {
      const impactStory = await ImpactStory.create({
        school: schoolId,
        donation: donationId,
        title: title.trim(),
        storyText: storyText.trim(),
        quote: quote ? quote.trim() : undefined,
        quoteAuthor: quoteAuthor ? quoteAuthor.trim() : undefined,
        images: imagesData,
        status: 'Pending Approval', // Default status
        submittedAt: Date.now(),
      });

      res.status(201).json({
        message: 'Impact story submitted successfully. It is now pending admin approval.',
        impactStory: {
          _id: impactStory._id,
          title: impactStory.title,
          status: impactStory.status,
          submittedAt: impactStory.submittedAt,
        },
      });

    } catch (dbError) {
       // If DB save fails, attempt to delete uploaded files
       if (req.files && req.files.length > 0) {
           req.files.forEach(file => fs.unlink(file.path, err => err && console.error("Error deleting uploaded file after DB error:", err)));
       }
       res.status(500); // Internal server error for DB issues
       throw new Error(`Failed to save impact story: ${dbError.message}`);
    }

});


// @desc    Get impact stories submitted by the logged-in school
// @route   GET /api/impact-stories/my-stories
// @access  Private (School)
const getSchoolImpactStories = asyncHandler(async (req, res) => {
  const schoolId = req.school._id;

  const stories = await ImpactStory.find({ school: schoolId })
    .select('-images -__v') // Exclude images in the list view for performance
    .sort({ submittedAt: -1 });

  res.json(stories);
});


// @desc    Get all impact stories for admin review
// @route   GET /api/impact-stories/admin
// @access  Private (Admin)
const getAdminImpactStories = asyncHandler(async (req, res) => {
  // Added debugging logs for the 400 error case
  console.log('Admin fetching impact stories request received.');
  console.log('Query parameters:', req.query);

  const { status } = req.query; // Allow filtering by status

  const filter = {};
  // The condition correctly checks if status is provided AND is one of the valid statuses
  if (status && ['Pending Approval', 'Approved', 'Rejected'].includes(status)) {
      filter.status = status;
  }
  console.log('Applying filter:', filter);


  try {
      // This is where the database query happens
      const stories = await ImpactStory.find(filter)
        .populate('school', 'schoolName city') // Populate school name and city
        .select('-images -__v') // Exclude images in the list view initially
        .sort({ submittedAt: -1 });

      console.log(`Successfully fetched ${stories.length} impact stories.`);

      res.json(stories);

  } catch (error) {
       // Catch and log the specific error happening during the query/population
       console.error('***** ERROR during ImpactStory.find query or population in getAdminImpactStories: *****');
       console.error(error);
       console.error('************************************************************************************');

       // Re-throw the error so asyncHandler can pass it to the global error handler
       // This ensures the frontend still gets an error response (like the 400)
       throw error; // Or throw new Error('Database query failed.'); for a generic message
  }
});


// @desc    Get a specific impact story by ID (for detail view)
// @route   GET /api/impact-stories/:id
// @access  Public (Checks status/auth inside)
const getImpactStoryById = asyncHandler(async (req, res) => {
    const storyId = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(storyId)) {
        res.status(400);
        throw new Error('Invalid Impact Story ID format.');
    }

    const story = await ImpactStory.findById(storyId)
        .populate('school', 'schoolName schoolEmail city district province images') // Populate key school info including images
        .populate('donation', 'itemsDonated createdAt donor'); // Populate related donation info

    if (!story) {
        res.status(404);
        throw new Error('Impact story not found.');
    }

    // --- Authorization Check ---
    // Admin can see any story
    // The submitting school can see their own story
    // Anyone can see an 'Approved' story
    const isSubmittingSchool = req.school && story.school?._id && story.school._id.toString() === req.school._id.toString();
    const isAdmin = req.admin;
    const isApproved = story.status === 'Approved';

    if (!isSubmittingSchool && !isAdmin && !isApproved) {
        res.status(403); // Forbidden
        throw new Error('Not authorized to view this impact story.');
    }

    // Format images with paths relative to uploads - Frontend will use getFullImageUrl helper
    const formattedImages = story.images.map(img => ({
           fileName: img.fileName,
           // Return the stored relative path. Frontend builds the full URL.
           // e.g., 'impact-story-images/filename.jpg'
           filePath: img.filePath
       }));

    // Format the response
    const responseData = {
         _id: story._id,
         title: story.title,
         storyText: story.storyText,
         quote: story.quote,
         quoteAuthor: story.quoteAuthor,
         images: formattedImages, // Use formatted images with relative paths
         status: story.status,
         submittedAt: story.submittedAt,
         approvedBy: story.approvedBy, // Include ID if admin viewing (will be populated below if admin)
         approvedAt: story.approvedAt,
         adminRemarks: story.adminRemarks,
         school: { // Safely access school properties
            _id: story.school?._id,
            schoolName: story.school?.schoolName,
            city: story.school?.city,
            district: story.school?.district,
            province: story.school?.province,
            // Return school images as relative paths too. Frontend builds full URL.
            // Assume school images are stored like 'school-profile-images/filename.jpg'
            images: story.school?.images || [],
            // Add other needed school fields here
         },
         donation: { // Include some context about the donation
            id: story.donation?._id,
            date: story.donation?.createdAt,
            // Only include donor ID for potential backend logic, not full donor info in public view
            donor: story.donation?.donor?._id, // Include donor ID if populated and exists
            summary: story.donation?.itemsDonated
                ?.map(item => `${item.quantityDonated} ${item.categoryNameEnglish}`)
                .join(', ') || 'N/A'
         }
    };

    // If admin is viewing and approvedBy is populated, populate the admin details for the response
    // This is done *after* the initial population because the check needs the ID.
    if (isAdmin && responseData.approvedBy) {
        try {
             const admin = await Admin.findById(responseData.approvedBy).select('name email').lean(); // Use lean for performance
             responseData.approvedBy = admin ? { _id: admin._id, name: admin.name, email: admin.email } : null;
        } catch (adminPopulateError) {
            console.error("Error populating admin for approvedBy:", adminPopulateError);
            responseData.approvedBy = null; // Ensure it's null on error
        }
    }


    res.json(responseData);
});


// @desc    Get publicly available impact stories (Approved status)
// @route   GET /api/impact-stories/public
// @access  Public
const getPublicImpactStories = asyncHandler(async (req, res) => {
  // Pagination and filtering logic can be added here if needed
  // For now, fetch all approved, sorted by approval date (newest first)

  const stories = await ImpactStory.find({ status: 'Approved' })
    .populate('school', 'schoolName city district province images') // Populate school name, location, first image
    .select('title storyText quote quoteAuthor images status submittedAt approvedAt')
    .sort({ approvedAt: -1, submittedAt: -1 }); // Sort by approval date then submission date

  // Format images with paths - Frontend will use getFullImageUrl helper
  const formattedStories = stories.map(story => {
      // Get the first school image path relative to uploads
      const firstSchoolImagePath = story.school?.images?.[0]; // Stored path like 'school-profile-images/filename.jpg'

      // Get all story image paths relative to uploads
      const storyImagePaths = story.images.map(img => img.filePath); // Stored paths like 'impact-story-images/filename.jpg'


      return {
          _id: story._id,
          title: story.title,
          storyText: story.storyText,
          quote: story.quote,
          quoteAuthor: story.quoteAuthor,
          // Return just the relative paths
          images: storyImagePaths,
          status: story.status, // Will be 'Approved'
          submittedAt: story.submittedAt,
          approvedAt: story.approvedAt,
          school: {
              _id: story.school?._id,
              schoolName: story.school?.schoolName,
              city: story.school?.city,
              district: story.school?.district,
              province: story.school?.province,
              // Return the relative path for the first school image
              firstSchoolImage: firstSchoolImagePath,
          },
          // Don't include full donation details in public list for privacy/simplicity
          // Add donation ID if linking to it is needed: donationId: story.donation
      };
  });


  res.json(formattedStories);
});


// @desc    Approve an impact story
// @route   PUT /api/impact-stories/:id/approve
// @access  Private (Admin)
const approveImpactStory = asyncHandler(async (req, res) => {
  const storyId = req.params.id;
  const adminId = req.admin._id; // Get admin ID from authenticated user
  const { adminRemarks } = req.body; // Optional remarks

  if (!mongoose.Types.ObjectId.isValid(storyId)) {
      res.status(400);
      throw new Error('Invalid Impact Story ID format.');
  }

  const story = await ImpactStory.findById(storyId);

  if (!story) {
    res.status(404);
    throw new Error('Impact story not found.');
  }

  // Only allow approving if status is 'Pending Approval' or 'Rejected' (maybe allow re-approving?)
   if (story.status === 'Approved') {
       res.status(400);
       throw new Error('Impact story is already approved.');
   }

  story.status = 'Approved';
  story.approvedBy = adminId;
  story.approvedAt = Date.now();
  story.adminRemarks = adminRemarks || 'Approved'; // Save admin remarks

  const updatedStory = await story.save();

  res.json({
    message: 'Impact story approved successfully.',
    impactStory: {
      _id: updatedStory._id,
      title: updatedStory.title,
      status: updatedStory.status,
      approvedAt: updatedStory.approvedAt,
      // Only include the ID here, frontend detail view will populate
      approvedBy: updatedStory.approvedBy,
      adminRemarks: updatedStory.adminRemarks,
    },
  });
});


// @desc    Reject an impact story
// @route   PUT /api/impact-stories/:id/reject
// @access  Private (Admin)
const rejectImpactStory = asyncHandler(async (req, res) => {
    const storyId = req.params.id;
    const adminId = req.admin._id;
    const { adminRemarks } = req.body;

    if (!mongoose.Types.ObjectId.isValid(storyId)) {
        res.status(400);
        throw new Error('Invalid Impact Story ID format.');
    }

    if (!adminRemarks || adminRemarks.trim().length === 0) {
        res.status(400);
        throw new Error('Admin remarks are required when rejecting an impact story.');
    }

    const story = await ImpactStory.findById(storyId);

    if (!story) {
      res.status(404);
      throw new Error('Impact story not found.');
    }

    // Only allow rejecting if status is 'Pending Approval' or 'Approved' (maybe allow un-approving/rejecting approved?)
    // Let's allow rejecting 'Pending Approval' or 'Approved'
     if (story.status === 'Rejected') {
         res.status(400);
         throw new Error('Impact story is already rejected.');
     }

    story.status = 'Rejected';
    story.approvedBy = adminId; // Store who rejected it
    story.approvedAt = Date.now(); // Store rejection timestamp
    story.adminRemarks = adminRemarks.trim(); // Save rejection reason

    const updatedStory = await story.save();

     // Optional: Delete uploaded files on rejection? Let's keep them for record for now.

    res.json({
      message: 'Impact story rejected.',
      impactStory: {
        _id: updatedStory._id,
        title: updatedStory.title,
        status: updatedStory.status,
        adminRemarks: updatedStory.adminRemarks,
        // Only include the ID here, frontend detail view will populate
        approvedBy: updatedStory.approvedBy, // This will store the admin ID who rejected it
        approvedAt: updatedStory.approvedAt, // This will store the rejection timestamp
      },
    });
});


module.exports = {
  getEligibleDonationsForStories,
  createImpactStory,
  getSchoolImpactStories,
  getAdminImpactStories,
  getImpactStoryById,
  getPublicImpactStories,
  approveImpactStory,
  rejectImpactStory,
  uploadImpactStoryImages // Export Multer middleware (used in routes)
};
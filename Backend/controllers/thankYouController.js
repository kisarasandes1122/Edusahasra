// backend/controllers/thankYouController.js

const asyncHandler = require('express-async-handler');
const Donation = require('../models/donationModel');
const ThankYou = require('../models/thankYouModel');
const Donor = require('../models/donorModel'); // Needed to populate donor info
const mongoose = require('mongoose');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// --- Multer Configuration for Thank You Images ---
const thankYouImageStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, '..', 'uploads', 'thankyou-images');
    fs.mkdirSync(uploadDir, { recursive: true });
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const safeOriginalName = file.originalname.replace(/\s+/g, '_');
    cb(null, `${Date.now()}-${path.parse(safeOriginalName).name}${path.extname(safeOriginalName)}`);
  },
});

const thankYouFileFilter = (req, file, cb) => {
  const filetypes = /jpeg|jpg|png|gif/; // Allow common image types
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = filetypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPG, JPEG, PNG, and GIF are allowed.'), false);
  }
};

const uploadThankYouImages = multer({
  storage: thankYouImageStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit per image
  fileFilter: thankYouFileFilter,
}).array('images', 5); // 'images' should match the field name in the form data

// @desc    Get confirmed donations eligible for a thank you message
// @route   GET /api/thankyous/eligible-donations
// @access  Private (School)
const getEligibleDonationsForThanks = asyncHandler(async (req, res) => {
  const schoolId = req.school._id;

  // 1. Find confirmed donations for this school
  // Use .populate('donor') without specific fields first to ensure the donor object (or null) is there
  const confirmedDonations = await Donation.find({
    school: schoolId,
    schoolConfirmation: true,
    trackingStatus: 'Received by School',
  })
    .populate('donor') // Populate the whole donor object (or null)
    .select('donor itemsDonated schoolConfirmationAt createdAt')
    .lean(); // Use lean for performance if not modifying

  // 2. Find donations that already have a ThankYou sent
  const thankedDonationIds = (await ThankYou.find({ school: schoolId }).select('donation -_id')).map(t => t.donation.toString());
  const thankedSet = new Set(thankedDonationIds);

  // 3. Filter out donations that have already been thanked AND filter out donations where the donor no longer exists
  const eligibleDonations = confirmedDonations.filter(
    donation => {
        // Check if donation has already been thanked
        const alreadyThanked = thankedSet.has(donation._id.toString());
        // Check if the donor is null (meaning the donor was deleted)
        const donorExists = donation.donor !== null; // Check if populated donor is not null

        // Only include donations that haven't been thanked AND whose donor still exists
        return !alreadyThanked && donorExists;
    }
  );


  // 4. Format the response for the frontend dropdown
  const formattedEligibleList = eligibleDonations.map(donation => ({
    donationId: donation._id,
    // Safely access donor properties - they are guaranteed to exist here due to the filter above
    donorId: donation.donor._id,
    donorName: donation.donor.fullName,
    // Create a summary of donated items
    donatedItemsSummary: donation.itemsDonated
      .map(item => `${item.quantityDonated} ${item.categoryNameEnglish}`)
      .join(', '),
    confirmationDate: donation.schoolConfirmationAt || donation.createdAt, // Use confirmation date or creation date as fallback
  }));

  // --- REMOVE THE TYPO'D LINE ---
  // res.json(formattedEligableList); // <-- DELETE THIS LINE

  // --- KEEP ONLY THE CORRECT LINE ---
  res.json(formattedEligibleList); // <-- KEEP THIS LINE
});


// @desc    Send a thank you message and optionally images
// @route   POST /api/thankyous
// @access  Private (School)
const sendThankYou = asyncHandler(async (req, res) => {
  // Use multer middleware first
  uploadThankYouImages(req, res, async (err) => {
    if (err instanceof multer.MulterError) {
      res.status(400);
      throw new Error(`Image Upload Error: ${err.message}`);
    } else if (err) {
      res.status(400);
      throw new Error(err.message); // Error from fileFilter
    }

    // --- After potential file upload ---
    const { donationId, message } = req.body;
    const schoolId = req.school._id;

    // --- Validation ---
    if (!mongoose.Types.ObjectId.isValid(donationId)) {
      res.status(400);
      throw new Error('Invalid Donation ID format.');
    }
    if (!message || message.trim().length === 0) {
      res.status(400);
      throw new Error('Thank you message cannot be empty.');
    }

    const donation = await Donation.findById(donationId);

    // Check if donation exists and belongs to the school
    if (!donation || donation.school.toString() !== schoolId.toString()) {
      res.status(404);
      throw new Error('Donation not found or does not belong to this school.');
    }

    // Check if donation is actually confirmed
    if (!donation.schoolConfirmation || donation.trackingStatus !== 'Received by School') {
      res.status(400);
      throw new Error('Cannot send thanks for a donation that has not been confirmed as received.');
    }

    // Check if a thank you already exists for this donation
    const existingThankYou = await ThankYou.findOne({ donation: donationId });
    if (existingThankYou) {
        // Clean up uploaded files if thank you already exists
        if (req.files && req.files.length > 0) {
            req.files.forEach(file => fs.unlink(file.path, err => err && console.error("Error deleting uploaded file:", err)));
        }
      res.status(400);
      throw new Error('A thank you message has already been sent for this donation.');
    }

    // --- Prepare Image Data ---
    const imagesData = req.files ? req.files.map(file => ({
      fileName: file.originalname,
      // Store path relative to the 'uploads' directory for easier serving
      filePath: path.relative(path.join(__dirname, '..', 'uploads'), file.path).replace(/\\/g, '/'), // Make path relative and use forward slashes
      fileType: file.mimetype,
    })) : [];

    // --- Create Thank You ---
    try {
      const thankYou = await ThankYou.create({
        donor: donation.donor,
        school: schoolId,
        donation: donationId,
        message: message.trim(),
        images: imagesData,
      });

      res.status(201).json({
        message: 'Thank you message sent successfully!',
        thankYou: { // Send back some details of the created thank you
          _id: thankYou._id,
          donor: thankYou.donor,
          school: thankYou.school,
          donation: thankYou.donation,
          message: thankYou.message,
          images: thankYou.images.map(img => ({ fileName: img.fileName, filePath: img.filePath })), // Only return relevant info
          sentAt: thankYou.sentAt
        },
      });

    } catch (dbError) {
       // If DB save fails, attempt to delete uploaded files
       if (req.files && req.files.length > 0) {
           req.files.forEach(file => fs.unlink(file.path, err => err && console.error("Error deleting uploaded file after DB error:", err)));
       }
       res.status(500); // Internal server error for DB issues
       throw new Error(`Failed to save thank you message: ${dbError.message}`);
    }
  });
});


// @desc    Get thank you messages received by the logged-in donor
// @route   GET /api/thankyous/my-thanks
// @access  Private (Donor)
const getMyThankYous = asyncHandler(async (req, res) => {
  const donorId = req.donor._id;

  const thankYous = await ThankYou.find({ donor: donorId })
    .populate('school', 'schoolName city') // Populate school name and city
    .populate({ // Populate donation details selectively
        path: 'donation',
        select: 'itemsDonated createdAt' // Get items and donation date
    })
    .sort({ sentAt: -1 }); // Show newest first

  // Optionally format the response further if needed
   const formattedThankYous = thankYous.map(ty => {
       const images = ty.images.map(img => ({
           fileName: img.fileName,
           // Construct full URL or keep relative path based on frontend needs
           // Assuming '/uploads' is the static route base
           url: `/uploads/${img.filePath}`
       }));
       const donationSummary = ty.donation?.itemsDonated
           ?.map(item => `${item.quantityDonated} ${item.categoryNameEnglish}`)
           .join(', ');

       return {
           _id: ty._id,
           schoolName: ty.school?.schoolName,
           schoolCity: ty.school?.city,
           message: ty.message,
           images: images,
           sentAt: ty.sentAt,
           donationDate: ty.donation?.createdAt,
           donationSummary: donationSummary || 'N/A'
       };
   });

  res.json(formattedThankYous);
});


// @desc    Get a specific thank you message by ID
// @route   GET /api/thankyous/:id
// @access  Private (Donor, School, Admin - with checks)
const getThankYouById = asyncHandler(async (req, res) => {
    const thankYouId = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(thankYouId)) {
        res.status(400);
        throw new Error('Invalid Thank You ID format.');
    }

    const thankYou = await ThankYou.findById(thankYouId)
        .populate('donor', 'fullName')
        .populate('school', 'schoolName schoolEmail city')
        .populate('donation', 'itemsDonated createdAt'); // Populate related donation info

    if (!thankYou) {
        res.status(404);
        throw new Error('Thank You message not found.');
    }

    // --- Authorization Check ---
    const isRecipientDonor = req.donor && thankYou.donor._id.toString() === req.donor._id.toString();
    const isSendingSchool = req.school && thankYou.school._id.toString() === req.school._id.toString();
    const isAdmin = req.admin;

    if (!isRecipientDonor && !isSendingSchool && !isAdmin) {
        res.status(403);
        throw new Error('Not authorized to view this thank you message.');
    }

    // Format images with full URLs for easier frontend consumption
    const formattedImages = thankYou.images.map(img => ({
           fileName: img.fileName,
           url: `/uploads/${img.filePath}` // Assuming '/uploads' is the static route base
       }));

    // Format the response
    const responseData = {
         _id: thankYou._id,
         donorName: thankYou.donor?.fullName,
         schoolName: thankYou.school?.schoolName,
         schoolEmail: thankYou.school?.schoolEmail,
         schoolCity: thankYou.school?.city,
         message: thankYou.message,
         images: formattedImages,
         sentAt: thankYou.sentAt,
         donation: { // Include some context about the donation
            id: thankYou.donation?._id,
            date: thankYou.donation?.createdAt,
            summary: thankYou.donation?.itemsDonated
                ?.map(item => `${item.quantityDonated} ${item.categoryNameEnglish}`)
                .join(', ') || 'N/A'
         }
    };


    res.json(responseData);
});


module.exports = {
  getEligibleDonationsForThanks,
  sendThankYou,
  getMyThankYous,
  getThankYouById
};
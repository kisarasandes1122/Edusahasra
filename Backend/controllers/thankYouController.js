// backend/controllers/thankYouController.js

const asyncHandler = require('express-async-handler');
const Donation = require('../models/donationModel');
const ThankYou = require('../models/thankYouModel');
const Donor = require('../models/donorModel');
const mongoose = require('mongoose');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

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
  const filetypes = /jpeg|jpg|png|gif/;
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
}).array('images', 5);

// @desc    Get confirmed donations eligible for a thank you message
// @route   GET /api/thankyous/eligible-donations
// @access  Private (School)
const getEligibleDonationsForThanks = asyncHandler(async (req, res) => {
  const schoolId = req.school._id;

  const confirmedDonations = await Donation.find({
    school: schoolId,
    schoolConfirmation: true,
    trackingStatus: 'Received by School',
  })
    .populate('donor')
    .select('donor itemsDonated schoolConfirmationAt createdAt')
    .lean();

  const thankedDonationIds = (await ThankYou.find({ school: schoolId }).select('donation -_id')).map(t => t.donation.toString());
  const thankedSet = new Set(thankedDonationIds);

  const eligibleDonations = confirmedDonations.filter(
    donation => {
        const alreadyThanked = thankedSet.has(donation._id.toString());
        const donorExists = donation.donor !== null;
        return !alreadyThanked && donorExists;
    }
  );

  const formattedEligibleList = eligibleDonations.map(donation => ({
    donationId: donation._id,
    donorId: donation.donor._id,
    donorName: donation.donor.fullName,
    donatedItemsSummary: donation.itemsDonated
      .map(item => `${item.quantityDonated} ${item.categoryNameEnglish}`)
      .join(', '),
    confirmationDate: donation.schoolConfirmationAt || donation.createdAt,
  }));

  res.json(formattedEligibleList);
});


// @desc    Send a thank you message and optionally images
// @route   POST /api/thankyous
// @access  Private (School)
const sendThankYou = asyncHandler(async (req, res) => {
  uploadThankYouImages(req, res, async (err) => {
    if (err instanceof multer.MulterError) {
      res.status(400);
      throw new Error(`Image Upload Error: ${err.message}`);
    } else if (err) {
      res.status(400);
      throw new Error(err.message);
    }

    const { donationId, message } = req.body;
    const schoolId = req.school._id;

    if (!mongoose.Types.ObjectId.isValid(donationId)) {
      res.status(400);
      throw new Error('Invalid Donation ID format.');
    }
    if (!message || message.trim().length === 0) {
      res.status(400);
      throw new Error('Thank you message cannot be empty.');
    }

    const donation = await Donation.findById(donationId);

    if (!donation || donation.school.toString() !== schoolId.toString()) {
      res.status(404);
      throw new Error('Donation not found or does not belong to this school.');
    }

    if (!donation.schoolConfirmation || donation.trackingStatus !== 'Received by School') {
      res.status(400);
      throw new Error('Cannot send thanks for a donation that has not been confirmed as received.');
    }

    const existingThankYou = await ThankYou.findOne({ donation: donationId });
    if (existingThankYou) {
        if (req.files && req.files.length > 0) {
            req.files.forEach(file => fs.unlink(file.path, err => err && console.error("Error deleting uploaded file:", err)));
        }
      res.status(400);
      throw new Error('A thank you message has already been sent for this donation.');
    }

    const imagesData = req.files ? req.files.map(file => ({
      fileName: file.originalname,
      filePath: path.relative(path.join(__dirname, '..', 'uploads'), file.path).replace(/\\/g, '/'),
      fileType: file.mimetype,
    })) : [];

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
        thankYou: {
          _id: thankYou._id,
          donor: thankYou.donor,
          school: thankYou.school,
          donation: thankYou.donation,
          message: thankYou.message,
          images: thankYou.images.map(img => ({ fileName: img.fileName, filePath: img.filePath })),
          sentAt: thankYou.sentAt
        },
      });

    } catch (dbError) {
       if (req.files && req.files.length > 0) {
           req.files.forEach(file => fs.unlink(file.path, err => err && console.error("Error deleting uploaded file after DB error:", err)));
       }
       res.status(500);
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
    .populate('school', 'schoolName city')
    .populate({
        path: 'donation',
        select: 'itemsDonated createdAt'
    })
    .sort({ sentAt: -1 });

   const formattedThankYous = thankYous.map(ty => {
       const images = ty.images.map(img => ({
           fileName: img.fileName,
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
        .populate('donation', 'itemsDonated createdAt');

    if (!thankYou) {
        res.status(404);
        throw new Error('Thank You message not found.');
    }

    const isRecipientDonor = req.donor && thankYou.donor._id.toString() === req.donor._id.toString();
    const isSendingSchool = req.school && thankYou.school._id.toString() === req.school._id.toString();
    const isAdmin = req.admin;

    if (!isRecipientDonor && !isSendingSchool && !isAdmin) {
        res.status(403);
        throw new Error('Not authorized to view this thank you message.');
    }

    const formattedImages = thankYou.images.map(img => ({
           fileName: img.fileName,
           url: `/uploads/${img.filePath}`
       }));

    const responseData = {
         _id: thankYou._id,
         donorName: thankYou.donor?.fullName,
         schoolName: thankYou.school?.schoolName,
         schoolEmail: thankYou.school?.schoolEmail,
         schoolCity: thankYou.school?.city,
         message: thankYou.message,
         images: formattedImages,
         sentAt: thankYou.sentAt,
         donation: {
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
const asyncHandler = require('express-async-handler');
const ImpactStory = require('../models/impactStoryModel');
const Donation = require('../models/donationModel');
const School = require('../models/schoolModel');
const Admin = require('../models/adminModel');
const mongoose = require('mongoose');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { sendEmail } = require('./adminController'); 

const impactStoryImageStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, '..', 'uploads', 'impact-story-images');
    fs.mkdirSync(uploadDir, { recursive: true });
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const safeOriginalName = file.originalname.replace(/\s+/g, '_');
    cb(null, `${Date.now()}-${path.parse(safeOriginalName).name}${path.extname(safeOriginalName)}`);
  },
});

const impactStoryFileFilter = (req, file, cb) => {
  const filetypes = /jpeg|jpg|png|gif|webp/;
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
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: impactStoryFileFilter,
}).array('images', 10);

const getFullImageUrl = (imagePath) => {
    console.warn("Backend getFullImageUrl helper called, but should usually be frontend concern.");
    if (!imagePath) return null;
     return `/uploads/${imagePath}`;
};

// @desc    Get confirmed donations eligible for an impact story
// @route   GET /api/impact-stories/eligible-donations
// @access  Private (School)
const getEligibleDonationsForStories = asyncHandler(async (req, res) => {
  const schoolId = req.school._id;

  const confirmedDonations = await Donation.find({
    school: schoolId,
    schoolConfirmation: true,
    trackingStatus: 'Received by School',
  })
    .populate('donor', 'fullName')
    .select('donor itemsDonated schoolConfirmationAt createdAt')
    .lean();

  const storiedDonationIds = (await ImpactStory.find({ school: schoolId }).select('donation -_id')).map(s => s.donation.toString());
  const storiedSet = new Set(storiedDonationIds);

  const eligibleDonations = confirmedDonations.filter(
    donation => {
        const alreadyStoried = storiedSet.has(donation._id.toString());
        const donorExists = donation.donor !== null;

        return !alreadyStoried && donorExists;
    }
  );

  const formattedEligibleList = eligibleDonations.map(donation => ({
    donationId: donation._id,
    donorName: donation.donor ? donation.donor.fullName : 'Anonymous Donor',
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
    const { donationId, title, storyText, quote, quoteAuthor } = req.body;
    const schoolId = req.school._id;

    if (!mongoose.Types.ObjectId.isValid(donationId)) {
      res.status(400);
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

     const existingStory = await ImpactStory.findOne({ donation: donationId });
     if (existingStory) {
         if (req.files && req.files.length > 0) { req.files.forEach(file => fs.unlink(file.path, err => err && console.error("Error deleting uploaded file:", err))); }
         res.status(400);
         throw new Error('An impact story already exists for this donation.');
     }

    const imagesData = req.files ? req.files.map(file => ({
      fileName: file.originalname,
      filePath: path.relative(path.join(__dirname, '..', 'uploads'), file.path).replace(/\\/g, '/'),
      fileType: file.mimetype,
    })) : [];

    try {
      const impactStory = await ImpactStory.create({
        school: schoolId,
        donation: donationId,
        title: title.trim(),
        storyText: storyText.trim(),
        quote: quote ? quote.trim() : undefined,
        quoteAuthor: quoteAuthor ? quoteAuthor.trim() : undefined,
        images: imagesData,
        status: 'Pending Approval',
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
       if (req.files && req.files.length > 0) {
           req.files.forEach(file => fs.unlink(file.path, err => err && console.error("Error deleting uploaded file after DB error:", err)));
       }
       res.status(500);
       throw new Error(`Failed to save impact story: ${dbError.message}`);
    }

});

// @desc    Get impact stories submitted by the logged-in school
// @route   GET /api/impact-stories/my-stories
// @access  Private (School)
const getSchoolImpactStories = asyncHandler(async (req, res) => {
  const schoolId = req.school._id;

  const stories = await ImpactStory.find({ school: schoolId })
    .select('-images -__v')
    .sort({ submittedAt: -1 });

  res.json(stories);
});

// @desc    Get all impact stories for admin review
// @route   GET /api/impact-stories/admin
// @access  Private (Admin)
const getAdminImpactStories = asyncHandler(async (req, res) => {
  console.log('Admin fetching impact stories request received.');
  console.log('Query parameters:', req.query);

  const { status } = req.query;

  const filter = {};
  if (status && ['Pending Approval', 'Approved', 'Rejected'].includes(status)) {
      filter.status = status;
  }
  console.log('Applying filter:', filter);

  try {
      const stories = await ImpactStory.find(filter)
        .populate('school', 'schoolName city')
        .select('-images -__v')
        .sort({ submittedAt: -1 });

      console.log(`Successfully fetched ${stories.length} impact stories.`);

      res.json(stories);

  } catch (error) {
       console.error('***** ERROR during ImpactStory.find query or population in getAdminImpactStories: *****');
       console.error(error);
       console.error('************************************************************************************');

       throw error;
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
        .populate('school', 'schoolName schoolEmail city district province images')
        .populate('donation', 'itemsDonated createdAt donor');

    if (!story) {
        res.status(404);
        throw new Error('Impact story not found.');
    }

    const isSubmittingSchool = req.school && story.school?._id && story.school._id.toString() === req.school._id.toString();
    const isAdmin = req.admin;
    const isApproved = story.status === 'Approved';

    if (!isSubmittingSchool && !isAdmin && !isApproved) {
        res.status(403);
        throw new Error('Not authorized to view this impact story.');
    }

    const formattedImages = story.images.map(img => ({
           fileName: img.fileName,
           filePath: img.filePath
       }));

    const responseData = {
         _id: story._id,
         title: story.title,
         storyText: story.storyText,
         quote: story.quote,
         quoteAuthor: story.quoteAuthor,
         images: formattedImages,
         status: story.status,
         submittedAt: story.submittedAt,
         approvedBy: story.approvedBy,
         approvedAt: story.approvedAt,
         adminRemarks: story.adminRemarks,
         school: {
            _id: story.school?._id,
            schoolName: story.school?.schoolName,
            city: story.school?.city,
            district: story.school?.district,
            province: story.school?.province,
            images: story.school?.images || [],
         },
         donation: {
            id: story.donation?._id,
            date: story.donation?.createdAt,
            donor: story.donation?.donor?._id,
            summary: story.donation?.itemsDonated
                ?.map(item => `${item.quantityDonated} ${item.categoryNameEnglish}`)
                .join(', ') || 'N/A'
         }
    };

    if (isAdmin && responseData.approvedBy) {
        try {
             const admin = await Admin.findById(responseData.approvedBy).select('name email').lean();
             responseData.approvedBy = admin ? { _id: admin._id, name: admin.name, email: admin.email } : null;
        } catch (adminPopulateError) {
            console.error("Error populating admin for approvedBy:", adminPopulateError);
            responseData.approvedBy = null;
        }
    }

    res.json(responseData);
});

// @desc    Get publicly available impact stories (Approved status)
// @route   GET /api/impact-stories/public
// @access  Public
const getPublicImpactStories = asyncHandler(async (req, res) => {
  const stories = await ImpactStory.find({ status: 'Approved' })
    .populate('school', 'schoolName city district province images')
    .select('title storyText quote quoteAuthor images status submittedAt approvedAt')
    .sort({ approvedAt: -1, submittedAt: -1 });

  const formattedStories = stories.map(story => {
      const firstSchoolImagePath = story.school?.images?.[0];

      const storyImagePaths = story.images.map(img => img.filePath);

      return {
          _id: story._id,
          title: story.title,
          storyText: story.storyText,
          quote: story.quote,
          quoteAuthor: story.quoteAuthor,
          images: storyImagePaths,
          status: story.status,
          submittedAt: story.submittedAt,
          approvedAt: story.approvedAt,
          school: {
              _id: story.school?._id,
              schoolName: story.school?.schoolName,
              city: story.school?.city,
              district: story.school?.district,
              province: story.school?.province,
              firstSchoolImage: firstSchoolImagePath,
          },

      };
  });

  res.json(formattedStories);
});

// @desc    Approve an impact story
// @route   PUT /api/impact-stories/:id/approve
// @access  Private (Admin)
const approveImpactStory = asyncHandler(async (req, res) => {
  const storyId = req.params.id;
  const adminId = req.admin._id;
  const { adminRemarks } = req.body;

  if (!mongoose.Types.ObjectId.isValid(storyId)) {
      res.status(400);
      throw new Error('Invalid Impact Story ID format.');
  }

  const story = await ImpactStory.findById(storyId).populate('school', 'schoolName schoolEmail');

  if (!story) {
    res.status(404);
    throw new Error('Impact story not found.');
  }

   if (story.status === 'Approved') {
       res.status(400);
       throw new Error('Impact story is already approved.');
   }

  story.status = 'Approved';
  story.approvedBy = adminId;
  story.approvedAt = Date.now();
  story.adminRemarks = adminRemarks || 'Approved';

  const updatedStory = await story.save();

  if (story.school && story.school.schoolEmail) {
    try {
      const emailMessage = `Dear ${story.school.schoolName},

We are pleased to inform you that your impact story titled "${updatedStory.title}" has been approved!

It will now be visible to the public (if applicable based on platform settings).

Admin Remarks: ${updatedStory.adminRemarks || 'N/A'}

Thank you for sharing the positive impact of donations.

Best regards,
EduSahasra Team`;

      await sendEmail({
        email: story.school.schoolEmail,
        subject: 'Your Impact Story has been Approved!',
        message: emailMessage,
      });
    } catch (emailError) {
      console.error(`Failed to send impact story approval email to ${story.school.schoolEmail}:`, emailError);
    }
  } else {
      console.warn(`Could not send approval email for story ${updatedStory._id}: School email not found.`);
  }

  res.json({
    message: 'Impact story approved successfully.',
    impactStory: {
      _id: updatedStory._id,
      title: updatedStory.title,
      status: updatedStory.status,
      approvedAt: updatedStory.approvedAt,
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

    const story = await ImpactStory.findById(storyId).populate('school', 'schoolName schoolEmail');

    if (!story) {
      res.status(404);
      throw new Error('Impact story not found.');
    }

     if (story.status === 'Rejected') {
         res.status(400);
         throw new Error('Impact story is already rejected.')   ;
     }

    story.status = 'Rejected';
    story.approvedBy = adminId;
    story.approvedAt = Date.now();
    story.adminRemarks = adminRemarks.trim();

    const updatedStory = await story.save();

    if (story.school && story.school.schoolEmail) {
        try {
          const emailMessage = `Dear ${story.school.schoolName},

We are writing to inform you that your impact story titled "${updatedStory.title}" has been reviewed and, unfortunately, has not been approved at this time.

Reason for Rejection: ${updatedStory.adminRemarks}

Please review the feedback and consider resubmitting with the necessary changes if you wish.
If you have any questions, please contact our support team.

Best regards,
EduSahasra Team`;

          await sendEmail({
            email: story.school.schoolEmail,
            subject: 'Update on Your Impact Story Submission',
            message: emailMessage,
          });
        } catch (emailError) {
          console.error(`Failed to send impact story rejection email to ${story.school.schoolEmail}:`, emailError);
        }
    } else {
          console.warn(`Could not send rejection email for story ${updatedStory._id}: School email not found.`);
    }

    res.json({
      message: 'Impact story rejected.',
      impactStory: {
        _id: updatedStory._id,
        title: updatedStory.title,
        status: updatedStory.status,
        adminRemarks: updatedStory.adminRemarks,
        approvedBy: updatedStory.approvedBy,
        approvedAt: updatedStory.approvedAt,
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
  uploadImpactStoryImages
};
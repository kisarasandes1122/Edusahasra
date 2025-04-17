const asyncHandler = require('express-async-handler');
const School = require('../models/schoolModel');
const { generateToken } = require('../utils/passwordUtils'); 
const path = require('path');
const fs = require('fs');
const multer = require('multer');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    const uploadDir = path.join(__dirname, '..', 'uploads', 'school-documents'); // More robust path joining

    // Create directory if it doesn't exist
    fs.mkdirSync(uploadDir, { recursive: true }); // Simplified directory creation

    cb(null, uploadDir);
  },
  filename: function(req, file, cb) {
    // Sanitize filename slightly (replace spaces, keep extension)
    const safeOriginalName = file.originalname.replace(/\s+/g, '_');
    cb(null, `${Date.now()}-${path.parse(safeOriginalName).name}${path.extname(safeOriginalName)}`);
  }
});


const fileFilter = (req, file, cb) => {
  // Allowed ext
  const filetypes = /jpeg|jpg|png|pdf/;
  // Check ext
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
  // Check mime
  const mimetype = filetypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only PDF, JPG, JPEG, and PNG are allowed.'), false);
  }
};


const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: fileFilter
}).array('documents', 5); // Define upload strategy here for clarity


// @desc    Register a new school
// @route   POST /api/schools/register
// @access  Public
const registerSchool = asyncHandler(async (req, res) => {
  // Use multer middleware directly in the route handler is cleaner
  upload(req, res, async (err) => {
    if (err instanceof multer.MulterError) {
      // A Multer error occurred when uploading.
      res.status(400);
      throw new Error(`File Upload Error: ${err.message}`);
    } else if (err) {
      // An unknown error occurred when uploading.
      res.status(400);
      throw new Error(err.message); // Use the error message from fileFilter
    }

    // File upload successful or no files uploaded, continue processing req.body
    const {
      schoolName,
      schoolEmail,
      password,
      confirmPassword, // Added check for confirmPassword
      streetAddress,
      city,
      district,
      province,
      postalCode,
      additionalRemarks,
      latitude,
      longitude,
      principalName,
      principalEmail,
      phoneNumber
    } = req.body;

    // Basic validation
    if (!schoolName || !schoolEmail || !password || !confirmPassword || !streetAddress || !city || !district || !province || !postalCode || !principalName || !principalEmail || !phoneNumber ) {
        res.status(400);
        throw new Error('Please fill in all required fields.');
    }

    if (password !== confirmPassword) {
        res.status(400);
        throw new Error('Passwords do not match.');
    }


    // Check if school already exists
    const schoolExists = await School.findOne({ schoolEmail });

    if (schoolExists) {
      // If files were uploaded, attempt to clean them up
      if (req.files && req.files.length > 0) {
          req.files.forEach(file => {
              fs.unlink(file.path, (unlinkErr) => {
                  if (unlinkErr) console.error(`Error deleting uploaded file ${file.path} after failed registration:`, unlinkErr);
              });
          });
      }
      res.status(400);
      throw new Error('School with this email already exists');
    }


    // Process uploaded files if they exist
    const documents = req.files ? req.files.map(file => ({
      fileName: file.originalname,
      fileType: file.mimetype,
      filePath: file.path // Store the relative path as saved by multer
    })) : [];


    // Create school
    const school = new School({ // Use 'new School' to potentially leverage pre-save hooks better if needed later
      schoolName,
      schoolEmail,
      password, // Hashing is handled by the pre-save hook in the model
      streetAddress,
      city,
      district,
      province,
      postalCode,
      additionalRemarks,
      principalName,
      principalEmail,
      phoneNumber,
      documents,
      // Location will be set by the pre-save hook using latitude/longitude if provided
    });

    // Add location data if provided
    if (latitude && longitude) {
        school.location = {
            type: 'Point',
            coordinates: [parseFloat(longitude), parseFloat(latitude)]
        }
        // Assigning directly, model hook will handle indexing etc.
        // Also storing raw lat/lon might be useful for display? Add if needed:
        // school.latitude = parseFloat(latitude);
        // school.longitude = parseFloat(longitude);
    }


    try {
        const createdSchool = await school.save();

        res.status(201).json({
            _id: createdSchool._id,
            schoolName: createdSchool.schoolName,
            schoolEmail: createdSchool.schoolEmail,
            isApproved: createdSchool.isApproved,
            message: 'School registration successful. Your account is pending approval.'
        });
    } catch (error) {
         // If saving fails (e.g., validation error after file upload), clean up files
        if (req.files && req.files.length > 0) {
             req.files.forEach(file => {
                 fs.unlink(file.path, (unlinkErr) => {
                     if (unlinkErr) console.error(`Error deleting uploaded file ${file.path} after failed DB save:`, unlinkErr);
                 });
             });
         }
         res.status(400); // Rethrow typical validation errors as 400
         throw new Error(`Failed to register school: ${error.message}`);
    }
  });
});


// @desc    Login school
// @route   POST /api/schools/login
// @access  Public
const loginSchool = asyncHandler(async (req, res) => {
  const { schoolEmail, password } = req.body;

  if (!schoolEmail || !password) {
    res.status(400);
    throw new Error('Please provide school email and password');
  }

  // Find school and explicitly include password for comparison
  const school = await School.findOne({ schoolEmail }).select('+password');

  if (!school) {
    res.status(401); // Use 401 for authentication failures
    throw new Error('Invalid credentials'); // Generic message
  }

  // Match password using the method defined in the model
  const isMatch = await school.matchPassword(password);

  if (!isMatch) {
    res.status(401);
    throw new Error('Invalid credentials'); // Generic message
  }

  // Check if school is approved AFTER validating credentials
  if (!school.isApproved) {
    res.status(403); // Use 403 Forbidden for access denied due to status
    throw new Error('Your school registration is pending approval or has been rejected.');
  }


  res.json({
    _id: school._id,
    schoolName: school.schoolName,
    schoolEmail: school.schoolEmail,
    isApproved: school.isApproved,
    token: generateToken(school._id) // Usage remains the same
  });
});


// @desc    Get school profile
// @route   GET /api/schools/profile
// @access  Private (School)
const getSchoolProfile = asyncHandler(async (req, res) => {
  // req.school is attached by the protectSchool middleware
  const school = await School.findById(req.school._id)
                         .select('-password -documents._id -documents.filePath'); // Exclude sensitive/internal data

  if (school) {
    res.json({
      _id: school._id,
      schoolName: school.schoolName,
      schoolEmail: school.schoolEmail,
      streetAddress: school.streetAddress,
      city: school.city,
      district: school.district,
      province: school.province,
      postalCode: school.postalCode,
      additionalRemarks: school.additionalRemarks,
      // Provide lat/lon if they exist in the location object
      latitude: school.location?.coordinates?.[1] || null,
      longitude: school.location?.coordinates?.[0] || null,
      principalName: school.principalName,
      principalEmail: school.principalEmail,
      phoneNumber: school.phoneNumber,
      isApproved: school.isApproved,
      approvedAt: school.approvedAt,
      registeredAt: school.registeredAt,
      adminRemarks: school.adminRemarks // Include admin remarks for the school to see
    });
  } else {
    // This case should technically be handled by protectSchool, but good practice
    res.status(404);
    throw new Error('School not found');
  }
});


// @desc    Check school approval status
// @route   GET /api/schools/approval-status
// @access  Public
const checkApprovalStatus = asyncHandler(async (req, res) => {
  const { schoolEmail } = req.query;

  if (!schoolEmail) {
    res.status(400);
    throw new Error('Please provide school email in query parameters');
  }

  const school = await School.findOne({ schoolEmail }).select('schoolName isApproved adminRemarks'); // Select only needed fields

  if (!school) {
    res.status(404);
    throw new Error('School not found with the provided email');
  }

  let message = 'Your school registration is still pending approval.';
  if (school.isApproved) {
    message = 'Your school has been approved. You can now login.';
  } else if (school.adminRemarks) {
    // If not approved and has remarks, it might have been rejected
    message = `Your school registration status: Pending/Rejected. Reason/Remark: ${school.adminRemarks}`;
  }


  res.json({
    schoolName: school.schoolName,
    isApproved: school.isApproved,
    message: message,
    adminRemarks: school.adminRemarks // Optionally include remarks here too
  });
});


module.exports = {
  registerSchool,
  loginSchool,
  getSchoolProfile,
  checkApprovalStatus
};
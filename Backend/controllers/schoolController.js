const asyncHandler = require('express-async-handler');
const School = require('../models/schoolModel');
const { generateToken } = require('../utils/passwordUtils');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../config/config');

// --- Multer Config ---

// For Registration Documents
const registrationStorage = multer.diskStorage({
  destination: function(req, file, cb) {
    const uploadDir = path.join(__dirname, '..', 'uploads', 'school-documents');
    fs.mkdir(uploadDir, { recursive: true }, (err) => {
      if (err) return cb(err);
      cb(null, uploadDir);
    });
  },
  filename: function(req, file, cb) {
    const safeOriginalName = file.originalname.replace(/\s+/g, '_');
    cb(null, `${Date.now()}-${path.parse(safeOriginalName).name}${path.extname(safeOriginalName)}`);
  }
});

const registrationFileFilter = (req, file, cb) => {
  const filetypes = /jpeg|jpg|png|pdf/;
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = filetypes.test(file.mimetype);
  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Invalid file type for registration. Only PDF, JPG, JPEG, PNG allowed.'), false);
  }
};

const uploadRegistrationDocs = multer({
  storage: registrationStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit per file
  fileFilter: registrationFileFilter
}).array('documents', 5); // Expects field named 'documents', max 5 files


// For Profile Images
const profileImageStorage = multer.diskStorage({
  destination: function(req, file, cb) {
    const uploadDir = path.join(__dirname, '..', 'uploads', 'school-profile-images');
    fs.mkdir(uploadDir, { recursive: true }, (err) => {
      if (err) return cb(err);
      cb(null, uploadDir);
    });
  },
  filename: function(req, file, cb) {
    const safeOriginalName = file.originalname.replace(/[^a-zA-Z0-9.]+/g, '_');
    const schoolId = req.school?._id ? req.school._id.toString() : 'undefined_school_id';
    if (!req.school?._id) {
      return cb(new Error("Cannot generate filename without authenticated school ID"));
    }
    const finalFilename = `${schoolId}-${Date.now()}-${safeOriginalName}`;
    cb(null, finalFilename);
  }
});

const profileImageFileFilter = (req, file, cb) => {
  const filetypes = /jpeg|jpg|png|gif|webp/;
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = filetypes.test(file.mimetype);
  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(null, false);
  }
};

const uploadProfileImages = multer({
  storage: profileImageStorage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit per image
  fileFilter: profileImageFileFilter
}).array('profileImages', 10);


// --- Controller Functions ---

// @desc    Register a new school
// @route   POST /api/schools/register
// @access  Public
const registerSchool = asyncHandler(async (req, res) => {
  uploadRegistrationDocs(req, res, async (err) => {
    if (err instanceof multer.MulterError) {
      res.status(400);
      throw new Error(`Registration File Upload Error: ${err.message}`);
    } else if (err) {
      res.status(400);
      throw new Error(err.message);
    }

    const {
      schoolName, schoolEmail, password, confirmPassword,
      streetAddress, city, district, province, postalCode, additionalRemarks,
      latitude, longitude,
      principalName, principalEmail, phoneNumber
    } = req.body;

    // Basic Validation
    const requiredFields = [schoolName, schoolEmail, password, confirmPassword, streetAddress, city, district, province, postalCode, principalName, principalEmail, phoneNumber];
    if (requiredFields.some(field => !field || field.trim() === '')) {
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
      // Clean up uploaded files if registration fails due to existing email
      if (req.files && req.files.length > 0) {
        req.files.forEach(file => {
          fs.unlink(file.path, () => {});
        });
      }
      res.status(400);
      throw new Error('School with this email already exists');
    }

    // Process uploaded documents
    const documents = req.files ? req.files.map(file => ({
      fileName: file.originalname,
      fileType: file.mimetype,
      filePath: file.path
    })) : [];

    // Create school instance
    const school = new School({
      schoolName, schoolEmail, password,
      streetAddress, city, district, province, postalCode, additionalRemarks,
      principalName, principalEmail, phoneNumber,
      documents,
      description: '',
      images: []
    });

    // Add location data if provided and valid
    const lat = parseFloat(latitude);
    const lon = parseFloat(longitude);
    if (!isNaN(lat) && !isNaN(lon) && lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180) {
      school.location = { type: 'Point', coordinates: [lon, lat] };
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
      // Clean up uploaded files if DB save fails
      if (req.files && req.files.length > 0) {
        req.files.forEach(file => {
          fs.unlink(file.path, () => {});
        });
      }
      res.status(400);
      throw new Error(`Failed to register school: ${error.message}`);
    }
  });
});


// @desc    Login school & get token
// @route   POST /api/schools/login
// @access  Public
const loginSchool = asyncHandler(async (req, res) => {
  const { schoolEmail, password } = req.body;

  if (!schoolEmail || !password) {
    res.status(400);
    throw new Error('Please provide school email and password');
  }

  // Fetch school, ensuring password field is included for comparison
  const school = await School.findOne({ schoolEmail }).select('+password');

  if (!school) {
    res.status(401);
    throw new Error('Invalid credentials');
  }

  // Use the instance method to compare passwords
  const isMatch = await school.matchPassword(password);
  if (!isMatch) {
    res.status(401);
    throw new Error('Invalid credentials');
  }

  // Check approval status
  if (!school.isApproved) {
    res.status(403);
    throw new Error('Your school registration is pending approval or has been rejected.');
  }

  res.json({
    _id: school._id,
    schoolName: school.schoolName,
    schoolEmail: school.schoolEmail,
    isApproved: school.isApproved,
    token: generateToken(school._id)
  });
});


// @desc    Get logged-in school profile
// @route   GET /api/schools/profile
// @access  Private (School)
const getSchoolProfile = asyncHandler(async (req, res) => {
  const school = await School.findById(req.school._id)
    .select('-password -documents._id -documents.filePath -__v');

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
      description: school.description,
      images: school.images,
      latitude: school.location?.coordinates?.[1] || null,
      longitude: school.location?.coordinates?.[0] || null,
      principalName: school.principalName,
      principalEmail: school.principalEmail,
      phoneNumber: school.phoneNumber,
      isApproved: school.isApproved,
      approvedAt: school.approvedAt,
      registeredAt: school.registeredAt,
      adminRemarks: school.adminRemarks
    });
  } else {
    res.status(404);
    throw new Error('School profile not found');
  }
});


// @desc    Update logged-in school profile (Handles text data + image uploads)
// @route   PUT /api/schools/profile
// @access  Private (School)
const updateSchoolProfile = asyncHandler(async (req, res) => {
  // ... (keep the initial checks: !req.school, finding school) ...
  const school = await School.findById(req.school._id);
  if (!school) {
    res.status(404);
    throw new Error('School associated with your token could not be found.');
  }

  let needsSave = false; // Flag to track if DB save is necessary

  // --- Update Text Fields ---
  const textFields = [
    'schoolName', 'streetAddress', 'city', 'district', 'province', 'postalCode',
    'description', 'principalName', 'principalEmail', 'phoneNumber'
  ];
  textFields.forEach(field => {
    if (req.body[field] !== undefined && school[field] !== req.body[field]) {
      school[field] = req.body[field];
      needsSave = true;
    }
  });

  // --- Update Location ---
  const lat = parseFloat(req.body.latitude);
  const lon = parseFloat(req.body.longitude);
  let locationUpdated = false;
  if (!isNaN(lat) && !isNaN(lon) && lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180) {
    // Check if location actually changed or was previously null/undefined
    if (!school.location || !school.location.coordinates || school.location.coordinates[0] !== lon || school.location.coordinates[1] !== lat) {
        school.location = { type: 'Point', coordinates: [lon, lat] };
        locationUpdated = true;
        needsSave = true;
    }
  } else if (req.body.latitude !== undefined || req.body.longitude !== undefined) {
    // Handle cases where location might be intentionally cleared
    if (school.location) { // Only mark as update if it previously existed
        school.location = undefined; // Or null, depending on your schema preference/defaults
        locationUpdated = true;
        needsSave = true;
    }
  }


  // --- Process Images to Delete ---
  let imagesWereDeleted = false;
  if (req.body.imagesToDelete) {
    try {
      const imagesToDelete = JSON.parse(req.body.imagesToDelete);
      if (Array.isArray(imagesToDelete) && imagesToDelete.length > 0) {
        const originalImagesCount = school.images.length;
        const imagesToKeep = school.images.filter(imgPath => !imagesToDelete.includes(imgPath));

        if (imagesToKeep.length < originalImagesCount) {
          // Get paths of images actually being removed from the DB record
          const deletedDbPaths = school.images.filter(imgPath => imagesToDelete.includes(imgPath));

          // Delete the corresponding files from storage
          deletedDbPaths.forEach(imgPath => {
            const fullPath = path.join(__dirname, '..', imgPath);
            fs.unlink(fullPath, (err) => {
              if (err && err.code !== 'ENOENT') { // Log error if deletion fails (and file existed)
                console.error(`Error deleting image file ${fullPath}:`, err);
                // Consider if this should stop the request or just be logged
              }
            });
          });

          school.images = imagesToKeep; // Update the images array on the document
          imagesWereDeleted = true;
          needsSave = true;
        }
      }
    } catch (parseError) {
      console.error('Error parsing imagesToDelete JSON:', parseError);
      res.status(400).json({ message: 'Invalid format for imagesToDelete field.' });
      return; // Stop processing on bad input
    }
  }

  // --- Handle Newly Uploaded Images ---
  let newImagePaths = [];
  if (req.files && Array.isArray(req.files) && req.files.length > 0) {
    newImagePaths = req.files.map(file => `/uploads/school-profile-images/${file.filename}`);
    school.images = school.images.concat(newImagePaths); // Add new images
    needsSave = true; // Always needs save if new files are uploaded
  }

  // --- Define function to prepare response data ---
  const prepareResponseData = (doc) => {
    // Use toObject to get a plain JS object, removing Mongoose methods/virtuals unless configured otherwise
    const data = doc.toObject ? doc.toObject() : { ...doc };

    // Explicitly add latitude/longitude
    data.latitude = doc.location?.coordinates?.[1] || null;
    data.longitude = doc.location?.coordinates?.[0] || null;

    // Clean up fields not needed in the response
    delete data.location; // Remove original nested GeoJSON object
    delete data.password; // Ensure password hash is never sent
    delete data.__v;      // Remove Mongoose version key
    // delete data.documents; // Decide if registration documents should be returned here
    // delete data.adminRemarks; // Only include if intended
    // delete data.approvedAt; // Only include if intended
    // delete data.registeredAt; // Only include if intended

    return data;
  };

  // --- Save if needed, then send response ---
  if (needsSave) {
    try {
      const updatedSchool = await school.save();
      res.json(prepareResponseData(updatedSchool));
    } catch (error) {
      // Clean up newly uploaded files if the database save fails
      if (newImagePaths.length > 0 && req.files) {
        req.files.forEach(file => {
          fs.unlink(file.path, (unlinkErr) => {
            if (unlinkErr) console.error(`Error cleaning up uploaded file ${file.path} on save failure:`, unlinkErr);
          });
        });
      }
      res.status(400);
      // Give a more specific error if possible (e.g., validation error)
      throw new Error(`Failed to update profile: ${error.message}`);
    }
  } else {
    // If no save was needed, just return the current data
    res.json(prepareResponseData(school));
  }
});


// @desc    Check school approval status by email
// @route   GET /api/schools/approval-status
// @access  Public
const checkApprovalStatus = asyncHandler(async (req, res) => {
  const { schoolEmail } = req.query;
  if (!schoolEmail) {
    res.status(400);
    throw new Error('Please provide school email in query parameters');
  }

  const school = await School.findOne({ schoolEmail }).select('schoolName isApproved adminRemarks');
  if (!school) {
    res.status(404);
    throw new Error('School not found with the provided email');
  }

  let message = 'Your school registration is still pending approval.';
  if (school.isApproved) {
    message = 'Your school has been approved. You can now login.';
  } else if (school.adminRemarks && !school.isApproved) {
    message = `Your school registration status: Pending/Rejected. Remark: ${school.adminRemarks}`;
  }

  res.json({
    schoolName: school.schoolName,
    isApproved: school.isApproved,
    message: message,
    adminRemarks: school.adminRemarks
  });
});


module.exports = {
  registerSchool,
  loginSchool,
  getSchoolProfile,
  updateSchoolProfile,
  checkApprovalStatus,
  uploadProfileImages
};
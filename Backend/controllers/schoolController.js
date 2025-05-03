require('dotenv').config();
const asyncHandler = require('express-async-handler');
const School = require('../models/schoolModel');
const { generateToken } = require('../utils/passwordUtils');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const jwt = require('jsonwebtoken');
const { JWT_SECRET, EMAIL_USER, EMAIL_PASS, NODE_ENV } = require('../config/config');
const validator = require('validator'); // Import validator
const nodemailer = require('nodemailer');
const crypto = require('crypto');

// --- Email Transporter Setup ---
let transporter;

try {
    transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: EMAIL_USER,
            pass: EMAIL_PASS,
        },
    });

    if (NODE_ENV !== 'production') {
         transporter.verify(function (error, success) {
           if (error) {
             console.error("Transporter verification failed:", error);
           } else {
             console.log("Server is ready to take our messages (Transporter verified)");
           }
         });
     }
} catch (error) {
    console.error("Failed to create email transporter:", error);
}

// --- Helper function to send email ---
const sendEmail = async (options) => {
    if (!transporter) {
        console.error("Email transporter is not configured or failed to initialize.");
        throw new Error("Email service not available. Check backend logs.");
    }

    const senderEmail = EMAIL_USER;

    if (!senderEmail) {
         console.error("Sender email address is not defined in configuration (EMAIL_USER).");
        throw new Error("Email service not properly configured.");
    }

    const mailOptions = {
        from: `"EduSahasra" <${senderEmail}>`,
        to: options.email,
        subject: options.subject,
        text: options.message,
    };

    try {
        const info = await transporter.sendMail(mailOptions);
        console.log('Message sent: %s', info.messageId);
        console.log(`Email sent successfully to ${options.email}`);
    } catch (error) {
        console.error('Error sending email:', error);
        throw new Error(`Failed to send email.`);
    }
};

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
    // Use school ID or something unique for uniqueness if needed, but timestamp is usually enough
    // Using the school ID from the request can be tricky BEFORE auth middleware runs.
    // A better approach is to use a combination of timestamp and original name.
    // Or, if this multer is only used AFTER auth, then use req.school._id.
    // Assuming this is used POST-auth for profile updates:
    const schoolId = req.school?._id ? req.school._id.toString() : `unknown_${Date.now()}`; // Fallback if not authenticated (shouldn't happen with protectSchool)
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
    cb(null, false); // Silently fail if file type is wrong, or return error for strict validation
  }
};

const uploadProfileImages = multer({
  storage: profileImageStorage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit per image
  fileFilter: profileImageFileFilter
}).array('profileImages', 10); // Expects field named 'profileImages', max 10 files


// --- Controller Functions ---

// @desc    Register a new school
// @route   POST /api/schools/register
// @access  Public
const registerSchool = asyncHandler(async (req, res) => {
  uploadRegistrationDocs(req, res, async (err) => {
    // Clean up files immediately on Multer error
    if (err instanceof multer.MulterError || err) {
       if (req.files && req.files.length > 0) {
         req.files.forEach(file => {
           fs.unlink(file.path, unlinkErr => unlinkErr && console.error("Error cleaning up multer error file:", unlinkErr));
         });
       }
       const errorMsg = err instanceof multer.MulterError ? `File Upload Error: ${err.message}` : err.message;
       res.status(400);
       throw new Error(errorMsg);
     }


    const {
      schoolName, schoolEmail, password, confirmPassword,
      streetAddress, city, district, province, postalCode, additionalRemarks,
      latitude, longitude,
      principalName, principalEmail, phoneNumber
    } = req.body;

    // Basic Validation
    const requiredFields = {
        schoolName: schoolName, schoolEmail: schoolEmail, password: password, confirmPassword: confirmPassword,
        streetAddress: streetAddress, city: city, district: district, province: province, postalCode: postalCode,
        principalName: principalName, principalEmail: principalEmail, phoneNumber: phoneNumber
    };

    for (const [fieldName, fieldValue] of Object.entries(requiredFields)) {
        if (!fieldValue || (typeof fieldValue === 'string' && fieldValue.trim() === '')) {
            // Clean up uploaded files if validation fails
             if (req.files && req.files.length > 0) { req.files.forEach(file => fs.unlink(file.path, unlinkErr => unlinkErr && console.error("Error cleaning up validation error file:", unlinkErr))); }
            res.status(400);
            throw new Error(`${fieldName} is required.`);
        }
    }

    if (password !== confirmPassword) {
       if (req.files && req.files.length > 0) { req.files.forEach(file => fs.unlink(file.path, unlinkErr => unlinkErr && console.error("Error cleaning up password mismatch file:", unlinkErr))); }
      res.status(400);
      throw new Error('Passwords do not match.');
    }
     // Add password strength validation
     if (password.length < 8 || !/[A-Z]/.test(password) || !/[0-9]/.test(password) || !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
         if (req.files && req.files.length > 0) { req.files.forEach(file => fs.unlink(file.path, unlinkErr => unlinkErr && console.error("Error cleaning up weak password file:", unlinkErr))); }
         res.status(400);
         throw new Error('Password must be at least 8 characters long and include uppercase, number, and special character.');
     }


     // Email validation
     if (!validator.isEmail(schoolEmail)) {
          if (req.files && req.files.length > 0) { req.files.forEach(file => fs.unlink(file.path, unlinkErr => unlinkErr && console.error("Error cleaning up invalid email file:", unlinkErr))); }
         res.status(400);
         throw new Error('Please provide a valid school email address.');
     }
      if (!validator.isEmail(principalEmail)) {
           if (req.files && req.files.length > 0) { req.files.forEach(file => fs.unlink(file.path, unlinkErr => unlinkErr && console.error("Error cleaning up invalid principal email file:", unlinkErr))); }
          res.status(400);
          throw new Error('Please provide a valid principal email address.');
      }

    // Phone number validation
     if (!/^(?:\+94|0)[0-9]{9}$/.test(phoneNumber)) {
         if (req.files && req.files.length > 0) { req.files.forEach(file => fs.unlink(file.path, unlinkErr => unlinkErr && console.error("Error cleaning up invalid phone file:", unlinkErr))); }
         res.status(400);
         throw new Error('Invalid phone number format. Use +94xxxxxxxxx or 0xxxxxxxxx.');
     }


    // Check if school already exists
    const schoolExists = await School.findOne({ schoolEmail });
    if (schoolExists) {
      // Clean up uploaded files if registration fails due to existing email
      if (req.files && req.files.length > 0) {
        req.files.forEach(file => {
          fs.unlink(file.path, unlinkErr => unlinkErr && console.error("Error cleaning up existing email file:", unlinkErr));
        });
      }
      res.status(400);
      throw new Error('School with this email already exists');
    }

    // Process uploaded documents
    // Only include documents if files were actually uploaded by multer
    const documents = (req.files && Array.isArray(req.files) && req.files.length > 0) ? req.files.map(file => ({
      fileName: file.originalname,
      fileType: file.mimetype,
      filePath: file.path // Store the full path temporarily or relative path if preferred
    })) : [];

    // Create school instance
    const school = new School({
      schoolName, schoolEmail, password,
      streetAddress, city, district, province, postalCode, additionalRemarks,
      principalName, principalEmail, phoneNumber,
      documents,
      description: '', // Initialize default empty values for new fields
      images: [] // Initialize empty array for images
    });

    // Add location data if provided and valid
    const lat = parseFloat(latitude);
    const lon = parseFloat(longitude);
    if (!isNaN(lat) && !isNaN(lon) && lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180) {
      school.location = { type: 'Point', coordinates: [lon, lat] };
    }
     // No need to throw error for invalid lat/lon on registration, just don't save location


    try {
      const createdSchool = await school.save();
      
      // Send confirmation email
      try {
        const message = `Dear ${createdSchool.schoolName},\n\n
Thank you for registering with EduSahasra. Your school registration has been received successfully.\n\n
Your registration is currently pending verification. Our team will review your application within 24-72 hours. You will receive another email once your registration has been approved.\n\n
If you have any questions, please don't hesitate to contact us.\n\n
Best regards,\nEduSahasra Team`;

        await sendEmail({
          email: createdSchool.schoolEmail,
          subject: 'EduSahasra School Registration Confirmation',
          message: message,
        });
      } catch (emailError) {
        console.error('Failed to send confirmation email:', emailError);
        // Don't throw error here, as registration was successful
      }

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
          fs.unlink(file.path, unlinkErr => unlinkErr && console.error("Error cleaning up DB save failure file:", unlinkErr));
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

   if (!validator.isEmail(schoolEmail)) {
       res.status(400);
       throw new Error('Please provide a valid school email address.');
   }


  // Fetch school, ensuring password field is included for comparison
  const school = await School.findOne({ schoolEmail }).select('+password');

  if (!school) {
    res.status(401); // Use 401 for authentication failures
    throw new Error('Invalid credentials');
  }

  // Use the instance method to compare passwords
  const isMatch = await school.matchPassword(password);
  if (!isMatch) {
    res.status(401); // Use 401 for authentication failures
    throw new Error('Invalid credentials');
  }

  // Check approval status
  if (!school.isApproved) {
    res.status(403); // Use 403 Forbidden for authorization failures
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
  // req.school is populated by protectSchool middleware
  // Exclude sensitive/unnecessary fields like password, internal document paths, version key
  const school = await School.findById(req.school._id)
    .select('-password -documents._id -documents.filePath -__v');

  if (!school) {
    // This case should ideally not be reached if protectSchool works correctly,
    // but check for safety.
    res.status(404);
    throw new Error('School profile not found.');
  }

   // Convert to plain object and add latitude/longitude from location object
   const profileData = school.toObject();
   profileData.latitude = school.location?.coordinates?.[1] ?? null;
   profileData.longitude = school.location?.coordinates?.[0] ?? null;
   delete profileData.location; // Remove the internal GeoJSON object

  res.json(profileData);
});


// @desc    Update logged-in school profile (Handles text data + image uploads)
// @route   PUT /api/schools/profile
// @access  Private (School)
const updateSchoolProfile = asyncHandler(async (req, res) => {
  // Multer middleware (uploadProfileImages) runs before this controller function
  // It handles parsing multipart/form-data and populating req.body and req.files.

  const school = await School.findById(req.school._id);
  if (!school) {
    // This should not happen if protectSchool ran, but good practice
    res.status(404);
    // Clean up files if school somehow not found post-auth
    if (req.files && req.files.length > 0) { req.files.forEach(file => fs.unlink(file.path, unlinkErr => unlinkErr && console.error("Error cleaning up file for non-existent school:", unlinkErr))); }
    throw new Error('School associated with your token could not be found.');
  }

  // Helper function to safely check properties
  const hasProperty = (obj, prop) => {
    return obj && typeof obj === 'object' && Object.prototype.hasOwnProperty.call(obj, prop);
  };

  let needsSave = false; // Flag to track if DB save is necessary

  // --- Update Text Fields ---
  const textFields = [
    'schoolName', 'streetAddress', 'city', 'district', 'province', 'postalCode',
    'description', 'principalName', 'principalEmail', 'phoneNumber'
  ];
  textFields.forEach(field => {
    // Use the safe property check method instead of direct hasOwnProperty
    if (hasProperty(req.body, field) && school[field] !== req.body[field]) {
        // Basic sanitization/trimming
        school[field] = typeof req.body[field] === 'string' ? req.body[field].trim() : req.body[field];
        needsSave = true;
    }
  });

  // Add validation for updated fields if necessary (e.g., email format/uniqueness)
  if (hasProperty(req.body, 'schoolEmail') && req.body.schoolEmail.trim() !== school.schoolEmail) {
    const newEmail = req.body.schoolEmail.trim();
    if (!validator.isEmail(newEmail)) {
      if (req.files && req.files.length > 0) { req.files.forEach(file => fs.unlink(file.path, unlinkErr => unlinkErr && console.error("Error cleaning up file invalid email update:", unlinkErr))); }
      res.status(400);
      throw new Error('Please provide a valid school email address.');
    }
    const emailExists = await School.findOne({ schoolEmail: newEmail, _id: { $ne: school._id } });
    if (emailExists) {
      if (req.files && req.files.length > 0) { req.files.forEach(file => fs.unlink(file.path, unlinkErr => unlinkErr && console.error("Error cleaning up file existing email update:", unlinkErr))); }
      res.status(400);
      throw new Error('Email address is already in use by another school.');
    }
    school.schoolEmail = newEmail;
    needsSave = true;
  }

  if (hasProperty(req.body, 'principalEmail') && req.body.principalEmail.trim() !== school.principalEmail) {
    const newPrincipalEmail = req.body.principalEmail.trim();
    if (!validator.isEmail(newPrincipalEmail)) {
      if (req.files && req.files.length > 0) { req.files.forEach(file => fs.unlink(file.path, unlinkErr => unlinkErr && console.error("Error cleaning up file invalid principal email update:", unlinkErr))); }
      res.status(400);
      throw new Error('Please provide a valid principal email address.');
    }
    school.principalEmail = newPrincipalEmail;
    needsSave = true;
  }

  if (hasProperty(req.body, 'phoneNumber') && req.body.phoneNumber.trim() !== school.phoneNumber) {
    const newPhoneNumber = req.body.phoneNumber.trim();
    if (newPhoneNumber !== '' && !/^(?:\+94|0)[0-9]{9}$/.test(newPhoneNumber)) {
      if (req.files && req.files.length > 0) { req.files.forEach(file => fs.unlink(file.path, unlinkErr => unlinkErr && console.error("Error cleaning up file invalid phone update:", unlinkErr))); }
      res.status(400);
      throw new Error('Invalid phone number format. Use +94xxxxxxxxx or 0xxxxxxxxx.');
    }
    school.phoneNumber = newPhoneNumber;
    needsSave = true;
  }

  // --- Update Location ---
  // Handle explicit null/empty string for clearing location
  const latitudeInput = hasProperty(req.body, 'latitude') ? req.body.latitude : undefined;
  const longitudeInput = hasProperty(req.body, 'longitude') ? req.body.longitude : undefined;

  let locationUpdated = false;

  if (latitudeInput !== undefined && longitudeInput !== undefined) {
    const lat = parseFloat(latitudeInput);
    const lon = parseFloat(longitudeInput);

    if (!isNaN(lat) && !isNaN(lon) && lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180) {
      // Valid coordinates provided
      if (!school.location || !school.location.coordinates || school.location.coordinates[0] !== lon || school.location.coordinates[1] !== lat) {
        school.location = { type: 'Point', coordinates: [lon, lat] };
        locationUpdated = true;
        needsSave = true;
      }
    } else if (latitudeInput === '' && longitudeInput === '') {
      // Explicitly requesting to clear location
      if (school.location) { // Only needs save if location previously existed
        school.location = undefined; // Or null, depending on schema
        locationUpdated = true;
        needsSave = true;
      }
    } else {
      // Invalid coordinates provided (e.g., non-empty non-numeric)
      if (req.files && req.files.length > 0) { req.files.forEach(file => fs.unlink(file.path, unlinkErr => unlinkErr && console.error("Error cleaning up file invalid coords update:", unlinkErr))); }
      res.status(400);
      throw new Error('Invalid latitude or longitude provided for location.');
    }
  }

  // --- Process Images to Delete ---
  let imagesWereDeleted = false; // Keep track for potential file cleanup on error
  if (hasProperty(req.body, 'imagesToDelete')) {
    try {
      const imagesToDelete = JSON.parse(req.body.imagesToDelete);
      if (Array.isArray(imagesToDelete) && imagesToDelete.length > 0) {
        // Filter images to keep based on the list of images to delete
        const originalImages = [...school.images]; // Clone before modifying
        const imagesToKeep = school.images.filter(imgPath => !imagesToDelete.includes(imgPath));

        if (imagesToKeep.length < originalImages.length) {
          // Identify which physical files need deletion
          const pathsToDelete = originalImages.filter(imgPath => imagesToDelete.includes(imgPath));

          // Update the images array on the document
          school.images = imagesToKeep;
          imagesWereDeleted = true;
          needsSave = true;

          // Delete the corresponding files from storage ASYNCHRONOUSLY
          pathsToDelete.forEach(imgPath => {
            try {
              // Improved path construction with better error handling
              let fullPath;
              if (imgPath.startsWith('/uploads/')) {
                fullPath = path.join(__dirname, '..', imgPath.slice(1)); // Remove leading slash
              } else if (imgPath.startsWith('uploads/')) {
                fullPath = path.join(__dirname, '..', imgPath);
              } else {
                fullPath = path.join(__dirname, '..', 'uploads', imgPath);
              }
              
              console.log(`Attempting to delete file: ${fullPath}`);
              
              fs.unlink(fullPath, (err) => {
                if (err && err.code !== 'ENOENT') { // Log error if deletion fails (and file existed)
                  console.error(`Error deleting image file ${fullPath}:`, err);
                  // Consider if this error should fail the whole request. For now, just log.
                } else if (!err) {
                  console.log(`Successfully deleted file: ${fullPath}`);
                } else {
                  console.warn(`Attempted to delete file ${fullPath} but it was not found (ENOENT).`);
                }
              });
            } catch (fileError) {
              console.error(`Error during file path processing for ${imgPath}:`, fileError);
              // Don't throw here to prevent the entire request from failing
            }
          });
        }
      }
    } catch (parseError) {
      console.error('Error parsing imagesToDelete JSON:', parseError);
      // Clean up newly uploaded files if parsing fails
      if (req.files && req.files.length > 0) { req.files.forEach(file => fs.unlink(file.path, unlinkErr => unlinkErr && console.error("Error cleaning up file JSON parse error:", unlinkErr))); }
      res.status(400);
      throw new Error('Invalid format for imagesToDelete field.');
      // Note: Files marked for deletion *from the DB* will not be deleted from storage
      // if the request fails here. This is an acceptable trade-off for simplicity.
    }
  }

  // --- Handle Newly Uploaded Images ---
  let newImagePaths = [];
  if (req.files && Array.isArray(req.files) && req.files.length > 0) {
    // Multer stores the file path on the file object.
    // We want to save the path relative to the 'uploads' directory.
    newImagePaths = req.files.map(file => {
      // file.path is something like 'C:\...\backend\uploads\school-profile-images\filename.jpg'
      // path.join(__dirname, '..', 'uploads') is 'C:\...\backend\uploads'
      // path.relative calculates the relative path: 'school-profile-images\filename.jpg'
      // Replace backslashes with forward slashes for URL consistency
      const relativePath = path.relative(path.join(__dirname, '..', 'uploads'), file.path).replace(/\\/g, '/');
      return relativePath;
    });
    school.images = school.images.concat(newImagePaths); // Add new images
    needsSave = true; // Always needs save if new files are uploaded
  }

  // --- Define function to prepare response data ---
  // This function takes a Mongoose document and returns a clean object for the response.
  const prepareResponseData = (doc) => {
    const data = doc.toObject ? doc.toObject() : { ...doc }; // Convert to plain object

    // Explicitly add latitude/longitude from the GeoJSON object
    data.latitude = doc.location?.coordinates?.[1] ?? null;
    data.longitude = doc.location?.coordinates?.[0] ?? null;

    // Clean up fields not needed in the response
    delete data.location; // Remove original nested GeoJSON object
    delete data.password; // Ensure password hash is never sent
    delete data.__v;      // Remove Mongoose version key
    delete data.documents; // Typically registration documents aren't returned in profile update response

    // Format image paths in the response to be relative to /uploads
    // The frontend's getFullImageUrl will prepend the base URL and /uploads
    data.images = data.images.map(imgPath => {
      // Ensure the path is relative to 'uploads' and uses forward slashes
      // It should already be in this format if saved correctly by multer config above
      const relativePath = imgPath.replace(/\\/g, '/'); // Convert backslashes if any slipped through
      // Strip any leading /uploads/ if it was accidentally included
      return relativePath.startsWith('uploads/') ? relativePath.substring('uploads/'.length) : relativePath;
    });

    return data;
  };

  // --- Save if needed, then send response ---
  if (needsSave) {
    try {
      const updatedSchool = await school.save();
      res.json(prepareResponseData(updatedSchool));
    } catch (error) {
      // Clean up newly uploaded files if the database save fails
      if (req.files && req.files.length > 0) {
        req.files.forEach(file => {
          fs.unlink(file.path, (unlinkErr) => {
            if (unlinkErr) console.error(`Error cleaning up uploaded file ${file.path} on save failure:`, unlinkErr);
          });
        });
      }
      res.status(400);
      // Give a more specific error if possible (e.g., Mongoose validation error)
      throw new Error(`Failed to update profile: ${error.message}`);
    }
  } else {
    // If no save was needed (no changes detected or only failed image deletions),
    // return the current state of the school profile.
    // Re-fetch to ensure data consistency, but exclude password and private fields.
    const currentSchoolData = await School.findById(req.school._id)
      .select('-password -documents._id -documents.filePath -__v')
      .lean(); // Use lean as we are just returning data, no modifications needed.

    if (!currentSchoolData) {
      // Should not happen, but handle defensively
      res.status(500);
      throw new Error('Failed to retrieve current profile data after update attempt.');
    }

    // Prepare the response data manually from the lean object
    const responseData = {
      ...currentSchoolData,
      latitude: currentSchoolData.location?.coordinates?.[1] ?? null,
      longitude: currentSchoolData.location?.coordinates?.[0] ?? null,
    };
    delete responseData.location; // Remove the original location object

    // Re-format image paths manually for the lean object response
    responseData.images = (responseData.images || []).map(imgPath => {
      const relativePath = imgPath.replace(/\\/g, '/');
      return relativePath.startsWith('uploads/') ? relativePath.substring('uploads/'.length) : relativePath;
    });

    res.json(responseData);
  }
});


// @desc    Update logged-in school's password
// @route   PUT /api/schools/profile/password
// @access  Private (School)
const updateSchoolPassword = asyncHandler(async (req, res) => {
    const { currentPassword, newPassword, confirmPassword } = req.body; // Ensure confirmPassword matches the frontend body key
    const schoolId = req.school._id; // Get school ID from authenticated user

    // --- Validation ---
    if (!currentPassword || !newPassword || !confirmPassword) {
        res.status(400);
        throw new Error('Please provide current password, new password, and confirm password.');
    }

    if (newPassword !== confirmPassword) {
        res.status(400);
        throw new Error('New password and confirm password do not match.');
    }

     // Add password strength validation for the new password
     if (newPassword.length < 8 || !/[A-Z]/.test(newPassword) || !/[0-9]/.test(newPassword) || !/[!@#$%^&*(),.?":{}|<>]/.test(newPassword)) {
        res.status(400);
        throw new Error('New password must be at least 8 characters long and include uppercase, number, and special character.');
    }


    // --- Verify Current Password & Update ---
    // Fetch the school again, explicitly including the password field for comparison
    const school = await School.findById(schoolId).select('+password');

    if (!school) {
        // This case should ideally not be reached if protectSchool works correctly,
        // but check for safety.
        res.status(404);
        throw new Error('School user not found.');
    }

    // Use the matchPassword instance method to compare the provided current password
    const isMatch = await school.matchPassword(currentPassword);

    if (!isMatch) {
        res.status(401); // Unauthorized
        throw new Error('Incorrect current password.');
    }

    // If current password matches, update the password field
    school.password = newPassword; // Mongoose pre-save hook will hash this automatically

    await school.save(); // Save the updated school document

    // --- Success Response ---
    res.status(200).json({ message: 'Password has been successfully changed.' });
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
   if (!validator.isEmail(schoolEmail)) {
       res.status(400);
       throw new Error('Please provide a valid school email address.');
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

// @desc    Forgot password - Send reset email
// @route   POST /api/schools/forgot-password
// @access  Public
const forgotPassword = asyncHandler(async (req, res) => {
  const { schoolEmail } = req.body;

  if (!schoolEmail) {
    res.status(400);
    throw new Error('Please provide your school email address');
  }

  if (!validator.isEmail(schoolEmail)) {
    res.status(400);
    throw new Error('Please provide a valid school email address');
  }

  const school = await School.findOne({ schoolEmail });

  if (!school) {
    res.status(404);
    throw new Error('No school account found with this email address');
  }

  // Generate reset token
  const resetToken = crypto.randomBytes(32).toString('hex');
  school.resetPasswordToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');
  school.resetPasswordExpire = Date.now() + 30 * 60 * 1000; // 30 minutes

  await school.save();

  // Create reset url
  const resetUrl = `http://localhost:5173/school-reset-password/${resetToken}`;

  // Email content
  const message = `Password Reset Request

You requested a password reset for your school account.

Please click the link below to reset your password:
${resetUrl}

If you did not request this, please ignore this email.`;

  try {
    await sendEmail({
      email: school.schoolEmail,
      subject: 'Password Reset Request',
      message,
    });

    res.json({ message: 'Password reset email sent' });
  } catch (error) {
    school.resetPasswordToken = undefined;
    school.resetPasswordExpire = undefined;
    await school.save();

    res.status(500);
    throw new Error('Email could not be sent');
  }
});

// @desc    Reset password
// @route   POST /api/schools/reset-password
// @access  Public
const resetPassword = asyncHandler(async (req, res) => {
  const { token, password, confirmPassword } = req.body;

  if (!token || !password || !confirmPassword) {
    res.status(400);
    throw new Error('Please provide all required fields');
  }

  if (password !== confirmPassword) {
    res.status(400);
    throw new Error('Passwords do not match');
  }

  // Add password strength validation
  if (password.length < 8 || !/[A-Z]/.test(password) || !/[0-9]/.test(password) || !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    res.status(400);
    throw new Error('Password must be at least 8 characters long and include uppercase, number, and special character');
  }

  // Get hashed token
  const resetPasswordToken = crypto
    .createHash('sha256')
    .update(token)
    .digest('hex');

  const school = await School.findOne({
    resetPasswordToken,
    resetPasswordExpire: { $gt: Date.now() },
  });

  if (!school) {
    res.status(400);
    throw new Error('Invalid or expired reset token');
  }

  // Set new password
  school.password = password;
  school.resetPasswordToken = undefined;
  school.resetPasswordExpire = undefined;
  await school.save();

  res.json({ message: 'Password reset successful' });
});

module.exports = {
  registerSchool,
  loginSchool,
  getSchoolProfile,
  updateSchoolProfile,
  checkApprovalStatus,
  uploadProfileImages, // Export Multer middleware
  updateSchoolPassword, // Export the new password update function
  sendEmail, // Export the sendEmail function
  forgotPassword,
  resetPassword
};
const asyncHandler = require('express-async-handler');
const School = require('../models/schoolModel');
const { generateToken } = require('../utils/passwordUtils');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../config/config');
const validator = require('validator'); // Import validator

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
      res.status(400); // Could be 500 for database errors, but 400 fits validation/data issues
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

  let needsSave = false; // Flag to track if DB save is necessary

  // --- Update Text Fields ---
  const textFields = [
    'schoolName', 'streetAddress', 'city', 'district', 'province', 'postalCode',
    'description', 'principalName', 'principalEmail', 'phoneNumber'
  ];
  textFields.forEach(field => {
    // Check if the field is provided in the body and is different from current value
    // Also handle cases where the field might be intentionally set to an empty string
    if (req.body.hasOwnProperty(field) && school[field] !== req.body[field]) {
        // Basic sanitization/trimming
        school[field] = typeof req.body[field] === 'string' ? req.body[field].trim() : req.body[field];
        needsSave = true;
    }
  });

  // Add validation for updated fields if necessary (e.g., email format/uniqueness)
   if (req.body.hasOwnProperty('schoolEmail') && req.body.schoolEmail.trim() !== school.schoolEmail) {
       const newEmail = req.body.schoolEmail.trim();
       if (!validator.isEmail(newEmail)) {
            if (req.files && req.files.length > 0) { req.files.forEach(file => fs.unlink(file.path, unlinkErr => unlinkErr && console.error("Error cleaning up file invalid email update:", unlinkErr))); }
            res.status(400);
            throw new Error('Please provide a valid school email address.');
       }
       const emailExists = await School.findOne({ schoolEmail: newEmail, _id: { $ne: school._id } });
       if(emailExists) {
            if (req.files && req.files.length > 0) { req.files.forEach(file => fs.unlink(file.path, unlinkErr => unlinkErr && console.error("Error cleaning up file existing email update:", unlinkErr))); }
            res.status(400);
            throw new Error('Email address is already in use by another school.');
       }
       school.schoolEmail = newEmail;
       needsSave = true;
   }

    if (req.body.hasOwnProperty('principalEmail') && req.body.principalEmail.trim() !== school.principalEmail) {
        const newPrincipalEmail = req.body.principalEmail.trim();
        if (!validator.isEmail(newPrincipalEmail)) {
             if (req.files && req.files.length > 0) { req.files.forEach(file => fs.unlink(file.path, unlinkErr => unlinkErr && console.error("Error cleaning up file invalid principal email update:", unlinkErr))); }
             res.status(400);
             throw new Error('Please provide a valid principal email address.');
        }
        school.principalEmail = newPrincipalEmail;
        needsSave = true;
    }

    if (req.body.hasOwnProperty('phoneNumber') && req.body.phoneNumber.trim() !== school.phoneNumber) {
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
  const latitudeInput = req.body.hasOwnProperty('latitude') ? req.body.latitude : undefined;
  const longitudeInput = req.body.hasOwnProperty('longitude') ? req.body.longitude : undefined;

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
  if (req.body.imagesToDelete) {
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
              // Construct the full path. Ensure imgPath starts with the correct uploads subdirectory
               const fullPath = path.join(__dirname, '..', 'uploads', imgPath.replace('/uploads/', '')); // Assuming imgPath comes in like '/uploads/school-profile-images/...'
               console.log(`Attempting to delete file: ${fullPath}`); // Debug log
            fs.unlink(fullPath, (err) => {
              if (err && err.code !== 'ENOENT') { // Log error if deletion fails (and file existed)
                console.error(`Error deleting image file ${fullPath}:`, err);
                // Consider if this error should fail the whole request. For now, just log.
              } else if (!err) {
                  console.log(`Successfully deleted file: ${fullPath}`); // Debug log
              } else {
                  console.warn(`Attempted to delete file ${fullPath} but it was not found (ENOENT).`); // Debug log
              }
            });
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
    // Decide if admin remarks, approval status etc should be returned here.
    // Based on previous getSchoolProfile, they were included, so keep them.
    // delete data.adminRemarks;
    // delete data.approvedAt;
    // delete data.registeredAt;


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


module.exports = {
  registerSchool,
  loginSchool,
  getSchoolProfile,
  updateSchoolProfile,
  checkApprovalStatus,
  uploadProfileImages, // Export Multer middleware
  updateSchoolPassword // Export the new password update function
};
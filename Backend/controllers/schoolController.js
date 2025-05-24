require('dotenv').config();
const asyncHandler = require('express-async-handler');
const School = require('../models/schoolModel');
const { generateToken } = require('../utils/passwordUtils');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const jwt = require('jsonwebtoken');
const { JWT_SECRET, EMAIL_USER, EMAIL_PASS, NODE_ENV } = require('../config/config');
const validator = require('validator');
const nodemailer = require('nodemailer');
const crypto = require('crypto');

let transporter;

try {
    transporter = nodemailer.createTransporter({
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
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: registrationFileFilter
}).array('documents', 5);

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
    const schoolId = req.school?._id ? req.school._id.toString() : `unknown_${Date.now()}`;
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
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: profileImageFileFilter
}).array('profileImages', 10);

// @desc    Register a new school
// @route   POST /api/schools/register
// @access  Public
const registerSchool = asyncHandler(async (req, res) => {
  uploadRegistrationDocs(req, res, async (err) => {
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

    const requiredFields = {
        schoolName: schoolName, schoolEmail: schoolEmail, password: password, confirmPassword: confirmPassword,
        streetAddress: streetAddress, city: city, district: district, province: province, postalCode: postalCode,
        principalName: principalName, principalEmail: principalEmail, phoneNumber: phoneNumber
    };

    for (const [fieldName, fieldValue] of Object.entries(requiredFields)) {
        if (!fieldValue || (typeof fieldValue === 'string' && fieldValue.trim() === '')) {
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

     if (password.length < 8 || !/[A-Z]/.test(password) || !/[0-9]/.test(password) || !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
         if (req.files && req.files.length > 0) { req.files.forEach(file => fs.unlink(file.path, unlinkErr => unlinkErr && console.error("Error cleaning up weak password file:", unlinkErr))); }
         res.status(400);
         throw new Error('Password must be at least 8 characters long and include uppercase, number, and special character.');
     }

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

     if (!/^(?:\+94|0)[0-9]{9}$/.test(phoneNumber)) {
         if (req.files && req.files.length > 0) { req.files.forEach(file => fs.unlink(file.path, unlinkErr => unlinkErr && console.error("Error cleaning up invalid phone file:", unlinkErr))); }
         res.status(400);
         throw new Error('Invalid phone number format. Use +94xxxxxxxxx or 0xxxxxxxxx.');
     }

    const schoolExists = await School.findOne({ schoolEmail });
    if (schoolExists) {
      if (req.files && req.files.length > 0) {
        req.files.forEach(file => {
          fs.unlink(file.path, unlinkErr => unlinkErr && console.error("Error cleaning up existing email file:", unlinkErr));
        });
      }
      res.status(400);
      throw new Error('School with this email already exists');
    }

    const documents = (req.files && Array.isArray(req.files) && req.files.length > 0) ? req.files.map(file => ({
      fileName: file.originalname,
      fileType: file.mimetype,
      filePath: file.path
    })) : [];

    const school = new School({
      schoolName, schoolEmail, password,
      streetAddress, city, district, province, postalCode, additionalRemarks,
      principalName, principalEmail, phoneNumber,
      documents,
      description: '',
      images: []
    });

    const lat = parseFloat(latitude);
    const lon = parseFloat(longitude);
    if (!isNaN(lat) && !isNaN(lon) && lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180) {
      school.location = { type: 'Point', coordinates: [lon, lat] };
    }

    try {
      const createdSchool = await school.save();
      
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
      }

      res.status(201).json({
        _id: createdSchool._id,
        schoolName: createdSchool.schoolName,
        schoolEmail: createdSchool.schoolEmail,
        isApproved: createdSchool.isApproved,
        message: 'School registration successful. Your account is pending approval.'
      });
    } catch (error) {
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

  const school = await School.findOne({ schoolEmail }).select('+password');

  if (!school) {
    res.status(401);
    throw new Error('Invalid credentials');
  }

  const isMatch = await school.matchPassword(password);
  if (!isMatch) {
    res.status(401);
    throw new Error('Invalid credentials');
  }

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

  if (!school) {
    res.status(404);
    throw new Error('School profile not found.');
  }

   const profileData = school.toObject();
   profileData.latitude = school.location?.coordinates?.[1] ?? null;
   profileData.longitude = school.location?.coordinates?.[0] ?? null;
   delete profileData.location;

  res.json(profileData);
});

// @desc    Update logged-in school profile (Handles text data + image uploads)
// @route   PUT /api/schools/profile
// @access  Private (School)
const updateSchoolProfile = asyncHandler(async (req, res) => {
  const school = await School.findById(req.school._id);
  if (!school) {
    res.status(404);
    if (req.files && req.files.length > 0) { req.files.forEach(file => fs.unlink(file.path, unlinkErr => unlinkErr && console.error("Error cleaning up file for non-existent school:", unlinkErr))); }
    throw new Error('School associated with your token could not be found.');
  }

  const hasProperty = (obj, prop) => {
    return obj && typeof obj === 'object' && Object.prototype.hasOwnProperty.call(obj, prop);
  };

  let needsSave = false;

  const textFields = [
    'schoolName', 'streetAddress', 'city', 'district', 'province', 'postalCode',
    'description', 'principalName', 'principalEmail', 'phoneNumber'
  ];
  textFields.forEach(field => {
    if (hasProperty(req.body, field) && school[field] !== req.body[field]) {
        school[field] = typeof req.body[field] === 'string' ? req.body[field].trim() : req.body[field];
        needsSave = true;
    }
  });

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

  const latitudeInput = hasProperty(req.body, 'latitude') ? req.body.latitude : undefined;
  const longitudeInput = hasProperty(req.body, 'longitude') ? req.body.longitude : undefined;

  let locationUpdated = false;

  if (latitudeInput !== undefined && longitudeInput !== undefined) {
    const lat = parseFloat(latitudeInput);
    const lon = parseFloat(longitudeInput);

    if (!isNaN(lat) && !isNaN(lon) && lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180) {
      if (!school.location || !school.location.coordinates || school.location.coordinates[0] !== lon || school.location.coordinates[1] !== lat) {
        school.location = { type: 'Point', coordinates: [lon, lat] };
        locationUpdated = true;
        needsSave = true;
      }
    } else if (latitudeInput === '' && longitudeInput === '') {
      if (school.location) {
        school.location = undefined;
        locationUpdated = true;
        needsSave = true;
      }
    } else {
      if (req.files && req.files.length > 0) { req.files.forEach(file => fs.unlink(file.path, unlinkErr => unlinkErr && console.error("Error cleaning up file invalid coords update:", unlinkErr))); }
      res.status(400);
      throw new Error('Invalid latitude or longitude provided for location.');
    }
  }

  let imagesWereDeleted = false;
  if (hasProperty(req.body, 'imagesToDelete')) {
    try {
      const imagesToDelete = JSON.parse(req.body.imagesToDelete);
      if (Array.isArray(imagesToDelete) && imagesToDelete.length > 0) {
        const originalImages = [...school.images];
        const imagesToKeep = school.images.filter(imgPath => !imagesToDelete.includes(imgPath));

        if (imagesToKeep.length < originalImages.length) {
          const pathsToDelete = originalImages.filter(imgPath => imagesToDelete.includes(imgPath));

          school.images = imagesToKeep;
          imagesWereDeleted = true;
          needsSave = true;

          pathsToDelete.forEach(imgPath => {
            try {
              let fullPath;
              if (imgPath.startsWith('/uploads/')) {
                fullPath = path.join(__dirname, '..', imgPath.slice(1));
              } else if (imgPath.startsWith('uploads/')) {
                fullPath = path.join(__dirname, '..', imgPath);
              } else {
                fullPath = path.join(__dirname, '..', 'uploads', imgPath);
              }
              
              console.log(`Attempting to delete file: ${fullPath}`);
              
              fs.unlink(fullPath, (err) => {
                if (err && err.code !== 'ENOENT') {
                  console.error(`Error deleting image file ${fullPath}:`, err);
                } else if (!err) {
                  console.log(`Successfully deleted file: ${fullPath}`);
                } else {
                  console.warn(`Attempted to delete file ${fullPath} but it was not found (ENOENT).`);
                }
              });
            } catch (fileError) {
              console.error(`Error during file path processing for ${imgPath}:`, fileError);
            }
          });
        }
      }
    } catch (parseError) {
      console.error('Error parsing imagesToDelete JSON:', parseError);
      if (req.files && req.files.length > 0) { req.files.forEach(file => fs.unlink(file.path, unlinkErr => unlinkErr && console.error("Error cleaning up file JSON parse error:", unlinkErr))); }
      res.status(400);
      throw new Error('Invalid format for imagesToDelete field.');
    }
  }

  let newImagePaths = [];
  if (req.files && Array.isArray(req.files) && req.files.length > 0) {
    newImagePaths = req.files.map(file => {
      const relativePath = path.relative(path.join(__dirname, '..', 'uploads'), file.path).replace(/\\/g, '/');
      return relativePath;
    });
    school.images = school.images.concat(newImagePaths);
    needsSave = true;
  }

  const prepareResponseData = (doc) => {
    const data = doc.toObject ? doc.toObject() : { ...doc };

    data.latitude = doc.location?.coordinates?.[1] ?? null;
    data.longitude = doc.location?.coordinates?.[0] ?? null;

    delete data.location;
    delete data.password;
    delete data.__v;
    delete data.documents;

    data.images = data.images.map(imgPath => {
      const relativePath = imgPath.replace(/\\/g, '/');
      return relativePath.startsWith('uploads/') ? relativePath.substring('uploads/'.length) : relativePath;
    });

    return data;
  };

  if (needsSave) {
    try {
      const updatedSchool = await school.save();
      res.json(prepareResponseData(updatedSchool));
    } catch (error) {
      if (req.files && req.files.length > 0) {
        req.files.forEach(file => {
          fs.unlink(file.path, (unlinkErr) => {
            if (unlinkErr) console.error(`Error cleaning up uploaded file ${file.path} on save failure:`, unlinkErr);
          });
        });
      }
      res.status(400);
      throw new Error(`Failed to update profile: ${error.message}`);
    }
  } else {
    const currentSchoolData = await School.findById(req.school._id)
      .select('-password -documents._id -documents.filePath -__v')
      .lean();

    if (!currentSchoolData) {
      res.status(500);
      throw new Error('Failed to retrieve current profile data after update attempt.');
    }

    const responseData = {
      ...currentSchoolData,
      latitude: currentSchoolData.location?.coordinates?.[1] ?? null,
      longitude: currentSchoolData.location?.coordinates?.[0] ?? null,
    };
    delete responseData.location;

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
    const { currentPassword, newPassword, confirmPassword } = req.body;
    const schoolId = req.school._id;

    if (!currentPassword || !newPassword || !confirmPassword) {
        res.status(400);
        throw new Error('Please provide current password, new password, and confirm password.');
    }

    if (newPassword !== confirmPassword) {
        res.status(400);
        throw new Error('New password and confirm password do not match.');
    }

     if (newPassword.length < 8 || !/[A-Z]/.test(newPassword) || !/[0-9]/.test(newPassword) || !/[!@#$%^&*(),.?":{}|<>]/.test(newPassword)) {
        res.status(400);
        throw new Error('New password must be at least 8 characters long and include uppercase, number, and special character.');
    }

    const school = await School.findById(schoolId).select('+password');

    if (!school) {
        res.status(404);
        throw new Error('School user not found.');
    }

    const isMatch = await school.matchPassword(currentPassword);

    if (!isMatch) {
        res.status(401);
        throw new Error('Incorrect current password.');
    }

    school.password = newPassword;

    await school.save();

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

  const resetToken = crypto.randomBytes(32).toString('hex');
  school.resetPasswordToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');
  school.resetPasswordExpire = Date.now() + 30 * 60 * 1000;

  await school.save();

  const resetUrl = `http://localhost:5173/school-reset-password/${resetToken}`;

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

  if (password.length < 8 || !/[A-Z]/.test(password) || !/[0-9]/.test(password) || !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    res.status(400);
    throw new Error('Password must be at least 8 characters long and include uppercase, number, and special character');
  }

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
  uploadProfileImages,
  updateSchoolPassword, 
  sendEmail, 
  forgotPassword,
  resetPassword
};
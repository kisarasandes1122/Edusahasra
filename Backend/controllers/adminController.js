const asyncHandler = require('express-async-handler');
const Admin = require('../models/adminModel');
const School = require('../models/schoolModel');
const { generateToken } = require('../utils/passwordUtils');
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const validator = require('validator');
const multer = require('multer');
const jwt = require('jsonwebtoken');
const { JWT_SECRET, EMAIL_USER, EMAIL_PASS, NODE_ENV } = require('../config/config');
const nodemailer = require('nodemailer');

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

// @desc    Register admin (only by superadmin)
// @route   POST /api/admin/register
// @access  Private (SuperAdmin)
const registerAdmin = asyncHandler(async (req, res) => {
  const { name, email, password, confirmPassword, role } = req.body;

   if (!name || !email || !password || !confirmPassword || !role) {
       res.status(400);
       throw new Error('Please fill in all required fields.');
   }

    if (password !== confirmPassword) {
        res.status(400);
        throw new Error('Passwords do not match.');
    }

    if (!validator.isEmail(email)) {
        res.status(400);
        throw new Error('Please provide a valid email address.');
    }

     if (!validator.isLength(password, { min: 8 })) {
        res.status(400);
        throw new Error('Password must be at least 8 characters long.');
     }

     if (!/[A-Z]/.test(password) || !/[0-9]/.test(password) || !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
         res.status(400);
         throw new Error('Password must include uppercase, number, and special character.');
     }

   if (!['admin', 'superadmin'].includes(role)) {
       res.status(400);
       throw new Error('Invalid role specified.');
   }

    if (role === 'superadmin' && req.admin.role !== 'superadmin') {
        res.status(403);
        throw new Error('Only Super Admins can create other Super Admins.');
    }

  const adminExists = await Admin.findOne({ email });

  if (adminExists) {
    res.status(400);
    throw new Error('Admin already exists');
  }

  const admin = await Admin.create({
    name,
    email,
    password,
    role: role
  });

  if (admin) {
    res.status(201).json({
      _id: admin._id,
      name: admin.name,
      email: admin.email,
      role: admin.role,
    });
  } else {
    res.status(400);
    throw new Error('Invalid admin data');
  }
});

// @desc    Login admin
// @route   POST /api/admin/login
// @access  Public
const loginAdmin = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
      res.status(400);
      throw new Error('Please provide email and password');
  }

  const admin = await Admin.findOne({ email }).select('+password');

  if (!admin || !(await admin.matchPassword(password))) {
    res.status(401);
    throw new Error('Invalid email or password');
  }

  res.json({
    _id: admin._id,
    name: admin.name,
    email: admin.email,
    role: admin.role,
    token: generateToken(admin._id)
  });
});

// @desc    Get schools for verification based on status filter
// @route   GET /api/admin/schools
// @access  Private (Admin)
const getSchoolsForVerification = asyncHandler(async (req, res) => {
    const { status, search, district, sortBy = 'dateDesc' } = req.query;

    const filterCriteria = {};

    if (status === 'pending') {
        filterCriteria.isApproved = false;
        filterCriteria.$or = [
            { adminRemarks: { $exists: false } },
            { adminRemarks: null },
            { adminRemarks: '' }
        ];
    } else if (status === 'approved') {
        filterCriteria.isApproved = true;
    } else if (status === 'rejected') {
        filterCriteria.isApproved = false;
        filterCriteria.$and = [
             { adminRemarks: { $exists: true, $ne: null, $ne: '' } }
        ];
    }

    if (search) {
        const searchRegex = new RegExp(search, 'i');
        const searchOrConditions = [
             { schoolName: searchRegex },
             { city: searchRegex },
             { district: searchRegex },
             { province: searchRegex },
             { principalName: searchRegex },
             { schoolEmail: searchRegex }
        ];

         const existingFilters = Object.keys(filterCriteria).length > 0;

         if (existingFilters) {
             filterCriteria.$and = filterCriteria.$and || [];
             if (!filterCriteria.$or && !filterCriteria.$and.length) {
                 const simpleFilter = { ...filterCriteria };
                 for (const key in simpleFilter) { delete filterCriteria[key]; }
                 filterCriteria.$and.push(simpleFilter);
             }
             filterCriteria.$and.push({ $or: searchOrConditions });

         } else {
             filterCriteria.$or = searchOrConditions;
         }
    }

     if (district && district !== 'All Districts') {
         filterCriteria.$and = filterCriteria.$and || [];
         filterCriteria.$and.push({ district: district });
     }

     if (filterCriteria.$and && filterCriteria.$and.length === 0) {
         delete filterCriteria.$and;
     }

    const sortCriteria = {};
    if (sortBy === 'dateAsc') {
        sortCriteria.registeredAt = 1;
    } else {
        sortCriteria.registeredAt = -1;
    }

    const schools = await School.find(filterCriteria)
        .select('schoolName city district province registeredAt isApproved adminRemarks')
        .sort(sortCriteria)

    const schoolsWithStatus = schools.map(school => {
         let statusString = 'pending';
         if (school.isApproved) {
             statusString = 'approved';
         } else if (school.adminRemarks && school.adminRemarks.trim() !== '') {
             statusString = 'rejected';
         }
         const schoolObject = school.toObject ? school.toObject() : { ...school };
         schoolObject.status = statusString;
         return schoolObject;
    });

    const totalSchools = await School.countDocuments(filterCriteria);

    res.json({
        schools: schoolsWithStatus,
        totalCount: totalSchools,
    });
});

// @desc    Get school details by ID
// @route   GET /api/admin/schools/:id
// @access  Private (Admin)
const getSchoolDetails = asyncHandler(async (req, res) => {
   if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
     res.status(400);
     throw new Error('Invalid School ID format.');
   }

  const school = await School.findById(req.params.id)
    .select('-password -__v');

  if (!school) {
    res.status(404);
    throw new Error('School not found');
  }

  const responseData = school.toObject();
   responseData.latitude = school.location?.coordinates?.[1] || null;
   responseData.longitude = school.location?.coordinates?.[0] || null;
   delete responseData.location;

  res.json(responseData);
});

// @desc    Get school document
// @route   GET /api/admin/schools/:id/documents/:docId
// @access  Private (Admin)
const getSchoolDocument = asyncHandler(async (req, res) => {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      res.status(400);
      throw new Error('Invalid School ID format.');
    }

  const school = await School.findById(req.params.id);

  if (!school) {
    res.status(404);
    throw new Error('School not found');
  }

  const document = school.documents.id(req.params.docId);

  if (!document) {
    res.status(404);
    throw new Error('Document not found');
  }

  const filePath = document.filePath;

  if (!fs.existsSync(filePath)) {
    console.error(`File not found at path: ${filePath}`);
    res.status(404);
    throw new Error('File not found on server');
  }

  res.sendFile(filePath, (err) => {
      if (err) {
          console.error(`Error sending file ${filePath}:`, err);
          if (!res.headersSent) {
              res.status(500).send('Error sending file.');
          } else {
              if (!res.writableEnded) {
                  res.end();
              }
              console.error('Headers already sent, cannot send 500 status.');
          }
      }
  });
});

// @desc    Approve school
// @route   PUT /api/admin/schools/:id/approve
// @access  Private (Admin)
const approveSchool = asyncHandler(async (req, res) => {
  const { adminRemarks } = req.body;

    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      res.status(400);
      throw new Error('Invalid School ID format.');
    }

  const school = await School.findById(req.params.id);

  if (!school) {
    res.status(404);
    throw new Error('School not found');
  }

  if (school.isApproved) {
    res.status(400);
    throw new Error('School is already approved');
  }

  school.isApproved = true;
  school.approvedBy = req.admin._id;
  school.approvedAt = Date.now();
  school.adminRemarks = adminRemarks ? adminRemarks.trim() : null;

  const updatedSchool = await school.save();

  try {
    const message = `Dear ${updatedSchool.schoolName},\n\n
We are pleased to inform you that your school registration with EduSahasra has been approved. You can now log in to your account and start using our platform.\n\n
If you have any questions or need assistance, please don't hesitate to contact us.\n\n
Best regards,\nEduSahasra Team`;

    await sendEmail({
      email: updatedSchool.schoolEmail,
      subject: 'EduSahasra School Registration Approved',
      message: message,
    });
  } catch (emailError) {
    console.error('Failed to send approval email:', emailError);
  }

  res.json({
    message: `School "${updatedSchool.schoolName}" has been approved successfully`,
    school: {
      _id: updatedSchool._id,
      schoolName: updatedSchool.schoolName,
      schoolEmail: updatedSchool.schoolEmail,
      isApproved: updatedSchool.isApproved,
      approvedAt: updatedSchool.approvedAt,
      approvedBy: updatedSchool.approvedBy,
      adminRemarks: updatedSchool.adminRemarks
    }
  });
});

// @desc    Reject school registration
// @route   PUT /api/admin/schools/:id/reject
// @access  Private (Admin)
const rejectSchool = asyncHandler(async (req, res) => {
  const { adminRemarks } = req.body;

    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      res.status(400);
      throw new Error('Invalid School ID format.');
    }

  if (!adminRemarks || adminRemarks.trim().length === 0) {
    res.status(400);
    throw new Error('Please provide a reason for rejection in adminRemarks');
  }

  const school = await School.findById(req.params.id);

  if (!school) {
    res.status(404);
    throw new Error('School not found');
  }

   if (school.isApproved) {
       res.status(400);
       throw new Error('Cannot reject an already approved school via this route. School status is Approved.');
   }

  school.isApproved = false;
  school.approvedBy = req.admin._id;
  school.approvedAt = Date.now();
  school.adminRemarks = adminRemarks.trim();

  const updatedSchool = await school.save();

  try {
    const message = `Dear ${updatedSchool.schoolName},\n\n
We regret to inform you that your school registration with EduSahasra has not been approved at this time.\n\n
Reason for rejection: ${updatedSchool.adminRemarks}\n\n
If you believe this decision was made in error or if you would like to provide additional information, please contact us.\n\n
Best regards,\nEduSahasra Team`;

    await sendEmail({
      email: updatedSchool.schoolEmail,
      subject: 'EduSahasra School Registration Status Update',
      message: message,
    });
  } catch (emailError) {
    console.error('Failed to send rejection email:', emailError);
  }

  res.json({
    message: `School "${updatedSchool.schoolName}" registration has been rejected`,
    school: {
      _id: updatedSchool._id,
      schoolName: updatedSchool.schoolName,
      schoolEmail: updatedSchool.schoolEmail,
      isApproved: updatedSchool.isApproved,
      adminRemarks: updatedSchool.adminRemarks,
      approvedBy: updatedSchool.approvedBy,
      approvedAt: updatedSchool.approvedAt,
    }
  });
});

// @desc    Get admin profile
// @route   GET /api/admin/profile
// @access  Private (Admin)
const getAdminProfile = asyncHandler(async (req, res) => {
  const admin = await Admin.findById(req.admin._id).select('-password');

  if (!admin) {
    res.status(404);
    throw new Error('Admin not found');
  }

   const adminProfile = admin.toObject();

  res.json(adminProfile);
});

// @desc    Update admin profile (e.g., name, email, phone - NOT password)
// @route   PUT /api/admin/profile
// @access  Private (Admin)
const updateAdminProfile = asyncHandler(async (req, res) => {
    const admin = await Admin.findById(req.admin._id).select('-password');

    if (!admin) {
        res.status(404);
        throw new Error('Admin not found.');
    }

    if (req.body.name !== undefined) admin.name = req.body.name;
    if (req.body.email !== undefined && req.body.email !== admin.email) {
         if (!validator.isEmail(req.body.email)) {
             res.status(400);
             throw new Error('Please provide a valid email address.');
         }
        const emailExists = await Admin.findOne({ email: req.body.email, _id: { $ne: admin._id } });
        if(emailExists) {
            res.status(400);
            throw new Error('Email address is already in use by another admin.');
        }
        admin.email = req.body.email;
    }

    await admin.save();

    res.json({
        message: 'Profile updated successfully.',
        _id: admin._id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
    });
});

// @desc    Update logged-in admin's password
// @route   PUT /api/admin/profile/password
// @access  Private (Admin)
const updateAdminPassword = asyncHandler(async (req, res) => {
    const { currentPassword, newPassword, confirmPassword } = req.body;
    const adminId = req.admin._id;

    if (!currentPassword || !newPassword || !confirmPassword) {
        res.status(400);
        throw new Error('Please provide current password, new password, and confirm password.');
    }

    if (newPassword !== confirmPassword) {
        res.status(400);
        throw new Error('New password and confirm password do not match.');
    }

    if (!validator.isLength(newPassword, { min: 8 })) {
        res.status(400);
        throw new Error('New password must be at least 8 characters long.');
    }

     if (!/[A-Z]/.test(newPassword) || !/[0-9]/.test(newPassword) || !/[!@#$%^&*(),.?":{}|<>]/.test(newPassword)) {
         res.status(400);
         throw new Error('New password must include uppercase, number, and special character.');
     }

    const admin = await Admin.findById(adminId).select('+password');

    if (!admin) {
        res.status(404);
        throw new Error('Admin user not found.');
    }

    const isMatch = await admin.matchPassword(currentPassword);

    if (!isMatch) {
        res.status(401);
        throw new Error('Incorrect current password.');
    }

    admin.password = newPassword;
    await admin.save();

    res.status(200).json({ message: 'Password has been successfully changed.' });
});

// @desc    Get all admin users (for Admin to manage)
// @route   GET /api/admin/admins
// @access  Private (Admin)
const getAdmins = asyncHandler(async (req, res) => {
    const admins = await Admin.find().select('_id name email role').sort('name').lean();

    res.json(admins);
});

// @desc    Delete an admin user
// @route   DELETE /api/admin/admins/:id
// @access  Private (SuperAdmin)
const deleteAdmin = asyncHandler(async (req, res) => {
    const adminToDeleteId = req.params.id;
    const loggedInAdminId = req.admin._id.toString();

    if (!mongoose.Types.ObjectId.isValid(adminToDeleteId)) {
        res.status(400);
        throw new Error('Invalid Admin ID format.');
    }

    const adminToDelete = await Admin.findById(adminToDeleteId);

    if (!adminToDelete) {
        res.status(404);
        throw new Error('Admin user not found.');
    }

    if (adminToDeleteId === loggedInAdminId) {
        res.status(403);
        throw new Error('You cannot delete your own admin account.');
    }

    if (adminToDelete.role === 'superadmin') {
        res.status(403);
        throw new Error('You cannot delete Super Admin accounts.');
    }

    await Admin.findByIdAndDelete(adminToDeleteId);

    res.json({ message: `Admin "${adminToDelete.name}" deleted successfully.` });
});

module.exports = {
  registerAdmin,
  loginAdmin,
  getSchoolsForVerification,
  getSchoolDetails,
  getSchoolDocument,
  approveSchool,
  rejectSchool,
  getAdminProfile,
  updateAdminProfile, 
  updateAdminPassword, 
  getAdmins,
  deleteAdmin,
  sendEmail 
};
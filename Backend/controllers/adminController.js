// backend/controllers/adminController.js
const asyncHandler = require('express-async-handler');
const Admin = require('../models/adminModel');
const School = require('../models/schoolModel');
const { generateToken } = require('../utils/passwordUtils'); // Assuming generateToken is needed elsewhere
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose'); // Import mongoose to check ObjectId validity
const validator = require('validator'); // Import validator for email/password validation
const multer = require('multer');
const jwt = require('jsonwebtoken');
const { JWT_SECRET, EMAIL_USER, EMAIL_PASS, NODE_ENV } = require('../config/config');
const nodemailer = require('nodemailer');

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

// @desc    Register admin (only by superadmin)
// @route   POST /api/admin/register
// @access  Private (SuperAdmin)
const registerAdmin = asyncHandler(async (req, res) => {
  const { name, email, password, confirmPassword, role } = req.body;

   // Basic validation
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
     // Add password strength validation if needed (min length, complexity)
     if (!validator.isLength(password, { min: 8 })) {
        res.status(400);
        throw new Error('Password must be at least 8 characters long.');
     }
     // Add checks for uppercase, number, special characters if required by model
     if (!/[A-Z]/.test(password) || !/[0-9]/.test(password) || !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
         res.status(400);
         throw new Error('Password must include uppercase, number, and special character.');
     }


  // Ensure role is either 'admin' or 'superadmin'
   if (!['admin', 'superadmin'].includes(role)) {
       res.status(400);
       throw new Error('Invalid role specified.');
   }
    // Additional check: Only SuperAdmins can create other SuperAdmins
    if (role === 'superadmin' && req.admin.role !== 'superadmin') {
        res.status(403);
        throw new Error('Only Super Admins can create other Super Admins.');
    }


  // Check if admin already exists
  const adminExists = await Admin.findOne({ email });

  if (adminExists) {
    res.status(400);
    throw new Error('Admin already exists');
  }

  // Create admin
  const admin = await Admin.create({
    name,
    email,
    password, // Password hashing happens in the model's pre-save middleware
    role: role // Use the provided role
  });

  if (admin) {
    res.status(201).json({
      _id: admin._id,
      name: admin.name,
      email: admin.email,
      role: admin.role, // Return the role
      // Do not return token for registration, user must log in separately
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

  // Find admin, select password field for comparison
  const admin = await Admin.findOne({ email }).select('+password');

  // Use admin.matchPassword which uses bcrypt compare internally
  if (!admin || !(await admin.matchPassword(password))) {
    res.status(401);
    throw new Error('Invalid email or password');
  }

   // Do not return the password field
  res.json({
    _id: admin._id,
    name: admin.name,
    email: admin.email,
    role: admin.role,
    token: generateToken(admin._id) // Usage remains the same
  });
});

// @desc    Get schools for verification based on status filter
// @route   GET /api/admin/schools
// @access  Private (Admin)
const getSchoolsForVerification = asyncHandler(async (req, res) => {
    const { status, search, district, sortBy = 'dateDesc' } = req.query; // Default sort is newest first

    // --- Build Filter Criteria ---
    const filterCriteria = {};

    if (status === 'pending') {
        filterCriteria.isApproved = false;
        // Find documents where adminRemarks is null or doesn't exist
        filterCriteria.$or = [
            { adminRemarks: { $exists: false } },
            { adminRemarks: null },
            { adminRemarks: '' } // Include empty string as potential pending state
        ];
    } else if (status === 'approved') {
        filterCriteria.isApproved = true;
    } else if (status === 'rejected') {
        filterCriteria.isApproved = false;
         // Find documents where adminRemarks exists and is not null or empty string
        filterCriteria.$and = [
             { adminRemarks: { $exists: true, $ne: null, $ne: '' } }
        ];
    }
    // If status is 'all' or undefined, no status filter is added, fetching all

    // --- Add Search Filter ---
    if (search) {
        const searchRegex = new RegExp(search, 'i'); // Case-insensitive search
        // Refined search logic to correctly combine with potential status filter
        const searchOrConditions = [
             { schoolName: searchRegex },
             { city: searchRegex },
             { district: searchRegex },
             { province: searchRegex },
             { principalName: searchRegex }, // Added principal name search
             { schoolEmail: searchRegex }    // Added school email search
        ];

         // Check if there are existing filter criteria (from status or district)
         const existingFilters = Object.keys(filterCriteria).length > 0;

         if (existingFilters) {
             // If existing filters exist, combine them with search using $and
             filterCriteria.$and = filterCriteria.$and || []; // Ensure $and is an array
             // If existing filters were not already inside an $and (e.g., simple {isApproved: true}),
             // wrap them before pushing search conditions
             if (!filterCriteria.$or && !filterCriteria.$and.length) {
                 const simpleFilter = { ...filterCriteria };
                 for (const key in simpleFilter) { delete filterCriteria[key]; } // Clear original keys
                 filterCriteria.$and.push(simpleFilter);
             }
             filterCriteria.$and.push({ $or: searchOrConditions });

         } else {
             // No existing filters, search becomes the primary filter
             filterCriteria.$or = searchOrConditions;
         }
    }

    // --- Add District Filter ---
     if (district && district !== 'All Districts') {
         // Ensure district filter is combined with others using $and
         filterCriteria.$and = filterCriteria.$and || []; // Ensure $and is an array
         filterCriteria.$and.push({ district: district });
     }

     // If $and array was created but is empty after checks, remove it
     if (filterCriteria.$and && filterCriteria.$and.length === 0) {
         delete filterCriteria.$and;
     }


    // --- Build Sort Criteria ---
    const sortCriteria = {};
    // Assuming 'registeredAt' is the submission date equivalent
    if (sortBy === 'dateAsc') {
        sortCriteria.registeredAt = 1; // Ascending (Oldest first)
    } else { // Default or 'dateDesc'
        sortCriteria.registeredAt = -1; // Descending (Newest first)
    }

    // --- Execute Query ---
    // Select fields needed for the list view
    const schools = await School.find(filterCriteria)
        .select('schoolName city district province registeredAt isApproved adminRemarks') // Include fields to determine status
        .sort(sortCriteria)
        // .lean(); // Use lean for performance if not modifying results after fetching

    // Manually add a 'status' string field to each school for frontend convenience
    const schoolsWithStatus = schools.map(school => {
         let statusString = 'pending'; // Default to pending
         if (school.isApproved) {
             statusString = 'approved';
         } else if (school.adminRemarks && school.adminRemarks.trim() !== '') {
             statusString = 'rejected';
         }
         // Create a plain object copy to add the status string
         const schoolObject = school.toObject ? school.toObject() : { ...school };
         schoolObject.status = statusString;
         return schoolObject;
    });


    // --- Basic Pagination (Client-side pagination intended by frontend structure) ---
    // The frontend code seems to perform pagination client-side based on the total fetched data.
    // So, for now, we return ALL matching schools. If the dataset grows large,
    // we should add server-side pagination ($skip, $limit) here.
    // Let's add count for potential future pagination implementation or frontend info display
    const totalSchools = await School.countDocuments(filterCriteria);


    // Respond with the filtered, sorted, and status-annotated list
    res.json({
        schools: schoolsWithStatus,
        totalCount: totalSchools, // Provide total count for frontend pagination info
        // Pagination details (currentPage, totalPages) would be calculated on frontend
    });
});


// @desc    Get school details by ID
// @route   GET /api/admin/schools/:id
// @access  Private (Admin)
const getSchoolDetails = asyncHandler(async (req, res) => {
  // Validate ID format
   if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
     res.status(400);
     throw new Error('Invalid School ID format.');
   }

  // Select necessary fields, including documents and adminRemarks
  const school = await School.findById(req.params.id)
    .select('-password -__v'); // Exclude password and version key

  if (!school) {
    res.status(404);
    throw new Error('School not found');
  }

  // Prepare response data, adding lat/lon from location object
  const responseData = school.toObject(); // Convert Mongoose document to plain object
   responseData.latitude = school.location?.coordinates?.[1] || null;
   responseData.longitude = school.location?.coordinates?.[0] || null;
   delete responseData.location; // Remove the original location object

  res.json(responseData);
});

// @desc    Get school document
// @route   GET /api/admin/schools/:id/documents/:docId
// @access  Private (Admin)
const getSchoolDocument = asyncHandler(async (req, res) => {
   // Validate ID formats
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      res.status(400);
      throw new Error('Invalid School ID format.');
    }
     // Note: Mongoose subdocument IDs are not standard ObjectIds, but they are ObjectId-like strings.
     // We can't strictly validate docId as ObjectId, but we can check if it's a non-empty string.
     // A more robust check would involve querying the school and checking if the docId exists in the documents array.


  const school = await School.findById(req.params.id);

  if (!school) {
    res.status(404);
    throw new Error('School not found');
  }

  // Find the document by its subdocument _id (which is an ObjectId)
  // .id() method is the correct way to find a subdocument by its _id
  const document = school.documents.id(req.params.docId); // Use Mongoose .id() method

  if (!document) {
    res.status(404);
    throw new Error('Document not found');
  }

  // The filePath stored in the model is the full system path as saved by multer for registration documents.
  const filePath = document.filePath;

  // Check if file exists
  if (!fs.existsSync(filePath)) {
    console.error(`File not found at path: ${filePath}`); // Added logging
    res.status(404);
    throw new Error('File not found on server'); // More specific error
  }

  // Send the file
  res.sendFile(filePath, (err) => {
      if (err) {
          console.error(`Error sending file ${filePath}:`, err);
          // Check if headers have already been sent before trying to send a 500 status
          if (!res.headersSent) {
              res.status(500).send('Error sending file.'); // Send a generic error response
          } else {
              // If headers were sent, just end the response stream if it hasn't finished
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
  const { adminRemarks } = req.body; // Optional remarks

   // Validate ID format
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      res.status(400);
      throw new Error('Invalid School ID format.');
    }


  const school = await School.findById(req.params.id);

  if (!school) {
    res.status(404);
    throw new Error('School not found');
  }

  // Prevent re-approving
  if (school.isApproved) {
    res.status(400);
    throw new Error('School is already approved');
  }

  // Update school with approval details
  school.isApproved = true;
  school.approvedBy = req.admin._id; // Store the ID of the admin who approved
  school.approvedAt = Date.now();
  school.adminRemarks = adminRemarks ? adminRemarks.trim() : null; // Store remarks, allow null/empty

  const updatedSchool = await school.save();

  // Send approval email
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
    // Don't throw error here, as approval was successful
  }

  // Respond with updated school details
  res.json({
    message: `School "${updatedSchool.schoolName}" has been approved successfully`,
    school: { // Return key updated fields
      _id: updatedSchool._id,
      schoolName: updatedSchool.schoolName,
      schoolEmail: updatedSchool.schoolEmail,
      isApproved: updatedSchool.isApproved, // Should be true
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

   // Validate ID format
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      res.status(400);
      throw new Error('Invalid School ID format.');
    }


  if (!adminRemarks || adminRemarks.trim().length === 0) {
    res.status(400);
    throw new Error('Please provide a reason for rejection in adminRemarks'); // Clearer error message
  }

  const school = await School.findById(req.params.id);

  if (!school) {
    res.status(404);
    throw new Error('School not found');
  }

  // Prevent rejecting an already approved school via this route (unless re-evaluation is allowed)
   if (school.isApproved) {
       res.status(400);
       throw new Error('Cannot reject an already approved school via this route. School status is Approved.');
   }

  // Update school with rejection details
  school.isApproved = false; // Explicitly set/keep as false
  school.approvedBy = req.admin._id; // Store the ID of the admin who rejected
  school.approvedAt = Date.now(); // Store rejection timestamp
  school.adminRemarks = adminRemarks.trim(); // Store the rejection reason

  const updatedSchool = await school.save();

  // Send rejection email
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
    // Don't throw error here, as rejection was successful
  }

  res.json({
    message: `School "${updatedSchool.schoolName}" registration has been rejected`,
    school: { // Return key updated fields
      _id: updatedSchool._id,
      schoolName: updatedSchool.schoolName,
      schoolEmail: updatedSchool.schoolEmail,
      isApproved: updatedSchool.isApproved, // Should be false
      adminRemarks: updatedSchool.adminRemarks,
      approvedBy: updatedSchool.approvedBy, // Admin who rejected
      approvedAt: updatedSchool.approvedAt, // Rejection timestamp
    }
  });
});


// @desc    Get admin profile
// @route   GET /api/admin/profile
// @access  Private (Admin)
const getAdminProfile = asyncHandler(async (req, res) => {
  // req.admin is attached by the protectAdmin middleware
  // The protectAdmin middleware already fetches and attaches the admin document.
  // We can just use req.admin directly, but let's fetch it again to ensure consistency
  // with select('-password').
  const admin = await Admin.findById(req.admin._id).select('-password');

  if (!admin) {
    // This case should technically be handled by protectAdmin, but belt-and-suspenders
    res.status(404);
    throw new Error('Admin not found');
  }

   // Convert to plain object to add/remove fields safely if needed
   const adminProfile = admin.toObject();
   // Add other computed fields if necessary
   // adminProfile.someComputedField = ...

  res.json(adminProfile);
});

// @desc    Update admin profile (e.g., name, email, phone - NOT password)
// @route   PUT /api/admin/profile
// @access  Private (Admin)
// NOTE: This is a placeholder/example. Implement if needed.
const updateAdminProfile = asyncHandler(async (req, res) => {
    // Access the logged-in admin via req.admin (populated by protectAdmin)
    const admin = await Admin.findById(req.admin._id).select('-password'); // Re-fetch without password for consistency

    if (!admin) {
        res.status(404);
        throw new Error('Admin not found.'); // Should not happen with protectAdmin, but for safety
    }

    // Update fields if they are provided in the request body
    // Add validation as needed (e.g., email format, uniqueness)
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
     // Add other fields like phone number here if they exist in your Admin model
     // if (req.body.phoneNumber !== undefined) admin.phoneNumber = req.body.phoneNumber;
     // if (req.body.notificationPreferences !== undefined) admin.notificationPreferences = req.body.notificationPreferences;


    await admin.save(); // Password hashing middleware won't run unless password field is modified

    res.json({
        message: 'Profile updated successfully.',
        // Return updated profile data (excluding password)
        _id: admin._id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
        // Include other fields returned by getAdminProfile if updated
        // phoneNumber: admin.phoneNumber,
        // notificationPreferences: admin.notificationPreferences,
    });
});


// @desc    Update logged-in admin's password
// @route   PUT /api/admin/profile/password
// @access  Private (Admin)
const updateAdminPassword = asyncHandler(async (req, res) => {
    const { currentPassword, newPassword, confirmPassword } = req.body;

    // Access the logged-in admin's ID from the token payload via req.admin
    const adminId = req.admin._id;

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
    if (!validator.isLength(newPassword, { min: 8 })) {
        res.status(400);
        throw new Error('New password must be at least 8 characters long.');
    }
     // Add checks for uppercase, number, special characters if required by model
     if (!/[A-Z]/.test(newPassword) || !/[0-9]/.test(newPassword) || !/[!@#$%^&*(),.?":{}|<>]/.test(newPassword)) {
         res.status(400);
         throw new Error('New password must include uppercase, number, and special character.');
     }


    // --- Verify Current Password & Update ---
    // Fetch the admin again, explicitly including the password field for comparison
    const admin = await Admin.findById(adminId).select('+password');

    if (!admin) {
        // This case should ideally not be reached if protectAdmin works correctly,
        // but check for safety.
        res.status(404);
        throw new Error('Admin user not found.');
    }

    // Use the matchPassword instance method to compare the provided current password
    const isMatch = await admin.matchPassword(currentPassword);

    if (!isMatch) {
        res.status(401); // Unauthorized
        throw new Error('Incorrect current password.');
    }

    // If current password matches, update the password field
    admin.password = newPassword; // Mongoose pre-save hook will hash this automatically

    await admin.save(); // Save the updated admin document

    // --- Success Response ---
    res.status(200).json({ message: 'Password has been successfully changed.' });
});


// @desc    Get all admin users (for Admin to manage)
// @route   GET /api/admin/admins
// @access  Private (Admin)
const getAdmins = asyncHandler(async (req, res) => {
    // Exclude password and other sensitive fields
    // Ensure the _id field is selected as it's used as the key in the frontend table
    const admins = await Admin.find().select('_id name email role').sort('name').lean();

    // In a real app, you might need pagination here
    res.json(admins);
});


// @desc    Delete an admin user
// @route   DELETE /api/admin/admins/:id
// @access  Private (SuperAdmin)
const deleteAdmin = asyncHandler(async (req, res) => {
    const adminToDeleteId = req.params.id;
    const loggedInAdminId = req.admin._id.toString(); // ID of the admin performing the deletion

    // Validate ID format
    if (!mongoose.Types.ObjectId.isValid(adminToDeleteId)) {
        res.status(400);
        throw new Error('Invalid Admin ID format.');
    }

    // Find the admin to delete
    const adminToDelete = await Admin.findById(adminToDeleteId);

    if (!adminToDelete) {
        res.status(404);
        throw new Error('Admin user not found.');
    }

    // Prevent deleting the logged-in admin
    if (adminToDeleteId === loggedInAdminId) {
        res.status(403);
        throw new Error('You cannot delete your own admin account.');
    }

    // Prevent deleting Super Admins (only Super Admins can delete regular Admins)
    if (adminToDelete.role === 'superadmin') {
        res.status(403);
        throw new Error('You cannot delete Super Admin accounts.');
    }

    // If all checks pass, proceed with deletion
    // Using findByIdAndDelete is a bit cleaner than findById then deleteOne
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
  updateAdminProfile, // Export the new profile update (optional for this task, but good to have)
  updateAdminPassword, // Export the new password update function
  getAdmins,
  deleteAdmin,
  sendEmail // Export the sendEmail function
};
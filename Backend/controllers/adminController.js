const asyncHandler = require('express-async-handler');
const Admin = require('../models/adminModel');
const School = require('../models/schoolModel');
const { generateToken } = require('../utils/passwordUtils'); 
const fs = require('fs');
const path = require('path');

// @desc    Register admin (only by superadmin)
// @route   POST /api/admin/register
// @access  Private (SuperAdmin)
const registerAdmin = asyncHandler(async (req, res) => {
  const { name, email, password, role } = req.body;

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
    password,
    role: role || 'admin' // Default to regular admin if not specified
  });

  if (admin) {
    res.status(201).json({
      _id: admin._id,
      name: admin.name,
      email: admin.email,
      role: admin.role,
      token: generateToken(admin._id) // Usage remains the same
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

  // Find admin
  const admin = await Admin.findOne({ email }).select('+password');

  // Use admin.matchPassword which uses bcrypt compare internally
  if (!admin || !(await admin.matchPassword(password))) {
    res.status(401);
    throw new Error('Invalid email or password');
  }


  res.json({
    _id: admin._id,
    name: admin.name,
    email: admin.email,
    role: admin.role,
    token: generateToken(admin._id) // Usage remains the same
  });
});

// @desc    Get all schools pending approval
// @route   GET /api/admin/schools/pending
// @access  Private (Admin)
const getPendingSchools = asyncHandler(async (req, res) => {
  const pendingSchools = await School.find({ isApproved: false })
    .select('schoolName schoolEmail city district province registeredAt documents')
    .sort('-registeredAt');

  res.json(pendingSchools);
});

// @desc    Get all approved schools
// @route   GET /api/admin/schools/approved
// @access  Private (Admin)
const getApprovedSchools = asyncHandler(async (req, res) => {
  const approvedSchools = await School.find({ isApproved: true })
    .select('schoolName schoolEmail city district province approvedAt approvedBy')
    .sort('-approvedAt');

  res.json(approvedSchools);
});

// @desc    Get school details by ID
// @route   GET /api/admin/schools/:id
// @access  Private (Admin)
const getSchoolDetails = asyncHandler(async (req, res) => {
  const school = await School.findById(req.params.id);

  if (!school) {
    res.status(404);
    throw new Error('School not found');
  }

  res.json(school);
});

// @desc    Get school document
// @route   GET /api/admin/schools/:id/documents/:docId
// @access  Private (Admin)
const getSchoolDocument = asyncHandler(async (req, res) => {
  const school = await School.findById(req.params.id);

  if (!school) {
    res.status(404);
    throw new Error('School not found');
  }

  const document = school.documents.find(doc => doc._id.toString() === req.params.docId);

  if (!document) {
    res.status(404);
    throw new Error('Document not found');
  }

  const filePath = path.resolve(document.filePath);

  // Check if file exists
  if (!fs.existsSync(filePath)) {
    console.error(`File not found at path: ${filePath}`); // Added logging
    res.status(404);
    throw new Error('File not found on server'); // More specific error
  }

  res.sendFile(filePath);
});


// @desc    Approve school
// @route   PUT /api/admin/schools/:id/approve
// @access  Private (Admin)
const approveSchool = asyncHandler(async (req, res) => {
  const { adminRemarks } = req.body;

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
  school.approvedBy = req.admin._id;
  school.approvedAt = Date.now();
  school.adminRemarks = adminRemarks || 'Approved'; // Provide default remark if none given

  const updatedSchool = await school.save();

  res.json({
    message: `School "${updatedSchool.schoolName}" has been approved successfully`,
    school: {
      _id: updatedSchool._id,
      schoolName: updatedSchool.schoolName,
      schoolEmail: updatedSchool.schoolEmail,
      isApproved: updatedSchool.isApproved,
      approvedAt: updatedSchool.approvedAt,
      approvedBy: updatedSchool.approvedBy, // Include approvedBy ID
      adminRemarks: updatedSchool.adminRemarks // Include remarks
    }
  });
});


// @desc    Reject school registration
// @route   PUT /api/admin/schools/:id/reject
// @access  Private (Admin)
const rejectSchool = asyncHandler(async (req, res) => {
  const { adminRemarks } = req.body;

  if (!adminRemarks) {
    res.status(400);
    throw new Error('Please provide a reason for rejection in adminRemarks'); // Clearer error message
  }

  const school = await School.findById(req.params.id);

  if (!school) {
    res.status(404);
    throw new Error('School not found');
  }

  // Prevent rejecting an already approved school via this route
  if (school.isApproved) {
    res.status(400);
    throw new Error('Cannot reject an already approved school. Consider deactivation if needed.');
  }

  // Update school with rejection details
  // We might want to keep isApproved as false (its default) or explicitly set it.
  // Setting adminRemarks is the key action here.
  school.isApproved = false; // Explicitly set/keep as false
  school.approvedBy = null; // Clear any potential previous interaction ID if workflow changes
  school.approvedAt = null; // Clear any potential previous interaction timestamp
  school.adminRemarks = adminRemarks; // Store the rejection reason

  const updatedSchool = await school.save();

  // Optionally: Delete the school record after rejection? Or keep it for records?
  // For now, we keep it and just update the status/remarks.

  res.json({
    message: `School "${updatedSchool.schoolName}" registration has been rejected`,
    school: {
      _id: updatedSchool._id,
      schoolName: updatedSchool.schoolName,
      schoolEmail: updatedSchool.schoolEmail,
      isApproved: updatedSchool.isApproved, // Should be false
      adminRemarks: updatedSchool.adminRemarks // Include rejection reason
    }
  });
});


// @desc    Get admin profile
// @route   GET /api/admin/profile
// @access  Private (Admin)
const getAdminProfile = asyncHandler(async (req, res) => {
  // req.admin is attached by the protectAdmin middleware
  const admin = await Admin.findById(req.admin._id);

  if (!admin) {
    // This case should technically be handled by protectAdmin, but belt-and-suspenders
    res.status(404);
    throw new Error('Admin not found');
  }


  res.json({
    _id: admin._id,
    name: admin.name,
    email: admin.email,
    role: admin.role,
    createdAt: admin.createdAt
  });
});

module.exports = {
  registerAdmin,
  loginAdmin,
  getPendingSchools,
  getApprovedSchools,
  getSchoolDetails,
  getSchoolDocument,
  approveSchool,
  rejectSchool,
  getAdminProfile
};
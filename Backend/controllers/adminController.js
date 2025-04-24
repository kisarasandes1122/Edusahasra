// backend/controllers/adminController.js
const asyncHandler = require('express-async-handler');
const Admin = require('../models/adminModel');
const School = require('../models/schoolModel');
const { generateToken } = require('../utils/passwordUtils');
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose'); // Import mongoose to check ObjectId validity


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
    // Password hashing happens in the model's pre-save middleware
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
        filterCriteria.$or = [
            { schoolName: searchRegex },
            { city: searchRegex },
            { district: searchRegex },
            { province: searchRegex },
             // Add other searchable fields if needed (e.g., principalName, schoolEmail)
             // { principalName: searchRegex },
             // { schoolEmail: searchRegex }
        ];
         // If a status filter was also applied, combine with $and
         // Note: This basic combination with $or/$and can be tricky.
         // For simplicity, we apply search across relevant fields *within* the filtered status set.
         // A more robust approach might use $regex on concatenated fields or text indexing.
         // For now, let's refine: if status is set, search applies *within* that status.
         const searchOrConditions = [
             { schoolName: searchRegex },
             { city: searchRegex },
             { district: searchRegex },
             { province: searchRegex },
         ];

         if (Object.keys(filterCriteria).length > 0 && !filterCriteria.$or) {
             // Status filter already added, wrap existing filterCriteria and search conditions in $and
             filterCriteria.$and = [
                 { ...filterCriteria }, // Existing status filter
                 { $or: searchOrConditions } // Search filter
             ];
             // Remove original keys to avoid conflict if only status filter existed
             delete filterCriteria.isApproved;
             delete filterCriteria.$or; // Assuming $or was only for pending status check initially
         } else {
             // No status filter, or status filter was already complex, just add $or for search
             filterCriteria.$or = searchOrConditions;
         }
          // Special handling for pending status combined with search
          if (status === 'pending' && filterCriteria.$and) {
               // Reconstruct the $and to include both pending status logic and search
               const pendingStatusConditions = filterCriteria.$and[0];
               filterCriteria.$and = [
                   pendingStatusConditions,
                   { $or: searchOrConditions }
               ];
          } else if (status === 'rejected' && filterCriteria.$and) {
               const rejectedStatusConditions = filterCriteria.$and[0];
               filterCriteria.$and = [
                   rejectedStatusConditions,
                   { $or: searchOrConditions }
               ];
          } else if (status === 'approved' && filterCriteria.$and) {
              const approvedStatusConditions = filterCriteria.$and[0];
               filterCriteria.$and = [
                   approvedStatusConditions,
                   { $or: searchOrConditions }
               ];
          }

    }

    // --- Add District Filter ---
     if (district && district !== 'All Districts') {
        // If filterCriteria already has $and, add to it. Otherwise, create $and.
        if (filterCriteria.$and) {
             filterCriteria.$and.push({ district: district });
        } else if (Object.keys(filterCriteria).length > 0) {
             // Existing filter (status or search), wrap with district in $and
             filterCriteria.$and = [{ ...filterCriteria }, { district: district }];
             // Clear original keys (this part needs care based on filter complexity)
             // A safer way for complex filters involving $or/$and is to build the $and array directly.
             // Let's rebuild the filterCriteria structure more carefully if needed.
              // Simpler approach: Just add the district filter directly if it doesn't conflict.
              // If status or search already used $or/$and, this might need adjustment.
              // For the current structure, let's assume simple additions or check if $and already exists.
               if (!filterCriteria.$and) { // If $and wasn't needed before
                    filterCriteria.district = district;
               } else { // If $and was needed (e.g., for search + status)
                     filterCriteria.$and.push({ district: district });
                     // Need to ensure original $or/$and from search/status are correctly carried over
                     // This requires more complex logic than simple pushing if multiple $ands were needed.
                     // Let's stick to the single $and wrapping for now as implemented for search.
               }
        } else {
            // No existing filter, just add district
            filterCriteria.district = district;
        }
         // Clean up redundant keys if $and was created
         if (filterCriteria.$and) {
              // Example: if status and district were both set, and status wasn't 'all'
              // We need to ensure isApproved/adminRemarks logic is inside the $and array
              // Re-evaluate the combination logic based on query params
              const combinedAndConditions = [];

              // 1. Add Status conditions
              if (status === 'pending') {
                   combinedAndConditions.push({ isApproved: false, $or: [{ adminRemarks: { $exists: false } }, { adminRemarks: null }, { adminRemarks: '' }] });
              } else if (status === 'approved') {
                   combinedAndConditions.push({ isApproved: true });
              } else if (status === 'rejected') {
                   combinedAndConditions.push({ isApproved: false, $and: [{ adminRemarks: { $exists: true, $ne: null, $ne: '' } }] });
              }

              // 2. Add Search conditions (if any)
              if (search) {
                  combinedAndConditions.push({ $or: searchOrConditions });
              }

              // 3. Add District condition (if any)
               if (district && district !== 'All Districts') {
                   combinedAndConditions.push({ district: district });
               }

               // If any conditions were added, replace filterCriteria with $and
               if (combinedAndConditions.length > 0) {
                    filterCriteria.$and = combinedAndConditions;
                    // Clear top-level keys that might have been set temporarily
                    delete filterCriteria.isApproved;
                    delete filterCriteria.$or;
                    delete filterCriteria.district;
               } else {
                   // Should not happen if district is set, but fallback
                   delete filterCriteria.$and;
               }
         }
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


  const school = await School.findById(req.params.id);

  if (!school) {
    res.status(404);
    throw new Error('School not found');
  }

  // Find the document by its subdocument _id (which is an ObjectId)
  const document = school.documents.id(req.params.docId); // Use Mongoose .id() method

  if (!document) {
    res.status(404);
    throw new Error('Document not found');
  }

  // The filePath stored in the model is likely relative (e.g., 'uploads/school-documents/...')
  // Or it could be relative to the project root if Multer was configured that way.
  // Assuming Multer stored paths relative to the project root, e.g., 'backend/uploads/school-documents/...'
  // Or assuming Multer stored paths relative to the uploads dir, e.g., 'school-documents/...'
  // Based on your multer config (`path.join(__dirname, '..', 'uploads', 'school-documents')`),
  // `file.path` will be a full system path. `path.relative` was not used for saving registration docs.
  // So `document.filePath` will be a full system path like `/path/to/your/project/backend/uploads/school-documents/filename.pdf`

  // Let's assume filePath is the *full system path* as saved by multer.
  const filePath = document.filePath; // Use the saved full path

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
          res.status(500).send('Error sending file.'); // Send a generic error response
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

  // Optionally: Delete the school record after rejection? Or keep it for records?
  // For now, we keep it and just update the status/remarks.

  res.json({
    message: `School "${updatedSchool.schoolName}" registration has been rejected`,
    school: { // Return key updated fields
      _id: updatedSchool._id,
      schoolName: updatedUpdatedSchool.schoolName,
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

module.exports = {
  registerAdmin,
  loginAdmin,
  getSchoolsForVerification, // Export the new function
  getSchoolDetails,
  getSchoolDocument,
  approveSchool,
  rejectSchool,
  getAdminProfile
};
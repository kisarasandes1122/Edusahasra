const jwt = require('jsonwebtoken');
const asyncHandler = require('express-async-handler');
const Donor = require('../models/donorModel');
const School = require('../models/schoolModel');
const Admin = require('../models/adminModel'); // Make sure Admin model is imported
const { JWT_SECRET } = require('../config/config');

// Protect Donor routes
const protect = asyncHandler(async (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, JWT_SECRET);
      req.donor = await Donor.findById(decoded.id).select('-password');
      if (!req.donor) { res.status(401); throw new Error('Not authorized, donor not found'); }
      next();
    } catch (error) { res.status(401); throw new Error('Not authorized, token failed'); }
  } else { res.status(401); throw new Error('Not authorized, no token'); }
});

// Protect School routes
const protectSchool = asyncHandler(async (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, JWT_SECRET);
      const schoolUser = await School.findById(decoded.id).select('-password');
      if (!schoolUser) { res.status(401); throw new Error('Not authorized, school not found for token'); }
      if (!schoolUser.isApproved) { res.status(403); throw new Error('Your school registration is pending approval or has been rejected'); }
      req.school = schoolUser;
      next();
    } catch (error) { res.status(401); throw new Error('Not authorized, token failed or invalid'); }
  } else { res.status(401); throw new Error('Not authorized, no token'); }
});

// Protect Admin routes - CORRECT IMPLEMENTATION
const protectAdmin = asyncHandler(async (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, JWT_SECRET);
      // *** CORRECT LINE: Find Admin user by decoded ID ***
      req.admin = await Admin.findById(decoded.id).select('-password');
      if (!req.admin) {
        // *** CORRECT ERROR: Admin not found for token ***
        res.status(401);
        throw new Error('Not authorized, admin not found for token');
      }
      next();
    } catch (error) {
      // *** CORRECT ERROR: Token failed verification ***
      console.error("protectAdmin token verification error:", error.message); // Log for debugging
      res.status(401);
      throw new Error('Not authorized, token failed or invalid');
    }
  } else {
    // *** CORRECT ERROR: No token provided ***
    res.status(401);
    throw new Error('Not authorized, no token');
  }
});


// Middleware to check if user is a superadmin (requires protectAdmin first)
const isSuperAdmin = asyncHandler(async (req, res, next) => {
  // Assumes protectAdmin has already run and attached req.admin
  if (!req.admin) {
      // This case should theoretically not happen if protectAdmin runs first,
      // but adding a check for robustness.
      res.status(401);
      throw new Error('Authentication failed (Admin object missing)');
  }
  if (req.admin.role === 'superadmin') {
    next();
  } else {
    res.status(403); // Forbidden
    throw new Error('Not authorized, requires super admin privileges');
  }
});


// --- NEW: Attempt Authentication Middleware ---
// Tries to authenticate user if token is present, but continues even if not successful.
const attemptAuth = asyncHandler(async (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            token = req.headers.authorization.split(' ')[1];
            const decoded = jwt.verify(token, JWT_SECRET);

            // Attempt to find user in different models
            // Use lean() for better performance since we're not saving changes here
            // Add checks for null results in case user was deleted after token issued
            const [donorUser, schoolUser, adminUser] = await Promise.allSettled([ // Use settled to get results even if one fails
                Donor.findById(decoded.id).select('-password').lean(),
                School.findById(decoded.id).select('-password').lean(),
                Admin.findById(decoded.id).select('-password').lean(),
            ]);

            // Attach user if found (prioritizing order as needed, or check by presence)
            // Check status ('fulfilled' or 'rejected') and value
            if (adminUser.status === 'fulfilled' && adminUser.value) { // Prioritize admin if applicable
                req.admin = adminUser.value;
                 console.log("AttemptAuth: Admin authenticated.");
            } else if (schoolUser.status === 'fulfilled' && schoolUser.value) {
                req.school = schoolUser.value;
                 console.log("AttemptAuth: School authenticated.");
                // Optional: check isApproved here if needed for this route, or handle in controller
            } else if (donorUser.status === 'fulfilled' && donorUser.value) {
                req.donor = donorUser.value;
                 console.log("AttemptAuth: Donor authenticated.");
            } else {
                // Token was valid, but user ID not found in any expected collection, or DB lookup failed
                 console.warn("AttemptAuth: Token valid, but user not found in any model or lookup failed.");
            }

        } catch (error) {
            // Token verification failed (invalid signature, expired, etc.)
            console.error('AttemptAuth: Token verification failed:', error.message);
            // Do NOT send 401/403 here. Just continue as if no token was provided.
            // The error is logged, but the request proceeds to the next middleware/controller.
        }
    } else {
         // No token provided in headers
         console.log("AttemptAuth: No token provided.");
    }

    // Always call next(), allowing the request to proceed to the controller
    next();
});


module.exports = {
  protect,
  protectSchool,
  protectAdmin, // Export the correct middleware
  isSuperAdmin,
  attemptAuth,
};
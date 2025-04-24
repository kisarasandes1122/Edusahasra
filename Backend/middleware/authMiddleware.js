const jwt = require('jsonwebtoken');
const asyncHandler = require('express-async-handler');
const Donor = require('../models/donorModel');
const School = require('../models/schoolModel');
const Admin = require('../models/adminModel');
const { JWT_SECRET } = require('../config/config');

// --- Keep Existing Protection Middlewares ---

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

// Protect Admin routes
const protectAdmin = asyncHandler(async (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, JWT_SECRET);
      req.admin = await Admin.findById(decoded.id).select('-password');
      if (!req.admin) { res.status(401); throw new Error('Not authorized, admin not found'); }
      next();
    } catch (error) { res.status(401); throw new Error('Not authorized, token failed'); }
  } else { res.status(401); throw new Error('Not authorized, no token'); }
});

// Middleware to check if user is a superadmin (requires protectAdmin first)
const isSuperAdmin = asyncHandler(async (req, res, next) => {
  if (req.admin && req.admin.role === 'superadmin') {
    next();
  } else {
    res.status(403);
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
            const [donorUser, schoolUser, adminUser] = await Promise.all([
                Donor.findById(decoded.id).select('-password').lean().catch(err => { console.warn("AttemptAuth: Donor find failed:", err.message); return null; }),
                School.findById(decoded.id).select('-password').lean().catch(err => { console.warn("AttemptAuth: School find failed:", err.message); return null; }),
                Admin.findById(decoded.id).select('-password').lean().catch(err => { console.warn("AttemptAuth: Admin find failed:", err.message); return null; }),
            ]);

            // Attach user if found (prioritizing order as needed, or check by presence)
            if (adminUser) { // Prioritize admin if applicable
                req.admin = adminUser;
                 console.log("AttemptAuth: Admin authenticated.");
            } else if (schoolUser) {
                req.school = schoolUser;
                 console.log("AttemptAuth: School authenticated.");
                // Optional: check isApproved here if needed for this route, or handle in controller
            } else if (donorUser) {
                req.donor = donorUser;
                 console.log("AttemptAuth: Donor authenticated.");
            } else {
                // Token was valid, but user ID not found in any expected collection
                 console.log("AttemptAuth: Token valid, but user not found in any model.");
            }

        } catch (error) {
            // Token verification failed (invalid signature, expired, etc.)
            console.error('AttemptAuth: Token verification failed:', error.message);
            // Do NOT send 401/403 here. Just continue as if no token was provided.
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
  protectAdmin,
  isSuperAdmin,
  attemptAuth, // Export the new middleware
};
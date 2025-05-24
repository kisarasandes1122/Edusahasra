const jwt = require('jsonwebtoken');
const asyncHandler = require('express-async-handler');
const Donor = require('../models/donorModel');
const School = require('../models/schoolModel');
const Admin = require('../models/adminModel'); 
const { JWT_SECRET } = require('../config/config');

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

const protectAdmin = asyncHandler(async (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, JWT_SECRET);
      req.admin = await Admin.findById(decoded.id).select('-password');
      if (!req.admin) {
        res.status(401);
        throw new Error('Not authorized, admin not found for token');
      }
      next();
    } catch (error) {
      console.error("protectAdmin token verification error:", error.message); 
      res.status(401);
      throw new Error('Not authorized, token failed or invalid');
    }
  } else {
    res.status(401);
    throw new Error('Not authorized, no token');
  }
});


const isSuperAdmin = asyncHandler(async (req, res, next) => {
  if (!req.admin) {
      res.status(401);
      throw new Error('Authentication failed (Admin object missing)');
  }
  if (req.admin.role === 'superadmin') {
    next();
  } else {
    res.status(403); 
    throw new Error('Not authorized, requires super admin privileges');
  }
});



const attemptAuth = asyncHandler(async (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            token = req.headers.authorization.split(' ')[1];
            const decoded = jwt.verify(token, JWT_SECRET);

            const [donorUser, schoolUser, adminUser] = await Promise.allSettled([ 
                Donor.findById(decoded.id).select('-password').lean(),
                School.findById(decoded.id).select('-password').lean(),
                Admin.findById(decoded.id).select('-password').lean(),
            ]);
            
            if (adminUser.status === 'fulfilled' && adminUser.value) { 
                req.admin = adminUser.value;
                 console.log("AttemptAuth: Admin authenticated.");
            } else if (schoolUser.status === 'fulfilled' && schoolUser.value) {
                req.school = schoolUser.value;
                 console.log("AttemptAuth: School authenticated.");
            } else if (donorUser.status === 'fulfilled' && donorUser.value) {
                req.donor = donorUser.value;
                 console.log("AttemptAuth: Donor authenticated.");
            } else {
                 console.warn("AttemptAuth: Token valid, but user not found in any model or lookup failed.");
            }

        } catch (error) {
            console.error('AttemptAuth: Token verification failed:', error.message);
        }
    } else {
         console.log("AttemptAuth: No token provided.");
    }
    next();
});


module.exports = {
  protect,
  protectSchool,
  protectAdmin,
  isSuperAdmin,
  attemptAuth,
};
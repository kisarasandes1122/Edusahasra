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
      // Get token from header
      token = req.headers.authorization.split(' ')[1];

      // Verify token
      const decoded = jwt.verify(token, JWT_SECRET);

      // Get donor from the token (exclude password)
      req.donor = await Donor.findById(decoded.id).select('-password');

      if (!req.donor) {
        res.status(401);
        throw new Error('Not authorized, donor not found');
      }

      next();
    } catch (error) {
      res.status(401);
      throw new Error('Not authorized, token failed');
    }
  }

  if (!token) {
    res.status(401);
    throw new Error('Not authorized, no token');
  }
});

// Protect school routes
const protectSchool = asyncHandler(async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];

      const decoded = jwt.verify(token, JWT_SECRET);

      // Get school from the token
      const schoolUser = await School.findById(decoded.id).select('-password');

      if (!schoolUser) {
        res.status(401);
        throw new Error('Not authorized, school not found for token');
      }

      // Check if school is approved
      if (!schoolUser.isApproved) {
        res.status(403); // Forbidden
        throw new Error('Your school registration is pending approval or has been rejected');
      }

      // Attach school to request object
      req.school = schoolUser;
      next();

    } catch (error) {
      res.status(401);
      throw new Error('Not authorized, token failed or invalid');
    }
  }

  if (!token) {
    res.status(401);
    throw new Error('Not authorized, no token');
  }
});

// Protect admin routes
const protectAdmin = asyncHandler(async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      // Get token from header
      token = req.headers.authorization.split(' ')[1];

      // Verify token
      const decoded = jwt.verify(token, JWT_SECRET);

      // Get admin from the token (exclude password)
      req.admin = await Admin.findById(decoded.id).select('-password');

      if (!req.admin) {
        res.status(401);
        throw new Error('Not authorized, admin not found');
      }

      next();
    } catch (error) {
      res.status(401);
      throw new Error('Not authorized, token failed');
    }
  }

  if (!token) {
    res.status(401);
    throw new Error('Not authorized, no token');
  }
});

// Middleware to check if user is a superadmin
const isSuperAdmin = asyncHandler(async (req, res, next) => {
  if (req.admin && req.admin.role === 'superadmin') {
    next();
  } else {
    res.status(403);
    throw new Error('Not authorized, requires super admin privileges');
  }
});

module.exports = { protect, protectSchool, protectAdmin, isSuperAdmin };
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
      console.error(error);
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
      // Get token from header
      token = req.headers.authorization.split(' ')[1];

      // Verify token
      const decoded = jwt.verify(token, JWT_SECRET);

      // Get school from the token (exclude password)
      req.school = await School.findById(decoded.id).select('-password');

      if (!req.school) {
        res.status(401);
        throw new Error('Not authorized, school not found');
      }

      // Check if school is approved
      if (!req.school.isApproved) {
        res.status(403);
        throw new Error('Your school registration is pending approval by an administrator');
      }

      next();
    } catch (error) {
      console.error(error);
      res.status(401);
      throw new Error('Not authorized, token failed');
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
      console.error(error);
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


const asyncHandler = require('express-async-handler');
const Donor = require('../models/donorModel');
const { generateToken } = require('../utils/passwordUtils');

// @desc    Register a new donor
// @route   POST /api/donors/register
// @access  Public
const registerDonor = asyncHandler(async (req, res) => {
  const { fullName, email, password, confirmPassword, phoneNumber, address, agreeToTerms, latitude, longitude } = req.body;

  // Validate input
  if (!fullName || !email || !password || !phoneNumber || !address || !agreeToTerms) {
    res.status(400);
    throw new Error('Please add all required fields');
  }

  if (password !== confirmPassword) {
    res.status(400);
    throw new Error('Passwords do not match');
  }

  // Check if donor exists
  const donorExists = await Donor.findOne({ email });

  if (donorExists) {
    res.status(400);
    throw new Error('Donor already exists');
  }

  // Create donor
  const donor = await Donor.create({
    fullName,
    email,
    password,
    phoneNumber,
    address,
    agreeToTerms,
    location: {
      type: 'Point',
      coordinates: [parseFloat(longitude), parseFloat(latitude)]
    }
  });

  if (donor) {
    res.status(201).json({
      _id: donor._id,
      fullName: donor.fullName,
      email: donor.email,
      phoneNumber: donor.phoneNumber,
      address: donor.address,
      location: donor.location,
      token: generateToken(donor._id)
    });
  } else {
    res.status(400);
    throw new Error('Invalid donor data');
  }
});

// @desc    Login donor
// @route   POST /api/donors/login
// @access  Public
const loginDonor = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // Check for donor email
  const donor = await Donor.findOne({ email });

  if (donor && (await donor.matchPassword(password))) {
    res.json({
      _id: donor._id,
      fullName: donor.fullName,
      email: donor.email,
      phoneNumber: donor.phoneNumber,
      address: donor.address,
      token: generateToken(donor._id)
    });
  } else {
    res.status(401);
    throw new Error('Invalid email or password');
  }
});

// @desc    Get donor profile
// @route   GET /api/donors/profile
// @access  Private
const getDonorProfile = asyncHandler(async (req, res) => {
  const donor = await Donor.findById(req.donor._id);

  if (donor) {
    res.json({
      _id: donor._id,
      fullName: donor.fullName,
      email: donor.email,
      phoneNumber: donor.phoneNumber,
      address: donor.address,
      location: donor.location
    });
  } else {
    res.status(404);
    throw new Error('Donor not found');
  }
});

// @desc    Update donor profile
// @route   PUT /api/donors/profile
// @access  Private
const updateDonorProfile = asyncHandler(async (req, res) => {
  const donor = await Donor.findById(req.donor._id);

  if (donor) {
    donor.fullName = req.body.fullName || donor.fullName;
    donor.email = req.body.email || donor.email;
    donor.phoneNumber = req.body.phoneNumber || donor.phoneNumber;
    donor.address = req.body.address || donor.address;
    
    if (req.body.latitude && req.body.longitude) {
      donor.location = {
        type: 'Point',
        coordinates: [parseFloat(req.body.longitude), parseFloat(req.body.latitude)]
      };
    }
    
    if (req.body.password) {
      donor.password = req.body.password;
    }

    const updatedDonor = await donor.save();

    res.json({
      _id: updatedDonor._id,
      fullName: updatedDonor.fullName,
      email: updatedDonor.email,
      phoneNumber: updatedDonor.phoneNumber,
      address: updatedDonor.address,
      location: updatedDonor.location,
      token: generateToken(updatedDonor._id)
    });
  } else {
    res.status(404);
    throw new Error('Donor not found');
  }
});



module.exports = {
  registerDonor,
  loginDonor,
  getDonorProfile,
  updateDonorProfile
};
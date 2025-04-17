const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const validator = require('validator'); // Import validator

const adminSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide a name'],
    trim: true // Added trim
  },
  email: {
    type: String,
    required: [true, 'Please provide an email'],
    unique: true,
    trim: true, // Added trim
    lowercase: true, // Added lowercase for consistent checks
    validate: [validator.isEmail, 'Please provide a valid email'] 
  },
  password: {
    type: String,
    required: [true, 'Please provide a password'],
    minlength: [8, 'Password must be at least 8 characters'], // Use array format for consistency
    select: false // Keep password hidden by default
  },
  role: {
    type: String,
    enum: ['admin', 'superadmin'],
    default: 'admin'
  },
}, {
  timestamps: true // Use Mongoose timestamps for createdAt and updatedAt
});

// Encrypt password using bcrypt before saving
adminSchema.pre('save', async function(next) {
  // Only run this function if password was actually modified
  if (!this.isModified('password')) {
    return next(); // Added return to prevent hashing unchanged passwords
  }

  // Hash the password with cost of 10
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next(); // Ensure next() is called after async operation
});

// Instance method to match entered password with hashed password in DB
adminSchema.methods.matchPassword = async function(enteredPassword) {
  // 'this.password' refers to the hashed password which is selected when needed (e.g., in login controller)
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('Admin', adminSchema);

// backend/utils/passwordUtils.js
const jwt = require('jsonwebtoken');
const crypto = require('crypto'); // Import crypto module
const { JWT_SECRET, JWT_EXPIRES_IN } = require('../config/config');

const generateToken = (id) => {
  return jwt.sign({ id }, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN
  });
};

// Generate a random reset token and its hash
const generateResetToken = () => {
  const resetToken = crypto.randomBytes(20).toString('hex'); // Generate a random token
  const resetPasswordToken = crypto // Hash the token for storage
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  // Set expiry time (e.g., 1 hour from now)
  const resetPasswordExpire = Date.now() + 60 * 60 * 1000; // 1 hour

  return {
    resetToken,           // The raw token to send to the user
    resetPasswordToken,   // The hashed token to store in DB
    resetPasswordExpire,  // The expiry date
  };
};


// Password validation
const validatePassword = (password) => {
  // Note: This function exists but is not currently used in the controllers for password validation.
  // We will add validation logic directly in the controller for simplicity here, but this utility
  // could be used to centralize it. For this specific task, we'll rely on the controller.
  console.warn("passwordUtils.validatePassword is not actively used for validation in controllers in this commit.");

  const hasMinLength = password.length >= 8;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

  const isValid = hasMinLength && hasUpperCase && hasLowerCase && hasNumber && hasSpecialChar;

  const errors = [];
  if (!hasMinLength) errors.push('Password must be at least 8 characters long');
  if (!hasUpperCase) errors.push('Password must contain at least one uppercase letter');
  if (!hasLowerCase) errors.push('Password must contain at least one lowercase letter');
  if (!hasNumber) errors.push('Password must contain at least one number');
  if (!hasSpecialChar) errors.push('Password must contain at least one special character');

  return {
    isValid,
    errors
  };
};

module.exports = {
  generateToken,
  generateResetToken, // Export the new function
  validatePassword
};
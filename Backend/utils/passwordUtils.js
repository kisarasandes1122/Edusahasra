const jwt = require('jsonwebtoken');
const crypto = require('crypto'); 
const { JWT_SECRET, JWT_EXPIRES_IN } = require('../config/config');

const generateToken = (id) => {
  return jwt.sign({ id }, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN
  });
};

const generateResetToken = () => {
  const resetToken = crypto.randomBytes(20).toString('hex'); 
  const resetPasswordToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  const resetPasswordExpire = Date.now() + 60 * 60 * 1000; 

  return {
    resetToken,           
    resetPasswordToken,  
    resetPasswordExpire,  
  };
};


const validatePassword = (password) => {
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
  generateResetToken, 
  validatePassword
};
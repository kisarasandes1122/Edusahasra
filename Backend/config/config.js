require('dotenv').config();

module.exports = {
  PORT: process.env.PORT || 5000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  MONGO_URI: process.env.MONGO_URI || 'mongodb://localhost:27017/donor_registration',
  JWT_SECRET: process.env.JWT_SECRET || 'donorapp123',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '30d',
  GEOCODE_API_URL: process.env.GEOCODE_API_URL || 'https://nominatim.openstreetmap.org/reverse',
  GEOCODE_USER_AGENT: process.env.GEOCODE_USER_AGENT || 'DonorRegistrationApp',
  EMAIL_USER: process.env.EMAIL_USER,
  EMAIL_PASS: process.env.EMAIL_PASS,
};
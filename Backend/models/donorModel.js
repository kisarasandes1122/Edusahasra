// backend/models/donorModel.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const validator = require('validator');
const crypto = require('crypto'); // Import crypto

const donorSchema = mongoose.Schema(
  {
    fullName: {
      type: String,
      required: [true, 'Please add a full name'],
      trim: true
    },
    email: {
      type: String,
      required: [true, 'Please add an email'],
      unique: true,
      trim: true,
      lowercase: true,
      validate: [validator.isEmail, 'Please enter a valid email']
    },
    password: {
      type: String,
      required: [true, 'Please add a password'],
      minlength: [8, 'Password must be at least 8 characters'],
      select: false // Keep password hidden by default
    },
    phoneNumber: {
      type: String,
      required: [true, 'Please add a phone number'],
      validate: {
        validator: function(v) {
          // Basic validation for Sri Lankan numbers (+94xxxxxxxxx or 0xxxxxxxxx)
          return /^(?:\+94|0)[0-9]{9}$/.test(v);
        },
        message: props => `${props.value} is not a valid phone number format!`
      }
    },
    address: {
      type: String,
      required: [true, 'Please add an address']
    },
    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point'
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        required: true
      }
    },
    agreeToTerms: {
      type: Boolean,
      required: [true, 'You must agree to the terms and conditions']
    },
    // --- Added fields for notification preferences ---
    notificationPreferences: {
      email: {
        type: Boolean,
        default: true
      },
      donationUpdates: {
        type: Boolean,
        default: true
      },
      impactReports: {
        type: Boolean,
        default: true
      },
       // SMS and Newsletter options removed as per request
      // sms: { type: Boolean, default: false },
      // newsletterUpdates: { type: Boolean, default: false }
    },
    // --- Added fields for password reset (forgot password) ---
    resetPasswordToken: String,
    resetPasswordExpire: Date

  },
  {
    timestamps: true
  }
);

// Create index for geospatial queries
donorSchema.index({ location: '2dsphere' });

// Pre-save hook to hash password
donorSchema.pre('save', async function(next) {
  // Only run this function if password was actually modified
  if (!this.isModified('password')) {
    return next();
  }

  // Hash the password with cost of 10
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Method to check if entered password matches with stored password
donorSchema.methods.matchPassword = async function(enteredPassword) {
  // This comparison method needs the password to be selected
  // In controllers, ensure `.select('+password')` is used when fetching the donor for login/password change
  return await bcrypt.compare(enteredPassword, this.password);
};

// Method to get reset password token (hashed)
donorSchema.methods.getResetPasswordToken = function() {
    // Note: This method is not strictly necessary if we generate the token and hash in the controller
    // or utility. Keeping it as a potential pattern, but the `generateResetToken` utility
    // is a cleaner approach as it handles both raw and hashed versions.
    console.warn("donorModel.getResetPasswordToken method is present but not actively used in this commit's logic.");
    const resetToken = crypto.randomBytes(20).toString('hex');

    this.resetPasswordToken = crypto
        .createHash('sha256')
        .update(resetToken)
        .digest('hex');

    this.resetPasswordExpire = Date.now() + 10 * 60 * 1000; // 10 minutes expiry

    return resetToken;
};


const Donor = mongoose.model('Donor', donorSchema);

module.exports = Donor;
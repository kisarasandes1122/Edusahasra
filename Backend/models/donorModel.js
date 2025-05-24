const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const validator = require('validator');
const crypto = require('crypto'); 

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
        type: [Number], 
        required: true
      }
    },
    agreeToTerms: {
      type: Boolean,
      required: [true, 'You must agree to the terms and conditions']
    },
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
       
    },
 
    resetPasswordToken: String,
    resetPasswordExpire: Date

  },
  {
    timestamps: true
  }
);

donorSchema.index({ location: '2dsphere' });

donorSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    return next();
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

donorSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

donorSchema.methods.getResetPasswordToken = function() {
    console.warn("donorModel.getResetPasswordToken method is present but not actively used in this commit's logic.");
    const resetToken = crypto.randomBytes(20).toString('hex');

    this.resetPasswordToken = crypto
        .createHash('sha256')
        .update(resetToken)
        .digest('hex');

    this.resetPasswordExpire = Date.now() + 10 * 60 * 1000; 

    return resetToken;
};


const Donor = mongoose.model('Donor', donorSchema);

module.exports = Donor;
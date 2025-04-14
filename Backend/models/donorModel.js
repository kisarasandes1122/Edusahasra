const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const validator = require('validator');

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
      minlength: [8, 'Password must be at least 8 characters']
    },
    phoneNumber: {
      type: String,
      required: [true, 'Please add a phone number'],
      validate: {
        validator: function(v) {
          return /^[+]?[(]?[0-9]{3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{4,6}$/.test(v);
        },
        message: props => `${props.value} is not a valid phone number!`
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
    }
  },
  {
    timestamps: true
  }
);

// Create index for geospatial queries
donorSchema.index({ location: '2dsphere' });

// Pre-save hook to hash password
donorSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    next();
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Method to check if entered password matches with stored password
donorSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

const Donor = mongoose.model('Donor', donorSchema);

module.exports = Donor;
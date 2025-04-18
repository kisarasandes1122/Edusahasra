const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const validator = require('validator');

const schoolSchema = new mongoose.Schema({
  // --- School Information ---
  schoolName: {
    type: String,
    required: [true, 'Please provide a school name'],
    trim: true
  },
  schoolEmail: {
    type: String,
    required: [true, 'Please provide a school email'],
    unique: true,
    trim: true,
    lowercase: true,
    validate: [validator.isEmail, 'Please provide a valid school email']
  },
  password: {
    type: String,
    required: [true, 'Please provide a password'],
    minlength: [8, 'Password must be at least 8 characters'],
    select: false // Keep password hidden by default
  },

  // --- School Address ---
  streetAddress: {
    type: String,
    required: [true, 'Please provide a street address'],
    trim: true
  },
  city: {
    type: String,
    required: [true, 'Please provide a city'],
    trim: true
  },
  district: {
    type: String,
    required: [true, 'Please provide a district'],
    trim: true
  },
  province: {
    type: String,
    required: [true, 'Please provide a province'],
    trim: true
  },
  postalCode: {
    type: String,
    required: [true, 'Please provide a postal code'],
    trim: true
  },
  additionalRemarks: {
    type: String,
    trim: true
  },

  // --- Location Data (Geospatial) ---
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      index: '2dsphere'
    }
  },

  // --- Principal Information ---
  principalName: {
    type: String,
    required: [true, 'Please provide the principal\'s name'],
    trim: true
  },
  principalEmail: {
    type: String,
    required: [true, 'Please provide the principal\'s email'],
    trim: true,
    lowercase: true,
    validate: [validator.isEmail, 'Please provide a valid principal email']
  },
  phoneNumber: {
    type: String,
    required: [true, 'Please provide a contact phone number'],
    trim: true,
    validate: {
      validator: function(v) {
        // Basic validation for Sri Lankan numbers (+94xxxxxxxxx or 0xxxxxxxxx)
        return /^(?:\+94|0)[0-9]{9}$/.test(v);
      },
      message: props => `${props.value} is not a valid phone number format!`
    }
  },

  // --- Profile Description & Images (Added for Edit Profile) ---
  description: {
    type: String,
    trim: true,
    default: ''
  },
  images: [{
    type: String,
    trim: true
  }],

  // --- Verification Documents (From Registration) ---
  documents: [
    {
      fileName: String,
      fileType: String,
      filePath: String,
      uploadedAt: {
        type: Date,
        default: Date.now
      }
    }
  ],

  // --- Approval Status & Metadata ---
  isApproved: {
    type: Boolean,
    default: false
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
    default: null
  },
  approvedAt: {
    type: Date,
    default: null
  },
  registeredAt: {
    type: Date,
    default: Date.now
  },
  adminRemarks: {
    type: String,
    trim: true,
    default: null
  }
}, {
  timestamps: true
});

// --- Middleware ---

// Encrypt password using bcrypt before saving (only if modified)
schoolSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    return next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// --- Methods ---

// Instance method to match entered password with hashed password in DB
schoolSchema.methods.matchPassword = async function(enteredPassword) {
  if (!this.password) {
    throw new Error('Password comparison error. Please try again.');
  }
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('School', schoolSchema);
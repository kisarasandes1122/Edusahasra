const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const validator = require('validator'); 

const schoolSchema = new mongoose.Schema({
  // School Information
  schoolName: {
    type: String,
    required: [true, 'Please provide a school name'],
    trim: true // Added trim
  },
  schoolEmail: {
    type: String,
    required: [true, 'Please provide a school email'],
    unique: true,
    trim: true, // Added trim
    lowercase: true, // Added lowercase
    validate: [validator.isEmail, 'Please provide a valid school email'] 
  },
  password: {
    type: String,
    required: [true, 'Please provide a password'],
    minlength: [8, 'Password must be at least 8 characters'], // Use array format
    select: false // Keep password hidden
  },

  // School Address
  streetAddress: {
    type: String,
    required: [true, 'Please provide a street address'],
    trim: true // Added trim
  },
  city: {
    type: String,
    required: [true, 'Please provide a city'],
    trim: true // Added trim
  },
  district: {
    type: String,
    required: [true, 'Please provide a district'],
    trim: true // Added trim
  },
  province: {
    type: String,
    required: [true, 'Please provide a province'],
    trim: true // Added trim
  },
  postalCode: {
    type: String,
    required: [true, 'Please provide a postal code'],
    trim: true // Added trim
  },
  additionalRemarks: {
    type: String,
    trim: true // Added trim
  },

  // Location Data (Geospatial)
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
      // required: true // Consider if location should be mandatory
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      index: '2dsphere'
      // required: true // Consider if location should be mandatory
    }
  },

  // Principal Information
  principalName: {
    type: String,
    required: [true, 'Please provide the principal\'s name'],
    trim: true // Added trim
  },
  principalEmail: {
    type: String,
    required: [true, 'Please provide the principal\'s email'],
    trim: true, // Added trim
    lowercase: true, // Added lowercase
    validate: [validator.isEmail, 'Please provide a valid principal email'] 
  },
  phoneNumber: {
    type: String,
    required: [true, 'Please provide a contact phone number'],
    trim: true, // Added trim
    validate: { // Added phone number validation (similar to donorModel)
      validator: function(v) {
        // Basic North American style validation, adjust regex if needed for other formats
        return /^[+]?[(]?[0-9]{3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{4,6}$/.test(v);
      },
      message: props => `${props.value} is not a valid phone number format!`
    }
  },

  // Verification Documents
  documents: [
    {
      fileName: String,
      fileType: String,
      filePath: String, // Path where file is stored on server
      uploadedAt: {
        type: Date,
        default: Date.now
      }
    }
  ],

  // Approval Status & Metadata
  isApproved: {
    type: Boolean,
    default: false
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin', // Reference to the Admin model
    default: null
  },
  approvedAt: {
    type: Date,
    default: null
  },
  registeredAt: { // Kept explicit for clarity, though timestamps:true provides createdAt
    type: Date,
    default: Date.now
  },

  // Admin feedback or rejection reason
  adminRemarks: {
    type: String,
    trim: true, // Added trim
    default: null
  }
}, {
  timestamps: true // Use Mongoose timestamps for createdAt and updatedAt
});

// Encrypt password using bcrypt before saving
schoolSchema.pre('save', async function(next) {
  // Only run this function if password was actually modified
  if (!this.isModified('password')) {
    return next(); // Added return
  }

  // Hash the password
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Instance method to match entered password with hashed password in DB
schoolSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('School', schoolSchema);
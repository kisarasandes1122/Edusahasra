const mongoose = require('mongoose');

const thankYouImageSchema = new mongoose.Schema({
  fileName: {
    type: String,
    required: true,
  },
  filePath: { 
    type: String,
    required: true,
  },
  fileType: { 
    type: String,
    required: true,
  }
}, { _id: false });


const thankYouSchema = new mongoose.Schema(
  {
    donor: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'Donor',
      index: true,
    },
    school: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'School',
      index: true,
    },
    donation: { 
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'Donation',
      unique: true, 
      index: true,
    },
    message: {
      type: String,
      required: [true, 'A thank you message is required.'],
      trim: true,
      maxlength: [1000, 'Message cannot exceed 1000 characters'],
    },
    images: [thankYouImageSchema], 
    sentAt: { 
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true, 
  }
);

module.exports = mongoose.model('ThankYou', thankYouSchema);
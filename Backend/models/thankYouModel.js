const mongoose = require('mongoose');

const thankYouImageSchema = new mongoose.Schema({
  fileName: {
    type: String,
    required: true,
  },
  filePath: { // Path relative to the uploads directory
    type: String,
    required: true,
  },
  fileType: { // Mime type
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
    donation: { // Link to the specific donation being thanked for
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'Donation',
      unique: true, // Typically, one thank you per donation
      index: true,
    },
    message: {
      type: String,
      required: [true, 'A thank you message is required.'],
      trim: true,
      maxlength: [1000, 'Message cannot exceed 1000 characters'],
    },
    images: [thankYouImageSchema], // Array of uploaded images
    sentAt: { // Keep explicit sentAt, though timestamps:true adds createdAt
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true, // Adds createdAt, updatedAt
  }
);

module.exports = mongoose.model('ThankYou', thankYouSchema);
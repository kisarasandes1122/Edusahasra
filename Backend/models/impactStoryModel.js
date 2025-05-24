const mongoose = require('mongoose');

const impactStoryImageSchema = new mongoose.Schema({
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


const impactStorySchema = new mongoose.Schema(
  {
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
    title: {
      type: String,
      required: [true, 'Please provide a title for the story.'],
      trim: true,
      maxlength: [150, 'Title cannot exceed 150 characters'],
    },
    storyText: {
      type: String,
      required: [true, 'Please write the main story text.'],
      trim: true,
      maxlength: [3000, 'Story text cannot exceed 3000 characters'],
    },
    quote: {
      type: String,
      trim: true,
      maxlength: [500, 'Quote cannot exceed 500 characters'],
    },
    quoteAuthor: {
      type: String,
      trim: true,
      maxlength: [100, 'Quote author cannot exceed 100 characters'],
    },
    images: [impactStoryImageSchema],

    status: {
      type: String,
      enum: ['Pending Approval', 'Approved', 'Rejected'],
      default: 'Pending Approval',
      required: true,
    },
    submittedAt: { 
      type: Date,
      default: Date.now,
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Admin',
      default: null,
    },
    approvedAt: {
      type: Date,
      default: null,
    },
    adminRemarks: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

impactStorySchema.index({ status: 1, submittedAt: -1 });
impactStorySchema.index({ school: 1, submittedAt: -1 });


module.exports = mongoose.model('ImpactStory', impactStorySchema);
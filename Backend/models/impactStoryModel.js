// backend/models/impactStoryModel.js
const mongoose = require('mongoose');

const impactStoryImageSchema = new mongoose.Schema({
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


const impactStorySchema = new mongoose.Schema(
  {
    school: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'School',
      index: true,
    },
    // Link to the specific donation this story is about
    // Assuming one story is tied to one confirmed donation for simplicity.
    // Could be an array if a story covers multiple donations.
    donation: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'Donation',
      unique: true, // Ensure one story per donation for now
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
    images: [impactStoryImageSchema], // Array of uploaded images

    status: {
      type: String,
      enum: ['Pending Approval', 'Approved', 'Rejected'],
      default: 'Pending Approval',
      required: true,
    },
    submittedAt: { // Can use createdAt from timestamps, but explicit might be clearer
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
    adminRemarks: { // Admin notes for rejection or approval specifics
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true, // Adds createdAt, updatedAt
  }
);

// Index to quickly find stories by status for admin/public views
impactStorySchema.index({ status: 1, submittedAt: -1 });
// Index for school to view their own stories
impactStorySchema.index({ school: 1, submittedAt: -1 });


module.exports = mongoose.model('ImpactStory', impactStorySchema);
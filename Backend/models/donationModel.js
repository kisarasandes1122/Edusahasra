const mongoose = require('mongoose');

const donatedItemSchema = new mongoose.Schema({
  categoryId: {
    type: Number,
    required: true,
  },
  categoryNameEnglish: {
    type: String,
    required: true,
    trim: true,
  },
  categoryNameSinhala: {
    type: String,
    required: true,
    trim: true,
  },
  quantityDonated: {
    type: Number,
    required: true,
    min: [1, 'Donated quantity must be at least 1'],
  },
}, { _id: false });

const donationSchema = new mongoose.Schema(
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
    donationRequest: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'DonationRequest',
      index: true,
    },
    itemsDonated: {
      type: [donatedItemSchema],
      required: true,
      validate: [
        (val) => val && val.length > 0,
        'At least one item must be included in the donation.',
      ],
    },
    deliveryMethod: {
      type: String,
      required: true,
      enum: ['Self-Delivery', 'Courier'], // Match frontend terms maybe? Adjust if needed
    },
    donorAddress: { // Used if Courier is selected, donor can provide specific pickup address
      type: String,
      trim: true,
       // Required only if deliveryMethod is 'Courier' - validation handled in controller
    },
    shippingCostEstimate: { // Optional: Store estimate if provided by partner
      type: Number,
    },
    trackingStatus: {
      type: String,
      required: true,
      enum: [
        'Pending Confirmation', // Initial state after donor submits
        'Preparing',            // Donor/Courier is preparing shipment
        'In Transit',           // Package is on its way
        'Delivered',            // Package arrived at school (or donor confirmed drop-off)
        'Received by School',   // School explicitly confirmed receipt - FINAL state
        'Cancelled',            // Donation cancelled
      ],
      default: 'Pending Confirmation',
    },
    statusLastUpdatedAt: {
      type: Date,
      default: Date.now,
    },
    donorRemarks: { // Optional notes from donor
      type: String,
      trim: true,
      maxlength: 500,
    },
    schoolConfirmation: { // Flag set by school
      type: Boolean,
      default: false,
    },
    schoolConfirmationAt: {
      type: Date,
    },
    adminTrackingId: { // For courier service tracking ID entered by admin
      type: String,
      trim: true,
    },
    adminRemarks: { // Admin notes specific to this delivery
        type: String,
        trim: true,
    },
  },
  {
    timestamps: true, // Adds createdAt, updatedAt
  }
);

// Index to quickly find donations by status for specific actors
donationSchema.index({ donor: 1, trackingStatus: 1 });
donationSchema.index({ school: 1, trackingStatus: 1 });
donationSchema.index({ trackingStatus: 1 }); // General status queries

module.exports = mongoose.model('Donation', donationSchema);
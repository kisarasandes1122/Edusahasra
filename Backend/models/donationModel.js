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
      enum: ['Self-Delivery', 'Courier'], 
    },
    donorAddress: { 
      type: String,
      trim: true,
    
    },
    shippingCostEstimate: { 
      type: Number,
    },
    trackingStatus: {
      type: String,
      required: true,
      enum: [
        'Pending Confirmation', 
        'Preparing',            
        'In Transit',           
        'Delivered',           
        'Received by School',   
        'Cancelled',            
      ],
      default: 'Preparing',
    },
    statusLastUpdatedAt: {
      type: Date,
      default: Date.now,
    },
    donorRemarks: { 
      type: String,
      trim: true,
      maxlength: 500,
    },
    schoolConfirmation: { 
      type: Boolean,
      default: false,
    },
    schoolConfirmationAt: {
      type: Date,
    },
    adminTrackingId: { 
      type: String,
      trim: true,
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

donationSchema.index({ donor: 1, trackingStatus: 1 });
donationSchema.index({ school: 1, trackingStatus: 1 });
donationSchema.index({ trackingStatus: 1 }); 

module.exports = mongoose.model('Donation', donationSchema);
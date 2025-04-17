const mongoose = require('mongoose');

const requestedItemSchema = new mongoose.Schema({
  categoryId: {
    type: Number, // Matches the ID in the frontend's availableCategories
    required: [true, 'Category ID is required'],
  },
  categoryNameEnglish: {
    type: String,
    required: [true, 'English category name is required'],
    trim: true,
  },
  categoryNameSinhala: {
    type: String,
    required: [true, 'Sinhala category name is required'],
    trim: true,
  },
  quantity: {
    type: Number,
    required: [true, 'Quantity is required'],
    min: [1, 'Quantity must be at least 1'], // Basic validation, controller will enforce minimum threshold
  },
}, { _id: false }); // Don't create separate _id for subdocuments unless needed

const donationRequestSchema = new mongoose.Schema(
  {
    school: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'School', // Reference to the School model
      index: true,   // Index for faster lookups by school
    },
    requestedItems: {
      type: [requestedItemSchema],
      required: true,
      validate: [
        {
          validator: function(items) {
            return items && items.length > 0;
          },
          message: 'At least one donation item must be requested.',
        },
        { // Ensure unique category IDs within the same request
            validator: function(items) {
                const categoryIds = items.map(item => item.categoryId);
                return new Set(categoryIds).size === categoryIds.length;
            },
            message: 'Duplicate item categories are not allowed in the same request.'
        }
      ],
    },
    status: {
      type: String,
      enum: ['Pending', 'Partially Fulfilled', 'Fulfilled', 'Closed', 'Cancelled'],
      default: 'Pending',
      required: true,
    },
    notes: { // Optional notes from the school
      type: String,
      trim: true,
      maxlength: [500, 'Notes cannot exceed 500 characters']
    },
    fulfilledByDonors: [ // Optional: Track which donors fulfilled parts of the request
      {
        donor: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Donor',
        },
        itemsFulfilled: [
          {
            categoryId: Number,
            quantityFulfilled: Number,
            fulfilledAt: { type: Date, default: Date.now },
          }
        ],
        // Add more details as needed
      }
    ],
    // Timestamps provided by mongoose option below
  },
  {
    timestamps: true, // Adds createdAt and updatedAt automatically
  }
);

module.exports = mongoose.model('DonationRequest', donationRequestSchema);
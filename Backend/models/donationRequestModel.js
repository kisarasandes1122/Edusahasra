const mongoose = require('mongoose');

const requestedItemSchema = new mongoose.Schema({
  categoryId: {
    type: Number, 
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
    required: [true, 'Requested quantity is required'],
    min: [1, 'Quantity must be at least 1'],
  },

  quantityReceived: { 
      type: Number,
      required: true,
      default: 0,
      min: 0,
  },
}, { _id: false });

const donationRequestSchema = new mongoose.Schema(
  {
    school: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'School',
      index: true,
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
        {
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
    notes: {
      type: String,
      trim: true,
      maxlength: [500, 'Notes cannot exceed 500 characters']
    },
    
  },
  {
    timestamps: true,
  }
);

donationRequestSchema.methods.updateRequestStatus = function() {
    let totalRequested = 0;
    let totalReceived = 0;
    let isPartiallyFulfilled = false;

    this.requestedItems.forEach(item => {
        totalRequested += item.quantity; // Use quantity (requested)
        totalReceived += item.quantityReceived;
        if (item.quantityReceived > 0 && item.quantityReceived < item.quantity) {
            isPartiallyFulfilled = true;
        }
    });

    if (totalReceived === 0) {
        this.status = 'Pending';
    } else if (totalReceived >= totalRequested) {
        this.status = 'Fulfilled';
    } else if (totalReceived > 0) {
        this.status = 'Partially Fulfilled';
    } else {
        this.status = 'Pending'; // Default case
    }
};

module.exports = mongoose.model('DonationRequest', donationRequestSchema);
// controllers/donationController.js
const asyncHandler = require('express-async-handler');
const Donation = require('../models/donationModel');
const DonationRequest = require('../models/donationRequestModel');
const School = require('../models/schoolModel');
const Donor = require('../models/donorModel');
const mongoose = require('mongoose');

// --- Helper Function to check remaining quantity ---
const checkRemainingQuantity = (request, itemsToDonate) => {
    const errors = [];
    const updates = []; // Store potential updates to quantityReceived temporarily if needed

    for (const donatedItem of itemsToDonate) {
        const requestedItem = request.requestedItems.find(
            (item) => item.categoryId === donatedItem.categoryId
        );

        if (!requestedItem) {
            errors.push(`Item with category ID ${donatedItem.categoryId} not found in the original request.`);
            continue;
        }

        const remaining = requestedItem.quantity - requestedItem.quantityReceived; // Use quantity and quantityReceived

        if (donatedItem.quantityDonated > remaining) {
            errors.push(
                `Cannot donate ${donatedItem.quantityDonated} of ${requestedItem.categoryNameEnglish}. Only ${remaining} remaining.`
            );
        }
        // Optional: Could track intended donations here if needed before confirmation
    }
    return { errors };
};


// @desc    Create a new donation commitment
// @route   POST /api/donations
// @access  Private (Donor)
const createDonation = asyncHandler(async (req, res) => {
    const {
        donationRequestId,
        itemsDonated, // Expected format: [{ categoryId, quantityDonated, categoryNameEnglish, categoryNameSinhala }]
        deliveryMethod, // 'Self-Delivery' or 'Courier'
        donorAddress,   // Required if deliveryMethod is 'Courier'
        donorRemarks,
        shippingCostEstimate // Optional
    } = req.body;
    const donorId = req.donor._id;

    // --- Validation ---
    if (!mongoose.Types.ObjectId.isValid(donationRequestId)) {
        res.status(400);
        throw new Error('Invalid Donation Request ID format.');
    }
    if (!itemsDonated || !Array.isArray(itemsDonated) || itemsDonated.length === 0) {
        res.status(400);
        throw new Error('Items donated list cannot be empty.');
    }
    if (!['Self-Delivery', 'Courier'].includes(deliveryMethod)) {
        res.status(400);
        throw new Error('Invalid delivery method specified.');
    }
    if (deliveryMethod === 'Courier' && !donorAddress) {
        res.status(400);
        throw new Error('Donor address is required for courier delivery.');
    }

    // Check Category IDs are unique within the donation
    const categoryIds = itemsDonated.map(item => item.categoryId);
    if (new Set(categoryIds).size !== categoryIds.length) {
         res.status(400);
         throw new Error('Duplicate item categories are not allowed in the same donation.');
    }

    // Fetch the donation request
    const donationRequest = await DonationRequest.findById(donationRequestId);
    if (!donationRequest) {
        res.status(404);
        throw new Error('Donation Request not found.');
    }

    // Check if request is already fulfilled or cancelled
    if (['Fulfilled', 'Closed', 'Cancelled'].includes(donationRequest.status)) {
        res.status(400);
        throw new Error(`Cannot donate to a request that is already ${donationRequest.status}.`);
    }

    // Validate quantities against remaining needs
    const { errors } = checkRemainingQuantity(donationRequest, itemsDonated);
    if (errors.length > 0) {
        res.status(400);
        // Join errors for a clearer message
        throw new Error(`Quantity validation failed: ${errors.join('; ')}`);
    }

    // --- Create Donation ---
    const donation = await Donation.create({
        donor: donorId,
        school: donationRequest.school, // Get school ID from the request
        donationRequest: donationRequestId,
        itemsDonated: itemsDonated.map(item => ({ // Ensure all required fields are present
            categoryId: item.categoryId,
            quantityDonated: item.quantityDonated,
            categoryNameEnglish: item.categoryNameEnglish,
            categoryNameSinhala: item.categoryNameSinhala,
        })),
        deliveryMethod,
        donorAddress: deliveryMethod === 'Courier' ? donorAddress : undefined,
        donorRemarks,
        shippingCostEstimate,
        trackingStatus: 'Pending Confirmation', // Initial status
        statusLastUpdatedAt: Date.now(),
        schoolConfirmation: false, // Not confirmed yet
    });

    if (donation) {
        res.status(201).json({
            message: 'Donation commitment created successfully. Pending confirmation and delivery.',
            donation,
        });
    } else {
        res.status(500);
        throw new Error('Failed to create donation commitment.');
    }
});


// @desc    Get donations made by the logged-in donor
// @route   GET /api/donations/my-donations
// @access  Private (Donor)
const getMyDonations = asyncHandler(async (req, res) => {
    const donations = await Donation.find({ donor: req.donor._id })
        .populate('school', 'schoolName city') // Populate school details
        .sort({ createdAt: -1 });
    res.json(donations);
});

// @desc    Get donations incoming to the logged-in school
// @route   GET /api/donations/school-donations
// @access  Private (School)
const getSchoolDonations = asyncHandler(async (req, res) => {
    const donations = await Donation.find({ school: req.school._id })
        .populate('donor', 'fullName email phoneNumber') // Populate donor details (careful with privacy)
        .sort({ createdAt: -1 });
    res.json(donations);
});

// @desc    Get donations for admin view (can add filtering)
// @route   GET /api/donations/admin-view
// @access  Private (Admin)
const getAdminDonations = asyncHandler(async (req, res) => {
    // Add filtering/pagination as needed
    const donations = await Donation.find({})
        .populate('donor', 'fullName email')
        .populate('school', 'schoolName city')
        .sort({ createdAt: -1 });
    res.json(donations);
});


// @desc    Get a specific donation by ID
// @route   GET /api/donations/:id
// @access  Private (Donor, School, Admin - with checks)
const getDonationById = asyncHandler(async (req, res) => {
    console.log('Fetching donation with ID:', req.params.id); // Log the requested ID
    const donation = await Donation.findById(req.params.id)
        .populate('donor', 'fullName email phoneNumber')
        .populate('school', 'schoolName schoolEmail city');

    if (!donation) {
        console.log('Donation not found in DB for ID:', req.params.id); // Log if not found
        res.status(404);
        throw new Error('Donation not found.');
    }

    // Log who is making the request
    console.log('Request made by:', {
         donor: req.donor ? req.donor._id : null,
         school: req.school ? req.school._id : null,
         admin: req.admin ? req.admin._id : null
    });
    // Log donation owner/recipient
    console.log('Donation details:', {
         donorId: donation.donor ? donation.donor._id : null,
         schoolId: donation.school ? donation.school._id : null
    });


    // --- Authorization Check ---
    const isDonor = req.donor && donation.donor && donation.donor._id.toString() === req.donor._id.toString();
    const isSchool = req.school && donation.school && donation.school._id.toString() === req.school._id.toString();
    const isAdmin = req.admin;

    console.log('Authorization check:', { isDonor, isSchool, isAdmin }); // Log permission check results


    if (!isDonor && !isSchool && !isAdmin) {
         console.log('Authorization failed!'); // Log auth failure
        res.status(403);
        throw new Error('Not authorized to view this donation.');
    }

    console.log('Authorization passed. Sending donation.'); // Log success
    res.json(donation);
});


// @desc    Update donation tracking status (by Donor for Self-Delivery)
// @route   PUT /api/donations/:id/status
// @access  Private (Donor)
const updateDonationStatusByDonor = asyncHandler(async (req, res) => {
    const { newStatus } = req.body;
    const donationId = req.params.id;
    const donorId = req.donor._id;

    // Allowed statuses for donor update (Self-Delivery)
    const allowedStatuses = ['Preparing', 'In Transit', 'Delivered'];
    if (!allowedStatuses.includes(newStatus)) {
        res.status(400);
        throw new Error(`Invalid status update: "${newStatus}". Allowed: ${allowedStatuses.join(', ')}`);
    }

    const donation = await Donation.findById(donationId);

    if (!donation) {
        res.status(404);
        throw new Error('Donation not found.');
    }

    // Authorization & Validation
    if (donation.donor.toString() !== donorId.toString()) {
        res.status(403);
        throw new Error('Not authorized to update this donation.');
    }
    if (donation.deliveryMethod !== 'Self-Delivery') {
        res.status(400);
        throw new Error('Donor can only update status for Self-Delivery donations.');
    }
    if (donation.trackingStatus === 'Received by School' || donation.schoolConfirmation) {
        res.status(400);
        throw new Error('Cannot update status after school has confirmed receipt.');
    }
    if (donation.trackingStatus === 'Cancelled') {
         res.status(400);
         throw new Error('Cannot update status of a cancelled donation.');
    }

    // Add more sophisticated state transition checks if needed (e.g., can't go from Delivered back to Preparing)

    donation.trackingStatus = newStatus;
    donation.statusLastUpdatedAt = Date.now();
    const updatedDonation = await donation.save();

    res.json({ message: 'Donation status updated successfully.', donation: updatedDonation });
});


// @desc    Update donation tracking status (by Admin for Courier)
// @route   PUT /api/donations/:id/admin-status
// @access  Private (Admin)
const updateDonationStatusByAdmin = asyncHandler(async (req, res) => {
    const { newStatus, adminTrackingId, adminRemarks } = req.body;
    const donationId = req.params.id;

    // Allowed statuses for admin update (Courier)
    const allowedStatuses = ['Preparing', 'In Transit', 'Delivered', 'Cancelled']; // Admin can cancel
    if (!allowedStatuses.includes(newStatus)) {
        res.status(400);
        throw new Error(`Invalid status update: "${newStatus}". Allowed: ${allowedStatuses.join(', ')}`);
    }

    const donation = await Donation.findById(donationId);

    if (!donation) {
        res.status(404);
        throw new Error('Donation not found.');
    }

    // Validation
    if (donation.deliveryMethod !== 'Courier') {
        res.status(400);
        throw new Error('Admin can typically only update status for Courier donations this way.');
        // Or adjust logic if admin should override self-delivery status too
    }
     if (donation.trackingStatus === 'Received by School' || donation.schoolConfirmation) {
        res.status(400);
        throw new Error('Cannot update status after school has confirmed receipt.');
    }
    

    donation.trackingStatus = newStatus;
    donation.statusLastUpdatedAt = Date.now();
    if (adminTrackingId !== undefined) donation.adminTrackingId = adminTrackingId;
    if (adminRemarks !== undefined) donation.adminRemarks = adminRemarks;


    const updatedDonation = await donation.save();

    res.json({ message: 'Donation status updated by admin.', donation: updatedDonation });
});


// @desc    Confirm receipt of a donation (by School)
// @route   PUT /api/donations/:id/confirm-receipt
// @access  Private (School)
const confirmDonationReceipt = asyncHandler(async (req, res) => {
    const donationId = req.params.id;
    const schoolId = req.school._id;

    const donation = await Donation.findById(donationId);

    if (!donation) {
        res.status(404);
        throw new Error('Donation not found.');
    }

    // Authorization & Validation
    if (donation.school.toString() !== schoolId.toString()) {
        res.status(403);
        throw new Error('Not authorized to confirm this donation.');
    }
    if (donation.schoolConfirmation) {
        res.status(400);
        throw new Error('Donation receipt already confirmed.');
    }


    // --- Perform Confirmation ---
    donation.schoolConfirmation = true;
    donation.schoolConfirmationAt = Date.now();
    donation.trackingStatus = 'Received by School'; // Final status
    donation.statusLastUpdatedAt = Date.now();

    // --- Update the Original Donation Request ---
    const donationRequest = await DonationRequest.findById(donation.donationRequest);
    if (!donationRequest) { 
        console.error(`Error: DonationRequest ${donation.donationRequest} not found for confirmed Donation ${donationId}`);
        await donation.save();
        res.status(500).json({ message: 'Donation confirmed, but failed to update original request (Request not found).' });
        return; // Stop further processing
    }

    let needsSave = false;
    donation.itemsDonated.forEach(donatedItem => {
        const requestedItem = donationRequest.requestedItems.find(
            reqItem => reqItem.categoryId === donatedItem.categoryId
        );
        if (requestedItem) {
            const potentialNewReceived = requestedItem.quantityReceived + donatedItem.quantityDonated;
             requestedItem.quantityReceived = potentialNewReceived; // Update received amount

            needsSave = true;
        } else {
             console.warn(`Warning: Category ID ${donatedItem.categoryId} from Donation ${donationId} not found in DonationRequest ${donationRequest._id}`);
        }
    });

    // Update the overall status of the request
    if (needsSave) {
        donationRequest.updateRequestStatus(); // Use the method defined in the model
        await donationRequest.save();
    }

    // Save the confirmed donation
    const updatedDonation = await donation.save();

    res.json({
        message: 'Donation receipt confirmed successfully. Request quantities updated.',
        donation: updatedDonation,
    });
});


module.exports = {
    createDonation,
    getMyDonations,
    getSchoolDonations,
    getAdminDonations,
    getDonationById,
    updateDonationStatusByDonor,
    updateDonationStatusByAdmin,
    confirmDonationReceipt,
};
const asyncHandler = require('express-async-handler');
const Donation = require('../models/donationModel');
const DonationRequest = require('../models/donationRequestModel');
const School = require('../models/schoolModel');
const Donor = require('../models/donorModel');
const mongoose = require('mongoose');
const { sendEmail } = require('./adminController');

const checkRemainingQuantity = (request, itemsToDonate) => {
    const errors = [];
    const updates = [];

    for (const donatedItem of itemsToDonate) {
        const requestedItem = request.requestedItems.find(
            (item) => item.categoryId === donatedItem.categoryId
        );

        if (!requestedItem) {
            errors.push(`Item with category ID ${donatedItem.categoryId} not found in the original request.`);
            continue;
        }

        const remaining = requestedItem.quantity - requestedItem.quantityReceived;

        if (donatedItem.quantityDonated > remaining) {
            errors.push(
                `Cannot donate ${donatedItem.quantityDonated} of ${requestedItem.categoryNameEnglish}. Only ${remaining} remaining.`
            );
        }
    }
    return { errors };
};

// @desc    Create a new donation commitment
// @route   POST /api/donations
// @access  Private (Donor)
const createDonation = asyncHandler(async (req, res) => {
    const {
        donationRequestId,
        itemsDonated,
        deliveryMethod,
        donorAddress,
        donorRemarks,
        shippingCostEstimate
    } = req.body;
    const donorId = req.donor._id;

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

    const categoryIds = itemsDonated.map(item => item.categoryId);
    if (new Set(categoryIds).size !== categoryIds.length) {
         res.status(400);
         throw new Error('Duplicate item categories are not allowed in the same donation.');
    }

    const donationRequest = await DonationRequest.findById(donationRequestId);
    if (!donationRequest) {
        res.status(404);
        throw new Error('Donation Request not found.');
    }

    if (['Fulfilled', 'Closed', 'Cancelled'].includes(donationRequest.status)) {
        res.status(400);
        throw new Error(`Cannot donate to a request that is already ${donationRequest.status}.`);
    }

    const { errors } = checkRemainingQuantity(donationRequest, itemsDonated);
    if (errors.length > 0) {
        res.status(400);
        throw new Error(`Quantity validation failed: ${errors.join('; ')}`);
    }

    const donation = await Donation.create({
        donor: donorId,
        school: donationRequest.school,
        donationRequest: donationRequestId,
        itemsDonated: itemsDonated.map(item => ({
            categoryId: item.categoryId,
            quantityDonated: item.quantityDonated,
            categoryNameEnglish: item.categoryNameEnglish,
            categoryNameSinhala: item.categoryNameSinhala,
        })),
        deliveryMethod,
        donorAddress: deliveryMethod === 'Courier' ? donorAddress : undefined,
        donorRemarks,
        shippingCostEstimate,
        trackingStatus: 'Preparing',
        statusLastUpdatedAt: Date.now(),
        schoolConfirmation: false,
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
        .populate('school', 'schoolName streetAddress city district province postalCode location')
        .sort({ createdAt: -1 });
    res.json(donations);
});

// @desc    Get donations incoming to the logged-in school
// @route   GET /api/donations/school-donations
// @access  Private (School)
const getSchoolDonations = asyncHandler(async (req, res) => {
    const donations = await Donation.find({ school: req.school._id })
        .populate('donor', 'fullName email phoneNumber')
        .sort({ createdAt: -1 });
    res.json(donations);
});

// @desc    Get donations for admin view (can add filtering)
// @route   GET /api/donations/admin-view
// @access  Private (Admin)
const getAdminDonations = asyncHandler(async (req, res) => {
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
    console.log('Fetching donation with ID:', req.params.id);
    const donation = await Donation.findById(req.params.id)
        .populate('donor', 'fullName email phoneNumber')
        .populate('school', 'schoolName schoolEmail city');

    if (!donation) {
        console.log('Donation not found in DB for ID:', req.params.id);
        res.status(404);
        throw new Error('Donation not found.');
    }

    console.log('Request made by:', {
         donor: req.donor ? req.donor._id : null,
         school: req.school ? req.school._id : null,
         admin: req.admin ? req.admin._id : null
    });
    console.log('Donation details:', {
         donorId: donation.donor ? donation.donor._id : null,
         schoolId: donation.school ? donation.school._id : null
    });

    const isDonor = req.donor && donation.donor && donation.donor._id.toString() === req.donor._id.toString();
    const isSchool = req.school && donation.school && donation.school._id.toString() === req.school._id.toString();
    const isAdmin = req.admin;

    console.log('Authorization check:', { isDonor, isSchool, isAdmin });

    if (!isDonor && !isSchool && !isAdmin) {
         console.log('Authorization failed!');
        res.status(403);
        throw new Error('Not authorized to view this donation.');
    }

    console.log('Authorization passed. Sending donation.');
    res.json(donation);
});

// @desc    Update donation tracking status (by Donor for Self-Delivery)
// @route   PUT /api/donations/:id/status
// @access  Private (Donor)
const updateDonationStatusByDonor = asyncHandler(async (req, res) => {
    const { newStatus } = req.body;
    const donationId = req.params.id;
    const donorId = req.donor._id;

    const allowedStatuses = ['Preparing', 'In Transit', 'Delivered', 'Cancelled'];
     if (!allowedStatuses.includes(newStatus)) {
         res.status(400);
         throw new Error(`Invalid status update: "${newStatus}". Allowed for Donor: ${allowedStatuses.join(', ')}`);
     }

    const donation = await Donation.findById(donationId)
        .populate('donor', 'fullName email')
        .populate('school', 'schoolName schoolEmail');

    if (!donation) {
        res.status(404);
        throw new Error('Donation not found.');
    }

    if (donation.donor._id.toString() !== donorId.toString()) {
        res.status(403);
        throw new Error('Not authorized to update this donation.');
    }
    if (donation.deliveryMethod !== 'Self-Delivery') {
        res.status(400);
        throw new Error('Donor can only update status for Self-Delivery donations using this endpoint.');
    }
    const finalStatuses = ['Received by School', 'Cancelled'];
    if (finalStatuses.includes(donation.trackingStatus)) {
        res.status(400);
        throw new Error(`Cannot update status for a donation that is already "${donation.trackingStatus}".`);
    }

    const statusOrder = ['Preparing', 'In Transit', 'Delivered'];
    const currentIndex = statusOrder.indexOf(donation.trackingStatus);
    const newIndex = statusOrder.indexOf(newStatus);

     if (newStatus === 'Cancelled') {
         // Allow cancelling from any status except final ones (checked above)
     } else if (newIndex === -1) {
          res.status(400);
          throw new Error(`Invalid status "${newStatus}" for Self-Delivery update.`);
     } else if (newIndex < currentIndex) {
         res.status(400);
         throw new Error(`Cannot change status from "${donation.trackingStatus}" to "${newStatus}". Invalid transition.`);
     } else if (newIndex > currentIndex + 1) {
          res.status(400);
          throw new Error(`Cannot skip statuses. Next valid status after "${donation.trackingStatus}" is "${statusOrder[currentIndex + 1]}".`);
     }

    const oldStatus = donation.trackingStatus;

    donation.trackingStatus = newStatus;
    donation.statusLastUpdatedAt = Date.now();
    const updatedDonation = await donation.save();

    if (oldStatus !== newStatus) {
        try {
            const schoolMessage = `Dear ${donation.school.schoolName},

The status of a self-delivery donation has been updated by the donor.

Donation Details:
- Previous Status: ${oldStatus}
- New Status: ${newStatus}
- Donor Name: ${donation.donor.fullName}
- Donor Email: ${donation.donor.email}

You can track this donation's status through your account.

Best regards,
EduSahasra Team`;

            await sendEmail({
                email: donation.school.schoolEmail,
                subject: `Donation Status Update: ${newStatus}`,
                message: schoolMessage,
            });
        } catch (emailError) {
            console.error('Failed to send status update email to school:', emailError);
        }
    }

    res.json({ message: 'Donation status updated successfully.', donation: updatedDonation });
});

// @desc    Update donation tracking status (by Admin for Courier)
// @route   PUT /api/donations/:id/admin-status
// @access  Private (Admin)
const updateDonationStatusByAdmin = asyncHandler(async (req, res) => {
    const { newStatus, adminTrackingId, adminRemarks } = req.body;
    const donationId = req.params.id;

    const allowedStatuses = ['Pending Confirmation', 'Preparing', 'In Transit', 'Delivered', 'Received by School', 'Cancelled'];
    if (!allowedStatuses.includes(newStatus)) {
        res.status(400);
        throw new Error(`Invalid status update: "${newStatus}". Allowed for Admin: ${allowedStatuses.join(', ')}`);
    }

    const donation = await Donation.findById(donationId)
        .populate('donor', 'fullName email')
        .populate('school', 'schoolEmail schoolName');

    if (!donation) {
        res.status(404);
        throw new Error('Donation not found.');
    }

    if (donation.trackingStatus === 'Received by School' && newStatus !== 'Received by School') {
        res.status(400);
        throw new Error('Cannot change status after school has confirmed receipt.');
    }

    const oldStatus = donation.trackingStatus;

    donation.trackingStatus = newStatus;
    donation.statusLastUpdatedAt = Date.now();
    if (adminTrackingId !== undefined) donation.adminTrackingId = adminTrackingId;
    if (adminRemarks !== undefined) donation.adminRemarks = adminRemarks;

    const updatedDonation = await donation.save();

    if (oldStatus !== newStatus) {
        try {
            const donorMessage = `Dear ${donation.donor.fullName},\n\n
Your donation status has been updated to "${newStatus}".\n\n
${adminRemarks ? `Admin Remarks: ${adminRemarks}\n\n` : ''}
${adminTrackingId ? `Tracking ID: ${adminTrackingId}\n\n` : ''}
You can track your donation status through your account.\n\n
Best regards,\nEduSahasra Team`;

            const schoolMessage = `Dear ${donation.school.schoolName},\n\n
A donation's status has been updated to "${newStatus}".\n\n
${adminRemarks ? `Admin Remarks: ${adminRemarks}\n\n` : ''}
${adminTrackingId ? `Tracking ID: ${adminTrackingId}\n\n` : ''}
You can track this donation's status through your account.\n\n
Best regards,\nEduSahasra Team`;

            if (donation.donor && donation.donor.email) {
                 await sendEmail({
                    email: donation.donor.email,
                    subject: `Donation Status Update: ${newStatus}`,
                    message: donorMessage,
                 });
            } else {
                 console.warn(`Donor email missing for donation ${donation._id}. Cannot send status update email.`);
            }

             if (donation.school && donation.school.schoolEmail) {
                 await sendEmail({
                    email: donation.school.schoolEmail,
                    subject: `Donation Status Update: ${newStatus}`,
                    message: schoolMessage,
                 });
             } else {
                 console.warn(`School email missing for donation ${donation._id}. Cannot send status update email.`);
             }

        } catch (emailError) {
            console.error('Failed to send status update emails:', emailError);
        }
    }

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

    if (donation.school.toString() !== schoolId.toString()) {
        res.status(403);
        throw new Error('Not authorized to confirm this donation.');
    }
    if (donation.schoolConfirmation || donation.trackingStatus === 'Received by School') {
        res.status(400);
        throw new Error('Donation receipt already confirmed.');
    }
     if (!['Delivered', 'In Transit'].includes(donation.trackingStatus) && donation.deliveryMethod !== 'Self-Delivery') {
          console.warn(`School confirming donation ${donationId} with unexpected status: ${donation.trackingStatus}`);
     }

    donation.schoolConfirmation = true;
    donation.schoolConfirmationAt = Date.now();
    donation.trackingStatus = 'Received by School';
    donation.statusLastUpdatedAt = Date.now();

    const donationRequest = await DonationRequest.findById(donation.donationRequest);
    if (!donationRequest) {
        console.error(`Error: DonationRequest ${donation.donationRequest} not found for confirmed Donation ${donationId}`);
        await donation.save();
        res.status(500).json({ message: 'Donation confirmed, but failed to update original request (Request not found).' });
        return;
    }

    let needsRequestSave = false;
    donation.itemsDonated.forEach(donatedItem => {
        const requestedItem = donationRequest.requestedItems.find(
            reqItem => reqItem.categoryId === donatedItem.categoryId
        );
        if (requestedItem) {
            const potentialNewReceived = requestedItem.quantityReceived + donatedItem.quantityDonated;
             requestedItem.quantityReceived = Math.min(potentialNewReceived, requestedItem.quantity);

            needsRequestSave = true;
        } else {
             console.warn(`Warning: Category ID ${donatedItem.categoryId} from Donation ${donationId} not found in DonationRequest ${donationRequest._id}`);
        }
    });

    if (needsRequestSave) {
        donationRequest.updateRequestStatus();
        await donationRequest.save();
    } else {
        console.warn(`No matching items found in request ${donationRequest._id} for donation ${donationId}. Request status not updated.`);
    }

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
// backend/controllers/analyticsController.js
const asyncHandler = require('express-async-handler');
const School = require('../models/schoolModel');
const Donation = require('../models/donationModel');
const DonationRequest = require('../models/donationRequestModel');
const ImpactStory = require('../models/impactStoryModel');
const Donor = require('../models/donorModel');
const { createObjectCsvWriter } = require('csv-writer');
const PdfPrinter = require('pdfmake');
const fs = require('fs');
const path = require('path');

const getDateRange = (timeRange) => {
    const now = new Date();
    let startDate = null;
    const endDate = new Date(now);
    endDate.setHours(23, 59, 59, 999);

    switch (timeRange) {
        case 'week': startDate = new Date(now); startDate.setDate(now.getDate() - 7); break;
        case 'month': startDate = new Date(now); startDate.setMonth(now.getMonth() - 1); break;
        case 'quarter': startDate = new Date(now); startDate.setMonth(now.getMonth() - 3); break;
        case 'year': startDate = new Date(now); startDate.setFullYear(now.getFullYear() - 1); break;
        case 'all': default: return { startDate: null, endDate: null };
    }
    if (startDate) startDate.setHours(0, 0, 0, 0);
    return { startDate, endDate };
};

const buildDateFilter = (fieldName, startDate, endDate) => {
    if (!startDate || !endDate) return {};
    return { [fieldName]: { $gte: startDate, $lte: endDate } };
};

const fonts = {
    Roboto: {
        normal: path.join(__dirname, '..', 'fonts', 'Roboto-Regular.ttf'),
        bold: path.join(__dirname, '..', 'fonts', 'Roboto-Medium.ttf'),
    }
};

let printer;
try {
    const fontFilesExist = Object.values(fonts.Roboto).every(fontPath => fs.existsSync(fontPath));
    if (fontFilesExist) {
        printer = new PdfPrinter(fonts);
        console.info("[PDFMake Init] PDFMake printer initialized successfully.");
    } else {
        console.error("[PDFMake Init] PDFMake font initialization failed: One or more Roboto font files not found in backend/fonts.");
        printer = null;
    }
} catch (fontError) {
    console.error("[PDFMake Init] PDFMake font initialization encountered an error:", fontError);
    printer = null;
}

const getAnalyticsData = asyncHandler(async (req, res) => {
    const { reportType } = req.params;
    const { timeRange } = req.query;
    const { startDate, endDate } = getDateRange(timeRange);
    let data = {};

    try {
        switch (reportType) {
            case 'donation': {
                const monthlyDonations = await Donation.aggregate([
                    { $match: buildDateFilter('createdAt', startDate, endDate) },
                    { $group: { _id: { $dateToString: { format: "%Y-%m", date: "$createdAt" } }, total: { $sum: 1 } } },
                    { $sort: { _id: 1 } }, { $project: { _id: 0, month: "$_id", total: 1 } }
                ]);
                const donationCategories = await Donation.aggregate([
                    { $match: buildDateFilter('createdAt', startDate, endDate) }, { $unwind: "$itemsDonated" },
                    { $group: { _id: "$itemsDonated.categoryNameEnglish", value: { $sum: "$itemsDonated.quantityDonated" } } },
                    { $sort: { value: -1 } }, { $project: { _id: 0, name: "$_id", value: 1 } }
                ]);
                const regionData = await Donation.aggregate([
                    { $match: buildDateFilter('createdAt', startDate, endDate) },
                    { $lookup: { from: 'schools', localField: 'school', foreignField: '_id', as: 'schoolDetails' } },
                    { $unwind: { path: '$schoolDetails', preserveNullAndEmptyArrays: true } },
                    { $match: { 'schoolDetails.isApproved': true } },
                    { $group: { _id: { $ifNull: ['$schoolDetails.district', 'Unknown District'] }, donations: { $sum: 1 } } },
                    { $project: { _id: 0, name: "$_id", donations: 1, requests: { $literal: Math.floor(Math.random() * 100) + 30 } } }
                ]);
                const totalDonations = await Donation.countDocuments(buildDateFilter('createdAt', startDate, endDate));
                const avgItemsResult = await Donation.aggregate([
                    { $match: buildDateFilter('createdAt', startDate, endDate) }, { $unwind: "$itemsDonated" },
                    { $group: { _id: null, totalItems: { $sum: "$itemsDonated.quantityDonated" }, totalDonations: { $addToSet: "$_id" } } },
                    { $project: { _id: 0, avgItems: { $divide: ["$totalItems", { $cond: [{ $eq: [{ $size: "$totalDonations" }, 0] }, 1, { $size: "$totalDonations" }] }] } } }
                ]);
                const avgItemsPerDonation = avgItemsResult.length > 0 && avgItemsResult[0].avgItems !== null ? avgItemsResult[0].avgItems.toFixed(1) : 0;
                const fulfillmentRateResult = await DonationRequest.aggregate([
                    { $match: buildDateFilter('createdAt', startDate, endDate) }, { $unwind: "$requestedItems" },
                    { $group: { _id: null, totalRequested: { $sum: "$requestedItems.quantity" }, totalReceived: { $sum: "$requestedItems.quantityReceived" } } },
                    { $project: { _id: 0, rate: { $round: [ { $multiply: [ { $divide: [ "$totalReceived", { $cond: [{ $eq: ["$totalRequested", 0] }, 1, "$totalRequested"] } ] }, 100 ] }, 0 ] } } }
                ]);
                const fulfillmentRate = fulfillmentRateResult.length > 0 && fulfillmentRateResult[0].rate !== null ? fulfillmentRateResult[0].rate : 0;
                const activeRequestsCount = await DonationRequest.countDocuments({ ...buildDateFilter('createdAt', startDate, endDate), status: { $in: ['Pending', 'Partially Fulfilled'] } });
                data = { monthlyDonations, resourceCategories: donationCategories, regionData, donationStats: { totalDonations, avgDonationValue: `Avg Items: ${avgItemsPerDonation}`, fulfillmentRate: `${fulfillmentRate}%`, activeRequests: activeRequestsCount } };
                break;
            }
            case 'users': {
                let effectiveStartDate = startDate || await School.findOne({ isApproved: true }).sort({ registeredAt: 1 }).select('registeredAt -_id').lean().then(s => s?.registeredAt) || await Donor.findOne().sort({ createdAt: 1 }).select('createdAt -_id').lean().then(d => d?.createdAt) || new Date();
                effectiveStartDate = new Date(effectiveStartDate.getFullYear(), effectiveStartDate.getMonth(), 1);
                const endLimitDate = endDate ? new Date(endDate.getFullYear(), endDate.getMonth() + 1, 0, 23, 59, 59, 999) : new Date();
                endLimitDate.setHours(23,59,59,999);
                let currentDate = new Date(effectiveStartDate);
                const allMonthsSet = new Set();
                while (currentDate <= endLimitDate) {
                    allMonthsSet.add(`${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`);
                    currentDate.setMonth(currentDate.getMonth() + 1);
                }
                const userGrowth = [];
                const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
                for (const month of Array.from(allMonthsSet).sort()) {
                    const [year, monthNumStr] = month.split('-');
                    const endOfMonth = new Date(parseInt(year), parseInt(monthNumStr), 0, 23, 59, 59, 999);
                    const totalSchoolsUpToMonth = await School.countDocuments({ isApproved: true, registeredAt: { $lte: endOfMonth } });
                    const totalDonorsUpToMonth = await Donor.countDocuments({ createdAt: { $lte: endOfMonth } });
                    userGrowth.push({ month: `${monthNames[parseInt(monthNumStr) - 1]} ${year}`, schools: totalSchoolsUpToMonth, donors: totalDonorsUpToMonth });
                }
                const userRetention = [ { month: 'Jan 2024', rate: 85 }, { month: 'Feb 2024', rate: 82 }, { month: 'Mar 2024', rate: 88 }, { month: 'Apr 2024', rate: 90 }, { month: 'May 2024', rate: 92 }, { month: 'Jun 2024', rate: 94 }, { month: 'Jul 2024', rate: 91 }, { month: 'Aug 2024', rate: 93 }, { month: 'Sep 2024', rate: 95 }, { month: 'Oct 2024', rate: 96 }, { month: 'Nov 2024', rate: 94 }, { month: 'Dec 2024', rate: 97 }, ];
                const totalApprovedSchools = await School.countDocuments({ isApproved: true });
                const totalDonors = await Donor.countDocuments();
                data = { userGrowth, userRetention, userStats: { totalSchools: totalApprovedSchools, totalDonors, avgSessionDuration: '6m 32s', returningUsersRate: '62%' } };
                break;
            }
            case 'resources': {
                const totalRequestedByCat = await DonationRequest.aggregate([
                    { $match: buildDateFilter('createdAt', startDate, endDate) }, { $unwind: "$requestedItems" },
                    { $group: { _id: "$requestedItems.categoryNameEnglish", requested: { $sum: "$requestedItems.quantity" }, received: { $sum: "$requestedItems.quantityReceived" } } },
                    { $project: { _id: 0, category: "$_id", requested: 1, received: 1, fulfilled: { $round: [{ $multiply: [{ $divide: ["$received", { $cond: [{ $eq: ["$requested", 0] }, 1, "$requested"] }] }, 100] }, 0] }, unfulfilled: { $round: [{ $multiply: [{ $divide: [{ $subtract: ["$requested", "$received"] }, { $cond: [{ $eq: ["$requested", 0] }, 1, "$requested"] }] }, 100] }, 0] } } },
                    { $sort: { requested: -1 } }
                ]);
                const regionalCoverage = [ { region: 'Central', coverage: 75 }, { region: 'Eastern', coverage: 60 }, { region: 'Northern', coverage: 55 }, { region: 'Southern', coverage: 70 }, { region: 'Western', coverage: 85 } ];
                data = { fulfillmentRate: totalRequestedByCat, regionalCoverage };
                break;
            }
            case 'impact': {
                const studentsBenefited = await Donation.aggregate([
                    { $match: { schoolConfirmation: true, trackingStatus: 'Received by School', ...buildDateFilter('schoolConfirmationAt', startDate, endDate) } },
                    { $group: { _id: { $dateToString: { format: "%Y-%m", date: "$schoolConfirmationAt" } }, count: { $sum: 1 } } }, // Assuming 1 donation helps X students or count is #donations.
                    { $sort: { _id: 1 } }, { $project: { _id: 0, month: "$_id", count: 1 } }
                ]);
                const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
                const studentsBenefitedFormatted = studentsBenefited.map(item => ({ month: `${monthNames[parseInt(item.month.split('-')[1]) - 1]} ${item.month.split('-')[0]}`, count: item.count }));
                const donationImpact = [ { category: 'Access to Resources', impact: 85 }, { category: 'Learning Environment', impact: 70 }, { category: 'Student Participation', impact: 75 }, { category: 'Teacher Effectiveness', impact: 65 }, ];
                data = { studentsBenefited: studentsBenefitedFormatted, donationImpact };
                break;
            }
            case 'logistics': {
                const deliveryTime = await Donation.aggregate([
                    { $match: { schoolConfirmation: true, trackingStatus: 'Received by School', ...buildDateFilter('schoolConfirmationAt', startDate, endDate), createdAt: { $exists: true, $ne: null } } },
                    { $addFields: { processingDurationMs: { $subtract: ["$schoolConfirmationAt", "$createdAt"] } } },
                    { $match: { processingDurationMs: { $gte: 0 } } },
                    { $group: { _id: "$deliveryMethod", avgDurationMs: { $avg: "$processingDurationMs" } } },
                    { $project: { _id: 0, method: "$_id", avgDays: { $round: [{ $divide: ["$avgDurationMs", 86400000] }, 1] } } }
                ]);
                const deliveryStatus = await Donation.aggregate([
                    { $match: buildDateFilter('createdAt', startDate, endDate) },
                    { $group: { _id: "$trackingStatus", count: { $sum: 1 } } },
                    { $project: { _id: 0, name: "$_id", value: "$count" } }
                ]);
                const recentDeliveries = await Donation.find({ schoolConfirmation: true, trackingStatus: 'Received by School', ...buildDateFilter('schoolConfirmationAt', startDate, endDate) })
                    .populate('school', 'schoolName city').select('_id createdAt itemsDonated deliveryMethod trackingStatus school schoolConfirmationAt')
                    .sort({ schoolConfirmationAt: -1 }).lean();
                const formattedRecentDeliveries = recentDeliveries.map(del => ({ donationId: del._id.toString(), schoolName: del.school?.schoolName, schoolCity: del.school?.city, itemsSummary: del.itemsDonated.map(item => `${item.quantityDonated} ${item.categoryNameEnglish}`).join(', '), deliveryMethod: del.deliveryMethod, status: del.trackingStatus, date: del.schoolConfirmationAt ? del.schoolConfirmationAt.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 'N/A' }));
                data = { deliveryTime, deliveryStatus, recentDeliveries: formattedRecentDeliveries };
                break;
            }
            case 'verification': {
                const verificationRate = await School.aggregate([
                    { $match: buildDateFilter('registeredAt', startDate, endDate) },
                    { $group: { _id: { $dateToString: { format: "%Y-%m", date: "$registeredAt" } }, approved: { $sum: { $cond: ["$isApproved", 1, 0] } }, rejected: { $sum: { $cond: [{ $and: [{ $eq: ["$isApproved", false] }, { $ne: ["$adminRemarks", null] }, { $ne: ["$adminRemarks", ""] }] }, 1, 0] } }, total: { $sum: 1 } } },
                    { $sort: { _id: 1 } }, { $project: { _id: 0, month: "$_id", approved: 1, rejected: 1 } }
                ]);
                 const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
                const verificationRateFormatted = verificationRate.map(item => ({ month: `${monthNames[parseInt(item.month.split('-')[1]) - 1]} ${item.month.split('-')[0]}`, approved: item.approved, rejected: item.rejected }));
                const processingTime = await School.aggregate([
                    { $match: { $or: [{ isApproved: true }, { isApproved: false, adminRemarks: { $ne: null, $ne: "" } }], registeredAt: { $exists: true, $ne: null }, approvedAt: { $exists: true, $ne: null }, ...buildDateFilter('approvedAt', startDate, endDate) } },
                    { $addFields: { processingDurationMs: { $subtract: ["$approvedAt", "$registeredAt"] } } }, { $match: { processingDurationMs: { $gte: 0 } } },
                    { $group: { _id: { $dateToString: { format: "%Y-%m", date: "$approvedAt" } }, avgDurationMs: { $avg: "$processingDurationMs" } } },
                    { $sort: { _id: 1 } }, { $project: { _id: 0, month: "$_id", days: { $round: [{ $divide: ["$avgDurationMs", 86400000] }, 1] } } }
                ]);
                const processingTimeFormatted = processingTime.map(item => ({ month: `${monthNames[parseInt(item.month.split('-')[1]) - 1]} ${item.month.split('-')[0]}`, days: item.days }));
                const totalApproved = await School.countDocuments({ isApproved: true });
                const totalRejected = await School.countDocuments({ isApproved: false, adminRemarks: { $ne: null, $ne: "" } });
                const totalProcessed = totalApproved + totalRejected;
                const approvalRate = totalProcessed > 0 ? ((totalApproved / totalProcessed) * 100).toFixed(0) + '%' : 'N/A';
                const avgProcessingTimeResult = await School.aggregate([
                    { $match: { $or: [{ isApproved: true }, { adminRemarks: { $ne: null, $ne: "" } }], registeredAt: { $exists: true, $ne: null }, approvedAt: { $exists: true, $ne: null } } },
                    { $addFields: { processingDurationMs: { $subtract: ["$approvedAt", "$registeredAt"] } } }, { $match: { processingDurationMs: { $gte: 0 } } },
                    { $group: { _id: null, avgDurationMs: { $avg: "$processingDurationMs" } } },
                    { $project: { _id: 0, avgDays: { $round: [{ $divide: ["$avgDurationMs", 86400000] }, 1] } } }
                ]);
                const avgProcessingTime = avgProcessingTimeResult.length > 0 && avgProcessingTimeResult[0].avgDays !== null ? avgProcessingTimeResult[0].avgDays + ' days' : 'N/A';
                const pendingVerifications = await School.countDocuments({ isApproved: false, $or: [{ adminRemarks: { $exists: false } }, { adminRemarks: null }, { adminRemarks: "" }] });
                data = { verificationRate: verificationRateFormatted, processingTime: processingTimeFormatted, verificationStats: { totalVerifications: totalProcessed, approvalRate, avgProcessingTime, pendingVerifications } };
                break;
            }
            default: res.status(404); throw new Error('Report type not found');
        }
        res.json(data);
    } catch (error) {
        console.error(`[getAnalyticsData] ERROR for ${reportType}: ${error.message}`, error.stack);
        res.status(500).json({ message: 'Failed to fetch analytics data', error: error.message });
    }
});

const exportAnalyticsReport = asyncHandler(async (req, res) => {
    const { reportType, format } = req.params;
    const { timeRange } = req.query;
    const { startDate, endDate } = getDateRange(timeRange);

    if (format === 'pdf' && !printer) {
        res.status(500).json({ message: 'PDF export failed: Font files not found or configured incorrectly.' });
        return;
    }
    if (format !== 'csv' && format !== 'pdf') {
        res.status(400).json({ message: 'Unsupported export format' });
        return;
    }

    let reportData = [];
    const safeReportType = reportType.replace(/\W+/g, '_').toLowerCase();
    const safeTimeRange = timeRange.replace(/\W+/g, '_').toLowerCase();
    let filename = `${safeReportType}_report_${safeTimeRange}`;
    let header = [];
    const reportTitle = `${reportType.replace(/([A-Z])/g, ' $1').trim().replace(/^\w/, c => c.toUpperCase())} Report`;

    try {
        switch (reportType) {
            case 'donation':
                reportData = await Donation.aggregate([
                    { $match: buildDateFilter('createdAt', startDate, endDate) },
                    { $lookup: { from: 'schools', localField: 'school', foreignField: '_id', as: 'schoolDetailsArr' } },
                    { $unwind: { path: '$schoolDetailsArr', preserveNullAndEmptyArrays: true } },
                    { $lookup: { from: 'donors', localField: 'donor', foreignField: '_id', as: 'donorDetailsArr' } },
                    { $unwind: { path: '$donorDetailsArr', preserveNullAndEmptyArrays: true } },
                    { $sort: { createdAt: -1 } },
                    { $project: {
                        _id: 1, createdAt: 1, deliveryMethod: 1, trackingStatus: 1, schoolConfirmation: 1, schoolConfirmationAt: 1, donorRemarks: 1, adminRemarks: 1, itemsDonated: 1,
                        'donorDetails.fullName': { $ifNull: ['$donorDetailsArr.fullName', 'N/A'] },
                        'donorDetails.email': { $ifNull: ['$donorDetailsArr.email', 'N/A'] },
                        'schoolDetails.schoolName': { $ifNull: ['$schoolDetailsArr.schoolName', 'N/A'] },
                        'schoolDetails.district': { $ifNull: ['$schoolDetailsArr.district', 'N/A'] },
                        'schoolDetails.province': { $ifNull: ['$schoolDetailsArr.province', 'N/A'] },
                    }}
                ]);
                header = [
                    { id: '_id', title: 'Donation ID' }, { id: 'createdAt', title: 'Date' },
                    { id: 'donorDetails.fullName', title: 'Donor Name' }, { id: 'donorDetails.email', title: 'Donor Email' },
                    { id: 'schoolDetails.schoolName', title: 'School Name' }, { id: 'schoolDetails.district', title: 'School District' }, { id: 'schoolDetails.province', title: 'School Province' },
                    { id: 'itemsDonatedSummary', title: 'Items Donated' }, { id: 'deliveryMethod', title: 'Delivery Method' },
                    { id: 'trackingStatus', title: 'Tracking Status' }, { id: 'schoolConfirmation', title: 'Confirmed' },
                    { id: 'schoolConfirmationAt', title: 'Confirmed At' }, { id: 'donorRemarks', title: 'Donor Remarks' }, { id: 'adminRemarks', title: 'Admin Remarks' },
                ];
                break;
            case 'users':
                const donors = await Donor.find(buildDateFilter('createdAt', startDate, endDate)).select('_id fullName email phoneNumber createdAt').sort({ createdAt: -1 }).lean();
                const schools = await School.find({ ...buildDateFilter('registeredAt', startDate, endDate), isApproved: true }).select('_id schoolName schoolEmail city district province registeredAt').sort({ registeredAt: -1 }).lean();
                reportData = { donors, schools }; // Special handling for 'users' report
                filename = `user_summary_report_${safeTimeRange}`;
                header = { // Headers specific to 'users' report
                    donors: [ { id: '_id', title: 'Donor ID' }, { id: 'fullName', title: 'Full Name' }, { id: 'email', title: 'Email' }, { id: 'phoneNumber', title: 'Phone' }, { id: 'createdAt', title: 'Registered' } ],
                    schools: [ { id: '_id', title: 'School ID' }, { id: 'schoolName', title: 'School Name' }, { id: 'schoolEmail', title: 'Email' }, { id: 'city', title: 'City' }, { id: 'district', title: 'District' }, { id: 'province', title: 'Province' }, { id: 'registeredAt', title: 'Registered' } ]
                };
                break;
            case 'resources':
                reportData = await DonationRequest.aggregate([
                    { $match: buildDateFilter('createdAt', startDate, endDate) },
                    { $lookup: { from: 'schools', localField: 'school', foreignField: '_id', as: 'schoolDetailsArr' } },
                    { $unwind: { path: '$schoolDetailsArr', preserveNullAndEmptyArrays: true } },
                    { $sort: { createdAt: -1 } },
                    { $project: {
                        _id: 1, createdAt: 1, requestedItems: 1, status: 1, notes: 1,
                        'schoolDetails.schoolName': { $ifNull: ['$schoolDetailsArr.schoolName', 'N/A'] },
                        'schoolDetails.district': { $ifNull: ['$schoolDetailsArr.district', 'N/A'] },
                    }}
                ]);
                header = [
                    { id: '_id', title: 'Request ID' }, { id: 'createdAt', title: 'Request Date' },
                    { id: 'schoolDetails.schoolName', title: 'School Name' }, { id: 'schoolDetails.district', title: 'School District' },
                    { id: 'requestedItemsSummary', title: 'Requested Items' }, { id: 'status', title: 'Status' }, { id: 'notes', title: 'Notes' },
                ];
                break;
            case 'impact':
                reportData = await ImpactStory.aggregate([
                    { $match: buildDateFilter('submittedAt', startDate, endDate) },
                    { $lookup: { from: 'schools', localField: 'school', foreignField: '_id', as: 'schoolDetailsArr' } }, { $unwind: { path: '$schoolDetailsArr', preserveNullAndEmptyArrays: true } },
                    { $lookup: { from: 'donations', localField: 'donation', foreignField: '_id', as: 'donationArr' } }, { $unwind: { path: '$donationArr', preserveNullAndEmptyArrays: true } },
                    { $lookup: { from: 'donors', localField: 'donationArr.donor', foreignField: '_id', as: 'donorDetailsArr' } }, { $unwind: { path: '$donorDetailsArr', preserveNullAndEmptyArrays: true } },
                    { $sort: { submittedAt: -1 } },
                    { $project: {
                        _id: 1, submittedAt: 1, title: 1, status: 1, approvedAt: 1, adminRemarks: 1, storyText: 1, quote: 1, quoteAuthor: 1,
                        'schoolDetails.schoolName': { $ifNull: ['$schoolDetailsArr.schoolName', 'N/A'] },
                        'donationDetails._id': { $ifNull: ['$donationArr._id', 'N/A'] },
                        'donationDetails.donorDetails.fullName': { $ifNull: ['$donorDetailsArr.fullName', 'N/A'] },
                    }}
                ]);
                header = [
                    { id: '_id', title: 'Story ID' }, { id: 'submittedAt', title: 'Submission Date' }, { id: 'title', title: 'Title' },
                    { id: 'schoolDetails.schoolName', title: 'School Name' }, { id: 'donationDetails._id', title: 'Donation ID' },
                    { id: 'donationDetails.donorDetails.fullName', title: 'Donor Name' }, { id: 'status', title: 'Status' },
                    { id: 'approvedAt', title: 'Approval Date' }, { id: 'adminRemarks', title: 'Admin Remarks' },
                    { id: 'storyTextSnippet', title: 'Story (Snippet)' }, { id: 'quote', title: 'Quote' }, { id: 'quoteAuthor', title: 'Quote Author' },
                ];
                break;
            case 'logistics':
                reportData = await Donation.aggregate([
                    { $match: buildDateFilter('createdAt', startDate, endDate) },
                    { $lookup: { from: 'schools', localField: 'school', foreignField: '_id', as: 'schoolDetailsArr' } },
                    { $unwind: { path: '$schoolDetailsArr', preserveNullAndEmptyArrays: true } },
                    { $sort: { createdAt: -1 } },
                    { $project: {
                        _id: 1, createdAt: 1, deliveryMethod: 1, trackingStatus: 1, itemsDonated: 1, schoolConfirmation: 1, schoolConfirmationAt: 1, adminTrackingId: 1, adminRemarks: 1,
                        'schoolDetails.schoolName': { $ifNull: ['$schoolDetailsArr.schoolName', 'N/A'] },
                        'schoolDetails.district': { $ifNull: ['$schoolDetailsArr.district', 'N/A'] },
                    }}
                ]);
                header = [
                    { id: '_id', title: 'Donation ID' }, { id: 'createdAt', title: 'Date' },
                    { id: 'schoolDetails.schoolName', title: 'School Name' }, { id: 'schoolDetails.district', title: 'School District' },
                    { id: 'deliveryMethod', title: 'Delivery Method' }, { id: 'trackingStatus', title: 'Tracking Status' },
                    { id: 'itemsDonatedSummary', title: 'Items Donated' }, { id: 'schoolConfirmation', title: 'Confirmed' },
                    { id: 'schoolConfirmationAt', title: 'Confirmed At' }, { id: 'adminTrackingId', title: 'Tracking ID' }, { id: 'adminRemarks', title: 'Admin Remarks' },
                ];
                break;
            case 'verification':
                reportData = await School.aggregate([
                    { $match: buildDateFilter('registeredAt', startDate, endDate) },
                    { $sort: { registeredAt: -1 } },
                    { $project: {
                        _id: 1, registeredAt: 1, schoolName: 1, schoolEmail: 1, principalName: 1, principalEmail: 1, phoneNumber: 1,
                        streetAddress: 1, city: 1, district: 1, province: 1, postalCode: 1,
                        status: { $cond: { if: "$isApproved", then: "Approved", else: { $cond: [{ $and: [{ $ne: ["$adminRemarks", null] }, { $ne: ["$adminRemarks", ""] }] }, "Rejected", "Pending"] } } },
                        approvedAt: 1, adminRemarks: 1,
                    }}
                ]);
                header = [
                    { id: '_id', title: 'School ID' }, { id: 'registeredAt', title: 'Registered' },
                    { id: 'schoolName', title: 'School Name' }, { id: 'schoolEmail', title: 'School Email' },
                    { id: 'principalName', title: 'Principal' }, { id: 'principalEmail', title: 'Principal Email' }, { id: 'phoneNumber', title: 'Phone' },
                    { id: 'streetAddress', title: 'Address' }, { id: 'city', title: 'City' }, { id: 'district', title: 'District' },
                    { id: 'province', title: 'Province' }, { id: 'postalCode', title: 'Postal Code' },
                    { id: 'status', title: 'Status' }, { id: 'approvedAt', title: 'Action Date' }, { id: 'adminRemarks', title: 'Admin Remarks' },
                ];
                break;
            default:
                res.status(404); throw new Error('Report type not found for export');
        }
    } catch (error) {
        console.error(`[exportAnalyticsReport] ERROR fetching for ${reportType}: ${error.message}`, error.stack);
        res.status(500).json({ message: 'Failed to fetch data for export', error: error.message });
        return;
    }

    if (format === 'csv') {
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}.csv"`);
        const tempFilePath = path.join(__dirname, `temp_export_${Date.now()}.csv`);
        const outputStream = fs.createWriteStream(tempFilePath);

        const writeTextLine = async (text, stream) => { // Helper for CSV text lines
            const textWriter = createObjectCsvWriter({ path: stream, header: [], alwaysQuote: true, append: true });
            await textWriter.writeRecords([[text]]);
        };

        if (reportType === 'users') {
            await writeTextLine(`${reportTitle} (${timeRange})`, outputStream);
            await writeTextLine('', outputStream);
            if (reportData.donors.length > 0) {
                await writeTextLine(`-- Donors (${reportData.donors.length}) --`, outputStream);
                const csvWriterDonors = createObjectCsvWriter({ header: header.donors, path: outputStream, alwaysQuote: true, append: true });
                await csvWriterDonors.writeRecords(reportData.donors.map(d => ({ ...d, createdAt: d.createdAt ? new Date(d.createdAt).toLocaleDateString('en-US') : '' })));
                await writeTextLine('', outputStream);
            }
            if (reportData.schools.length > 0){
                await writeTextLine(`-- Approved Schools (${reportData.schools.length}) --`, outputStream);
                const csvWriterSchools = createObjectCsvWriter({ header: header.schools, path: outputStream, alwaysQuote: true, append: true });
                await csvWriterSchools.writeRecords(reportData.schools.map(s => ({ ...s, registeredAt: s.registeredAt ? new Date(s.registeredAt).toLocaleDateString('en-US') : '' })));
            }
        } else if (Array.isArray(reportData) && reportData.length > 0) {
            const formattedData = reportData.map(row => {
                const csvRow = {};
                header.forEach(h => {
                    const getValue = (obj, pathStr) => pathStr.split('.').reduce((acc, part) => acc && acc[part], obj);
                    let value = getValue(row, h.id);
                    if (value instanceof Date) {
                        const isDateTime = h.id.toLowerCase().includes('at') || (h.title || '').toLowerCase().includes('time') || h.id.toLowerCase().includes('submittedat');
                        value = isDateTime ? `${new Date(value).toLocaleDateString('en-US')} ${new Date(value).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}` : new Date(value).toLocaleDateString('en-US');
                    } else if (h.id === 'itemsDonatedSummary') value = (getValue(row, 'itemsDonated') || []).map(item => `${item.quantityDonated} ${item.categoryNameEnglish || item.categoryName || 'N/A'}`).join('; ');
                    else if (h.id === 'requestedItemsSummary') value = (getValue(row, 'requestedItems') || []).map(item => `${item.quantity} ${item.categoryNameEnglish || item.categoryName || 'N/A'} (Rec: ${item.quantityReceived || 0})`).join('; ');
                    else if (h.id === 'storyTextSnippet') value = (String(getValue(row, 'storyText') || '')).substring(0, 100) + (String(getValue(row, 'storyText') || '').length > 100 ? '...' : '');
                    else if (typeof value === 'boolean') value = value ? 'Yes' : 'No';
                    csvRow[h.id] = (value === null || value === undefined) ? '' : String(value);
                });
                return csvRow;
            });
            const writer = createObjectCsvWriter({ header, path: outputStream, alwaysQuote: true });
            await writer.writeRecords(formattedData);
        } else {
            await writeTextLine('No data available for the selected time range and report type.', outputStream);
        }
        outputStream.end();
        outputStream.on('finish', () => {
            const readStream = fs.createReadStream(tempFilePath);
            readStream.pipe(res);
            readStream.on('close', () => fs.unlink(tempFilePath, err => err && console.warn(`Error deleting temp CSV: ${err.message}`)));
        });
        outputStream.on('error', err => { console.error("Error writing CSV:", err); if(!res.headersSent) res.status(500).send('Error writing CSV file.'); });

    } else if (format === 'pdf') {
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}.pdf"`);

        const docDefinition = {
            content: [
                { text: reportTitle, style: 'header' },
                { text: `Time Range: ${timeRange.charAt(0).toUpperCase() + timeRange.slice(1)}`, style: 'subheader' },
                { text: `Generated: ${new Date().toLocaleString('en-US', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}`, style: 'small', margin: [0,0,0,15] },
            ],
            styles: {
                header: { fontSize: 18, bold: true, margin: [0, 0, 0, 5] },
                subheader: { fontSize: 14, bold: true, margin: [0, 0, 0, 2] },
                tableHeader: { bold: true, fontSize: 9, color: 'black', fillColor: '#eeeeee' },
                small: { fontSize: 8 }
            },
            defaultStyle: { font: 'Roboto', fontSize: 9 },
            pageMargins: [30, 40, 30, 40], // Left, Top, Right, Bottom
        };
        
        if (reportType === 'donation') {
            docDefinition.pageOrientation = 'landscape';
        }

        const getValue = (obj, pathStr) => {
            if (!pathStr || obj === null || obj === undefined) return undefined;
            return pathStr.split('.').reduce((acc, part) => acc && acc[part], obj);
        };

        if (reportType === 'users') {
            if (reportData.donors.length > 0) {
                docDefinition.content.push({ text: `Donors (${reportData.donors.length})`, style: 'subheader', margin: [0, 10, 0, 5] });
                docDefinition.content.push({
                    table: {
                        headerRows: 1, 
                        widths: [50, '*', '*', 70, 70], // ID, Name*, Email*, Phone, Registered
                        body: [
                            header.donors.map(h => ({ text: h.title, style: 'tableHeader', alignment: 'center' })),
                            ...reportData.donors.map(row => header.donors.map(h => {
                                let val = getValue(row, h.id);
                                let alignment = 'left';
                                if (val instanceof Date) {
                                    val = new Date(val).toLocaleDateString('en-US', {month:'short', day:'numeric', year:'numeric'});
                                    alignment = 'center';
                                }
                                if (h.id === '_id' || h.id === 'phoneNumber') alignment = 'center';
                                return { text: String(val || ''), alignment: alignment };
                            }))
                        ]
                    }, layout: 'lightHorizontalLines', margin: [0, 5, 0, 15]
                });
            }
            if (reportData.schools.length > 0) {
                docDefinition.content.push({ text: `Approved Schools (${reportData.schools.length})`, style: 'subheader', margin: [0, 10, 0, 5] });
                docDefinition.content.push({
                    table: {
                        headerRows: 1, 
                        widths: [50, '*', '*', 60, 65, 65, 70], // ID, Name*, Email*, City, District, Province, Registered
                        body: [
                            header.schools.map(h => ({ text: h.title, style: 'tableHeader', alignment: 'center' })),
                            ...reportData.schools.map(row => header.schools.map(h => {
                                let val = getValue(row, h.id);
                                let alignment = 'left';
                                if (val instanceof Date) {
                                    val = new Date(val).toLocaleDateString('en-US', {month:'short', day:'numeric', year:'numeric'});
                                    alignment = 'center';
                                }
                                if (h.id === '_id' || ['city', 'district', 'province'].includes(h.id) ) alignment = 'center';
                                return { text: String(val || ''), alignment: alignment };
                            }))
                        ]
                    }, layout: 'lightHorizontalLines', margin: [0, 5, 0, 15]
                });
            }
        } else if (Array.isArray(reportData) && reportData.length > 0) {
            const columnWidthConfig = {
                // IDs
                '_id': 45, 'donationDetails._id': 45,
                // Dates & Times (e.g., "MMM DD, YYYY, HH:MM AM/PM")
                'createdAt': 75, 'schoolConfirmationAt': 75, 'submittedAt': 75, 'approvedAt': 75, 'registeredAt': 75,
                // Names & Titles (flexible)
                'donorDetails.fullName': '*', 'schoolDetails.schoolName': '*', 'donationDetails.donorDetails.fullName': '*',
                'title': '*', 'principalName': '*', 'schoolName': '*', 
                // Emails (flexible, can be long)
                'donorDetails.email': 90, 'schoolEmail': '*', 'principalEmail': '*',
                // Location
                'schoolDetails.district': 65, 'schoolDetails.province': 65,
                'city': 60, 'district': 65, 'province': 65, 'postalCode': 50,
                // Summaries / Long Text
                'itemsDonatedSummary': reportType === 'donation' ? '*' : 100, // Flexible for donation report in landscape
                'requestedItemsSummary': 100, 'storyTextSnippet': 80, 'notes': '*',
                'quote': '*', 'adminRemarks': '*', 'donorRemarks': '*', 'streetAddress': '*',
                // Status & Short Info
                'deliveryMethod': 'auto', 'trackingStatus': 'auto', 'status': 55,
                'schoolConfirmation': 45, 'phoneNumber': 70, 'quoteAuthor': 'auto', 'adminTrackingId': 'auto',
            };
            const colWidths = header.map(h => columnWidthConfig[h.id] || 'auto');

            docDefinition.content.push({
                table: {
                    headerRows: 1, widths: colWidths,
                    body: [
                        header.map(h => ({ text: h.title, style: 'tableHeader', alignment: 'center' })),
                        ...reportData.map(row => header.map(h => {
                            let cellText = ''; let alignment = 'left';
                            let value = getValue(row, h.id);

                            if (value === null || value === undefined) cellText = '';
                            else if (h.id === 'itemsDonatedSummary') cellText = (getValue(row, 'itemsDonated') || []).map(item => `${item.quantityDonated} ${item.categoryNameEnglish || item.categoryName || 'N/A'}`).join(', ');
                            else if (h.id === 'requestedItemsSummary') cellText = (getValue(row, 'requestedItems') || []).map(item => `${item.quantity} ${item.categoryNameEnglish || item.categoryName || 'N/A'} (Rec: ${item.quantityReceived || 0})`).join(', ');
                            else if (h.id === 'storyTextSnippet') cellText = (String(getValue(row, 'storyText') || '')).substring(0, 50) + (String(getValue(row, 'storyText') || '').length > 50 ? '...' : '');
                            else if (value instanceof Date) {
                                const isDateTime = h.id.toLowerCase().includes('at') || (h.title || '').toLowerCase().includes('time') || h.id.toLowerCase().includes('submittedat');
                                cellText = isDateTime 
                                    ? new Date(value).toLocaleString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true })
                                    : new Date(value).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
                                alignment = 'center';
                            } else if (typeof value === 'boolean') {
                                cellText = value ? 'Yes' : 'No'; alignment = 'center';
                            } else {
                                cellText = String(value);
                                if (h.id.toLowerCase().includes('id') || typeof value === 'number' || ['status', 'schoolConfirmation', 'deliveryMethod', 'trackingStatus', 'postalCode', 'city', 'district', 'province'].includes(h.id) || (typeof value === 'string' && value.length < 15 && !h.id.toLowerCase().includes('name') && !h.id.toLowerCase().includes('email')  && !h.id.toLowerCase().includes('summary') && !h.id.toLowerCase().includes('text') && !h.id.toLowerCase().includes('remarks'))) {
                                     alignment = 'center';
                                }
                            }
                            return { text: cellText, alignment };
                        }))
                    ]
                }, layout: 'lightHorizontalLines', margin: [0, 5, 0, 15]
            });
        } else {
            docDefinition.content.push({ text: 'No data available for the selected time range and report type.', italics: true, margin: [0, 10, 0, 0] });
        }

        const pdfDoc = printer.createPdfKitDocument(docDefinition);
        pdfDoc.pipe(res);
        pdfDoc.on('error', (err) => { console.error("Error generating PDF:", err); if(!res.headersSent) res.status(500).send('Error generating PDF.'); });
        pdfDoc.end();
    }
});

module.exports = { getAnalyticsData, exportAnalyticsReport };
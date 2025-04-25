// backend/controllers/analyticsController.js
const asyncHandler = require('express-async-handler');
const School = require('../models/schoolModel');
const Donation = require('../models/donationModel');
const DonationRequest = require('../models/donationRequestModel');
const ImpactStory = require('../models/impactStoryModel');
const Donor = require('../models/donorModel');
const csvWriter = require('csv-writer').createObjectCsvWriter;
const PdfPrinter = require('pdfmake');
const { Readable } = require('stream');
const { promisify } = require('util');
const pipeline = promisify(require('stream').pipeline);
const fs = require('fs');
const path = require('path');

const getDateRange = (timeRange) => {
    const now = new Date();
    let startDate = new Date();

    now.setHours(23, 59, 59, 999);

    switch (timeRange) {
        case 'week':
            startDate.setDate(now.getDate() - 7);
            break;
        case 'month':
            startDate.setMonth(now.getMonth() - 1);
            break;
        case 'quarter':
            startDate.setMonth(now.getMonth() - 3);
            break;
        case 'year':
            startDate.setFullYear(now.getFullYear() - 1);
            break;
        case 'all':
        default:
            return {};
    }
    startDate.setHours(0, 0, 0, 0);
    return { createdAt: { $gte: startDate, $lte: now } };
};

const fonts = {
    Roboto: {
        normal: path.join(__dirname, '..', 'fonts', 'Roboto-Regular.ttf'),
        bold: path.join(__dirname, '..', 'fonts', 'Roboto-Medium.ttf'),
        italics: path.join(__dirname, '..', 'fonts', 'Roboto-Italic.ttf'),
        bolditalics: path.join(__dirname, '..', 'fonts', 'Roboto-MediumItalics.ttf')
    }
};

let printer;
try {
    const fontFilesExist = Object.values(fonts).every(fontStyles =>
        Object.values(fontStyles).every(fontPath => fs.existsSync(fontPath))
    );

    if (fontFilesExist) {
        printer = new PdfPrinter(fonts);
    } else {
         console.error("PDFMake font initialization failed: One or more font files not found.");
         console.error("Ensure font files like Roboto-Regular.ttf are in the backend/fonts directory.");
    }

} catch (fontError) {
    console.error("PDFMake font initialization encountered an error:", fontError);
}

const getAnalyticsData = asyncHandler(async (req, res) => {
    const { reportType } = req.params;
    const { timeRange } = req.query;
    const dateFilter = getDateRange(timeRange);

    let data = {};

    try {
        switch (reportType) {
            case 'donation': {
                const monthlyDonations = await Donation.aggregate([
                    { $match: dateFilter },
                    {
                        $group: {
                            _id: { $dateToString: { format: "%Y-%m", date: "$createdAt" } },
                            total: { $sum: 1 }
                        }
                    },
                    { $sort: { _id: 1 } },
                    { $project: { _id: 0, month: "$_id", total: 1 } }
                ]);

                 const donationCategories = await Donation.aggregate([
                    { $match: dateFilter },
                    { $unwind: "$itemsDonated" },
                    {
                        $group: {
                            _id: "$itemsDonated.categoryNameEnglish",
                            value: { $sum: "$itemsDonated.quantityDonated" }
                        }
                    },
                    { $sort: { value: -1 } },
                    { $project: { _id: 0, name: "$_id", value: 1 } }
                 ]);

                const regionData = await Donation.aggregate([
                    { $match: dateFilter },
                    {
                        $lookup: {
                            from: 'schools',
                            localField: 'school',
                            foreignField: '_id',
                            as: 'schoolDetails'
                        }
                    },
                    { $unwind: { path: '$schoolDetails', preserveNullAndEmptyArrays: true } },
                     { $match: { 'schoolDetails.isApproved': true } },
                    {
                        $group: {
                            _id: { $ifNull: ['$schoolDetails.district', 'Unknown District'] },
                            donations: { $sum: 1 }
                        }
                    },
                    { $project: { _id: 0, name: "$_id", donations: 1, requests: { $literal: Math.floor(Math.random() * 100) + 30 } } }
                ]);

                 const totalDonations = await Donation.countDocuments(dateFilter);

                 const avgItemsPerDonationResult = await Donation.aggregate([
                      { $match: dateFilter },
                      { $unwind: "$itemsDonated" },
                      {
                          $group: {
                              _id: null,
                              totalItems: { $sum: "$itemsDonated.quantityDonated" },
                              totalDonations: { $addToSet: "$_id" }
                           }
                       },
                       { $project: { _id: 0, avgItems: { $divide: ["$totalItems", { $cond: [{ $eq: [{ $size: "$totalDonations" }, 0] }, 1, { $size: "$totalDonations" }] }] } } }
                 ]);
                 const avgItemsPerDonation = avgItemsPerDonationResult.length > 0 && avgItemsPerDonationResult[0].avgItems !== null
                 ? avgItemsPerDonationResult[0].avgItems.toFixed(1)
                 : 0;

                 const fulfillmentRateResult = await DonationRequest.aggregate([
                     { $match: dateFilter },
                     { $unwind: "$requestedItems" },
                     {
                         $group: {
                             _id: null,
                             totalRequested: { $sum: "$requestedItems.quantity" },
                             totalReceived: { $sum: "$requestedItems.quantityReceived" }
                         }
                     },
                 {
                     $project: {
                         _id: 0,
                         rate: {
                             $round: [
                                 {
                                     $multiply: [
                                         {
                                             $divide: [
                                                 "$totalReceived",
                                                 { $cond: [{ $eq: ["$totalRequested", 0] }, 1, "$totalRequested"] }
                                             ]
                                         },
                                         100
                                     ]
                                 },
                                 0
                             ]
                         }
                     }
                 }
                ]);
                 const fulfillmentRate = fulfillmentRateResult.length > 0 && fulfillmentRateResult[0].rate !== null ? fulfillmentRateResult[0].rate : 0;

                 const activeRequestsCount = await DonationRequest.countDocuments({
                     ...dateFilter,
                     status: { $in: ['Pending', 'Partially Fulfilled'] }
                 });


                data = {
                    monthlyDonations,
                    resourceCategories: donationCategories,
                    regionData,
                    donationStats: {
                        totalDonations,
                        avgDonationValue: `Avg Items: ${avgItemsPerDonation}`,
                        fulfillmentRate: `${fulfillmentRate}%`,
                        activeRequests: activeRequestsCount,
                    }
                };
                break;
            }

            case 'users': {
                 const userGrowthSchools = await School.aggregate([
                     { $match: { ...dateFilter, isApproved: true } },
                      {
                         $group: {
                             _id: { $dateToString: { format: "%Y-%m", date: "$registeredAt" } },
                             count: { $sum: 1 }
                         }
                     },
                     { $sort: { _id: 1 } }
                 ]);
                  const userGrowthDonors = await Donor.aggregate([
                     { $match: dateFilter },
                      {
                         $group: {
                             _id: { $dateToString: { format: "%Y-%m", date: "$createdAt" } },
                             count: { $sum: 1 }
                         }
                     },
                     { $sort: { _id: 1 } }
                 ]);

                 const userGrowth = [];
                 const schoolMap = new Map(userGrowthSchools.map(item => [item._id, item.count]));
                 const donorMap = new Map(userGrowthDonors.map(item => [item._id, item.count]));
                 const allMonths = [...new Set([...schoolMap.keys(), ...donorMap.keys()])].sort();

                  let cumulativeSchools = 0;
                  let cumulativeDonors = 0;

                  allMonths.forEach(month => {
                      const [year, monthNum] = month.split('-');
                      const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
                      const shortMonth = monthNames[parseInt(monthNum, 10) - 1];

                     cumulativeSchools += schoolMap.get(month) || 0;
                     cumulativeDonors += donorMap.get(month) || 0;

                      userGrowth.push({
                          month: `${shortMonth} ${year}`,
                          schools: cumulativeSchools,
                          donors: cumulativeDonors
                      });
                  });

                 const userRetention = [
                     { month: 'Jan 2024', rate: 85 }, { month: 'Feb 2024', rate: 82 },
                     { month: 'Mar 2024', rate: 88 }, { month: 'Apr 2024', rate: 90 },
                     { month: 'May 2024', rate: 92 }, { month: 'Jun 2024', rate: 94 },
                     { month: 'Jul 2024', rate: 91 }, { month: 'Aug 2024', rate: 93 },
                     { month: 'Sep 2024', rate: 95 }, { month: 'Oct 2024', rate: 96 },
                     { month: 'Nov 2024', rate: 94 }, { month: 'Dec 2024', rate: 97 },
                 ];

                 const totalApprovedSchools = await School.countDocuments({ isApproved: true });
                 const totalDonors = await Donor.countDocuments();
                 const avgSessionDuration = '6m 32s';
                 const returningUsersRate = '62%';


                data = {
                    userGrowth,
                    userRetention,
                    userStats: {
                        totalSchools: totalApprovedSchools,
                        totalDonors: totalDonors,
                        avgSessionDuration,
                        returningUsersRate,
                    }
                };
                break;
            }

            case 'resources': {
                 const totalRequestedByCat = await DonationRequest.aggregate([
                          { $match: dateFilter },
                          { $unwind: "$requestedItems" },
                          {
                              $group: {
                                  _id: "$requestedItems.categoryNameEnglish",
                                  requested: { $sum: "$requestedItems.quantity" },
                                  received: { $sum: "$requestedItems.quantityReceived" }
                              }
                          },
                         { $project: { _id: 0, category: "$_id", requested: 1, received: 1 } },
                         { $sort: { requested: -1 } }
                     ]);

                 const regionalCoverage = [
                    { region: 'Central', coverage: 75 },
                    { region: 'Eastern', coverage: 60 },
                    { region: 'Northern', coverage: 55 },
                    { region: 'Southern', coverage: 70 },
                    { region: 'Western', coverage: 85 }
                 ];

                data = {
                    fulfillmentRate: totalRequestedByCat,
                    regionalCoverage,
                };
                break;
            }

            case 'impact': {
                 const studentsBenefited = await Donation.aggregate([
                     { $match: { schoolConfirmation: true, trackingStatus: 'Received by School', schoolConfirmationAt: { $gte: dateFilter.createdAt?.$gte, $lte: dateFilter.createdAt?.$lte } } },
                      {
                         $group: {
                             _id: { $dateToString: { format: "%Y-%m", date: "$schoolConfirmationAt" } },
                             count: { $sum: 1 }
                         }
                     },
                     { $sort: { _id: 1 } },
                     { $project: { _id: 0, month: "$_id", count: 1 } }
                 ]);

                  const studentsBenefitedFormatted = studentsBenefited.map(item => {
                       const [year, monthNum] = item.month.split('-');
                       const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
                       const shortMonth = monthNames[parseInt(monthNum, 10) - 1];
                       return {
                           month: `${shortMonth} ${year}`,
                           count: item.count
                       };
                  });

                 const donationImpact = [
                    { category: 'Access to Resources', impact: 85 },
                    { category: 'Learning Environment', impact: 70 },
                    { category: 'Student Participation', impact: 75 },
                    { category: 'Teacher Effectiveness', impact: 65 },
                 ];

                data = {
                    studentsBenefited: studentsBenefitedFormatted,
                    donationImpact,
                };
                break;
            }

            case 'logistics': {
                 const deliveryTime = await Donation.aggregate([
                     { $match: { schoolConfirmation: true, trackingStatus: 'Received by School', schoolConfirmationAt: { $gte: dateFilter.createdAt?.$gte, $lte: dateFilter.createdAt?.$lte }, createdAt: { $exists: true } } },
                      {
                         $addFields: {
                             processingDurationMs: { $subtract: ["$schoolConfirmationAt", "$createdAt"] }
                         }
                     },
                      { $match: { processingDurationMs: { $gte: 0 } } },
                     {
                         $group: {
                             _id: "$deliveryMethod",
                             avgDurationMs: { $avg: "$processingDurationMs" }
                         }
                     },
                      {
                         $project: {
                              _id: 0,
                              method: "$_id",
                              avgDays: { $round: [{ $divide: ["$avgDurationMs", 1000 * 60 * 60 * 24] }, 1] }
                         }
                     }
                 ]);

                 const deliveryStatus = await Donation.aggregate([
                     { $match: dateFilter },
                     {
                         $group: {
                             _id: "$trackingStatus",
                             count: { $sum: 1 }
                         }
                     },
                      { $project: { _id: 0, name: "$_id", value: "$count" } }
                 ]);

                 const recentDeliveries = await Donation.find(dateFilter)
                      .populate('school', 'schoolName city')
                      .select('_id createdAt itemsDonated deliveryMethod trackingStatus school schoolConfirmationAt')
                      .sort({ createdAt: -1 })
                      .limit(20)
                      .lean();

                  const formattedRecentDeliveries = recentDeliveries.map(del => ({
                      donationId: del._id.toString(),
                      schoolName: del.school?.schoolName,
                       schoolCity: del.school?.city,
                       itemsSummary: del.itemsDonated.map(item => `${item.quantityDonated} ${item.categoryNameEnglish}`).join(', '),
                      deliveryMethod: del.deliveryMethod,
                      status: del.trackingStatus,
                       date: del.createdAt ? del.createdAt.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 'N/A',
                  }));


                data = {
                    deliveryTime,
                    deliveryStatus,
                    recentDeliveries: formattedRecentDeliveries,
                };
                break;
            }

            case 'verification': {
                 const verificationRate = await School.aggregate([
                     { $match: dateFilter },
                      {
                         $group: {
                             _id: { $dateToString: { format: "%Y-%m", date: "$registeredAt" } },
                             approved: { $sum: { $cond: ["$isApproved", 1, 0] } },
                              rejected: { $sum: { $cond: [{ $and: [{ $eq: ["$isApproved", false] }, { $ne: ["$adminRemarks", null] }, { $ne: ["$adminRemarks", ""] }] }, 1, 0] } },
                             total: { $sum: 1 }
                         }
                     },
                     { $sort: { _id: 1 } },
                     {
                         $project: {
                             _id: 0,
                             month: "$_id",
                             approved: 1,
                             rejected: 1,
                         }
                     }
                 ]);

                  const verificationRateFormatted = verificationRate.map(item => {
                       const [year, monthNum] = item.month.split('-');
                       const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
                       const shortMonth = monthNames[parseInt(monthNum, 10) - 1];
                       return {
                           month: `${shortMonth} ${year}`,
                           approved: item.approved,
                           rejected: item.rejected,
                       };
                  });

                 const processingTime = await School.aggregate([
                     {
                         $match: {
                              $or: [
                                  { isApproved: true, approvedAt: { $gte: dateFilter.createdAt?.$gte, $lte: dateFilter.createdAt?.$lte } },
                                  { isApproved: false, adminRemarks: { $ne: null, $ne: "" }, approvedAt: { $gte: dateFilter.createdAt?.$gte, $lte: dateFilter.createdAt?.$lte } }
                              ],
                              registeredAt: { $exists: true, $ne: null },
                              approvedAt: { $exists: true, $ne: null }
                         }
                      },
                      {
                         $addFields: {
                             processingDurationMs: { $subtract: ["$approvedAt", "$registeredAt"] }
                         }
                     },
                     { $match: { processingDurationMs: { $gte: 0 } } },
                     {
                         $group: {
                              _id: { $dateToString: { format: "%Y-%m", date: "$approvedAt" } },
                              avgDurationMs: { $avg: "$processingDurationMs" }
                         }
                     },
                     { $sort: { _id: 1 } },
                      {
                         $project: {
                             _id: 0,
                             month: "$_id",
                             days: { $round: [{ $divide: ["$avgDurationMs", 1000 * 60 * 60 * 24] }, 1] }
                         }
                     }
                 ]);

                  const processingTimeFormatted = processingTime.map(item => {
                       const [year, monthNum] = item.month.split('-');
                       const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
                       const shortMonth = monthNames[parseInt(monthNum, 10) - 1];
                       return {
                           month: `${shortMonth} ${year}`,
                           days: item.days
                       };
                  });

                  const totalVerificationsProcessedOverall = await School.countDocuments({
                       $or: [
                           { isApproved: true },
                           { isApproved: false, adminRemarks: { $ne: null, $ne: "" } }
                       ]
                   });

                   const totalApprovedSchoolsCountOverall = await School.countDocuments({ isApproved: true });
                   const totalRejectedSchoolsCountOverall = await School.countDocuments({ isApproved: false, adminRemarks: { $ne: null, $ne: "" } });
                   const totalProcessedOverall = totalApprovedSchoolsCountOverall + totalRejectedSchoolsCountOverall;

                   const approvalRate = totalProcessedOverall > 0 ? ((totalApprovedSchoolsCountOverall / totalProcessedOverall) * 100).toFixed(0) + '%' : 'N/A';

                  const avgProcessingTimeResult = await School.aggregate([
                      {
                          $match: {
                              $or: [{ isApproved: true }, { adminRemarks: { $ne: null, $ne: "" } }],
                              registeredAt: { $exists: true, $ne: null },
                              approvedAt: { $exists: true, $ne: null }
                          }
                      },
                       {
                          $addFields: {
                              processingDurationMs: { $subtract: ["$approvedAt", "$registeredAt"] }
                          }
                      },
                       { $match: { processingDurationMs: { $gte: 0 } } },
                      {
                          $group: {
                               _id: null,
                               avgDurationMs: { $avg: "$processingDurationMs" }
                          }
                      },
                       {
                          $project: {
                              _id: 0,
                              avgDays: { $round: [{ $divide: ["$avgDurationMs", 1000 * 60 * 60 * 24] }, 1] }
                          }
                       }
                  ]);
                  const avgProcessingTime = avgProcessingTimeResult.length > 0 && avgProcessingTimeResult[0].avgDays !== null ? avgProcessingTimeResult[0].avgDays + ' days' : 'N/A';

                  const pendingVerifications = await School.countDocuments({
                      isApproved: false,
                      $or: [
                          { adminRemarks: { $exists: false } },
                          { adminRemarks: null },
                          { adminRemarks: "" }
                      ]
                  });


                data = {
                    verificationRate: verificationRateFormatted,
                    processingTime: processingTimeFormatted,
                    verificationStats: {
                        totalVerifications: totalProcessedOverall,
                        approvalRate,
                        avgProcessingTime,
                        pendingVerifications,
                    }
                };
                break;
            }


            default:
                res.status(404);
                throw new Error('Report type not found');
        }

        res.json(data);

    } catch (error) {
        console.error(`Error fetching analytics data for ${reportType}:`, error);
        res.status(500).json({ message: 'Failed to fetch analytics data', error: error.message });
    }
});


const exportAnalyticsReport = asyncHandler(async (req, res) => {
    const { reportType, format } = req.params;
    const { timeRange } = req.query;
    const dateFilter = getDateRange(timeRange);

    if (format === 'pdf' && !printer) {
         console.error("PDFMake printer not initialized due to font errors.");
         res.status(500).json({ message: 'PDF export failed: Font files not found or configured incorrectly on the server.' });
         return;
    }

    let reportData = [];
    const safeReportType = reportType.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_]/g, '').toLowerCase();
    const safeTimeRange = timeRange.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_]/g, '').toLowerCase();
    let filename = `${safeReportType}_report_${safeTimeRange}`;
    let header = [];
    let reportTitle = `${reportType.replace(/([A-Z])/g, ' $1').trim().replace(/^\w/, (c) => c.toUpperCase())} Report`;

    try {
        switch (reportType) {
            case 'donation': {
                 reportData = await Donation.aggregate([
                      { $match: dateFilter },
                       {
                         $lookup: {
                             from: 'schools', localField: 'school', foreignField: '_id', as: 'schoolDetails'
                         }
                     },
                     { $unwind: { path: '$schoolDetails', preserveNullAndEmptyArrays: true } },
                     {
                         $lookup: {
                              from: 'donors', localField: 'donor', foreignField: '_id', as: 'donorDetails'
                         }
                     },
                     { $unwind: { path: '$donorDetails', preserveNullAndEmptyArrays: true } },
                     { $sort: { createdAt: 1 } },
                     {
                          $project: {
                              'Donation ID': { $toString: '$_id' },
                              'Date': { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
                              'Donor Name': { $ifNull: ['$donorDetails.fullName', 'Deleted Donor'] },
                              'Donor Email': { $ifNull: ['$donorDetails.email', 'N/A'] },
                              'School Name': { $ifNull: ['$schoolDetails.schoolName', 'Deleted School'] },
                              'School District': { $ifNull: ['$schoolDetails.district', 'N/A'] },
                              'School Province': { $ifNull: ['$schoolDetails.province', 'N/A'] },
                              'Items Donated': {
                                  $reduce: {
                                      input: "$itemsDonated",
                                      initialValue: "",
                                      in: { $concat: ["$$value", { $cond: [{ $eq: ["$$value", ""] }, "", ", "] }, { $toString: "$$this.quantityDonated" }, " ", "$$this.categoryNameEnglish"] }
                                  }
                              },
                              'Delivery Method': '$deliveryMethod',
                              'Tracking Status': '$trackingStatus',
                              'Confirmation Status': { $cond: ["$schoolConfirmation", "Confirmed", "Pending"] },
                              'Donor Remarks': '$donorRemarks',
                              'Admin Remarks': '$adminRemarks',
                          }
                     }
                 ]);
                 header = [
                     { id: 'Donation ID', title: 'Donation ID' }, { id: 'Date', title: 'Date' },
                     { id: 'Donor Name', title: 'Donor Name' }, { id: 'Donor Email', title: 'Donor Email' },
                     { id: 'School Name', title: 'School Name' }, { id: 'School District', title: 'School District' },
                     { id: 'School Province', title: 'School Province' }, { id: 'Items Donated', title: 'Items Donated' },
                     { id: 'Delivery Method', title: 'Delivery Method' }, { id: 'Tracking Status', title: 'Tracking Status' },
                     { id: 'Confirmation Status', title: 'Confirmation Status' }, { id: 'Donor Remarks', title: 'Donor Remarks' },
                     { id: 'Admin Remarks', title: 'Admin Remarks' },
                 ];
                 break;
            }

            case 'users': {
                 const donors = await Donor.find(dateFilter).select('_id fullName email phoneNumber createdAt').sort({ createdAt: 1 }).lean();
                 const schools = await School.find({ ...dateFilter, isApproved: true }).select('_id schoolName schoolEmail city district province registeredAt').sort({ registeredAt: 1 }).lean();

                 reportData = { donors, schools };
                 filename = `user_summary_report_${safeTimeRange}`;
                 header = {
                     donors: [
                          { id: '_id', title: 'Donor ID' }, { id: 'fullName', title: 'Full Name' },
                          { id: 'email', title: 'Email' }, { id: 'phoneNumber', title: 'Phone Number' },
                          { id: 'createdAt', title: 'Registered Date' },
                     ],
                     schools: [
                          { id: '_id', title: 'School ID' }, { id: 'schoolName', title: 'School Name' },
                          { id: 'schoolEmail', title: 'School Email' }, { id: 'city', title: 'City' },
                          { id: 'district', title: 'District' }, { id: 'province', title: 'Province' },
                          { id: 'registeredAt', title: 'Registration Date' },
                     ]
                 };
                 break;
            }

            case 'resources': {
                 reportData = await DonationRequest.aggregate([
                     { $match: dateFilter },
                     {
                         $lookup: {
                             from: 'schools', localField: 'school', foreignField: '_id', as: 'schoolDetails'
                         }
                     },
                     { $unwind: { path: '$schoolDetails', preserveNullAndEmptyArrays: true } },
                     { $sort: { createdAt: 1 } },
                     {
                         $project: {
                             'Request ID': { $toString: '$_id' },
                             'Request Date': { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
                             'School Name': { $ifNull: ['$schoolDetails.schoolName', 'Deleted School'] },
                             'School District': { $ifNull: ['$schoolDetails.district', 'N/A'] },
                             'Requested Items': {
                                   $reduce: {
                                       input: "$requestedItems",
                                       initialValue: "",
                                       in: { $concat: ["$$value", { $cond: [{ $eq: ["$$value", ""] }, "", ", "] }, { $toString: "$$this.quantity" }, " ", "$$this.categoryNameEnglish", " (Rec: ", { $toString: "$$this.quantityReceived" }, ")"] }
                                   }
                              },
                              'Status': '$status',
                              'Notes': '$notes'
                         }
                     }
                 ]);
                 header = [
                     { id: 'Request ID', title: 'Request ID' }, { id: 'Request Date', title: 'Request Date' },
                     { id: 'School Name', title: 'School Name' }, { id: 'School District', title: 'School District' },
                     { id: 'Requested Items', title: 'Requested Items' }, { id: 'Status', title: 'Status' },
                     { id: 'Notes', title: 'Notes' },
                 ];
                 break;
            }

             case 'impact': {
                 reportData = await ImpactStory.aggregate([
                     { $match: dateFilter },
                      {
                         $lookup: {
                             from: 'schools', localField: 'school', foreignField: '_id', as: 'schoolDetails'
                         }
                     },
                     { $unwind: { path: '$schoolDetails', preserveNullAndEmptyArrays: true } },
                      {
                         $lookup: {
                              from: 'donations', localField: 'donation', foreignField: '_id', as: 'donationDetails'
                         }
                     },
                     { $unwind: { path: '$donationDetails', preserveNullAndEmptyArrays: true } },
                      {
                         $lookup: {
                              from: 'donors', localField: 'donationDetails.donor', foreignField: '_id', as: 'donorDetails'
                         }
                     },
                     { $unwind: { path: '$donorDetails', preserveNullAndEmptyArrays: true } },
                     { $sort: { submittedAt: 1 } },
                     {
                         $project: {
                             'Story ID': { $toString: '$_id' },
                             'Submission Date': { $dateToString: { format: "%Y-%m-%d", date: "$submittedAt" } },
                             'Title': '$title',
                             'School Name': { $ifNull: ['$schoolDetails.schoolName', 'Deleted School'] },
                              'Related Donation ID': { $ifNull: [{ $toString: '$donationDetails._id' }, 'N/A'] },
                              'Related Donor Name': { $ifNull: ['$donorDetails.fullName', 'Anonymous/Deleted Donor'] },
                             'Status': '$status',
                              'Approval Date': { $dateToString: { format: "%Y-%m-%d", date: "$approvedAt" } },
                              'Admin Remarks': '$adminRemarks',
                              'Story Text (Snippet)': { $substrCP: ["$storyText", 0, 200] },
                              'Quote': '$quote',
                              'Quote Author': '$quoteAuthor',
                         }
                     }
                 ]);
                  header = [
                      { id: 'Story ID', title: 'Story ID' }, { id: 'Submission Date', title: 'Submission Date' },
                      { id: 'Title', title: 'Title' }, { id: 'School Name', title: 'School Name' },
                       { id: 'Related Donation ID', title: 'Related Donation ID' }, { id: 'Related Donor Name', title: 'Related Donor Name' },
                      { id: 'Status', title: 'Status' }, { id: 'Approval Date', title: 'Approval Date' },
                      { id: 'Admin Remarks', title: 'Admin Remarks' }, { id: 'Story Text (Snippet)', title: 'Story Text (Snippet)' },
                      { id: 'Quote', title: 'Quote' }, { id: 'Quote Author', title: 'Quote Author' },
                  ];
                  break;
            }

            case 'logistics': {
                 reportData = await Donation.aggregate([
                      { $match: dateFilter },
                       {
                         $lookup: {
                             from: 'schools', localField: 'school', foreignField: '_id', as: 'schoolDetails'
                         }
                     },
                     { $unwind: { path: '$schoolDetails', preserveNullAndEmptyArrays: true } },
                     { $sort: { createdAt: 1 } },
                     {
                          $project: {
                              'Donation ID': { $toString: '$_id' },
                              'Date': { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
                              'School Name': { $ifNull: ['$schoolDetails.schoolName', 'Deleted School'] },
                              'School District': { $ifNull: ['$schoolDetails.district', 'N/A'] },
                              'Delivery Method': '$deliveryMethod',
                              'Tracking Status': '$trackingStatus',
                              'Items Donated': {
                                  $reduce: {
                                      input: "$itemsDonated",
                                      initialValue: "",
                                      in: { $concat: ["$$value", { $cond: [{ $eq: ["$$value", ""] }, "", ", "] }, { $toString: "$$this.quantityDonated" }, " ", "$$this.categoryNameEnglish"] }
                                  }
                              },
                              'School Confirmed': { $cond: ["$schoolConfirmation", "Yes", "No"] },
                              'Confirmed At': { $dateToString: { format: "%Y-%m-%d %H:%M", date: "$schoolConfirmationAt" } },
                              'Admin Tracking ID': '$adminTrackingId',
                              'Admin Remarks': '$adminRemarks',
                          }
                     }
                 ]);
                  header = [
                      { id: 'Donation ID', title: 'Donation ID' }, { id: 'Date', title: 'Date' },
                      { id: 'School Name', title: 'School Name' }, { id: 'School District', title: 'School District' },
                      { id: 'Delivery Method', title: 'Delivery Method' }, { id: 'Tracking Status', title: 'Tracking Status' },
                      { id: 'Items Donated', title: 'Items Donated' }, { id: 'School Confirmed', title: 'School Confirmed' },
                      { id: 'Confirmed At', title: 'Confirmed At' }, { id: 'Admin Tracking ID', title: 'Admin Tracking ID' },
                      { id: 'Admin Remarks', title: 'Admin Remarks' },
                  ];
                  break;
            }

            case 'verification': {
                 reportData = await School.aggregate([
                     { $match: dateFilter },
                      { $sort: { registeredAt: 1 } },
                     {
                         $project: {
                             'School ID': { $toString: '$_id' },
                             'Registration Date': { $dateToString: { format: "%Y-%m-%d", date: "$registeredAt" } },
                              'School Name': '$schoolName',
                              'School Email': '$schoolEmail',
                              'Principal Name': '$principalName',
                              'Principal Email': '$principalEmail',
                              'Phone Number': '$phoneNumber',
                              'Street Address': '$streetAddress',
                              'City': '$city',
                              'District': '$district',
                              'Province': '$province',
                              'Postal Code': '$postalCode',
                             'Status': {
                                 $cond: {
                                     if: "$isApproved",
                                     then: "Approved",
                                     else: { $cond: [{ $and: [{ $ne: ["$adminRemarks", null] }, { $ne: ["$adminRemarks", ""] }] }, "Rejected", "Pending"] }
                                 }
                             },
                              'Approved/Rejected Date': { $dateToString: { format: "%Y-%m-%d", date: "$approvedAt" } },
                              'Admin Remarks': '$adminRemarks',
                         }
                     }
                 ]);
                  header = [
                      { id: 'School ID', title: 'School ID' }, { id: 'Registration Date', title: 'Registration Date' },
                      { id: 'School Name', title: 'School Name' }, { id: 'School Email', title: 'School Email' },
                       { id: 'Principal Name', title: 'Principal Name' }, { id: 'Principal Email', title: 'Principal Email' },
                       { id: 'Phone Number', title: 'Phone Number' }, { id: 'Street Address', title: 'Street Address' },
                       { id: 'City', title: 'City' }, { id: 'District', title: 'District' },
                       { id: 'Province', title: 'Province' }, { id: 'Postal Code', title: 'Postal Code' },
                      { id: 'Status', title: 'Status' }, { id: 'Approved/Rejected Date', title: 'Approved/Rejected Date' },
                      { id: 'Admin Remarks', title: 'Admin Remarks' },
                  ];
                  break;
            }

            default:
                res.status(404);
                throw new Error('Report type not found for export');
        }
    } catch (error) {
        console.error(`Error fetching data for export ${reportType}:`, error);
        res.status(500).json({ message: 'Failed to fetch data for export', error: error.message });
        return;
    }


    if (format === 'csv') {
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename=${filename}.csv`);

        if (reportType === 'users') {
             const tempFilePath = path.join(__dirname, `temp_users_export_${Date.now()}.csv`);
             const outputStream = fs.createWriteStream(tempFilePath);

             outputStream.write(`${reportTitle} (${timeRange})\n\n`);

             outputStream.write(`-- Donors (${reportData.donors.length}) --\n`);
             const csvWriterDonors = csvWriter({ header: header.donors, path: outputStream, append: true });
             await csvWriterDonors.writeRecords(reportData.donors.map(d => ({
                 ...d,
                 createdAt: d.createdAt ? d.createdAt.toLocaleDateString('en-US') : ''
             })));
             outputStream.write(`\n\n`);

             outputStream.write(`-- Approved Schools (${reportData.schools.length}) --\n`);
             const csvWriterSchools = csvWriter({ header: header.schools, path: outputStream, append: true });
              await csvWriterSchools.writeRecords(reportData.schools.map(s => ({
                 ...s,
                 registeredAt: s.registeredAt ? s.registeredAt.toLocaleDateString('en-US') : ''
             })));

             outputStream.end();

             outputStream.on('finish', () => {
                 const readStream = fs.createReadStream(tempFilePath);
                 readStream.pipe(res);
                  readStream.on('close', () => {
                       fs.unlink(tempFilePath, (err) => {
                           if (err) console.error(`Error deleting temp file ${tempFilePath}:`, err);
                       });
                  });
                  readStream.on('error', (err) => {
                      console.error("Error piping temp file to response:", err);
                      if (!res.headersSent) res.status(500).send('Error sending file.');
                  });
             });

              outputStream.on('error', (err) => {
                   console.error("Error writing temp file:", err);
                   if (!res.headersSent) res.status(500).send('Error writing file.');
              });


        } else {
             const formattedReportData = reportData.map(row => {
                const formattedRow = { ...row };
                for (const key in formattedRow) {
                     if (formattedRow[key] instanceof Date) {
                         if (key.toLowerCase().endsWith('at') || key.toLowerCase().includes('time')) {
                            formattedRow[key] = formattedRow[key].toLocaleDateString('en-US') + ' ' + formattedRow[key].toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
                         } else {
                             formattedRow[key] = formattedRow[key].toLocaleDateString('en-US');
                         }
                     }
                }
                 return formattedRow;
             });

             const writer = csvWriter({ header: header, path: res });
             await writer.writeRecords(formattedReportData);
             res.end();
        }

    } else if (format === 'pdf') {
         if (!printer) {
              res.status(500).json({ message: 'PDF export failed: Printer not initialized.' });
              return;
         }

         res.setHeader('Content-Type', 'application/pdf');
         res.setHeader('Content-Disposition', `attachment; filename=${filename}.pdf`);

         const docDefinition = {
             content: [
                 { text: reportTitle, style: 'header' },
                 { text: `Time Range: ${timeRange}`, style: 'subheader' },
                 { text: `Generated: ${new Date().toLocaleDateString('en-US')} ${new Date().toLocaleTimeString('en-US')}`, style: 'small' },
                 { text: '\n' },
             ],
             styles: {
                 header: { fontSize: 18, bold: true, margin: [0, 0, 0, 10] },
                 subheader: { fontSize: 14, bold: true, margin: [0, 10, 0, 5] },
                 tableHeader: { bold: true, fontSize: 10, color: 'black', fillColor: '#f5f5f5' },
                 small: { fontSize: 9 }
             },
             defaultStyle: { font: 'Roboto', fontSize: 10 }
         };

         if (reportType === 'users') {
               if(reportData.donors.length > 0){
                    docDefinition.content.push({ text: `Donors (${reportData.donors.length})`, style: 'subheader', margin: [0, 10, 0, 5] });
                    docDefinition.content.push({
                        table: {
                            headerRows: 1,
                            widths: [80, '*', '*', 80, 60],
                            body: [
                                header.donors.map(h => ({ text: h.title, style: 'tableHeader', alignment: 'center' })),
                                ...reportData.donors.map(row => [
                                    { text: row._id.toString(), alignment: 'left' },
                                    { text: row.fullName || '', alignment: 'left' },
                                    { text: row.email || '', alignment: 'left' },
                                    { text: row.phoneNumber || '', alignment: 'left' },
                                    { text: row.createdAt ? row.createdAt.toLocaleDateString('en-US') : '', alignment: 'center' }
                                ])
                            ]
                        },
                        layout: 'lightHorizontalLines',
                        margin: [0, 5, 0, 15]
                    });
               }
                if(reportData.schools.length > 0){
                   docDefinition.content.push({ text: '\n' });
                   docDefinition.content.push({ text: `Approved Schools (${reportData.schools.length})`, style: 'subheader', margin: [0, 10, 0, 5] });
                   docDefinition.content.push({
                       table: {
                           headerRows: 1,
                           widths: [80, '*', '*', 80, 80, 80, 60],
                           body: [
                               header.schools.map(h => ({ text: h.title, style: 'tableHeader', alignment: 'center' })),
                               ...reportData.schools.map(row => [
                                   { text: row._id.toString(), alignment: 'left' },
                                   { text: row.schoolName || '', alignment: 'left' },
                                   { text: row.schoolEmail || '', alignment: 'left' },
                                   { text: row.city || '', alignment: 'left' },
                                   { text: row.district || '', alignment: 'left' },
                                   { text: row.province || '', alignment: 'left' },
                                   { text: row.registeredAt ? row.registeredAt.toLocaleDateString('en-US') : '', alignment: 'center' }
                               ])
                           ]
                       },
                       layout: 'lightHorizontalLines',
                       margin: [0, 5, 0, 15]
                   });
                }

         } else if (reportData.length > 0) {
             const colWidths = header.map(() => '*');
             const columnWidthMap = {
                 'Donation ID': 60, 'Request ID': 60, 'School ID': 60, 'Story ID': 60,
                 'Date': 50, 'Submission Date': 50, 'Approval Date': 50, 'Registration Date': 50,
                 'Delivery Method': 60, 'Tracking Status': 60, 'Status': 60, 'School Confirmed': 40,
                 'Confirmed At': 80, 'Quote Author': 60, 'Phone Number': 60, 'Postal Code': 40,
                 'Items Donated': '*', 'Requested Items': '*', 'Story Text (Snippet)': '*', 'Title': '*'
             };

             header.forEach((h, index) => {
                  const mappedWidth = columnWidthMap[h.title];
                  if (mappedWidth !== undefined) {
                      colWidths[index] = mappedWidth;
                  }
             });

              docDefinition.content.push({
                  table: {
                      headerRows: 1,
                      widths: colWidths,
                      body: [
                          header.map(h => ({ text: h.title, style: 'tableHeader', alignment: 'center' })),
                          ...reportData.map(row => header.map(h => {
                              let value = row[h.id];
                              if (value && typeof value === 'string') {
                                  try {
                                      const date = new Date(value);
                                      if (!isNaN(date) && date.getFullYear() > 1900) {
                                            if (h.id.toLowerCase().includes('at') || h.title.toLowerCase().includes('time')) {
                                                return { text: date.toLocaleDateString('en-US') + ' ' + date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }), alignment: 'center' };
                                            } else {
                                                return { text: date.toLocaleDateString('en-US'), alignment: 'center' };
                                            }
                                      }
                                  } catch (e) {
                                  }
                              }

                               let cellText = '';
                               if (value === null || value === undefined) {
                                   cellText = '';
                               } else if (typeof value === 'object') {
                                    try {
                                        cellText = JSON.stringify(value);
                                    } catch (e) {
                                        cellText = '[Object]';
                                    }
                               } else {
                                   cellText = String(value);
                               }

                               let alignment = 'left';
                               if (h.id.toLowerCase().includes('date') || h.id.toLowerCase().includes('id') || h.id === 'Status' || h.title.toLowerCase().includes('confirmed')) {
                                  alignment = 'center';
                               } else if (typeof value === 'number') {
                                   alignment = 'right';
                               }

                              return { text: cellText, alignment: alignment };
                          }))
                      ]
                  },
                  layout: 'lightHorizontalLines',
                   margin: [0, 5, 0, 15]
              });
         } else {
              docDefinition.content.push({ text: 'No data available for the selected time range and report type.', italics: true });
         }


         const pdfDoc = printer.createPdfKitDocument(docDefinition);
         pdfDoc.pipe(res);
         pdfDoc.end();

    } else {
        res.status(400).json({ message: 'Unsupported export format' });
    }
});


module.exports = {
    getAnalyticsData,
    exportAnalyticsReport,
};
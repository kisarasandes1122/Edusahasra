// backend/controllers/analyticsController.js
const asyncHandler = require('express-async-handler');
const School = require('../models/schoolModel');
const Donation = require('../models/donationModel');
const DonationRequest = require('../models/donationRequestModel');
const ImpactStory = require('../models/impactStoryModel');
const Donor = require('../models/donorModel');
// Correctly import createObjectCsvWriter
const { createObjectCsvWriter } = require('csv-writer');
const PdfPrinter = require('pdfmake');
const { Readable } = require('stream');
const { promisify } = require('util');
const pipeline = promisify(require('stream').pipeline);
const fs = require('fs');
const path = require('path');

// Refactored getDateRange to return start and end dates
const getDateRange = (timeRange) => {
    console.debug(`[getDateRange] Calculating date range for: ${timeRange}`);
    const now = new Date();
    let startDate = null; // Use null for 'all' range

    // Set end date to the end of the current day
    const endDate = new Date(now); // Clone now
    endDate.setHours(23, 59, 59, 999);

    switch (timeRange) {
        case 'week':
            startDate = new Date(now); // Clone now
            startDate.setDate(now.getDate() - 7);
            break;
        case 'month':
             startDate = new Date(now); // Clone now
             startDate.setMonth(now.getMonth() - 1);
             // Note: This gives roughly the last month. For strict calendar month, more logic is needed.
             // This is acceptable for typical analytics ranges.
            break;
        case 'quarter':
             startDate = new Date(now); // Clone now
             startDate.setMonth(now.getMonth() - 3);
            break;
        case 'year':
             startDate = new Date(now); // Clone now
             startDate.setFullYear(now.getFullYear() - 1);
            break;
        case 'all':
        default:
             console.debug('[getDateRange] timeRange "all" or unknown. No date filter applied.');
             return { startDate: null, endDate: null }; // Return nulls for 'all' range
    }
    // Set start date to the beginning of the day
    startDate.setHours(0, 0, 0, 0);

    console.debug(`[getDateRange] Calculated range: ${startDate} to ${endDate}`);
    return { startDate, endDate }; // Return start and end dates
};

// Helper to create MongoDB date filter
const buildDateFilter = (fieldName, startDate, endDate) => {
    if (!startDate || !endDate) {
         console.debug(`[buildDateFilter] No date range provided. Returning empty filter for field: ${fieldName}`);
        return {}; // No filter if range is 'all' or dates are invalid
    }
    console.debug(`[buildDateFilter] Applying date filter for field "${fieldName}" between ${startDate} and ${endDate}`);
    return { [fieldName]: { $gte: startDate, $lte: endDate } };
};


const fonts = {
    Roboto: {
        normal: path.join(__dirname, '..', 'fonts', 'Roboto-Regular.ttf'),
        bold: path.join(__dirname, '..', 'fonts', 'Roboto-Medium.ttf'),
        // Removed references to Italic and BoldItalic as files were not found
        // italics: path.join(__dirname, '..', 'fonts', 'Roboto-Italics.ttf'),
        // bolditalics: path.join(__dirname, '..', 'fonts', 'Roboto-MediumItalics.ttf')
    }
};

let printer;
try {
     console.info('[PDFMake Init] Checking font files for PDFMake...');
     const fontExistence = Object.fromEntries(
         Object.entries(fonts.Roboto).map(([key, fontPath]) => [key, { path: fontPath, exists: fs.existsSync(fontPath) }])
     );
     console.debug('[PDFMake Init] Font Existence Check Results:', fontExistence);


    const fontFilesExist = Object.values(fonts).every(fontStyles =>
        Object.values(fontStyles).every(fontPath => fs.existsSync(fontPath))
    );

    if (fontFilesExist) {
        printer = new PdfPrinter(fonts);
         console.info("[PDFMake Init] PDFMake printer initialized successfully.");
    } else {
         console.error("[PDFMake Init] PDFMake font initialization failed: One or more font files not found.");
         console.error("[PDFMake Init] Ensure font files like Roboto-Regular.ttf are in the backend/fonts directory at the correct path:", path.join(__dirname, '..', 'fonts'));
         // You might want to keep printer as null here or throw an error depending on desired behavior
         // Keeping it null allows the server to start but PDF export will fail gracefully
         printer = null; // Explicitly set to null if fonts are missing
    }

} catch (fontError) {
    console.error("[PDFMake Init] PDFMake font initialization encountered an error:", fontError);
     printer = null; // Explicitly set to null on error
}

const getAnalyticsData = asyncHandler(async (req, res) => {
    const { reportType } = req.params;
    const { timeRange } = req.query;
    console.info(`[getAnalyticsData] Entering for reportType=${reportType}, timeRange=${timeRange}`);

    const { startDate, endDate } = getDateRange(timeRange);

    let data = {};

    try {
        switch (reportType) {
            case 'donation': {
                console.debug(`[getAnalyticsData:donation] Fetching monthlyDonations...`);
                const monthlyDonations = await Donation.aggregate([
                    { $match: buildDateFilter('createdAt', startDate, endDate) }, // Use createdAt
                    {
                        $group: {
                            _id: { $dateToString: { format: "%Y-%m", date: "$createdAt" } },
                            total: { $sum: 1 }
                        }
                    },
                    { $sort: { _id: 1 } },
                    { $project: { _id: 0, month: "$_id", total: 1 } }
                ]);
                console.debug(`[getAnalyticsData:donation] Fetched ${monthlyDonations.length} monthly donation entries.`);


                 console.debug(`[getAnalyticsData:donation] Fetching donationCategories...`);
                 const donationCategories = await Donation.aggregate([
                    { $match: buildDateFilter('createdAt', startDate, endDate) }, // Use createdAt
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
                 console.debug(`[getAnalyticsData:donation] Fetched ${donationCategories.length} donation category entries.`);

                console.debug(`[getAnalyticsData:donation] Fetching regionData...`);
                const regionData = await Donation.aggregate([
                    { $match: buildDateFilter('createdAt', startDate, endDate) }, // Use createdAt
                    {
                        $lookup: {
                            from: 'schools',
                            localField: 'school',
                            foreignField: '_id',
                            as: 'schoolDetails'
                        }
                    },
                    { $unwind: { path: '$schoolDetails', preserveNullAndEmptyArrays: true } },
                     { $match: { 'schoolDetails.isApproved': true } }, // Only count donations to approved schools
                    {
                        $group: {
                            _id: { $ifNull: ['$schoolDetails.district', 'Unknown District'] },
                            donations: { $sum: 1 }
                        }
                    },
                    { $project: { _id: 0, name: "$_id", donations: 1, requests: { $literal: Math.floor(Math.random() * 100) + 30 } } } // Mock requests
                ]);
                console.debug(`[getAnalyticsData:donation] Fetched ${regionData.length} region data entries.`);


                 console.debug(`[getAnalyticsData:donation] Fetching totalDonations count...`);
                 const totalDonations = await Donation.countDocuments(buildDateFilter('createdAt', startDate, endDate)); // Use createdAt
                 console.debug(`[getAnalyticsData:donation] Total Donations: ${totalDonations}`);

                 console.debug(`[getAnalyticsData:donation] Calculating avgItemsPerDonation...`);
                 const avgItemsPerDonationResult = await Donation.aggregate([
                      { $match: buildDateFilter('createdAt', startDate, endDate) }, // Use createdAt
                      { $unwind: "$itemsDonated" },
                      {
                          $group: {
                              _id: null,
                              totalItems: { $sum: "$itemsDonated.quantityDonated" },
                              totalDonations: { $addToSet: "$_id" } // Count unique donation IDs
                           }
                       },
                       { $project: { _id: 0, avgItems: { $divide: ["$totalItems", { $cond: [{ $eq: ["$totalDonations", 0] }, 1, { $size: "$totalDonations" }] }] } } }
                 ]);
                 const avgItemsPerDonation = avgItemsPerDonationResult.length > 0 && avgItemsPerDonationResult[0].avgItems !== null
                 ? avgItemsPerDonationResult[0].avgItems.toFixed(1)
                 : 0;
                 console.debug(`[getAnalyticsData:donation] Avg Items Per Donation: ${avgItemsPerDonation}`);


                 console.debug(`[getAnalyticsData:donation] Calculating fulfillmentRate...`);
                 const fulfillmentRateResult = await DonationRequest.aggregate([
                     { $match: buildDateFilter('createdAt', startDate, endDate) }, // Use createdAt for request date
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
                 console.debug(`[getAnalyticsData:donation] Fulfillment Rate: ${fulfillmentRate}%`);

                 console.debug(`[getAnalyticsData:donation] Counting active requests...`);
                 const activeRequestsCount = await DonationRequest.countDocuments({
                     ...buildDateFilter('createdAt', startDate, endDate), // Use createdAt
                     status: { $in: ['Pending', 'Partially Fulfilled'] }
                 });
                 console.debug(`[getAnalyticsData:donation] Active Requests: ${activeRequestsCount}`);


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
                 console.debug(`[getAnalyticsData:users] Fetching userGrowthSchools...`);
                 const userGrowthSchools = await School.aggregate([
                     { $match: { ...buildDateFilter('registeredAt', startDate, endDate), isApproved: true } }, // Use registeredAt
                      {
                         $group: {
                             _id: { $dateToString: { format: "%Y-%m", date: "$registeredAt" } },
                             count: { $sum: 1 }
                         }
                     },
                     { $sort: { _id: 1 } }
                 ]);
                 console.debug(`[getAnalyticsData:users] Fetched ${userGrowthSchools.length} school growth entries.`);

                 console.debug(`[getAnalyticsData:users] Fetching userGrowthDonors...`);
                  const userGrowthDonors = await Donor.aggregate([
                     { $match: buildDateFilter('createdAt', startDate, endDate) }, // Use createdAt
                      {
                         $group: {
                             _id: { $dateToString: { format: "%Y-%m", date: "$createdAt" } },
                             count: { $sum: 1 }
                         }
                     },
                     { $sort: { _id: 1 } }
                 ]);
                 console.debug(`[getAnalyticsData:users] Fetched ${userGrowthDonors.length} donor growth entries.`);


                 const userGrowth = [];
                 // const schoolMap = new Map(userGrowthSchools.map(item => [item._id, item.count])); // Not used directly in loop
                 // const donorMap = new Map(userGrowthDonors.map(item => [item._id, item.count])); // Not used directly in loop

                 console.debug('[getAnalyticsData:users] Generating cumulative user growth data points.');
                 const allMonthsSet = new Set();
                  let effectiveStartDate = startDate || await School.findOne({ isApproved: true }).sort({ registeredAt: 1 }).select('registeredAt -_id').lean().then(s => s?.registeredAt) || await Donor.findOne().sort({ createdAt: 1 }).select('createdAt -_id').lean().then(d => d?.createdAt) || new Date();
                   effectiveStartDate = new Date(effectiveStartDate.getFullYear(), effectiveStartDate.getMonth(), 1); // Start from the 1st of the month

                   const endLimitDate = endDate ? new Date(endDate.getFullYear(), endDate.getMonth() + 1, 0, 23, 59, 59, 999) : new Date(); // Use end of month if endDate exists, otherwise current date
                    endLimitDate.setHours(23,59,59,999); // Set to end of day for accurate comparison

                   let currentDate = new Date(effectiveStartDate);

                   while (currentDate <= endLimitDate) {
                       const monthKey = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
                       allMonthsSet.add(monthKey);
                       currentDate.setMonth(currentDate.getMonth() + 1);
                   }
                   const allMonths = Array.from(allMonthsSet).sort();
                   console.debug(`[getAnalyticsData:users] Generating cumulative data for ${allMonths.length} months.`);


                for (const month of allMonths) {
                      const [year, monthNumStr] = month.split('-');
                      const monthNum = parseInt(monthNumStr, 10);
                      const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
                      const shortMonth = monthNames[monthNum - 1];

                      const endOfMonth = new Date(year, monthNum, 0, 23, 59, 59, 999); // Day 0 of next month is end of this month

                       // Query cumulative counts up to the end of the current month iteration
                       console.debug(`[getAnalyticsData:users] Calculating cumulative counts up to ${endOfMonth} for month ${month}.`);
                      const totalSchoolsUpToMonth = await School.countDocuments({
                          isApproved: true,
                          registeredAt: { $lte: endOfMonth }
                      });
                      const totalDonorsUpToMonth = await Donor.countDocuments({
                          createdAt: { $lte: endOfMonth }
                      });

                      userGrowth.push({
                          month: `${shortMonth} ${year}`,
                          schools: totalSchoolsUpToMonth,
                          donors: totalDonorsUpToMonth
                      });
                  }
                   console.debug(`[getAnalyticsData:users] Cumulative user growth data generated (${userGrowth.length} points).`);


                 const userRetention = [
                     { month: 'Jan 2024', rate: 85 }, { month: 'Feb 2024', rate: 82 },
                     { month: 'Mar 2024', rate: 88 }, { month: 'Apr 2024', rate: 90 },
                     { month: 'May 2024', rate: 92 }, { month: 'Jun 2024', rate: 94 },
                     { month: 'Jul 2024', rate: 91 }, { month: 'Aug 2024', rate: 93 },
                     { month: 'Sep 2024', rate: 95 }, { month: 'Oct 2024', rate: 96 },
                     { month: 'Nov 2024', rate: 94 }, { month: 'Dec 2024', rate: 97 },
                 ]; // Mocked Data
                 console.debug(`[getAnalyticsData:users] Using mocked userRetention data.`);


                 console.debug(`[getAnalyticsData:users] Counting total approved schools and donors...`);
                 const totalApprovedSchools = await School.countDocuments({ isApproved: true });
                 const totalDonors = await Donor.countDocuments();
                 const avgSessionDuration = '6m 32s'; // Mocked
                 const returningUsersRate = '62%'; // Mocked
                 console.debug(`[getAnalyticsData:users] Total Schools: ${totalApprovedSchools}, Total Donors: ${totalDonors}`);


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
                 console.debug(`[getAnalyticsData:resources] Fetching total requested items by category...`);
                 const totalRequestedByCat = await DonationRequest.aggregate([
                          { $match: buildDateFilter('createdAt', startDate, endDate) }, // Use createdAt
                          { $unwind: "$requestedItems" },
                          {
                              $group: {
                                  _id: "$requestedItems.categoryNameEnglish",
                                  requested: { $sum: "$requestedItems.quantity" },
                                  received: { $sum: "$requestedItems.quantityReceived" }
                              }
                          },
                         {
                             $project: {
                                  _id: 0,
                                  category: "$_id",
                                  requested: "$requested",
                                  received: "$received",
                                  fulfilled: {
                                       $round: [{ $multiply: [{ $divide: ["$received", { $cond: [{ $eq: ["$requested", 0] }, 1, "$requested"] }] }, 100] }, 0]
                                  },
                                  unfulfilled: {
                                       $round: [{ $multiply: [{ $divide: [{ $subtract: ["$requested", "$received"] }, { $cond: [{ $eq: ["$requested", 0] }, 1, "$requested"] }] }, 100] }, 0]
                                  }
                             }
                         },
                         { $sort: { requested: -1 } }
                     ]);
                 console.debug(`[getAnalyticsData:resources] Fetched ${totalRequestedByCat.length} resource fulfillment entries.`);

                 const regionalCoverage = [
                    { region: 'Central', coverage: 75 },
                    { region: 'Eastern', coverage: 60 },
                    { region: 'Northern', coverage: 55 },
                    { region: 'Southern', coverage: 70 },
                    { region: 'Western', coverage: 85 }
                 ]; // Mocked data
                 console.debug(`[getAnalyticsData:resources] Using mocked regionalCoverage data.`);

                data = {
                    fulfillmentRate: totalRequestedByCat,
                    regionalCoverage,
                };
                break;
            }

            case 'impact': {
                 console.debug(`[getAnalyticsData:impact] Fetching confirmed donations received by schools...`);
                 const studentsBenefited = await Donation.aggregate([
                     { $match: { schoolConfirmation: true, trackingStatus: 'Received by School', ...buildDateFilter('schoolConfirmationAt', startDate, endDate) } }, // Filter by confirmation date
                      {
                         $group: {
                             _id: { $dateToString: { format: "%Y-%m", date: "$schoolConfirmationAt" } },
                             count: { $sum: 1 }
                         }
                     },
                     { $sort: { _id: 1 } },
                     { $project: { _id: 0, month: "$_id", count: 1 } }
                 ]);
                 console.debug(`[getAnalyticsData:impact] Fetched ${studentsBenefited.length} confirmed donation entries.`);


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
                 ]; // Mocked data
                 console.debug(`[getAnalyticsData:impact] Using mocked donationImpact data.`);


                data = {
                    studentsBenefited: studentsBenefitedFormatted,
                    donationImpact,
                };
                break;
            }

            case 'logistics': {
                 console.debug(`[getAnalyticsData:logistics] Calculating average delivery time...`);
                 const deliveryTime = await Donation.aggregate([
                     { $match: { schoolConfirmation: true, trackingStatus: 'Received by School', ...buildDateFilter('schoolConfirmationAt', startDate, endDate), createdAt: { $exists: true, $ne: null } } }, // Filter by confirmation date, ensure creation date exists
                      {
                         $addFields: {
                             processingDurationMs: { $subtract: ["$schoolConfirmationAt", "$createdAt"] }
                         }
                     },
                      { $match: { processingDurationMs: { $gte: 0 } } }, // Filter out data anomalies
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
                 console.debug(`[getAnalyticsData:logistics] Fetched ${deliveryTime.length} average delivery time entries.`);


                 console.debug(`[getAnalyticsData:logistics] Fetching delivery status distribution...`);
                 const deliveryStatus = await Donation.aggregate([
                     { $match: buildDateFilter('createdAt', startDate, endDate) }, // Filter by creation date
                     {
                         $group: {
                             _id: "$trackingStatus",
                             count: { $sum: 1 }
                         }
                     },
                      { $project: { _id: 0, name: "$_id", value: "$count" } }
                 ]);
                 console.debug(`[getAnalyticsData:logistics] Fetched ${deliveryStatus.length} delivery status entries.`);


                 console.debug(`[getAnalyticsData:logistics] Fetching recent deliveries...`);
                 const recentDeliveries = await Donation.find({
                     schoolConfirmation: true,
                     trackingStatus: 'Received by School',
                     ...buildDateFilter('schoolConfirmationAt', startDate, endDate) // Filter by confirmation date
                    })
                      .populate('school', 'schoolName city')
                      .select('_id createdAt itemsDonated deliveryMethod trackingStatus school schoolConfirmationAt')
                      .sort({ schoolConfirmationAt: -1 }) // Sort by confirmation date
                      .lean();
                 console.debug(`[getAnalyticsData:logistics] Fetched ${recentDeliveries.length} recent delivery entries.`);


                  const formattedRecentDeliveries = recentDeliveries.map(del => ({
                      donationId: del._id.toString(),
                      schoolName: del.school?.schoolName,
                       schoolCity: del.school?.city,
                       itemsSummary: del.itemsDonated.map(item => `${item.quantityDonated} ${item.categoryNameEnglish}`).join(', '),
                      deliveryMethod: del.deliveryMethod,
                      status: del.trackingStatus,
                       date: del.schoolConfirmationAt ? del.schoolConfirmationAt.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 'N/A', // Use confirmation date
                  }));


                data = {
                    deliveryTime,
                    deliveryStatus,
                    recentDeliveries: formattedRecentDeliveries,
                };
                break;
            }

            case 'verification': {
                 console.debug(`[getAnalyticsData:verification] Fetching school verification statistics...`);
                 const verificationRate = await School.aggregate([
                     { $match: buildDateFilter('registeredAt', startDate, endDate) }, // Use registeredAt
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
                 console.debug(`[getAnalyticsData:verification] Fetched ${verificationRate.length} verification rate entries.`);


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

                 console.debug(`[getAnalyticsData:verification] Calculating average processing time for verified schools...`);
                 const processingTime = await School.aggregate([
                     {
                         $match: {
                              $or: [
                                  { isApproved: true }, // Schools that are approved (any time)
                                  { isApproved: false, adminRemarks: { $ne: null, $ne: "" } } // Schools that are rejected (any time)
                              ],
                              registeredAt: { $exists: true, $ne: null },
                              approvedAt: { $exists: true, $ne: null },
                              ...buildDateFilter('approvedAt', startDate, endDate) // Filter by approval/rejection date
                         }
                      },
                      {
                         $addFields: {
                             processingDurationMs: { $subtract: ["$approvedAt", "$registeredAt"] }
                         }
                     },
                     { $match: { processingDurationMs: { $gte: 0 } } }, // Filter out data anomalies
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
                 console.debug(`[getAnalyticsData:verification] Fetched ${processingTime.length} processing time entries.`);


                  const processingTimeFormatted = processingTime.map(item => {
                       const [year, monthNum] = item.month.split('-');
                       const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
                       const shortMonth = monthNames[parseInt(monthNum, 10) - 1];
                       return {
                           month: `${shortMonth} ${year}`,
                           days: item.days
                       };
                  });

                   console.debug(`[getAnalyticsData:verification] Calculating overall verification stats...`);
                   const totalVerificationsProcessedOverall = await School.countDocuments({
                       $or: [
                           { isApproved: true },
                           { isApproved: false, adminRemarks: { $ne: null, $ne: "" } }
                       ]
                   });

                   const totalApprovedSchoolsCountOverall = await School.countDocuments({ isApproved: true });
                   const totalRejectedSchoolsCountOverall = await School.countDocuments({ isApproved: false, adminRemarks: { $ne: null, $ne: "" } });
                   const totalProcessedOverall = totalApprovedSchoolsCountOverall + totalRejectedSchoolsCountOverall;
                   console.debug(`[getAnalyticsData:verification] Overall: Processed=${totalProcessedOverall}, Approved=${totalApprovedSchoolsCountOverall}, Rejected=${totalRejectedSchoolsCountOverall}`);


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
                   console.debug(`[getAnalyticsData:verification] Avg processing time overall: ${avgProcessingTime}`);

                  const pendingVerifications = await School.countDocuments({
                      isApproved: false,
                      $or: [
                          { adminRemarks: { $exists: false } },
                          { adminRemarks: null },
                          { adminRemarks: "" }
                      ]
                  });
                   console.debug(`[getAnalyticsData:verification] Pending verifications count: ${pendingVerifications}`);


                // Assuming you want verification data structure similar to other tabs
                // Need to map the fetched data correctly here based on the structure expected by renderTabContent
                // The original switch case for verification in renderTabContent expects: verificationRate, processingTime, verificationStats
                // So, the `data` object should be constructed with these keys.
                data = {
                    verificationRate: verificationRateFormatted, // Use formatted data for chart
                    processingTime: processingTimeFormatted, // Use formatted data for chart
                     verificationStats: {
                         totalVerifications: totalProcessedOverall, // Changed from totalVerificationsProcessedOverall as it matches the chart title better
                         approvalRate: approvalRate,
                         avgProcessingTime: avgProcessingTime,
                         pendingVerifications: pendingVerifications,
                     }
                };

                break;
            }


            default:
                console.warn(`[getAnalyticsData] Unknown report type requested: ${reportType}`);
                res.status(404);
                throw new Error('Report type not found');
        }

        console.info(`[getAnalyticsData] Successfully fetched data for ${reportType}. Sending response.`);
        res.json(data);

    } catch (error) {
        console.error(`[getAnalyticsData] ***** ERROR fetching analytics data for ${reportType}: *****`);
        console.error(`[getAnalyticsData] Error Message: ${error.message}`);
        console.error('[getAnalyticsData] Error Stack:', error.stack); // Log stack trace for server errors
        console.error('[getAnalyticsData] *******************************************************');
        res.status(500).json({ message: 'Failed to fetch analytics data', error: error.message });
    }
});


const exportAnalyticsReport = asyncHandler(async (req, res) => {
    const { reportType, format } = req.params;
    const { timeRange } = req.query;
    console.info(`[exportAnalyticsReport] Entering for reportType=${reportType}, format=${format}, timeRange=${timeRange}`);

    const { startDate, endDate } = getDateRange(timeRange);
    console.debug(`[exportAnalyticsReport] Date range for export: startDate=${startDate}, endDate=${endDate}`);


    if (format === 'pdf' && !printer) {
         console.error(`[exportAnalyticsReport] PDF export requested for ${reportType} but printer not initialized.`);
         res.status(500).json({ message: 'PDF export failed: Font files not found or configured incorrectly on the server.' });
         return;
    }
     if (format !== 'csv' && format !== 'pdf') {
         console.warn(`[exportAnalyticsReport] Unsupported export format requested: ${format}`);
          res.status(400).json({ message: 'Unsupported export format' });
          return; // Stop execution
     }


    let reportData = [];
    const safeReportType = reportType.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_]/g, '').toLowerCase();
    const safeTimeRange = timeRange.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_]/g, '').toLowerCase();
    let filename = `${safeReportType}_report_${safeTimeRange}`;
    let header = [];
    const reportTitle = `${reportType.replace(/([A-Z])/g, ' $1').trim().replace(/^\w/, (c) => c.toUpperCase())} Report`;

    try {
        console.debug(`[exportAnalyticsReport:${reportType}] Starting data fetch for export...`);
        switch (reportType) {
            case 'donation': {
                 reportData = await Donation.aggregate([
                      { $match: buildDateFilter('createdAt', startDate, endDate) },
                       {
                         $lookup: { from: 'schools', localField: 'school', foreignField: '_id', as: 'schoolDetails' }
                     }, { $unwind: { path: '$schoolDetails', preserveNullAndEmptyArrays: true } },
                     {
                         $lookup: { from: 'donors', localField: 'donor', foreignField: '_id', as: 'donorDetails' }
                     }, { $unwind: { path: '$donorDetails', preserveNullAndEmptyArrays: true } },
                     { $sort: { createdAt: 1 } },
                     {
                          $project: {
                              '_id': '$_id',
                              'createdAt': '$createdAt',
                              'donorDetails': { fullName: { $ifNull: ['$donorDetails.fullName', 'Deleted Donor'] }, email: { $ifNull: ['$donorDetails.email', 'N/A'] } },
                              'schoolDetails': { schoolName: { $ifNull: ['$schoolDetails.schoolName', 'Deleted School'] }, district: { $ifNull: ['$schoolDetails.district', 'N/A'] }, province: { $ifNull: ['$schoolDetails.province', 'N/A'] } },
                              'itemsDonated': '$itemsDonated',
                              'deliveryMethod': '$deliveryMethod',
                              'trackingStatus': '$trackingStatus',
                              'schoolConfirmation': '$schoolConfirmation',
                              'schoolConfirmationAt': '$schoolConfirmationAt',
                              'donorRemarks': '$donorRemarks',
                              'adminRemarks': '$adminRemarks',
                          }
                     }
                 ]);
                 header = [
                     { id: '_id', title: 'Donation ID' }, { id: 'createdAt', title: 'Date' },
                     { id: 'donor.fullName', title: 'Donor Name' }, { id: 'donor.email', title: 'Donor Email' },
                     { id: 'school.schoolName', title: 'School Name' }, { id: 'school.district', title: 'School District' }, { id: 'school.province', title: 'School Province' },
                     { id: 'itemsDonatedSummary', title: 'Items Donated' },
                     { id: 'deliveryMethod', title: 'Delivery Method' }, { id: 'trackingStatus', title: 'Tracking Status' },
                     { id: 'schoolConfirmation', title: 'Confirmation Status' }, { id: 'schoolConfirmationAt', title: 'Confirmed At' },
                     { id: 'donorRemarks', title: 'Donor Remarks' }, { id: 'adminRemarks', title: 'Admin Remarks' },
                 ];
                 break;
            }

            case 'users': {
                 const donors = await Donor.find(buildDateFilter('createdAt', startDate, endDate)).select('_id fullName email phoneNumber createdAt').sort({ createdAt: 1 }).lean();
                 const schools = await School.find({ ...buildDateFilter('registeredAt', startDate, endDate), isApproved: true }).select('_id schoolName schoolEmail city district province registeredAt').sort({ registeredAt: 1 }).lean();
                 reportData = { donors, schools };
                 filename = `user_summary_report_${safeTimeRange}`;
                 header = {
                     donors: [ { id: '_id', title: 'Donor ID' }, { id: 'fullName', title: 'Full Name' }, { id: 'email', title: 'Email' }, { id: 'phoneNumber', title: 'Phone Number' }, { id: 'createdAt', title: 'Registered Date' }, ],
                     schools: [ { id: '_id', title: 'School ID' }, { id: 'schoolName', title: 'School Name' }, { id: 'schoolEmail', title: 'School Email' }, { id: 'city', title: 'City' }, { id: 'district', title: 'District' }, { id: 'province', title: 'Province' }, { id: 'registeredAt', title: 'Registration Date' }, ]
                 };
                 break;
            }

            case 'resources': {
                 reportData = await DonationRequest.aggregate([
                     { $match: buildDateFilter('createdAt', startDate, endDate) },
                     { $lookup: { from: 'schools', localField: 'school', foreignField: '_id', as: 'schoolDetails' } }, { $unwind: { path: '$schoolDetails', preserveNullAndEmptyArrays: true } },
                     { $sort: { createdAt: 1 } },
                     {
                         $project: {
                             '_id': '$_id', 'createdAt': '$createdAt',
                             'schoolDetails': { schoolName: { $ifNull: ['$schoolDetails.schoolName', 'Deleted School'] }, district: { $ifNull: ['$schoolDetails.district', 'N/A'] } },
                              'requestedItems': '$requestedItems',
                              'status': '$status', 'notes': '$notes'
                         }
                     }
                 ]);
                 header = [
                     { id: '_id', title: 'Request ID' }, { id: 'createdAt', title: 'Request Date' },
                     { id: 'school.schoolName', title: 'School Name' }, { id: 'school.district', title: 'School District' },
                     { id: 'requestedItemsSummary', title: 'Requested Items' },
                     { id: 'status', title: 'Status' }, { id: 'notes', title: 'Notes' },
                 ];
                 break;
            }

             case 'impact': {
                 reportData = await ImpactStory.aggregate([
                     { $match: buildDateFilter('submittedAt', startDate, endDate) },
                      { $lookup: { from: 'schools', localField: 'school', foreignField: '_id', as: 'schoolDetails' } }, { $unwind: { path: '$schoolDetails', preserveNullAndEmptyArrays: true } },
                      { $lookup: { from: 'donations', localField: 'donation', foreignField: '_id', as: 'donationDetails' } }, { $unwind: { path: '$donationDetails', preserveNullAndEmptyArrays: true } },
                      { $lookup: { from: 'donors', localField: 'donationDetails.donor', foreignField: '_id', as: 'donorDetails' } }, { $unwind: { path: '$donorDetails', preserveNullAndEmptyArrays: true } },
                     { $sort: { submittedAt: 1 } },
                     {
                         $project: {
                             '_id': '$_id', 'submittedAt': '$submittedAt', 'title': '$title',
                             'schoolDetails': { schoolName: { $ifNull: ['$schoolDetails.schoolName', 'Deleted School'] } },
                              'donationDetails': { _id: '$donationDetails._id', donorDetails: { fullName: { $ifNull: ['$donorDetails.fullName', 'Anonymous/Deleted Donor'] } } },
                             'status': '$status', 'approvedAt': '$approvedAt', 'adminRemarks': '$adminRemarks',
                              'storyText': '$storyText', 'quote': '$quote', 'quoteAuthor': '$quoteAuthor',
                         }
                     }
                 ]);
                  header = [
                      { id: '_id', title: 'Story ID' }, { id: 'submittedAt', title: 'Submission Date' },
                      { id: 'title', title: 'Title' }, { id: 'school.schoolName', title: 'School Name' },
                       { id: 'donation._id', title: 'Related Donation ID' }, { id: 'donation.donor.fullName', title: 'Related Donor Name' },
                      { id: 'status', title: 'Status' }, { id: 'approvedAt', title: 'Approval Date' }, { id: 'adminRemarks', title: 'Admin Remarks' },
                      { id: 'storyTextSnippet', title: 'Story Text (Snippet)' },
                      { id: 'quote', title: 'Quote' }, { id: 'quoteAuthor', title: 'Quote Author' },
                  ];
                  break;
            }

            case 'logistics': {
                 reportData = await Donation.aggregate([
                      { $match: buildDateFilter('createdAt', startDate, endDate) },
                       { $lookup: { from: 'schools', localField: 'school', foreignField: '_id', as: 'schoolDetails' } }, { $unwind: { path: '$schoolDetails', preserveNullAndEmptyArrays: true } },
                     { $sort: { createdAt: 1 } },
                     {
                          $project: {
                              '_id': '$_id', 'createdAt': '$createdAt',
                              'schoolDetails': { schoolName: { $ifNull: ['$schoolDetails.schoolName', 'Deleted School'] }, district: { $ifNull: ['$schoolDetails.district', 'N/A'] } },
                              'deliveryMethod': '$deliveryMethod', 'trackingStatus': '$trackingStatus', 'itemsDonated': '$itemsDonated',
                              'schoolConfirmation': '$schoolConfirmation', 'schoolConfirmationAt': '$schoolConfirmationAt',
                              'adminTrackingId': '$adminTrackingId', 'adminRemarks': '$adminRemarks',
                          }
                     }
                 ]);
                  header = [
                      { id: '_id', title: 'Donation ID' }, { id: 'createdAt', title: 'Date' },
                      { id: 'school.schoolName', title: 'School Name' }, { id: 'school.district', title: 'School District' },
                      { id: 'deliveryMethod', title: 'Delivery Method' }, { id: 'trackingStatus', title: 'Tracking Status' },
                      { id: 'itemsDonatedSummary', title: 'Items Donated' },
                      { id: 'schoolConfirmation', title: 'School Confirmed' }, { id: 'schoolConfirmationAt', title: 'Confirmed At' },
                      { id: 'adminTrackingId', title: 'Admin Tracking ID' }, { id: 'adminRemarks', title: 'Admin Remarks' },
                  ];
                  break;
            }

            case 'verification': {
                 reportData = await School.aggregate([
                     { $match: buildDateFilter('registeredAt', startDate, endDate) },
                      { $sort: { registeredAt: 1 } },
                     {
                         $project: {
                             '_id': '$_id', 'registeredAt': '$registeredAt',
                              'schoolName': '$schoolName', 'schoolEmail': '$schoolEmail',
                              'principalName': '$principalName', 'principalEmail': '$principalEmail',
                              'phoneNumber': '$phoneNumber', 'streetAddress': '$streetAddress', 'city': '$city',
                              'district': '$district', 'province': '$province', 'postalCode': '$postalCode',
                             'status': { $cond: { if: "$isApproved", then: "Approved", else: { $cond: [{ $and: [{ $ne: ["$adminRemarks", null] }, { $ne: ["$adminRemarks", ""] }] }, "Rejected", "Pending"] } } },
                              'approvedAt': '$approvedAt', 'adminRemarks': '$adminRemarks',
                         }
                     }
                 ]);
                  header = [
                      { id: '_id', title: 'School ID' }, { id: 'registeredAt', title: 'Registration Date' },
                      { id: 'schoolName', title: 'School Name' }, { id: 'schoolEmail', title: 'School Email' },
                       { id: 'principalName', title: 'Principal Name' }, { id: 'principalEmail', title: 'Principal Email' },
                       { id: 'phoneNumber', title: 'Phone Number' }, { id: 'streetAddress', title: 'Street Address' },
                       { id: 'city', title: 'City' }, { id: 'district', title: 'District' }, { id: 'province', title: 'Province' },
                       { id: 'postalCode', title: 'Postal Code' },
                      { id: 'status', title: 'Status' },
                      { id: 'approvedAt', title: 'Approved/Rejected Date' }, { id: 'adminRemarks', title: 'Admin Remarks' },
                  ];
                  break;
            }

            default:
                console.warn(`[exportAnalyticsReport] Unknown report type requested for export: ${reportType}`);
                res.status(404);
                throw new Error('Report type not found for export');
        }
        console.debug(`[exportAnalyticsReport:${reportType}] Data fetch complete. Records found: ${Array.isArray(reportData) ? reportData.length : (reportData.donors?.length || 0) + (reportData.schools?.length || 0)}`);

    } catch (error) {
        console.error(`[exportAnalyticsReport] ***** ERROR during data fetching for export ${reportType}: *****`);
        console.error(`[exportAnalyticsReport] Error Message: ${error.message}`);
        console.error('[exportAnalyticsReport] Error Stack:', error.stack); // Log stack trace
        console.error('[exportAnalyticsReport] ***************************************************************');
        res.status(500).json({ message: 'Failed to fetch data for export', error: error.message });
        return;
    }


    if (format === 'csv') {
        console.info(`[exportAnalyticsReport] Generating CSV report for ${reportType}.`);
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}.csv"`);

        const tempFilePath = path.join(__dirname, `temp_${reportType}_export_${Date.now()}_${Math.random().toString(36).substring(7)}.csv`); // Added random suffix
        console.debug(`[exportAnalyticsReport:csv] Writing CSV to temporary file: ${tempFilePath}`);
        const outputStream = fs.createWriteStream(tempFilePath);

        // Use createObjectCsvWriter for all writing to the stream, including text lines
        const writeTextLine = async (text, stream) => {
            // Create a temporary writer for just this line with no header
            const textWriter = createObjectCsvWriter({ path: stream, header: [], alwaysQuote: true });
            // Write the text as a single record with one field
            await textWriter.writeRecords([[text]]);
        };


        if (reportType === 'users') {
             console.debug(`[exportAnalyticsReport:csv:users] Writing users report sections.`);

             // Write Report Title and initial blank line using the helper
             await writeTextLine(`${reportTitle} (${timeRange})`, outputStream);
             await writeTextLine('', outputStream); // Blank line

             // Write Donors Section
             if (reportData.donors.length > 0) {
                await writeTextLine(`-- Donors (${reportData.donors.length}) --`, outputStream);
                const csvWriterDonors = createObjectCsvWriter({ header: header.donors, path: outputStream, alwaysQuote: true });
                await csvWriterDonors.writeRecords(reportData.donors.map(d => ({
                    ...d,
                    createdAt: d.createdAt && !isNaN(d.createdAt.getTime()) ? d.createdAt.toLocaleDateString('en-US') : ''
                })));
                await writeTextLine('', outputStream); // Blank line after section
             } else {
                 await writeTextLine(`-- Donors (0) --`, outputStream);
                 await writeTextLine('No donor data available for the selected time range.', outputStream);
                 await writeTextLine('', outputStream); // Blank line after section
             }

             // Write Schools Section
             if (reportData.schools.length > 0){
                await writeTextLine(`-- Approved Schools (${reportData.schools.length}) --`, outputStream);
                const csvWriterSchools = createObjectCsvWriter({ header: header.schools, path: outputStream, alwaysQuote: true });
                 await csvWriterSchools.writeRecords(reportData.schools.map(s => ({
                    ...s,
                    registeredAt: s.registeredAt && !isNaN(s.registeredAt.getTime()) ? s.registeredAt.toLocaleDateString('en-US') : ''
                })));
                 // No blank line needed after the last section
             } else {
                 await writeTextLine(`-- Approved Schools (0) --`, outputStream);
                 await writeTextLine('No approved school data available for the selected time range.', outputStream);
                 // No blank line needed after the last section
             }

             console.debug(`[exportAnalyticsReport:csv:users] Finished writing all users sections to temp file.`);
             outputStream.end(); // End the main stream

        } else if (Array.isArray(reportData) && reportData.length > 0) {
             // This section already correctly uses createObjectCsvWriter implicitly via the import alias
             console.debug(`[exportAnalyticsReport:csv:${reportType}] Formatting and writing ${reportData.length} records to temp file.`);
             const formattedReportData = reportData.map(row => {
                const csvRow = {};
                header.forEach(h => {
                    const getValue = (obj, path) => {
                        if (!path) return obj;
                        const parts = path.split('.');
                        let current = obj;
                        for (const part of parts) {
                            if (current === null || current === undefined) return undefined;
                            current = current[part];
                        }
                        return current;
                    };
                    let value = getValue(row, h.id);

                    let cellText = '';

                    if (value === null || value === undefined) {
                        cellText = '';
                    } else if (value instanceof Date && !isNaN(value.getTime())) {
                         const isDateTime = h.id.toLowerCase().includes('at') || (h.title || '').toLowerCase().includes('time') || (h.title || '').toLowerCase().includes('confirmed at');
                         if (isDateTime) {
                             cellText = value.toLocaleDateString('en-US') + ' ' + value.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
                         } else {
                             cellText = value.toLocaleDateString('en-US');
                         }
                     } else if (h.id === 'itemsDonatedSummary' && Array.isArray(row.itemsDonated)) {
                         cellText = row.itemsDonated.map(item => `${item.quantityDonated} ${item.categoryNameEnglish || item.categoryName}`).join(', '); // Added item.categoryName fallback
                     } else if (h.id === 'requestedItemsSummary' && Array.isArray(row.requestedItems)) {
                          cellText = row.requestedItems.map(item => `${item.quantity} ${item.categoryNameEnglish || item.categoryName} (Rec: ${item.quantityReceived})`).join(', '); // Added item.categoryName fallback
                      } else if (h.id === 'storyTextSnippet') {
                         cellText = (row.storyText || '').substring(0, 200) + ((row.storyText || '').length > 200 ? '...' : '');
                     } else if (typeof value === 'boolean') {
                          cellText = value ? 'Yes' : 'No';
                      }
                    else if (typeof value === 'object' && value !== null) {
                         try {
                            cellText = value.toString();
                         } catch (e) {
                            cellText = '[Object Error]';
                            console.warn(`[exportAnalyticsReport:csv] Error converting object to string for cell (Header ID: ${h.id}):`, value, e);
                         }
                    }
                     else {
                         cellText = String(value);
                     }
                     csvRow[h.id] = cellText;
                });
                return csvRow;
             });

             const writer = createObjectCsvWriter({ header: header, path: outputStream, alwaysQuote: true });
             await writer.writeRecords(formattedReportData);
             console.debug(`[exportAnalyticsReport:csv:${reportType}] Finished writing formatted records to temp file.`);
             outputStream.end();
        } else {
             console.debug(`[exportAnalyticsReport:csv:${reportType}] No data found for ${reportType} in range ${timeRange}. Writing empty file message.`);
             // Use writeTextLine for the "No data" message as well
             await writeTextLine('No data available for the selected time range and report type.', outputStream);
             outputStream.end();
        }

         // Common logic for piping temp file to response and cleaning up
         outputStream.on('finish', () => {
             console.debug(`[exportAnalyticsReport:csv] Temporary file write stream finished. Piping to response.`);
             const readStream = fs.createReadStream(tempFilePath);
             readStream.pipe(res);

             readStream.on('close', () => {
                 console.debug(`[exportAnalyticsReport:csv] Read stream closed. Attempting to delete temp file: ${tempFilePath}`);
                 // Add a small delay before deleting the file
                 setTimeout(() => {
                     fs.unlink(tempFilePath, (err) => {
                         if (err && err.code !== 'ENOENT') {
                              console.warn(`[exportAnalyticsReport:csv] Error deleting temp file ${tempFilePath}:`, err);
                         } else if (!err) {
                              console.debug(`[exportAnalyticsReport:csv] Successfully deleted temp file: ${tempFilePath}`);
                         }
                     });
                 }, 200); // Increased delay slightly
             });

             readStream.on('error', (err) => {
                 console.error(`[exportAnalyticsReport:csv] Error piping temp file ${tempFilePath} to response:`, err);
                 if (!res.headersSent) {
                     res.status(500).send('Error sending file.');
                 } else {
                      console.error('[exportAnalyticsReport:csv] Headers already sent, cannot send 500 status. Ending response.');
                      res.end();
                 }
             });
         });

         outputStream.on('error', (err) => {
             console.error(`[exportAnalyticsReport:csv] Error writing temp file ${tempFilePath}:`, err);
             if (!res.headersSent) {
                  res.status(500).send('Error writing file.');
             } else {
                  console.error('[exportAnalyticsReport:csv] Headers already sent, cannot send 500 status. Ending response.');
                  res.end();
             }
         });


    } else if (format === 'pdf') {
         console.info(`[exportAnalyticsReport] Generating PDF report for ${reportType}.`);
         if (!printer) {
              console.error(`[exportAnalyticsReport:pdf] PDF export requested but printer is null.`);
              res.status(500).json({ message: 'PDF export failed: Printer not initialized (font issue).' });
              return;
         }

         res.setHeader('Content-Type', 'application/pdf');
         res.setHeader('Content-Disposition', `attachment; filename="${filename}.pdf"`);

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

         // Helper to safely get value, supporting dot notation
         const getValue = (obj, path) => {
             if (!path || obj === null || obj === undefined) return undefined;
             const parts = path.split('.');
             let current = obj;
             for (const part of parts) {
                 if (current === null || current === undefined) return undefined;
                 current = current[part];
             }
             return current;
         };


         if (reportType === 'users') {
               console.debug(`[exportAnalyticsReport:pdf] Formatting users data for PDF.`);
               if(reportData.donors.length > 0){
                    docDefinition.content.push({ text: `Donors (${reportData.donors.length})`, style: 'subheader', margin: [0, 10, 0, 5] });
                    docDefinition.content.push({
                        table: {
                            headerRows: 1,
                            widths: [80, '*', '*', 80, 60], // Widths for Donors table
                            body: [
                                header.donors.map(h => ({ text: h.title, style: 'tableHeader', alignment: 'center' })),
                                ...reportData.donors.map(row => [
                                    { text: row._id ? row._id.toString() : '', alignment: 'left' },
                                    { text: row.fullName || '', alignment: 'left' },
                                    { text: row.email || '', alignment: 'left' },
                                    { text: row.phoneNumber || '', alignment: 'left' },
                                     { text: row.createdAt && !isNaN(row.createdAt.getTime()) ? row.createdAt.toLocaleDateString('en-US') : '', alignment: 'center' }
                                ])
                            ]
                        },
                        layout: 'lightHorizontalLines',
                        margin: [0, 5, 0, 15]
                    });
               } else {
                    docDefinition.content.push({ text: 'No donor data available for the selected time range.', italics: true, margin: [0, 5, 0, 15] });
               }
                if(reportData.schools.length > 0){
                   docDefinition.content.push({ text: '\n' }); // Add space between tables
                   docDefinition.content.push({ text: `Approved Schools (${reportData.schools.length})`, style: 'subheader', margin: [0, 10, 0, 5] });
                   docDefinition.content.push({
                       table: {
                           headerRows: 1,
                           widths: [80, '*', '*', 80, 80, 80, 60], // Widths for Schools table
                           body: [
                               header.schools.map(h => ({ text: h.title, style: 'tableHeader', alignment: 'center' })),
                               ...reportData.schools.map(row => [
                                   { text: row._id ? row._id.toString() : '', alignment: 'left' },
                                   { text: row.schoolName || '', alignment: 'left' },
                                   { text: row.schoolEmail || '', alignment: 'left' },
                                   { text: row.city || '', alignment: 'left' },
                                   { text: row.district || '', alignment: 'left' },
                                   { text: row.province || '', alignment: 'left' },
                                   { text: row.registeredAt && !isNaN(row.registeredAt.getTime()) ? row.registeredAt.toLocaleDateString('en-US') : '', alignment: 'center' }
                               ])
                           ]
                       },
                       layout: 'lightHorizontalLines',
                       margin: [0, 5, 0, 15]
                   });
                } else {
                     docDefinition.content.push({ text: 'No approved school data available for the selected time range.', italics: true, margin: [0, 5, 0, 15] });
                }

         } else if (Array.isArray(reportData) && reportData.length > 0) {
              console.debug(`[exportAnalyticsReport:pdf] Formatting ${reportData.length} records for PDF table.`);
             const colWidths = header.map(() => '*');
             const columnWidthMap = {
                 '_id': 60, 'createdAt': 50, 'submittedAt': 50, 'approvedAt': 50, 'registeredAt': 50,
                 'deliveryMethod': 60, 'trackingStatus': 60, 'status': 60, 'schoolConfirmation': 40,
                 'schoolConfirmationAt': 80, 'quoteAuthor': 60, 'phoneNumber': 60, 'postalCode': 40,
                 'itemsDonatedSummary': '*', 'requestedItemsSummary': '*', 'storyTextSnippet': '*', 'title': '*',
                 'donor.fullName': '*', 'donor.email': '*', 'school.schoolName': '*',
                 'school.district': 80, 'school.province': 80,
                 'donation._id': 60, 'donation.donor.fullName': '*',
                 'donorRemarks': '*', 'adminRemarks': '*', 'notes': '*', 'principalName': '*', 'principalEmail': '*',
                 'streetAddress': '*', 'city': '*',
             };

             header.forEach((h, index) => {
                  const mappedWidth = columnWidthMap[h.id];
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
                              let value;
                               let cellText = '';
                               let alignment = 'left';

                               if (h.id === 'itemsDonatedSummary') {
                                   value = row.itemsDonated;
                                   cellText = Array.isArray(value) ? value.map(item => `${item.quantityDonated} ${item.categoryNameEnglish || item.categoryName}`).join(', ') : 'N/A'; // Added fallback
                               } else if (h.id === 'requestedItemsSummary') {
                                    value = row.requestedItems;
                                     cellText = Array.isArray(value) ? value.map(item => `${item.quantity} ${item.categoryNameEnglish || item.categoryName} (Rec: ${item.quantityReceived})`).join(', ') : 'N/A'; // Added fallback
                                } else if (h.id === 'storyTextSnippet') {
                                   value = row.storyText;
                                    cellText = (value || '').substring(0, 200) + ((value || '').length > 200 ? '...' : '');
                                }
                                else {
                                    value = getValue(row, h.id);

                                    if (value === null || value === undefined) {
                                        cellText = '';
                                    } else if (value instanceof Date && !isNaN(value.getTime())) {
                                         const isDateTime = h.id.toLowerCase().includes('at') || (h.title || '').toLowerCase().includes('time') || (h.title || '').toLowerCase().includes('confirmed at');
                                         if (isDateTime) {
                                             cellText = value.toLocaleDateString('en-US') + ' ' + value.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
                                         } else {
                                             cellText = value.toLocaleDateString('en-US');
                                         }
                                         alignment = 'center';
                                    } else if (typeof value === 'boolean') {
                                          cellText = value ? 'Yes' : 'No';
                                          alignment = 'center';
                                     }
                                    else if (typeof value === 'object' && value !== null) {
                                         try {
                                            cellText = value.toString();
                                         } catch (e) {
                                            cellText = '[Object Error]';
                                            console.warn(`[exportAnalyticsReport:pdf] Error converting object to string for PDF cell (Header ID: ${h.id}):`, value, e);
                                         }
                                          alignment = 'left';
                                    }
                                     else {
                                         cellText = String(value);

                                          if (h.id.toLowerCase().includes('id') || h.id === 'status' || h.id.toLowerCase().includes('confirmed')) {
                                             alignment = 'center';
                                          } else if (typeof value === 'number') {
                                             alignment = 'right';
                                          }
                                    }
                                }
                                return { text: cellText, alignment: alignment };
                          }))
                      ]
                  },
                  layout: 'lightHorizontalLines',
                   margin: [0, 5, 0, 15]
              });
         } else {
              console.debug(`[exportAnalyticsReport:pdf] No data found for ${reportType} in range ${timeRange}. Adding message to PDF.`);
              // Note: We kept italics: true here in the PDF No data message, which is fine as long as the 'italics' font variant is NOT removed from the 'fonts' object.
              // If you remove the font variant definition, remove italics: true here too.
              docDefinition.content.push({ text: 'No data available for the selected time range and report type.', italics: true });
         }

         console.debug(`[exportAnalyticsReport:pdf] Creating PDF stream.`);
         const pdfDoc = printer.createPdfKitDocument(docDefinition);
         console.debug(`[exportAnalyticsReport:pdf] Piping PDF stream to response.`);

         pdfDoc.on('error', (err) => {
             console.error(`[exportAnalyticsReport:pdf] ***** ERROR during PDF generation stream for ${reportType}: *****`);
             console.error(`[exportAnalyticsReport:pdf] Error Message: ${err.message}`);
             console.error('[exportAnalyticsReport:pdf] Error Stack:', err.stack); // Log stack trace
             console.error('[exportAnalyticsReport:pdf] ********************************************************');
             if (!res.headersSent) {
                 res.status(500).send('Error generating PDF report.');
             } else {
                console.error('[exportAnalyticsReport:pdf] Headers already sent, cannot send 500 status. Ending response.');
                res.end();
             }
         });

        pdfDoc.pipe(res);
        pdfDoc.on('end', () => { // Use 'end' for PDF stream
            console.debug(`[exportAnalyticsReport:pdf] PDF stream ended successfully.`);
        });
        pdfDoc.end(); // Finalize the PDF and start the stream

    } else {
         console.warn(`[exportAnalyticsReport] Fallback: Unsupported export format: ${format}`);
        res.status(400).json({ message: 'Unsupported export format' });
    }
});


module.exports = {
    getAnalyticsData,
    exportAnalyticsReport,
};
// frontend/src/components/Admin/AnalyticsReports/AnalyticsReports.jsx

import React, { useState, useEffect, useCallback } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, AreaChart, Area,
} from 'recharts';
import { Calendar, Download, RefreshCw, Map } from 'lucide-react';
import api from '../../../api'; // Import your custom API instance
import './AnalyticsReports.css';

// Colors for charts
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#a4dfdf', '#d0f0c0', '#f0d9e8', '#c2b280'];

const AnalyticsReports = () => {
  const [activeTab, setActiveTab] = useState('donation');
  const [timeRange, setTimeRange] = useState('month');
  const [isLoading, setIsLoading] = useState(true);
  const [reportData, setReportData] = useState({ // Initialize with null for each tab's data
    donation: null,
    users: null,
    resources: null,
    impact: null,
    logistics: null,
    verification: null,
  });
  const [error, setError] = useState(null); // State for error handling
  const [isExporting, setIsExporting] = useState(false); // State for export loading indicator

  // Fetch data function - memoized with useCallback
  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null); // Clear previous errors

    try {
        // API endpoint structure: /api/admin/analytics/:reportType
        // api.js baseURL is http://localhost:5000
        const endpoint = `/api/admin/analytics/${activeTab}`;

        const response = await api.get(endpoint, {
            params: { timeRange: timeRange } // Pass timeRange as a query parameter
        });

        // Update state based on the active tab
        setReportData(prevData => ({
            ...prevData,
            [activeTab]: response.data // Store fetched data under the active tab's key
        }));

    } catch (err) {
        console.error(`[AnalyticsReports] Error fetching data for ${activeTab}:`, err.response?.data || err.message);
         // Check if it's a 404 error (e.g. report type not found or not implemented on backend)
        if (err.response && err.response.status === 404) {
             setError(`Report type "${activeTab}" not found or not implemented.`);
        } else {
             setError(`Failed to fetch ${activeTab} data: ${err.response?.data?.message || err.message}`);
        }
         setReportData(prevData => ({ // Clear data for the tab that failed to load
             ...prevData,
             [activeTab]: null
         }));
    } finally {
        setIsLoading(false);
    }
  }, [activeTab, timeRange]); // Dependencies for useCallback

  // Effect to fetch data whenever the active tab or time range changes
  useEffect(() => {
    fetchData();
  }, [fetchData]); // fetchData is memoized and includes activeTab and timeRange as dependencies

   // Effect to clear report data for the new tab when switching tabs.
   // This ensures the loading state is shown correctly rather than stale data.
   useEffect(() => {
       setReportData(prevData => ({
           ...prevData,
           [activeTab]: null // Clear previous data for the newly selected tab
       }));
       setError(null); // Also clear any previous errors
   }, [activeTab]);

  // Function to handle exporting reports
  const handleExportReport = async (format) => {
    setIsExporting(true);
    try {
        // API export endpoint structure: /api/admin/analytics/export/:reportType/:format
        const exportEndpoint = `/api/admin/analytics/export/${activeTab}/${format}`;

        const response = await api.get(exportEndpoint, {
          responseType: 'blob', // Important for handling file downloads
          timeout: 60000, // Increased timeout for potentially large report generation
          params: { timeRange: timeRange } // Pass timeRange as a query parameter
        });

        // Create a blob URL and trigger download
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;

        // Suggest a filename. Backend might provide one via Content-Disposition header.
        const contentDisposition = response.headers['content-disposition'];
         let filename = `${activeTab}_report.${format}`; // Default filename
         if (contentDisposition) {
              const filenameMatch = contentDisposition.match(/filename="(.+)"/);
              if (filenameMatch && filenameMatch[1]) {
                  filename = filenameMatch[1].replace(/["']/g, ''); // Clean up potential quotes
              } else {
                  console.warn('[AnalyticsReports] Content-Disposition header found but filename could not be parsed:', contentDisposition);
              }
         } else {
             console.warn('[AnalyticsReports] No Content-Disposition header received. Using default filename:', filename);
         }

        link.setAttribute('download', filename);

        // Append, click, and remove the link to trigger the download
        document.body.appendChild(link);
        link.click();

        // Using a timeout to ensure the download link is processed before removal and URL revocation
        setTimeout(() => {
             document.body.removeChild(link);
             window.URL.revokeObjectURL(url); // Clean up the blob URL
        }, 100);

    } catch (err) {
        console.error(`[AnalyticsReports] Error exporting report for ${activeTab} in ${format}:`, err.response?.data || err.message);
        let errorMessage = 'Failed to export report.';

         // Attempt to read error message from blob if the error response is a blob
         if (err.response?.data instanceof Blob) {
             const reader = new FileReader();
             reader.onload = function() {
                 try {
                     const errorJson = JSON.parse(reader.result);
                     errorMessage = errorJson.message || 'Unknown error from server during export';
                 } catch (e) {
                      console.warn('[AnalyticsReports] Could not parse error blob as JSON during export:', e);
                      errorMessage = `Failed to export report: ${err.message} (Error response was a non-JSON blob).`;
                 }
                 alert(`Export Error: ${errorMessage}`);
             };
             reader.onerror = function() {
                  console.warn('[AnalyticsReports] Error reading error blob during export:', reader.error);
                  errorMessage = `Failed to export report: ${err.message} (Could not read error blob).`;
                  alert(`Export Error: ${errorMessage}`);
             };
             reader.readAsText(err.response.data); // Read blob as text (assuming JSON error message)
         } else {
             errorMessage = err.response?.data?.message || err.message;
             alert(`Export Error: ${errorMessage}`);
         }
    } finally {
         setIsExporting(false);
    }
  };

  // Helper function to check if there's meaningful data for the current active tab
  const checkHasData = () => {
    const data = reportData[activeTab];
    if (!data) return false; // No data object for the tab
    
    // Check for specific data points within each tab's data structure
    switch (activeTab) {
      case 'donation':
        return (data.monthlyDonations?.length > 0 || data.resourceCategories?.length > 0 || data.regionData?.length > 0 || (data.donationStats && Object.values(data.donationStats).some(val => val !== null && val !== undefined)));
      case 'users':
        return (data.userGrowth?.length > 0 || data.userRetention?.length > 0 || (data.userStats && Object.values(data.userStats).some(val => val !== null && val !== undefined)));
      case 'resources':
        return (data.fulfillmentRate?.length > 0 || data.regionalCoverage?.length > 0);
      case 'impact':
        return (data.studentsBenefited?.length > 0 || data.donationImpact?.length > 0);
      case 'logistics':
        return (data.deliveryTime?.length > 0 || data.deliveryStatus?.length > 0 || data.recentDeliveries?.length > 0);
      case 'verification':
        return (data.verificationRate?.length > 0 || data.processingTime?.length > 0 || (data.verificationStats && Object.values(data.verificationStats).some(val => val !== null && val !== undefined)));
      default:
        return false;
    }
  };

  const hasData = checkHasData();

   // Renders the content (charts, tables, stats) based on the currently active tab
  const renderTabContent = () => {
    const data = reportData[activeTab];

     if (isLoading) {
         return <div className="loading-indicator">Loading data... <RefreshCw size={20} className="spin" /></div>;
     }

     if (error) {
         return <div className="loading-indicator error">Error: {error}</div>;
     }

     // Check if there's data to display after loading and no errors
     if (!hasData) {
         return <div className="loading-indicator">No data available for this report type or time range.</div>;
     }

    // Destructure expected data based on active tab and render corresponding visualizations
    switch (activeTab) {
      case 'donation':
        const { monthlyDonations, resourceCategories, regionData, donationStats } = data;
        return (
          <div className="analytics-content">
            {/* Stats Summary */}
            {donationStats && ( // Render stats only if donationStats object exists and has values
                <div className="stats-summary">
                    <div className="stat-card"><h4>Total Donations</h4><p className="stat-value">{donationStats.totalDonations ?? 0}</p></div>
                    <div className="stat-card"><h4>Avg. Items Per Donation</h4><p className="stat-value">{donationStats.avgDonationValue ?? 'N/A'}</p></div>
                    <div className="stat-card"><h4>Fulfillment Rate</h4><p className="stat-value">{donationStats.fulfillmentRate ?? 'N/A'}</p></div>
                    <div className="stat-card"><h4>Active Requests</h4><p className="stat-value">{donationStats.activeRequests ?? 0}</p></div>
                </div>
             )}

            <div className="chart-row">
                {monthlyDonations?.length > 0 ? (
                   <div className="chart-container">
                     <h3>Monthly Donations</h3>
                     <div>
                        <ResponsiveContainer width="100%" height={300}>
                          <LineChart data={monthlyDonations} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="month" />
                            <YAxis allowDecimals={false} /> {/* Quantities are generally whole numbers */}
                            <Tooltip />
                            <Legend />
                            <Line type="monotone" dataKey="total" stroke="#8884d8" activeDot={{ r: 8 }} />
                          </LineChart>
                        </ResponsiveContainer>
                     </div>
                   </div>
                ) : <div className="chart-container"><h3>Monthly Donations</h3><p className="loading-indicator">No monthly donation data available.</p></div>}

               {resourceCategories?.length > 0 ? (
                 <div className="chart-container">
                   <h3>Donation Categories (Total Quantity)</h3>
                    <div>
                        <ResponsiveContainer width="100%" height={300}>
                          <PieChart>
                            <Pie
                              data={resourceCategories}
                              cx="50%"
                              cy="50%"
                              labelLine={false}
                              // Label displays name, value, and percentage
                              label={({ name, percent, value }) => `${name}: ${value ?? 0} (${((percent || 0) * 100).toFixed(0)}%)`}
                              outerRadius={100}
                              fill="#8884d8"
                              dataKey="value"
                              nameKey="name" // Key for the name of the pie slice
                            >
                              {resourceCategories.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                              ))}
                            </Pie>
                            {/* Tooltip formatter includes value and percentage, with safety checks */}
                            <Tooltip formatter={(value, name, props) => [`${value ?? 0} (${((props?.payload?.percent || 0) * 100).toFixed(0)}%)`, name]} />
                            <Legend />
                          </PieChart>
                        </ResponsiveContainer>
                    </div>
                 </div>
               ) : <div className="chart-container"><h3>Donation Categories (Total Quantity)</h3><p className="loading-indicator">No donation category data available.</p></div>}
             </div>

             {regionData?.length > 0 ? (
             <div className="chart-row">
               <div className="chart-container full-width">
                 <h3>Regional Donation Analysis (Donations Count)</h3>
                  <div>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={regionData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis allowDecimals={false} />
                        <Tooltip />
                        <Legend />
                         <Bar dataKey="donations" fill="#82ca9d" name="Donations" />
                         <Bar dataKey="requests" fill="#8884d8" name="Requests (Mock)" /> {/* Mock data indicator is kept as backend provides this as mock */}
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
               </div>
             </div>
              ) : null}
           </div>
         );

       case 'users':
          const { userGrowth, userRetention, userStats } = data;
         return (
           <div className="analytics-content">
              {/* Stats Summary */}
             {userStats && (
                 <div className="stats-summary">
                     <div className="stat-card"><h4>Total Schools</h4><p className="stat-value">{userStats.totalSchools ?? 0}</p></div>
                     <div className="stat-card"><h4>Total Donors</h4><p className="stat-value">{userStats.totalDonors ?? 0}</p></div>
                     {/* Mock data indicators are kept as backend provides these as mock */}
                     <div className="stat-card"><h4>Avg. Session Duration (Mock)</h4><p className="stat-value">{userStats.avgSessionDuration ?? 'N/A'}</p></div>
                     <div className="stat-card"><h4>Returning Users (Mock)</h4><p className="stat-value">{userStats.returningUsersRate ?? 'N/A'}</p></div>
                 </div>
              )}
             <div className="chart-row">
               {userGrowth?.length > 0 ? (
                 <div className="chart-container">
                   <h3>Cumulative User Growth</h3>
                   <div>
                      <ResponsiveContainer width="100%" height={300}>
                        <AreaChart data={userGrowth} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="month" />
                          <YAxis allowDecimals={false} />
                          <Tooltip />
                          <Legend />
                          <Area type="monotone" dataKey="schools" stackId="1" stroke="#8884d8" fill="#8884d8" name="Schools (Approved)" />
                          <Area type="monotone" dataKey="donors" stackId="1" stroke="#82ca9d" fill="#82ca9d" name="Donors" />
                        </AreaChart>
                      </ResponsiveContainer>
                   </div>
               </div>
                ) : <div className="chart-container"><h3>Cumulative User Growth</h3><p className="loading-indicator">No user growth data available.</p></div>}

               {userRetention?.length > 0 ? (
                 <div className="chart-container">
                   <h3>User Retention Rate (%) (Mock)</h3> {/* Mock data indicator */}
                   <div>
                     <ResponsiveContainer width="100%" height={300}>
                       <LineChart data={userRetention} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                         <CartesianGrid strokeDasharray="3 3" />
                         <XAxis dataKey="month" />
                         <YAxis domain={[0, 100]} />
                         <Tooltip />
                         <Legend />
                         <Line type="monotone" dataKey="rate" stroke="#ff7300" activeDot={{ r: 8 }} name="Retention Rate (Mock)" />
                       </LineChart>
                     </ResponsiveContainer>
                   </div>
                 </div>
               ) : null}
             </div>
           </div>
         );

       case 'resources':
          const { fulfillmentRate, regionalCoverage } = data;
         return (
           <div className="analytics-content">
             {fulfillmentRate?.length > 0 ? (
               <div className="chart-row">
                 <div className="chart-container full-width"> {/* Uses full-width class if it's the only chart in the row or needs more space */}
                   <h3>Resource Fulfillment Rate (%) by Category</h3>
                    <div>
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={fulfillmentRate} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="category" />
                          <YAxis domain={[0, 100]} />
                          <Tooltip formatter={(value, name) => [`${value}%`, name]} /> {/* Format tooltip to show percentages */}
                          <Legend />
                          <Bar dataKey="fulfilled" stackId="a" fill="#82ca9d" name="Fulfilled %" />
                          <Bar dataKey="unfulfilled" stackId="a" fill="#ff8042" name="Unfulfilled %" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                 </div>
               </div>
             ) : <div className="chart-container full-width"><h3>Resource Fulfillment Rate (%) by Category</h3><p className="loading-indicator">No resource fulfillment data available.</p></div>}

              {regionalCoverage?.length > 0 ? (
              <div className="chart-row">
                <div className="chart-container">
                  <h3>Regional Coverage (%) (Mock)</h3> {/* Mock data indicator */}
                   <div>
                     <ResponsiveContainer width="100%" height={300}>
                       <BarChart data={regionalCoverage} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                         <CartesianGrid strokeDasharray="3 3" />
                         <XAxis dataKey="region" />
                         <YAxis domain={[0, 100]} />
                         <Tooltip formatter={(value) => [`${value}%`, 'Coverage']}/>
                         <Bar dataKey="coverage" fill="#8884d8" name="Coverage % (Mock)" />
                       </BarChart>
                     </ResponsiveContainer>
                   </div>
                 </div>
              </div>
               ) : null}

            <div className="resource-map-container">
              <h3>Resource Distribution Map</h3>
              <div className="resource-map-placeholder">
                <Map size={48} />
                <p>Interactive resource distribution map feature coming soon.</p>
              </div>
            </div>
          </div>
         );

       case 'impact':
          const { studentsBenefited, donationImpact } = data;
         return (
           <div className="analytics-content">
             <div className="chart-row">
               {studentsBenefited?.length > 0 ? (
                 <div className="chart-container">
                   <h3>Confirmed Donations Received by Schools (Proxy for Students Benefited)</h3>
                   <div>
                    <ResponsiveContainer width="100%" height={300}>
                      <AreaChart data={studentsBenefited} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis allowDecimals={false} />
                        <Tooltip />
                        <Area type="monotone" dataKey="count" stroke="#8884d8" fill="#8884d8" name="Confirmed Donations" />
                      </AreaChart>
                    </ResponsiveContainer>
                   </div>
                 </div>
               ) : <div className="chart-container"><h3>Confirmed Donations Received by Schools (Proxy for Students Benefited)</h3><p className="loading-indicator">No confirmed donation data available.</p></div>}

               {donationImpact?.length > 0 ? (
                 <div className="chart-container">
                   <h3>Donation Impact Areas (Mock)</h3> {/* Mock data indicator */}
                   <div>
                     <ResponsiveContainer width="100%" height={300}>
                       <BarChart data={donationImpact} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                         <CartesianGrid strokeDasharray="3 3" />
                         <XAxis type="number" domain={[0, 100]} />
                         <YAxis dataKey="category" type="category" width={150} />
                         <Tooltip formatter={(value) => [`${value}%`, 'Impact Score']} /> {/* Format tooltip */}
                         <Bar dataKey="impact" fill="#82ca9d" name="Impact Score (Mock)" />
                       </BarChart>
                     </ResponsiveContainer>
                   </div>
                 </div>
               ) : null}
             </div>

             <div className="testimonials-section">
                <h3>School Testimonials (Mock)</h3> {/* Mock data indicator */}
                <div className="testimonials-container">
                  <div className="testimonial-card">
                    <p>"The textbooks donated through Edusahasra have significantly improved our students' learning experience. We are grateful for this platform."</p>
                    <p className="testimonial-author">- Principal, Ananda College, Colombo</p>
                  </div>
                  <div className="testimonial-card">
                    <p>"Our science lab now has essential equipment that our students never had access to before. This has sparked a new interest in science subjects."</p>
                    <p className="testimonial-author">- Science Teacher, Mahinda College, Galle</p>
                  </div>
                  <div className="testimonial-card">
                    <p>"The sports equipment received has enabled us to start a proper physical education program. Our students are now more active and engaged."</p>
                    <p className="testimonial-author">- Sports Coordinator, Vavuniya Central College</p>
                  </div>
                </div>
             </div>
           </div>
         );

       case 'logistics':
          const { deliveryTime, deliveryStatus, recentDeliveries } = data;
         return (
           <div className="analytics-content">
             <div className="chart-row">
               {deliveryTime?.length > 0 ? (
                 <div className="chart-container">
                   <h3>Average Delivery Time (Days) for Confirmed Donations</h3>
                   <div>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={deliveryTime} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="method" />
                        <YAxis />
                        <Tooltip formatter={(value) => [`${value} days`, 'Average Time']} /> {/* Format tooltip to show days */}
                        <Bar dataKey="avgDays" fill="#8884d8" name="Average Days" />
                      </BarChart>
                    </ResponsiveContainer>
                   </div>
                 </div>
               ) : <div className="chart-container"><h3>Average Delivery Time (Days) for Confirmed Donations</h3><p className="loading-indicator">No average delivery time data available.</p></div>}

               {deliveryStatus?.length > 0 ? (
                 <div className="chart-container">
                   <h3>Delivery Status Distribution</h3>
                    <div>
                      <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                          <Pie
                            data={deliveryStatus}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, percent, value }) => `${name}: ${value ?? 0} (${((percent || 0) * 100).toFixed(0)}%)`}
                            outerRadius={100}
                            fill="#8884d8"
                            dataKey="value"
                            nameKey="name"
                          >
                            {deliveryStatus.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          {/* Tooltip formatter includes value and percentage, with safety checks */}
                          <Tooltip formatter={(value, name, props) => [`${value ?? 0} (${((props?.payload?.percent || 0) * 100).toFixed(0)}%)`, name]} />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                   </div>
                 </div>
                ) : <div className="chart-container"><h3>Delivery Status Distribution</h3><p className="loading-indicator">No delivery status distribution data available.</p></div>}
             </div>

             <div className="table-container">
               <h3>Recent Deliveries</h3>
                {recentDeliveries && recentDeliveries.length > 0 ? (
                   <div style={{ overflowX: 'auto' }}> {/* Wrapper for horizontal scrolling on small screens */}
                      <table className="analytics-table">
                        <thead>
                          <tr>
                            <th>Donation ID</th>
                            <th>School</th>
                            <th>Items</th>
                            <th>Delivery Method</th>
                            <th>Status</th>
                            <th>Date</th>
                          </tr>
                        </thead>
                        <tbody>
                          {recentDeliveries.map((delivery, index) => (
                            <tr key={index}>
                              <td>{delivery.donationId}</td>
                              <td>{delivery.schoolName} ({delivery.schoolCity})</td>
                              <td>{delivery.itemsSummary}</td>
                              <td>{delivery.deliveryMethod}</td>
                              {/* Status with dynamic class for styling based on status value */}
                              <td><span className={`status-${delivery.status?.toLowerCase().replace(/\s+/g, '-')}`}>{delivery.status}</span></td>
                              <td>{delivery.date}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                   </div>
                ) : (
                    <p className="loading-indicator">No recent deliveries found for this time range.</p>
                )}
             </div>
           </div>
         );

       case 'verification':
          const { verificationRate, processingTime, verificationStats } = data;
         return (
           <div className="analytics-content">
              {/* Stats Summary */}
              {verificationStats && (
                  <div className="stats-summary">
                      <div className="stat-card"><h4>Total Processed Verifications</h4><p className="stat-value">{verificationStats.totalVerifications ?? 0}</p></div>
                      <div className="stat-card"><h4>Approval Rate</h4><p className="stat-value">{verificationStats.approvalRate ?? 'N/A'}</p></div>
                      <div className="stat-card"><h4>Avg. Processing Time</h4><p className="stat-value">{verificationStats.avgProcessingTime ?? 'N/A'}</p></div>
                      <div className="stat-card"><h4>Pending Verifications</h4><p className="stat-value">{verificationStats.pendingVerifications ?? 0}</p></div>
                  </div>
              )}
             <div className="chart-row">
               {verificationRate?.length > 0 ? (
                 <div className="chart-container">
                   <h3>School Verification Statistics (Approved vs Rejected)</h3>
                   <div>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={verificationRate} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis allowDecimals={false} />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="approved" stackId="a" fill="#82ca9d" name="Approved" />
                        <Bar dataKey="rejected" stackId="a" fill="#ff8042" name="Rejected" />
                      </BarChart>
                    </ResponsiveContainer>
                   </div>
                 </div>
               ) : <div className="chart-container"><h3>School Verification Statistics (Approved vs Rejected)</h3><p className="loading-indicator">No verification rate data available.</p></div>}

               {processingTime?.length > 0 ? (
                 <div className="chart-container">
                   <h3>Average Processing Time for Verified Schools (Days)</h3>
                   <div>
                     <ResponsiveContainer width="100%" height={300}>
                       <LineChart data={processingTime} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                         <CartesianGrid strokeDasharray="3 3" />
                         <XAxis dataKey="month" />
                         <YAxis />
                         <Tooltip formatter={(value) => [`${value} days`, 'Processing Time']} />
                         <Line type="monotone" dataKey="days" stroke="#8884d8" activeDot={{ r: 8 }} name="Processing Days" />
                       </LineChart>
                     </ResponsiveContainer>
                   </div>
                 </div>
                ) : <div className="chart-container"><h3>Average Processing Time for Verified Schools (Days)</h3><p className="loading-indicator">No processing time data available.</p></div>}
             </div>
           </div>
         );

       default:
         // Fallback for an unknown or unhandled tab
         return <div className="loading-indicator">Select a report type to view analytics.</div>;
     }
  };

  return (
    <div className="analytics-reports-container">
      <div className="analytics-header">
        <h2>Analytics & Reports</h2>
        <div className="analytics-actions">
          <div className="time-range-selector">
            <Calendar size={16} />
            <select value={timeRange} onChange={(e) => setTimeRange(e.target.value)} disabled={isLoading || isExporting}>
              <option value="week">Last 7 Days</option>
              <option value="month">Last 30 Days</option>
              <option value="quarter">Last 90 Days</option>
              <option value="year">Last 365 Days</option>
              <option value="all">All Time</option>
            </select>
          </div>
          <button className="refresh-btn" onClick={fetchData} disabled={isLoading || isExporting}>
            {isLoading ? <RefreshCw size={16} className="spin" /> : <RefreshCw size={16} />}
            {isLoading ? 'Refreshing...' : 'Refresh Data'}
          </button>
          <div className="export-dropdown">
            {/* Disable export button if loading, exporting, no data object for tab, or no actual data points */}
            <button className="export-btn" disabled={isLoading || isExporting || !reportData[activeTab] || !hasData}>
              {isExporting ? <RefreshCw size={16} className="spin" /> : <Download size={16} />}
              {isExporting ? 'Exporting...' : 'Export Report'}
               {/* Dropdown arrow might be styled via CSS, comment notes if it's hidden when disabled */}
            </button>
            {/* Show dropdown content only if not loading/exporting and data is available */}
             {(!isLoading && !isExporting && reportData[activeTab] && hasData) && (
                 <div className="export-dropdown-content">
                   <button onClick={() => handleExportReport('csv')}>CSV</button>
                   <button onClick={() => handleExportReport('pdf')}>PDF</button>
                 </div>
             )}
          </div>
        </div>
      </div>

      <div className="analytics-tabs">
        <button
          className={activeTab === 'donation' ? 'active' : ''}
          onClick={() => setActiveTab('donation')}
           disabled={isLoading || isExporting} // Disable tab switching during load/export
        >
          Donation Analytics
        </button>
        <button
          className={activeTab === 'users' ? 'active' : ''}
          onClick={() => setActiveTab('users')}
           disabled={isLoading || isExporting}
        >
          User Analytics
        </button>
        <button
          className={activeTab === 'resources' ? 'active' : ''}
          onClick={() => setActiveTab('resources')}
           disabled={isLoading || isExporting}
        >
          Resource Distribution
        </button>
        <button
          className={activeTab === 'impact' ? 'active' : ''}
          onClick={() => setActiveTab('impact')}
           disabled={isLoading || isExporting}
        >
          Impact Assessment
        </button>
        <button
          className={activeTab === 'logistics' ? 'active' : ''}
          onClick={() => setActiveTab('logistics')}
           disabled={isLoading || isExporting}
        >
          Logistics Performance
        </button>
        <button
          className={activeTab === 'verification' ? 'active' : ''}
          onClick={() => setActiveTab('verification')}
           disabled={isLoading || isExporting}
        >
          Verification Analytics
        </button>
      </div>

      {renderTabContent()}

    </div>
  );
};

export default AnalyticsReports;
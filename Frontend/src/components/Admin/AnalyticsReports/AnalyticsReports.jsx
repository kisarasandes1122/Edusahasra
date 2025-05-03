// frontend/src/components/Admin/AnalyticsReports/AnalyticsReports.jsx

import React, { useState, useEffect, useCallback } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, AreaChart, Area,
} from 'recharts';
import { Calendar, Download, Filter, Map, RefreshCw, FileText } from 'lucide-react';
import api from '../../../api'; // Import your custom API instance
import './AnalyticsReports.css';

// Colors for charts
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#a4dfdf', '#d0f0c0', '#f0d9e8', '#c2b280'];


const AnalyticsReports = () => {
  const [activeTab, setActiveTab] = useState('donation');
  const [timeRange, setTimeRange] = useState('month'); // Ensure default is set
  const [isLoading, setIsLoading] = useState(true);
  const [reportData, setReportData] = useState({
    donation: null,
    users: null,
    resources: null,
    impact: null,
    logistics: null,
    verification: null,
  });
  const [error, setError] = useState(null); // State for error handling

  // Fetch data function - memoized with useCallback
  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null); // Clear previous errors
    console.log(`[AnalyticsReports] Fetching data for tab: ${activeTab}, time range: ${timeRange}`); // Frontend log

    try {
        // Corrected endpoint path to include /api prefix based on server.js routing
        // api.js baseURL is http://localhost:5000
        // Backend route is /api/admin/analytics/:reportType
        const endpoint = `/api/admin/analytics/${activeTab}`; // Corrected endpoint

        console.debug(`[AnalyticsReports] Making API GET request to: ${endpoint} with params: { timeRange: ${timeRange} }`); // Debug log

        // Fetch data for the active tab
        const response = await api.get(endpoint, {
            params: { timeRange: timeRange } // Pass timeRange as a query parameter
        });

        console.debug(`[AnalyticsReports] Received data for ${activeTab}:`, response.data); // Debug log

        // Update state based on the active tab
        setReportData(prevData => ({
            ...prevData,
            [activeTab]: response.data // Store data under the tab key
        }));

    } catch (err) {
        console.error(`[AnalyticsReports] Error fetching data for ${activeTab}:`, err.response || err.message); // Debug log
        setError(`Failed to fetch ${activeTab} data: ${err.response?.data?.message || err.message}`);
         setReportData(prevData => ({ // Clear data for the failed tab
             ...prevData,
             [activeTab]: null
         }));
    } finally {
        console.debug(`[AnalyticsReports] Finished fetching data for ${activeTab}. setIsLoading(false)`); // Debug log
        setIsLoading(false);
    }
  }, [activeTab, timeRange]); // Dependencies for useCallback


  // Effect to fetch data whenever the active tab or time range changes
  useEffect(() => {
    console.log(`[AnalyticsReports] useEffect triggered. Fetching data...`); // Frontend log
    fetchData();
  }, [fetchData]); // fetchData is the dependency

  // Function to handle exporting reports
  const handleExportReport = async (format) => {
    console.log(`[AnalyticsReports] Exporting report for ${activeTab} in ${format} format (Time Range: ${timeRange})`);
    try {
        // Corrected export endpoint path to include /api prefix based on server.js routing
        // api.js baseURL is http://localhost:5000
        // Backend route is /api/admin/analytics/export/:reportType/:format
        const exportEndpoint = `/api/admin/analytics/export/${activeTab}/${format}`; // Corrected endpoint

        console.debug(`[AnalyticsReports] Making API GET request to: ${exportEndpoint} with params: { timeRange: ${timeRange} }, responseType: 'blob'`); // Debug log

        const response = await api.get(exportEndpoint, {
          responseType: 'blob', // Important for file downloads
          timeout: 30000, // Add timeout
          params: { timeRange: timeRange } // Pass timeRange as a query parameter
        });

        console.debug(`[AnalyticsReports] Received blob response for export.`); // Debug log

        // Create a blob URL and trigger download
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        // Suggest a filename. Backend might also provide one via Content-Disposition header
        const contentDisposition = response.headers['content-disposition'];
         let filename = `${activeTab}_report.${format}`;
         if (contentDisposition) {
              const filenameMatch = contentDisposition.match(/filename="(.+)"/);
              if (filenameMatch && filenameMatch[1]) {
                  filename = filenameMatch[1];
              } else {
                  console.warn('[AnalyticsReports] Content-Disposition header found but filename could not be parsed:', contentDisposition);
              }
         } else {
             console.warn('[AnalyticsReports] No Content-Disposition header received. Using default filename:', filename);
         }

        console.debug(`[AnalyticsReports] Setting download filename: ${filename}`); // Debug log
        link.setAttribute('download', filename);

        // Append, click, and remove the link to trigger the download
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link); // Use removeChild for better compatibility than link.remove()

        // Clean up the blob URL after a short delay
        setTimeout(() => {
            window.URL.revokeObjectURL(url);
            console.debug('[AnalyticsReports] Revoked blob URL.'); // Debug log
        }, 100); // Short delay to ensure download starts

         console.log(`[AnalyticsReports] Export initiated successfully for ${activeTab}.${format}`); // Frontend log

    } catch (err) {
        console.error(`[AnalyticsReports] Error exporting report for ${activeTab} in ${format}:`, err.response?.data || err.message); // Debug log
        // Try to read error message from blob if available (though often not possible on 500)
        let errorMessage = err.response?.data?.message || err.message;
         if (err.response?.data instanceof Blob) {
             const reader = new FileReader();
             reader.onload = function() {
                 try {
                     const errorJson = JSON.parse(reader.result);
                     alert(`Failed to export report: ${errorJson.message || 'Unknown error'}`);
                 } catch (e) {
                      console.warn('[AnalyticsReports] Could not parse error blob as JSON:', e);
                      alert(`Failed to export report: ${err.message} (See console for details)`);
                 }
             };
             reader.onerror = function() {
                  console.warn('[AnalyticsReports] Error reading error blob:', reader.error);
                  alert(`Failed to export report: ${err.message} (See console for details)`);
             };
             // Attempt to read the blob, assuming it contains text (like JSON error)
             reader.readAsText(err.response.data.slice(0, 2000)); // Read first 2KB to avoid memory issues with large blobs
         } else {
             alert(`Failed to export report: ${errorMessage}`);
         }
    }
  };

   // Render data based on the currently active tab
  const renderTabContent = () => {
    const data = reportData[activeTab];

     if (isLoading) {
         return <div className="loading-indicator">Loading data...</div>;
     }

     if (error) {
         return <div className="loading-indicator" style={{ color: 'red' }}>Error: {error}</div>;
     }

    if (!data) {
         return <div className="loading-indicator">No data available for this report type or time range.</div>;
    }

    // Use the fetched data instead of mock data
    switch (activeTab) {
      case 'donation':
        const { monthlyDonations, resourceCategories, regionData, donationStats } = data;
        return (
          <div className="analytics-content">
            {/* Stats Summary */}
            {donationStats && (
                <div className="stats-summary">
                    <div className="stat-card"><h4>Total Donations</h4><p className="stat-value">{donationStats.totalDonations}</p></div>
                    <div className="stat-card"><h4>Avg. Donation Value</h4><p className="stat-value">{donationStats.avgDonationValue}</p></div>
                    <div className="stat-card"><h4>Fulfillment Rate</h4><p className="stat-value">{donationStats.fulfillmentRate}</p></div>
                    <div className="stat-card"><h4>Active Requests</h4><p className="stat-value">{donationStats.activeRequests}</p></div>
                </div>
             )}

            <div className="chart-row">
              <div className="chart-container">
                <h3>Monthly Donations</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={monthlyDonations} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="total" stroke="#8884d8" activeDot={{ r: 8 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div className="chart-container">
                <h3>Donation Categories (Total Quantity)</h3>
                 <ResponsiveContainer width="100%" height={300}>
                   <PieChart>
                     <Pie
                       data={resourceCategories}
                       cx="50%"
                       cy="50%"
                       labelLine={false}
                       label={({ name, percent, value }) => `${name}: ${value} (${(percent * 100).toFixed(0)}%)`} // Show quantity and percentage
                       outerRadius={100} // Increased radius slightly
                       fill="#8884d8"
                       dataKey="value"
                       nameKey="name" // Specify name key
                     >
                       {resourceCategories.map((entry, index) => (
                         <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                       ))}
                     </Pie>
                     <Tooltip />
                     <Legend />
                   </PieChart>
                 </ResponsiveContainer>
              </div>
            </div>

            <div className="chart-row">
              <div className="chart-container full-width">
                <h3>Regional Donation Analysis (Donations Count)</h3>
                 <ResponsiveContainer width="100%" height={300}>
                   <BarChart data={regionData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                     <CartesianGrid strokeDasharray="3 3" />
                     <XAxis dataKey="name" />
                     <YAxis />
                     <Tooltip />
                     <Legend />
                      <Bar dataKey="donations" fill="#82ca9d" name="Donations" />
                      <Bar dataKey="requests" fill="#8884d8" name="Requests (Mock)" />
                   </BarChart>
                 </ResponsiveContainer>
              </div>
            </div>
          </div>
        );

      case 'users':
         const { userGrowth, userRetention, userStats } = data;
        return (
          <div className="analytics-content">
             {/* Stats Summary */}
            {userStats && (
                <div className="stats-summary">
                    <div className="stat-card"><h4>Total Schools</h4><p className="stat-value">{userStats.totalSchools}</p></div>
                    <div className="stat-card"><h4>Total Donors</h4><p className="stat-value">{userStats.totalDonors}</p></div>
                    <div className="stat-card"><h4>Avg. Session Duration</h4><p className="stat-value">{userStats.avgSessionDuration}</p></div>
                    <div className="stat-card"><h4>Returning Users</h4><p className="stat-value">{userStats.returningUsersRate}</p></div>
                </div>
             )}
            <div className="chart-row">
              <div className="chart-container">
                <h3>Cumulative User Growth</h3>
                 <ResponsiveContainer width="100%" height={300}>
                   <AreaChart data={userGrowth} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                     <CartesianGrid strokeDasharray="3 3" />
                     <XAxis dataKey="month" />
                     <YAxis />
                     <Tooltip />
                     <Legend />
                     <Area type="monotone" dataKey="schools" stackId="1" stroke="#8884d8" fill="#8884d8" name="Schools (Approved)" />
                     <Area type="monotone" dataKey="donors" stackId="1" stroke="#82ca9d" fill="#82ca9d" name="Donors" />
                   </AreaChart>
                 </ResponsiveContainer>
              </div>

              <div className="chart-container">
                <h3>User Retention Rate (%)</h3>
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
          </div>
        );

      case 'resources':
         const { fulfillmentRate, regionalCoverage } = data;
        return (
          <div className="analytics-content">
            <div className="chart-row">
              <div className="chart-container">
                <h3>Resource Fulfillment Rate (%)</h3>
                 <ResponsiveContainer width="100%" height={300}>
                   <BarChart data={fulfillmentRate} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                     <CartesianGrid strokeDasharray="3 3" />
                     <XAxis dataKey="category" />
                     <YAxis domain={[0, 100]} />
                     <Tooltip />
                     <Legend />
                     <Bar dataKey="fulfilled" stackId="a" fill="#82ca9d" name="Fulfilled %" />
                     <Bar dataKey="unfulfilled" stackId="a" fill="#ff8042" name="Unfulfilled %" />
                   </BarChart>
                 </ResponsiveContainer>
              </div>

              <div className="chart-container">
                <h3>Regional Coverage (%)</h3>
                 <ResponsiveContainer width="100%" height={300}>
                   <BarChart data={regionalCoverage} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                     <CartesianGrid strokeDasharray="3 3" />
                     <XAxis dataKey="region" />
                     <YAxis domain={[0, 100]} />
                     <Tooltip />
                     <Bar dataKey="coverage" fill="#8884d8" name="Coverage % (Mock)" />
                   </BarChart>
                 </ResponsiveContainer>
              </div>
            </div>

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
              <div className="chart-container">
                <h3>Confirmed Donations Received by Schools (Proxy for Students Benefited)</h3>
                 <ResponsiveContainer width="100%" height={300}>
                   <AreaChart data={studentsBenefited} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                     <CartesianGrid strokeDasharray="3 3" />
                     <XAxis dataKey="month" />
                     <YAxis />
                     <Tooltip />
                     <Area type="monotone" dataKey="count" stroke="#8884d8" fill="#8884d8" name="Confirmed Donations" />
                   </AreaChart>
                 </ResponsiveContainer>
              </div>

              <div className="chart-container">
                <h3>Donation Impact Areas (Mock)</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={donationImpact} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" domain={[0, 100]} />
                    <YAxis dataKey="category" type="category" width={150} />
                    <Tooltip />
                    <Bar dataKey="impact" fill="#82ca9d" name="Impact Score (Mock)" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="testimonials-section">
               <h3>School Testimonials</h3>
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
              <div className="chart-container">
                <h3>Average Delivery Time (Days) for Confirmed Donations</h3>
                 <ResponsiveContainer width="100%" height={300}>
                   <BarChart data={deliveryTime} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                     <CartesianGrid strokeDasharray="3 3" />
                     <XAxis dataKey="method" />
                     <YAxis />
                     <Tooltip />
                     <Bar dataKey="avgDays" fill="#8884d8" name="Average Days" />
                   </BarChart>
                 </ResponsiveContainer>
              </div>

              <div className="chart-container">
                <h3>Delivery Status Distribution</h3>
                 <ResponsiveContainer width="100%" height={300}>
                   <PieChart>
                     <Pie
                       data={deliveryStatus}
                       cx="50%"
                       cy="50%"
                       labelLine={false}
                       label={({ name, percent, value }) => `${name}: ${value} (${(percent * 100).toFixed(0)}%)`}
                       outerRadius={100}
                       fill="#8884d8"
                       dataKey="value"
                       nameKey="name"
                     >
                       {deliveryStatus.map((entry, index) => (
                         <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                       ))}
                     </Pie>
                     <Tooltip />
                     <Legend />
                   </PieChart>
                 </ResponsiveContainer>
              </div>
            </div>

            <div className="table-container">
              <h3>Recent Deliveries</h3>
               {recentDeliveries && recentDeliveries.length > 0 ? (
                  <div style={{ overflowX: 'auto' }}>
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
                             <td><span className={`status-${delivery.status.toLowerCase().replace(/\s+/g, '-')}`}>{delivery.status}</span></td>
                             <td>{delivery.date}</td>
                           </tr>
                         ))}
                       </tbody>
                     </table>
                  </div>
               ) : (
                   <p>No recent deliveries found for this time range.</p>
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
                 <div className="verification-summary">
                     <div className="stat-card"><h4>Total Processed Verifications</h4><p className="stat-value">{verificationStats.totalVerifications}</p></div>
                     <div className="stat-card"><h4>Approval Rate</h4><p className="stat-value">{verificationStats.approvalRate}</p></div>
                     <div className="stat-card"><h4>Avg. Processing Time</h4><p className="stat-value">{verificationStats.avgProcessingTime}</p></div>
                     <div className="stat-card"><h4>Pending Verifications</h4><p className="stat-value">{verificationStats.pendingVerifications}</p></div>
                 </div>
             )}
            <div className="chart-row">
              <div className="chart-container">
                <h3>School Verification Statistics (Approved vs Rejected)</h3>
                 <ResponsiveContainer width="100%" height={300}>
                   <BarChart data={verificationRate} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                     <CartesianGrid strokeDasharray="3 3" />
                     <XAxis dataKey="month" />
                     <YAxis />
                     <Tooltip />
                     <Legend />
                     <Bar dataKey="approved" stackId="a" fill="#82ca9d" name="Approved" />
                     <Bar dataKey="rejected" stackId="a" fill="#ff8042" name="Rejected" />
                   </BarChart>
                 </ResponsiveContainer>
              </div>

              <div className="chart-container">
                <h3>Average Processing Time for Verified Schools (Days)</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={processingTime} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="days" stroke="#8884d8" activeDot={{ r: 8 }} name="Processing Days" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        );

      default:
        return <div className="loading-indicator">Select a report type.</div>;
    }
  };

  return (
    <div className="analytics-reports-container">
      <div className="analytics-header">
        <h2>Analytics & Reports</h2>
        <div className="analytics-actions">
          <div className="time-range-selector">
            <Calendar size={16} />
            <select value={timeRange} onChange={(e) => setTimeRange(e.target.value)}>
              <option value="week">Last 7 Days</option>
              <option value="month">Last 30 Days</option>
              <option value="quarter">Last 90 Days</option>
              <option value="year">Last 365 Days</option>
              <option value="all">All Time</option>
            </select>
          </div>
          <button className="refresh-btn" onClick={fetchData} disabled={isLoading}>
            {isLoading ? <RefreshCw size={16} className="spin" /> : <RefreshCw size={16} />}
            {isLoading ? 'Refreshing...' : 'Refresh Data'}
          </button>
          <div className="export-dropdown">
            <button className="export-btn">
              <Download size={16} />
              Export Report
            </button>
            <div className="export-dropdown-content">
              <button onClick={() => handleExportReport('csv')}>CSV</button>
              <button onClick={() => handleExportReport('pdf')}>PDF</button>
            </div>
          </div>
        </div>
      </div>

      <div className="analytics-tabs">
        <button
          className={activeTab === 'donation' ? 'active' : ''}
          onClick={() => setActiveTab('donation')}
        >
          Donation Analytics
        </button>
        <button
          className={activeTab === 'users' ? 'active' : ''}
          onClick={() => setActiveTab('users')}
        >
          User Analytics
        </button>
        <button
          className={activeTab === 'resources' ? 'active' : ''}
          onClick={() => setActiveTab('resources')}
        >
          Resource Distribution
        </button>
        <button
          className={activeTab === 'impact' ? 'active' : ''}
          onClick={() => setActiveTab('impact')}
        >
          Impact Assessment
        </button>
        <button
          className={activeTab === 'logistics' ? 'active' : ''}
          onClick={() => setActiveTab('logistics')}
        >
          Logistics Performance
        </button>
        <button
          className={activeTab === 'verification' ? 'active' : ''}
          onClick={() => setActiveTab('verification')}
        >
          Verification Analytics
        </button>
      </div>

      {/* Custom Report Builder section has been removed */}

      {/* This calls the function that renders the content based on the active tab */}
      {renderTabContent()}

    </div>
  );
};

export default AnalyticsReports;
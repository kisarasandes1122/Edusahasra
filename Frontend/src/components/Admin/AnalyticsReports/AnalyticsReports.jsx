import React, { useState, useEffect } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, AreaChart, Area
} from 'recharts';
import { Calendar, Download, Filter, Map, RefreshCw, FileText } from 'lucide-react';
import './AnalyticsReports.css';

const AnalyticsReports = () => {
  const [activeTab, setActiveTab] = useState('donation');
  const [timeRange, setTimeRange] = useState('month');
  const [isLoading, setIsLoading] = useState(true);
  const [reportData, setReportData] = useState({
    donationStats: {},
    userEngagement: {},
    resourceDistribution: {},
    impactAssessment: {},
    logisticsPerformance: {},
    verificationAnalytics: {}
  });

  // Colors for charts
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

  useEffect(() => {
    // Simulating API fetch - would be replaced with actual API calls
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // Mock data - would be replaced with actual API responses
        const mockDonationStats = {
          monthlyDonations: [
            { month: 'Jan', total: 23 },
            { month: 'Feb', total: 35 },
            { month: 'Mar', total: 28 },
            { month: 'Apr', total: 42 },
            { month: 'May', total: 55 },
            { month: 'Jun', total: 40 },
          ],
          resourceCategories: [
            { name: 'Textbooks', value: 35 },
            { name: 'Stationery', value: 25 },
            { name: 'Uniforms', value: 15 },
            { name: 'Sports Equipment', value: 10 },
            { name: 'Lab Equipment', value: 15 }
          ],
          regionData: [
            { name: 'Central', donations: 45, requests: 60 },
            { name: 'Eastern', donations: 30, requests: 55 },
            { name: 'Northern', donations: 25, requests: 50 },
            { name: 'Southern', donations: 40, requests: 45 },
            { name: 'Western', donations: 50, requests: 40 },
          ]
        };

        const mockUserEngagement = {
          userGrowth: [
            { month: 'Jan', schools: 20, donors: 35 },
            { month: 'Feb', schools: 25, donors: 45 },
            { month: 'Mar', schools: 30, donors: 55 },
            { month: 'Apr', schools: 35, donors: 65 },
            { month: 'May', schools: 45, donors: 85 },
            { month: 'Jun', schools: 50, donors: 95 },
          ],
          userRetention: [
            { month: 'Jan', rate: 85 },
            { month: 'Feb', rate: 82 },
            { month: 'Mar', rate: 88 },
            { month: 'Apr', rate: 90 },
            { month: 'May', rate: 92 },
            { month: 'Jun', rate: 94 },
          ]
        };

        const mockResourceDistribution = {
          fulfillmentRate: [
            { category: 'Textbooks', fulfilled: 80, unfulfilled: 20 },
            { category: 'Stationery', fulfilled: 70, unfulfilled: 30 },
            { category: 'Uniforms', fulfilled: 65, unfulfilled: 35 },
            { category: 'Sports Equipment', fulfilled: 50, unfulfilled: 50 },
            { category: 'Lab Equipment', fulfilled: 40, unfulfilled: 60 },
          ],
          regionalCoverage: [
            { region: 'Central', coverage: 75 },
            { region: 'Eastern', coverage: 60 },
            { region: 'Northern', coverage: 55 },
            { region: 'Southern', coverage: 70 },
            { region: 'Western', coverage: 85 },
          ]
        };

        const mockImpactAssessment = {
          studentsBenefited: [
            { month: 'Jan', count: 500 },
            { month: 'Feb', count: 750 },
            { month: 'Mar', count: 900 },
            { month: 'Apr', count: 1200 },
            { month: 'May', count: 1500 },
            { month: 'Jun', count: 1700 },
          ],
          donationImpact: [
            { category: 'Access to Resources', impact: 85 },
            { category: 'Learning Environment', impact: 70 },
            { category: 'Student Participation', impact: 75 },
            { category: 'Teacher Effectiveness', impact: 65 },
          ]
        };

        const mockLogisticsPerformance = {
          deliveryTime: [
            { method: 'Logistics Partner', avgDays: 3.5 },
            { method: 'Self-Delivery', avgDays: 2.2 },
          ],
          deliveryStatus: [
            { status: 'Delivered', value: 70 },
            { status: 'In Transit', value: 20 },
            { status: 'Processing', value: 10 },
          ]
        };

        const mockVerificationAnalytics = {
          verificationRate: [
            { month: 'Jan', approved: 18, rejected: 3 },
            { month: 'Feb', approved: 22, rejected: 5 },
            { month: 'Mar', approved: 25, rejected: 4 },
            { month: 'Apr', approved: 30, rejected: 6 },
            { month: 'May', approved: 35, rejected: 7 },
            { month: 'Jun', approved: 40, rejected: 8 },
          ],
          processingTime: [
            { month: 'Jan', days: 4.5 },
            { month: 'Feb', days: 4.2 },
            { month: 'Mar', days: 3.8 },
            { month: 'Apr', days: 3.5 },
            { month: 'May', days: 3.2 },
            { month: 'Jun', days: 2.8 },
          ]
        };

        setReportData({
          donationStats: mockDonationStats,
          userEngagement: mockUserEngagement,
          resourceDistribution: mockResourceDistribution,
          impactAssessment: mockImpactAssessment,
          logisticsPerformance: mockLogisticsPerformance,
          verificationAnalytics: mockVerificationAnalytics
        });
      } catch (error) {
        console.error("Error fetching analytics data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [timeRange]);

  // Function to handle exporting reports
  const handleExportReport = (format) => {
    console.log(`Exporting report in ${format} format`);
    // Here you would implement the actual export functionality
  };

  // Render Donation Analytics tab content
  const renderDonationAnalytics = () => {
    const { monthlyDonations, resourceCategories, regionData } = reportData.donationStats;
    
    if (isLoading || !monthlyDonations) return <div className="loading-indicator">Loading data...</div>;
    
    return (
      <div className="analytics-content">
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
            <h3>Donation Categories</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={resourceCategories}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {resourceCategories.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        <div className="chart-row">
          <div className="chart-container full-width">
            <h3>Regional Donation Analysis</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={regionData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="donations" fill="#82ca9d" name="Donations" />
                <Bar dataKey="requests" fill="#8884d8" name="Requests" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        <div className="stats-summary">
          <div className="stat-card">
            <h4>Total Donations</h4>
            <p className="stat-value">240</p>
            <p className="stat-trend positive">+15% from last month</p>
          </div>
          <div className="stat-card">
            <h4>Avg. Donation Value</h4>
            <p className="stat-value">₹8,500</p>
            <p className="stat-trend positive">+5% from last month</p>
          </div>
          <div className="stat-card">
            <h4>Fulfillment Rate</h4>
            <p className="stat-value">72%</p>
            <p className="stat-trend positive">+8% from last month</p>
          </div>
          <div className="stat-card">
            <h4>Active Requests</h4>
            <p className="stat-value">125</p>
            <p className="stat-trend negative">-3% from last month</p>
          </div>
        </div>
      </div>
    );
  };

  // Render User Engagement tab content
  const renderUserEngagement = () => {
    const { userGrowth, userRetention } = reportData.userEngagement;
    
    if (isLoading || !userGrowth) return <div className="loading-indicator">Loading data...</div>;
    
    return (
      <div className="analytics-content">
        <div className="chart-row">
          <div className="chart-container">
            <h3>User Growth</h3>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={userGrowth} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Area type="monotone" dataKey="schools" stackId="1" stroke="#8884d8" fill="#8884d8" name="Schools" />
                <Area type="monotone" dataKey="donors" stackId="2" stroke="#82ca9d" fill="#82ca9d" name="Donors" />
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
                <Line type="monotone" dataKey="rate" stroke="#ff7300" activeDot={{ r: 8 }} name="Retention Rate" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        <div className="stats-summary">
          <div className="stat-card">
            <h4>Total Schools</h4>
            <p className="stat-value">2,451</p>
            <p className="stat-trend positive">+12% from last month</p>
          </div>
          <div className="stat-card">
            <h4>Total Donors</h4>
            <p className="stat-value">8,749</p>
            <p className="stat-trend positive">+8% from last month</p>
          </div>
          <div className="stat-card">
            <h4>Avg. Session Duration</h4>
            <p className="stat-value">6m 32s</p>
            <p className="stat-trend positive">+10% from last month</p>
          </div>
          <div className="stat-card">
            <h4>Returning Users</h4>
            <p className="stat-value">62%</p>
            <p className="stat-trend positive">+5% from last month</p>
          </div>
        </div>
      </div>
    );
  };

  // Render Resource Distribution tab content
  const renderResourceDistribution = () => {
    const { fulfillmentRate, regionalCoverage } = reportData.resourceDistribution;
    
    if (isLoading || !fulfillmentRate) return <div className="loading-indicator">Loading data...</div>;
    
    return (
      <div className="analytics-content">
        <div className="chart-row">
          <div className="chart-container">
            <h3>Resource Fulfillment Rate</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={fulfillmentRate} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="category" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="fulfilled" stackId="a" fill="#82ca9d" name="Fulfilled" />
                <Bar dataKey="unfulfilled" stackId="a" fill="#ff8042" name="Unfulfilled" />
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
                <Bar dataKey="coverage" fill="#8884d8" name="Coverage %" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        <div className="resource-map-container">
          <h3>Resource Distribution Map</h3>
          <div className="resource-map-placeholder">
            <Map size={48} />
            <p>Interactive resource distribution map would be displayed here</p>
          </div>
        </div>
      </div>
    );
  };

  // Render Impact Assessment tab content
  const renderImpactAssessment = () => {
    const { studentsBenefited, donationImpact } = reportData.impactAssessment;
    
    if (isLoading || !studentsBenefited) return <div className="loading-indicator">Loading data...</div>;
    
    return (
      <div className="analytics-content">
        <div className="chart-row">
          <div className="chart-container">
            <h3>Students Benefited</h3>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={studentsBenefited} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Area type="monotone" dataKey="count" stroke="#8884d8" fill="#8884d8" name="Students" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          
          <div className="chart-container">
            <h3>Donation Impact Areas</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={donationImpact} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" domain={[0, 100]} />
                <YAxis dataKey="category" type="category" />
                <Tooltip />
                <Bar dataKey="impact" fill="#82ca9d" name="Impact Score" />
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
  };

  // Render Logistics Performance tab content
  const renderLogisticsPerformance = () => {
    const { deliveryTime, deliveryStatus } = reportData.logisticsPerformance;
    
    if (isLoading || !deliveryTime) return <div className="loading-indicator">Loading data...</div>;
    
    return (
      <div className="analytics-content">
        <div className="chart-row">
          <div className="chart-container">
            <h3>Average Delivery Time (Days)</h3>
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
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {deliveryStatus.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        <div className="table-container">
          <h3>Recent Deliveries</h3>
          <table className="analytics-table">
            <thead>
              <tr>
                <th>Donation ID</th>
                <th>School</th>
                <th>Items</th>
                <th>Delivery Method</th>
                <th>Status</th>
                <th>Estimated Delivery</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>D-2023-0125</td>
                <td>Vidyaloka College, Galle</td>
                <td>50 Science Textbooks</td>
                <td>Logistics Partner</td>
                <td><span className="status-delivered">Delivered</span></td>
                <td>Completed: April 10, 2025</td>
              </tr>
              <tr>
                <td>D-2023-0126</td>
                <td>Dharmaraja College, Kandy</td>
                <td>30 Math Workbooks</td>
                <td>Self-Delivery</td>
                <td><span className="status-delivered">Delivered</span></td>
                <td>Completed: April 08, 2025</td>
              </tr>
              <tr>
                <td>D-2023-0127</td>
                <td>Royal College, Colombo</td>
                <td>10 Lab Equipment Sets</td>
                <td>Logistics Partner</td>
                <td><span className="status-transit">In Transit</span></td>
                <td>Expected: April 14, 2025</td>
              </tr>
              <tr>
                <td>D-2023-0128</td>
                <td>Jaffna Central College</td>
                <td>100 Notebooks, 50 Pens</td>
                <td>Logistics Partner</td>
                <td><span className="status-processing">Processing</span></td>
                <td>Expected: April 18, 2025</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  // Render Verification Analytics tab content
  const renderVerificationAnalytics = () => {
    const { verificationRate, processingTime } = reportData.verificationAnalytics;
    
    if (isLoading || !verificationRate) return <div className="loading-indicator">Loading data...</div>;
    
    return (
      <div className="analytics-content">
        <div className="chart-row">
          <div className="chart-container">
            <h3>School Verification Statistics</h3>
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
            <h3>Average Processing Time (Days)</h3>
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
        
        <div className="verification-summary">
          <div className="stat-card">
            <h4>Total Verifications</h4>
            <p className="stat-value">264</p>
            <p className="stat-trend positive">+18% from last month</p>
          </div>
          <div className="stat-card">
            <h4>Approval Rate</h4>
            <p className="stat-value">85%</p>
            <p className="stat-trend positive">+3% from last month</p>
          </div>
          <div className="stat-card">
            <h4>Avg. Processing Time</h4>
            <p className="stat-value">2.8 days</p>
            <p className="stat-trend positive">-12% from last month</p>
          </div>
          <div className="stat-card">
            <h4>Pending Verifications</h4>
            <p className="stat-value">24</p>
            <p className="stat-trend negative">+5% from last month</p>
          </div>
        </div>
      </div>
    );
  };

  // Helper to render the active tab content
  const renderActiveTabContent = () => {
    switch (activeTab) {
      case 'donation':
        return renderDonationAnalytics();
      case 'users':
        return renderUserEngagement();
      case 'resources':
        return renderResourceDistribution();
      case 'impact':
        return renderImpactAssessment();
      case 'logistics':
        return renderLogisticsPerformance();
      case 'verification':
        return renderVerificationAnalytics();
      default:
        return renderDonationAnalytics();
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
              <option value="week">Last Week</option>
              <option value="month">Last Month</option>
              <option value="quarter">Last Quarter</option>
              <option value="year">Last Year</option>
              <option value="all">All Time</option>
            </select>
          </div>
          <button className="refresh-btn">
            <RefreshCw size={16} />
            Refresh Data
          </button>
          <div className="export-dropdown">
            <button className="export-btn">
              <Download size={16} />
              Export Report
            </button>
            <div className="export-dropdown-content">
              <button onClick={() => handleExportReport('pdf')}>PDF</button>
              <button onClick={() => handleExportReport('csv')}>CSV</button>
              <button onClick={() => handleExportReport('excel')}>Excel</button>
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
          User Engagement
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

      <div className="custom-report-builder">
        <div className="custom-report-header">
          <h3>Custom Report Builder</h3>
          <button className="generate-report-btn">
            <FileText size={16} />
            Generate Custom Report
          </button>
        </div>
        <div className="filter-options">
          <div className="filter-option">
            <label>Region:</label>
            <select>
              <option value="all">All Regions</option>
              <option value="central">Central</option>
              <option value="eastern">Eastern</option>
              <option value="northern">Northern</option>
              <option value="southern">Southern</option>
              <option value="western">Western</option>
            </select>
          </div>
          <div className="filter-option">
            <label>School Type:</label>
            <select>
              <option value="all">All Types</option>
              <option value="primary">Primary</option>
              <option value="secondary">Secondary</option>
              <option value="combined">Combined</option>
            </select>
          </div>
          <div className="filter-option">
            <label>Resource Category:</label>
            <select>
              <option value="all">All Categories</option>
              <option value="textbooks">Textbooks</option>
              <option value="stationery">Stationery</option>
              <option value="uniforms">Uniforms</option>
              <option value="sports">Sports Equipment</option>
              <option value="lab">Lab Equipment</option>
            </select>
          </div>
          <div className="filter-option">
            <label>Date Range:</label>
            <input type="date" />
            <span>to</span>
            <input type="date" />
          </div>
        </div>
      </div>

      {/* Render the content of the active tab */}
      {renderActiveTabContent()}
    </div>
  );
};

export default AnalyticsReports;

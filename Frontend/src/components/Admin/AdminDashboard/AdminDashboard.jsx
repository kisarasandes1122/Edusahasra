// frontend/src/components/Admin/AdminDashboard/AdminDashboard.jsx

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom'; // Import useNavigate for quick actions
import api from '../../../api'; // Import your API utility
import './AdminDashboard.css';
import { FaSchool, FaUsers, FaBook, FaCheckCircle } from 'react-icons/fa';
import { RiMenuLine, RiNotification3Line } from 'react-icons/ri';
import { IoMdArrowDropup, IoMdArrowDropdown } from 'react-icons/io'; // Import dropdown icon
import { FaRegBuilding, FaHandHoldingHeart, FaTasks } from 'react-icons/fa'; // Icons for activity list if needed


const AdminDashboard = () => {
  const navigate = useNavigate(); // Initialize navigate hook

  // State for fetched data
  const [adminName, setAdminName] = useState('Admin'); // Default name, will be replaced
  const [statsData, setStatsData] = useState([]); // Changed to array to hold processed stats
  const [recentActivities, setRecentActivities] = useState([]); // To hold fetched recent activities (e.g., pending schools)

  // State for loading and errors
  const [loadingStats, setLoadingStats] = useState(true);
  const [statsError, setStatsError] = useState(null);
  const [loadingActivities, setLoadingActivities] = useState(true);
  const [activitiesError, setActivitiesError] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(true); // Loading state for profile name
  const [profileError, setProfileError] = useState(null); // *** ADDED profileError state ***


  // Fetch data on component mount
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoadingProfile(true);
        setLoadingStats(true);
        setLoadingActivities(true);
        setStatsError(null);
        setActivitiesError(null);
        setProfileError(null); // *** Clear profileError at start ***


        // --- Fetch Admin Profile Name ---
        // Assumes backend GET /api/admin/profile exists and is protected by protectAdmin
        try {
             const profileRes = await api.get('/api/admin/profile');
             setAdminName(profileRes.data.name || 'Admin'); // Set admin name
             setLoadingProfile(false); // Only set false if profile fetch succeeded
        } catch (profileFetchError) {
            console.error('Failed to fetch admin profile:', profileFetchError);
            setProfileError(profileFetchError.response?.data?.message || 'Failed to load profile.');
            setLoadingProfile(false); // Ensure loading is off even on error
             // Do NOT re-throw, allow other fetches to potentially complete
        }


        // --- Fetch Statistics Data ---
        // Use Promise.all to fetch multiple sets of stats concurrently
        const statsPromises = [
            api.get('/api/admin/analytics/users?timeRange=all'), // Get total schools/donors
            api.get('/api/admin/analytics/donation?timeRange=all'), // Get total donations, active requests
            api.get('/api/admin/analytics/verification?timeRange=all'), // Get pending verifications
            // Fetch last month's data for comparison if needed (requires backend support for time ranges)
            // api.get('/api/admin/analytics/users?timeRange=month'),
            // api.get('/api/admin/analytics/donation?timeRange=month'),
            // api.get('/api/admin/analytics/verification?timeRange=month'),
        ];

        // Use Promise.allSettled to continue even if one stats fetch fails
        const statsResults = await Promise.allSettled(statsPromises);

        // Process results to build statsData
        let usersStats = {};
        let donationStats = {};
        let verificationStats = {};

        // Check results from Promise.allSettled
        if(statsResults[0]?.status === 'fulfilled') {
             usersStats = statsResults[0].value?.data?.userStats || {};
        } else {
             console.error('Failed to fetch users stats:', statsResults[0]?.reason);
             setStatsError(prev => (prev ? prev + '; ' : '') + 'Failed to load user stats.'); // Append error message
        }
         if(statsResults[1]?.status === 'fulfilled') {
             donationStats = statsResults[1].value?.data?.donationStats || {};
        } else {
             console.error('Failed to fetch donation stats:', statsResults[1]?.reason);
             setStatsError(prev => (prev ? prev + '; ' : '') + 'Failed to load donation stats.'); // Append error message
        }
        if(statsResults[2]?.status === 'fulfilled') {
             verificationStats = statsResults[2].value?.data?.verificationStats || {};
        } else {
             console.error('Failed to fetch verification stats:', statsResults[2]?.reason);
             setStatsError(prev => (prev ? prev + '; ' : '') + 'Failed to load verification stats.'); // Append error message
        }


        // Manually structure the stats cards based on fetched data
        const processedStats = [
             {
                id: 1,
                title: 'Total Approved Schools', // Using total schools from users stats
                value: usersStats.totalSchools?.toLocaleString() || 'N/A',
                icon: <FaSchool className="edusahasra-stat-icon-element" />,
                 // Change data would need fetching past periods from backend
                // change: { value: '?', direction: 'up', label: ' from last month.' }
             },
             {
                id: 2,
                title: 'Total Donors', // Using total donors from users stats
                value: usersStats.totalDonors?.toLocaleString() || 'N/A',
                icon: <FaUsers className="edusahasra-stat-icon-element" />,
                 // Change data would need fetching past periods from backend
                // change: { value: '?', direction: 'up', label: ' from last month.' }
             },
             {
                id: 3,
                title: 'Total Donations', // Using total donations from donation stats
                value: donationStats.totalDonations?.toLocaleString() || 'N/A',
                icon: <FaHandHoldingHeart className="edusahasra-stat-icon-element" />, // Using HandHoldingHeart for donations
                 // Change data would need fetching past periods from backend
                // change: { value: '?', direction: 'up', label: ' from last month.' }
             },
             {
                id: 4,
                title: 'Pending Verifications', // Using pending verifications from verification stats
                value: verificationStats.pendingVerifications?.toLocaleString() || '0',
                icon: <FaTasks className="edusahasra-stat-icon-element" />, // Using Tasks icon
                alert: (verificationStats.pendingVerifications > 0) ? 'Requires attention' : null // Show alert if > 0
             },
        ];
        setStatsData(processedStats); // Set the state with the processed stats
        setLoadingStats(false);


        // --- Fetch Recent Activity (e.g., Pending School Registrations) ---
        // Assumes backend GET /api/admin/schools exists and can filter by status & sort
        // We'll fetch pending schools and limit to, say, the latest 5 for the dashboard
        try {
             const pendingSchoolsRes = await api.get('/api/admin/schools?status=pending&sortBy=dateDesc');

             // Format pending schools into the activity list structure
             const processedActivities = pendingSchoolsRes.data?.schools
                  ?.slice(0, 5) // Take only the first 5 (latest) pending schools
                  .map(school => ({
                     id: school._id, // Use actual ID
                     icon: <FaSchool />,
                     type: 'school',
                     title: `New school registration: ${school.schoolName}`,
                     // Format the date/time - assuming registeredAt is a Date object or parsable string
                     time: school.registeredAt ? new Date(school.registeredAt).toLocaleString() : 'N/A',
                     // Action button links to school verification page
                     action: { label: 'Review', type: 'primary', path: `/admin/school-verification?id=${school._id}` } // Add path for navigation
                  })) || []; // Default to empty array if no schools or data missing

             // NOTE: For a full "Recent Activity" list (new donors, donations, etc.),
             // you would ideally need a dedicated backend endpoint that aggregates
             // recent events from different models. For now, this shows pending schools.
             setRecentActivities(processedActivities); // Set the state with processed activities
             setLoadingActivities(false);

        } catch (activitiesFetchError) {
            console.error('Failed to fetch recent activities (pending schools):', activitiesFetchError);
            setActivitiesError(activitiesFetchError.response?.data?.message || 'Failed to load recent activity.');
            setLoadingActivities(false); // Ensure loading is off even on error
        }


      } catch (error) {
         // This catch block will only be reached if Promise.allSettled *itself* fails,
         // or if the profile fetch (which is not in its own try block) fails.
         // Since we added specific try/catch for profile and activities, this main catch
         // might be less critical, but useful as a fallback.
         // For simplicity, let's assume specific try/catch blocks handle granular errors.
         // This main catch will catch errors not handled by the inner blocks.
        console.error('An unhandled error occurred during dashboard data fetch:', error);
        // Set a general error if specific errors weren't caught/set
        if (!profileError && !statsError && !activitiesError) {
             setProfileError('An unexpected error occurred.');
             setStatsError('An unexpected error occurred.');
             setActivitiesError('An unexpected error occurred.');
        }
         setLoadingProfile(false); // Ensure loading is off
         setLoadingStats(false);
         setLoadingActivities(false);
        // AdminRoute handles 401 redirects, no need for explicit handling here
      }
    };

    fetchDashboardData(); // Call the fetch function when the component mounts
  }, []); // Empty dependency array means this effect runs only once on mount


  // Quick action buttons - These trigger navigation
  const quickActions = [
    { id: 1, icon: <FaCheckCircle />, label: 'Approve Schools', type: 'primary', path: '/admin/school-verification' },
    { id: 2, icon: <FaBook />, label: 'Analytics Reports', type: 'success', path: '/admin/analytics-reports' }, // Changed label to match route/component
    { id: 3, icon: '$', label: 'Donation Management', type: 'info', path: '/admin/donation-management' }, // Changed label to match route/component
  ];


  return (
    <div className="edusahasra-dashboard">
        <header className="edusahasra-dashboard-header">
            <span className="edusahasra-header-title">Admin Dashboard</span>
            <div className="edusahasra-user-profile">
                {loadingProfile ? (
                    <span className="edusahasra-user-name">Loading...</span>
                ) : profileError ? ( // *** Use profileError here ***
                     <span className="edusahasra-user-name edusahasra-error-message">{profileError}</span> // Style for error
                ) : (
                    <span className="edusahasra-user-name">{adminName}</span>
                )}
            </div>
        </header>

       {/* Display Stats */}
      <div className="edusahasra-stats-container">
        {loadingStats ? (
            <p>Loading statistics...</p>
        ) : statsError ? (
             // Display statsError. Consider styling this clearly.
             <p className="edusahasra-error-message">Error loading stats: {statsError}</p>
        ) : statsData.length === 0 ? ( // Check if statsData is empty
             <p>No statistics available.</p>
        ) : (
             // Map over the processedStats array
            statsData.map(stat => (
              <div key={stat.id} className="edusahasra-stat-card">
                <div className="edusahasra-stat-info">
                  <h3 className="edusahasra-stat-title">{stat.title}</h3>
                  <p className="edusahasra-stat-value">{stat.value}</p>
                  {/* Render change/alert only if they exist in the stat object */}
                  {stat.change && (
                    <p className="edusahasra-stat-change">
                      <span className={`edusahasra-change-indicator edusahasra-change-${stat.change.direction}`}>
                         {stat.change.direction === 'up' ? <IoMdArrowDropup /> : <IoMdArrowDropdown />}
                         {stat.change.value}
                      </span> {stat.change.label}
                    </p>
                  )}
                  {stat.alert && (
                    <p className="edusahasra-stat-alert">
                      <span className="edusahasra-alert-indicator">⚠️</span> {stat.alert}
                    </p>
                  )}
                </div>
                <div className="edusahasra-stat-icon">
                  {stat.icon}
                </div>
              </div>
            ))
        )}
      </div>

      {/* Display Recent Activity and Quick Actions */}
      <div className="edusahasra-dashboard-content">
        <div className="edusahasra-activity-container">
          <h2 className="edusahasra-section-title">Recent Activity (Pending Schools)</h2> {/* Updated title */}
            {loadingActivities ? (
                 <p>Loading activity...</p>
            ) : activitiesError ? (
                 // Display activitiesError. Consider styling this clearly.
                 <p className="edusahasra-error-message">Error loading activity: {activitiesError}</p>
            ) : recentActivities.length === 0 ? (
                 <p>No recent pending school registrations.</p>
            ) : (
               <ul className="edusahasra-activity-list">
                 {/* Map over the recentActivities state */}
                 {recentActivities.map(activity => (
                   <li key={activity.id} className={`edusahasra-activity-item edusahasra-activity-${activity.type}`}>
                     <div className="edusahasra-activity-icon">
                       {activity.icon}
                     </div>
                     <div className="edusahasra-activity-details">
                       <p className="edusahasra-activity-title">{activity.title}</p>
                       <p className="edusahasra-activity-time">{activity.time}</p>
                     </div>
                     {activity.action && activity.action.path && ( // Check if action and path exist
                       <button
                         className={`edusahasra-activity-button edusahasra-button-${activity.action.type}`}
                         onClick={() => navigate(activity.action.path)} // Navigate on click
                       >
                         {activity.action.label}
                       </button>
                     )}
                   </li>
                 ))}
               </ul>
            )}
        </div>
        <div className="edusahasra-actions-container">
          <h2 className="edusahasra-section-title">Quick Actions</h2>
          <div className="edusahasra-quick-actions">
            {quickActions.map(action => (
              <button
                key={action.id}
                className={`edusahasra-action-button edusahasra-button-${action.type}`}
                onClick={() => navigate(action.path)} // Navigate on click
              >
                <span className="edusahasra-action-icon">{action.icon}</span>
                <span className="edusahasra-action-label">{action.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
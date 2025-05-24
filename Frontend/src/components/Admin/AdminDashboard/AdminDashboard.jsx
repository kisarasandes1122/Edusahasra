import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../../api';
import './AdminDashboard.css';
import { FaSchool, FaUsers, FaBook, FaCheckCircle } from 'react-icons/fa';
import { RiMenuLine, RiNotification3Line } from 'react-icons/ri';
import { IoMdArrowDropup, IoMdArrowDropdown } from 'react-icons/io';
import { FaRegBuilding, FaHandHoldingHeart, FaTasks } from 'react-icons/fa';

const AdminDashboard = () => {
  const navigate = useNavigate();

  const [adminName, setAdminName] = useState('Admin');
  const [statsData, setStatsData] = useState([]);
  const [recentActivities, setRecentActivities] = useState([]);

  const [loadingStats, setLoadingStats] = useState(true);
  const [statsError, setStatsError] = useState(null);
  const [loadingActivities, setLoadingActivities] = useState(true);
  const [activitiesError, setActivitiesError] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [profileError, setProfileError] = useState(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoadingProfile(true);
        setLoadingStats(true);
        setLoadingActivities(true);
        setStatsError(null);
        setActivitiesError(null);
        setProfileError(null);

        try {
             const profileRes = await api.get('/api/admin/profile');
             setAdminName(profileRes.data.name || 'Admin');
             setLoadingProfile(false);
        } catch (profileFetchError) {
            console.error('Failed to fetch admin profile:', profileFetchError);
            setProfileError(profileFetchError.response?.data?.message || 'Failed to load profile.');
            setLoadingProfile(false);
        }

        const statsPromises = [
            api.get('/api/admin/analytics/users?timeRange=all'),
            api.get('/api/admin/analytics/donation?timeRange=all'),
            api.get('/api/admin/analytics/verification?timeRange=all'),
        ];

        const statsResults = await Promise.allSettled(statsPromises);

        let usersStats = {};
        let donationStats = {};
        let verificationStats = {};

        if(statsResults[0]?.status === 'fulfilled') {
             usersStats = statsResults[0].value?.data?.userStats || {};
        } else {
             console.error('Failed to fetch users stats:', statsResults[0]?.reason);
             setStatsError(prev => (prev ? prev + '; ' : '') + 'Failed to load user stats.');
        }
         if(statsResults[1]?.status === 'fulfilled') {
             donationStats = statsResults[1].value?.data?.donationStats || {};
        } else {
             console.error('Failed to fetch donation stats:', statsResults[1]?.reason);
             setStatsError(prev => (prev ? prev + '; ' : '') + 'Failed to load donation stats.');
        }
        if(statsResults[2]?.status === 'fulfilled') {
             verificationStats = statsResults[2].value?.data?.verificationStats || {};
        } else {
             console.error('Failed to fetch verification stats:', statsResults[2]?.reason);
             setStatsError(prev => (prev ? prev + '; ' : '') + 'Failed to load verification stats.');
        }

        const processedStats = [
             {
                id: 1,
                title: 'Total Approved Schools',
                value: usersStats.totalSchools?.toLocaleString() || 'N/A',
                icon: <FaSchool className="edusahasra-stat-icon-element" />,
             },
             {
                id: 2,
                title: 'Total Donors',
                value: usersStats.totalDonors?.toLocaleString() || 'N/A',
                icon: <FaUsers className="edusahasra-stat-icon-element" />,
             },
             {
                id: 3,
                title: 'Total Donations',
                value: donationStats.totalDonations?.toLocaleString() || 'N/A',
                icon: <FaHandHoldingHeart className="edusahasra-stat-icon-element" />,
             },
             {
                id: 4,
                title: 'Pending Verifications',
                value: verificationStats.pendingVerifications?.toLocaleString() || '0',
                icon: <FaTasks className="edusahasra-stat-icon-element" />,
                alert: (verificationStats.pendingVerifications > 0) ? 'Requires attention' : null
             },
        ];
        setStatsData(processedStats);
        setLoadingStats(false);

        try {
             const pendingSchoolsRes = await api.get('/api/admin/schools?status=pending&sortBy=dateDesc');

             const processedActivities = pendingSchoolsRes.data?.schools
                  ?.slice(0, 5)
                  .map(school => ({
                     id: school._id,
                     icon: <FaSchool />,
                     type: 'school',
                     title: `New school registration: ${school.schoolName}`,
                     time: school.registeredAt ? new Date(school.registeredAt).toLocaleString() : 'N/A',
                     action: { label: 'Review', type: 'primary', path: `/admin/school-verification?id=${school._id}` }
                  })) || [];

             setRecentActivities(processedActivities);
             setLoadingActivities(false);

        } catch (activitiesFetchError) {
            console.error('Failed to fetch recent activities (pending schools):', activitiesFetchError);
            setActivitiesError(activitiesFetchError.response?.data?.message || 'Failed to load recent activity.');
            setLoadingActivities(false);
        }

      } catch (error) {
        console.error('An unhandled error occurred during dashboard data fetch:', error);
        if (!profileError && !statsError && !activitiesError) {
             setProfileError('An unexpected error occurred.');
             setStatsError('An unexpected error occurred.');
             setActivitiesError('An unexpected error occurred.');
        }
         setLoadingProfile(false);
         setLoadingStats(false);
         setLoadingActivities(false);
      }
    };

    fetchDashboardData();
  }, []);

  const quickActions = [
    { id: 1, icon: <FaCheckCircle />, label: 'Approve Schools', type: 'primary', path: '/admin/school-verification' },
    { id: 2, icon: <FaBook />, label: 'Analytics Reports', type: 'success', path: '/admin/analytics-reports' },
    { id: 3, icon: '$', label: 'Donation Management', type: 'info', path: '/admin/donation-management' },
  ];

  return (
    <div className="edusahasra-dashboard">
        <header className="edusahasra-dashboard-header">
            <span className="edusahasra-header-title">Admin Dashboard</span>
            <div className="edusahasra-user-profile">
                {loadingProfile ? (
                    <span className="edusahasra-user-name">Loading...</span>
                ) : profileError ? (
                     <span className="edusahasra-user-name edusahasra-error-message">{profileError}</span>
                ) : (
                    <span className="edusahasra-user-name">{adminName}</span>
                )}
            </div>
        </header>

      <div className="edusahasra-stats-container">
        {loadingStats ? (
            <p>Loading statistics...</p>
        ) : statsError ? (
             <p className="edusahasra-error-message">Error loading stats: {statsError}</p>
        ) : statsData.length === 0 ? (
             <p>No statistics available.</p>
        ) : (
            statsData.map(stat => (
              <div key={stat.id} className="edusahasra-stat-card">
                <div className="edusahasra-stat-info">
                  <h3 className="edusahasra-stat-title">{stat.title}</h3>
                  <p className="edusahasra-stat-value">{stat.value}</p>
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

      <div className="edusahasra-dashboard-content">
        <div className="edusahasra-activity-container">
          <h2 className="edusahasra-section-title">Recent Activity (Pending Schools)</h2>
            {loadingActivities ? (
                 <p>Loading activity...</p>
            ) : activitiesError ? (
                 <p className="edusahasra-error-message">Error loading activity: {activitiesError}</p>
            ) : recentActivities.length === 0 ? (
                 <p>No recent pending school registrations.</p>
            ) : (
               <ul className="edusahasra-activity-list">
                 {recentActivities.map(activity => (
                   <li key={activity.id} className={`edusahasra-activity-item edusahasra-activity-${activity.type}`}>
                     <div className="edusahasra-activity-icon">
                       {activity.icon}
                     </div>
                     <div className="edusahasra-activity-details">
                       <p className="edusahasra-activity-title">{activity.title}</p>
                       <p className="edusahasra-activity-time">{activity.time}</p>
                     </div>
                     {activity.action && activity.action.path && (
                       <button
                         className={`edusahasra-activity-button edusahasra-button-${activity.action.type}`}
                         onClick={() => navigate(activity.action.path)}
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
                onClick={() => navigate(action.path)}
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
import React from 'react';
import './AdminDashboard.css';
import { FaSchool, FaUsers, FaBook, FaCheckCircle } from 'react-icons/fa';
import { RiMenuLine, RiNotification3Line } from 'react-icons/ri';
import { IoMdArrowDropup } from 'react-icons/io';

const AdminDashboard = () => {
  const stats = [
    { 
      id: 1, 
      title: 'Total Schools', 
      value: '2,451', 
      icon: <FaSchool className="edusahasra-stat-icon-element" />, 
      change: { value: '12%', direction: 'up', label: ' from last month.' } 
    },
    { 
      id: 2, 
      title: 'Total Donors', 
      value: '8,749', 
      icon: <FaUsers className="edusahasra-stat-icon-element" />, 
      change: { value: '8%', direction: 'up', label: 'from last month' } 
    },
    { 
      id: 3, 
      title: 'Total Donations', 
      value: '1000', 
      icon: <FaBook className="edusahasra-stat-icon-element" />, 
      change: { value: '15%', direction: 'up', label: ' from last month.' } 
    },
    { 
      id: 4, 
      title: 'Pending Verifications', 
      value: '24', 
      icon: <FaCheckCircle className="edusahasra-stat-icon-element" />, 
      alert: 'Requires attention' 
    },
  ];

  const activities = [
    { 
      id: 1, 
      icon: <FaSchool />, 
      type: 'school', 
      title: 'New school registration: Lincoln High School',
      time: '2 hours ago',
      action: { label: 'Review', type: 'primary' }
    },
    { 
      id: 2, 
      icon: <FaUsers />, 
      type: 'donor', 
      title: 'New donor registration: Sarah Johnson',
      time: '5 hours ago',
      action: { label: 'Profile', type: 'info' }
    },
  ];

  const quickActions = [
    { id: 1, icon: <FaCheckCircle />, label: 'Approve Schools', type: 'primary' },
    { id: 2, icon: <FaBook />, label: 'Generate Report', type: 'success' },
    { id: 3, icon: '$', label: 'View Donations', type: 'info' },
  ];

  return (
    <div className="edusahasra-dashboard">
        <header className="edusahasra-dashboard-header">
            
            <span className="edusahasra-header-title">Admin Dashboard</span>

            <div className="edusahasra-user-profile">
                <span className="edusahasra-user-name">John Admin</span>
            </div>
        </header>

      <div className="edusahasra-stats-container">
        {stats.map(stat => (
          <div key={stat.id} className="edusahasra-stat-card">
            <div className="edusahasra-stat-info">
              <h3 className="edusahasra-stat-title">{stat.title}</h3>
              <p className="edusahasra-stat-value">{stat.value}</p>
              {stat.change && (
                <p className="edusahasra-stat-change">
                  <span className={`edusahasra-change-indicator edusahasra-change-${stat.change.direction}`}>
                    <IoMdArrowDropup /> {stat.change.value} 
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
        ))}
      </div>

      <div className="edusahasra-dashboard-content">
        <div className="edusahasra-activity-container">
          <h2 className="edusahasra-section-title">Recent Activity</h2>
          <ul className="edusahasra-activity-list">
            {activities.map(activity => (
              <li key={activity.id} className={`edusahasra-activity-item edusahasra-activity-${activity.type}`}>
                <div className="edusahasra-activity-icon">
                  {activity.icon}
                </div>
                <div className="edusahasra-activity-details">
                  <p className="edusahasra-activity-title">{activity.title}</p>
                  <p className="edusahasra-activity-time">{activity.time}</p>
                </div>
                <button className={`edusahasra-activity-button edusahasra-button-${activity.action.type}`}>
                  {activity.action.label}
                </button>
              </li>
            ))}
          </ul>
        </div>
        <div className="edusahasra-actions-container">
          <h2 className="edusahasra-section-title">Quick Actions</h2>
          <div className="edusahasra-quick-actions">
            {quickActions.map(action => (
              <button 
                key={action.id} 
                className={`edusahasra-action-button edusahasra-button-${action.type}`}
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
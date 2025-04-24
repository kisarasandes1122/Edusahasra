import React, { useState } from 'react';
import './AdminSettings.css';

const AdminSettings = () => {
  const [activeTab, setActiveTab] = useState('profile');
  
  // Mock user data
  const [userData, setUserData] = useState({
    name: 'John Admin',
    email: 'john.admin@scholarease.org',
    phone: '(555) 123-4567',
    notifications: {
      emailAlerts: true,
      newDonations: true,
      newSchools: true,
      systemUpdates: false
    },
    twoFactorAuth: false
  });

  // Mock system settings
  const [systemSettings, setSystemSettings] = useState({
    autoApproveSchools: false,
    donationMinimum: 5,
    systemTheme: 'light'
  });

  // Handle form input changes
  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setUserData({
      ...userData,
      [name]: value
    });
  };

  const handleNotificationChange = (e) => {
    const { name, checked } = e.target;
    setUserData({
      ...userData,
      notifications: {
        ...userData.notifications,
        [name]: checked
      }
    });
  };

  const handleSystemSettingChange = (e) => {
    const { name, value, type, checked } = e.target;
    setSystemSettings({
      ...systemSettings,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const handleTwoFactorChange = (e) => {
    setUserData({
      ...userData,
      twoFactorAuth: e.target.checked
    });
  };


  const handleSaveSettings = (e) => {
    e.preventDefault();
    // Save settings logic here
    alert('Settings saved successfully!');
  };

  return (
    <div className="settings-container">
      <h1 className="settings-title">Admin Settings</h1>
      
      <div className="settings-layout">
        <div className="settings-sidebar">
          <ul className="settings-tabs">
            <li 
              className={activeTab === 'profile' ? 'active' : ''}
              onClick={() => setActiveTab('profile')}
            >
              <i className="fas fa-user"></i> Profile Settings
            </li>
            <li 
              className={activeTab === 'notifications' ? 'active' : ''}
              onClick={() => setActiveTab('notifications')}
            >
              <i className="fas fa-bell"></i> Notification Preferences
            </li>
            <li 
              className={activeTab === 'security' ? 'active' : ''}
              onClick={() => setActiveTab('security')}
            >
              <i className="fas fa-shield-alt"></i> Security
            </li>
            <li 
              className={activeTab === 'system' ? 'active' : ''}
              onClick={() => setActiveTab('system')}
            >
              <i className="fas fa-cogs"></i> System Configuration
            </li>
            <li 
              className={activeTab === 'users' ? 'active' : ''}
              onClick={() => setActiveTab('users')}
            >
              <i className="fas fa-users"></i> User Management
            </li>
          </ul>
        </div>
        
        <div className="settings-content">
          {activeTab === 'profile' && (
            <div className="settings-panel">
              <h2>Profile Settings</h2>
              <form onSubmit={handleSaveSettings}>
                <div className="form-group">
                  <label htmlFor="name">Full Name</label>
                  <input 
                    type="text" 
                    id="name" 
                    name="name" 
                    value={userData.name} 
                    onChange={handleProfileChange} 
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="email">Email Address</label>
                  <input 
                    type="email" 
                    id="email" 
                    name="email" 
                    value={userData.email} 
                    onChange={handleProfileChange} 
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="phone">Phone Number</label>
                  <input 
                    type="tel" 
                    id="phone" 
                    name="phone" 
                    value={userData.phone} 
                    onChange={handleProfileChange} 
                  />
                </div>
                
                <button type="submit" className="save-button">Save Profile</button>
              </form>
            </div>
          )}
          
          {activeTab === 'notifications' && (
            <div className="settings-panel">
              <h2>Notification Preferences</h2>
              <form onSubmit={handleSaveSettings}>
                <div className="checkbox-group">
                  <input 
                    type="checkbox" 
                    id="emailAlerts" 
                    name="emailAlerts" 
                    checked={userData.notifications.emailAlerts} 
                    onChange={handleNotificationChange} 
                  />
                  <label htmlFor="emailAlerts">Email Alerts</label>
                </div>
                
                <div className="checkbox-group">
                  <input 
                    type="checkbox" 
                    id="newDonations" 
                    name="newDonations" 
                    checked={userData.notifications.newDonations} 
                    onChange={handleNotificationChange} 
                  />
                  <label htmlFor="newDonations">New Donation Notifications</label>
                </div>
                
                <div className="checkbox-group">
                  <input 
                    type="checkbox" 
                    id="newSchools" 
                    name="newSchools" 
                    checked={userData.notifications.newSchools} 
                    onChange={handleNotificationChange} 
                  />
                  <label htmlFor="newSchools">New School Registration Alerts</label>
                </div>
                
                <div className="checkbox-group">
                  <input 
                    type="checkbox" 
                    id="systemUpdates" 
                    name="systemUpdates" 
                    checked={userData.notifications.systemUpdates} 
                    onChange={handleNotificationChange} 
                  />
                  <label htmlFor="systemUpdates">System Update Notifications</label>
                </div>
                
                <button type="submit" className="save-button">Save Preferences</button>
              </form>
            </div>
          )}
          
          {activeTab === 'security' && (
            <div className="settings-panel">
              <h2>Security Settings</h2>
              <form onSubmit={handleSaveSettings}>
                <div className="form-section">
                  <h3>Change Password</h3>
                  <div className="form-group">
                    <label htmlFor="currentPassword">Current Password</label>
                    <input type="password" id="currentPassword" name="currentPassword" />
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="newPassword">New Password</label>
                    <input type="password" id="newPassword" name="newPassword" />
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="confirmPassword">Confirm New Password</label>
                    <input type="password" id="confirmPassword" name="confirmPassword" />
                  </div>
                </div>
                
                <div className="form-section">
                  <h3>Two-Factor Authentication</h3>
                  <div className="checkbox-group">
                    <input 
                      type="checkbox" 
                      id="twoFactorAuth" 
                      name="twoFactorAuth" 
                      checked={userData.twoFactorAuth} 
                      onChange={handleTwoFactorChange} 
                    />
                    <label htmlFor="twoFactorAuth">Enable Two-Factor Authentication</label>
                  </div>
                  {userData.twoFactorAuth && (
                    <div className="two-factor-info">
                      <p>Scan the QR code with your authenticator app:</p>
                      <div className="qr-placeholder">QR Code Placeholder</div>
                      <p>Or enter this code manually: <strong>ABCD-EFGH-IJKL</strong></p>
                    </div>
                  )}
                </div>
                
                <button type="submit" className="save-button">Save Security Settings</button>
              </form>
            </div>
          )}
          
          {activeTab === 'system' && (
            <div className="settings-panel">
              <h2>System Configuration</h2>
              <form onSubmit={handleSaveSettings}>
                <div className="form-section">
                  <h3>Donation Settings</h3>
                  <div className="form-group">
                    <label htmlFor="donationMinimum">Minimum Donation Amount ($)</label>
                    <input 
                      type="number" 
                      id="donationMinimum" 
                      name="donationMinimum" 
                      value={systemSettings.donationMinimum} 
                      onChange={handleSystemSettingChange} 
                    />
                  </div>
                </div>
                
                <div className="form-section">
                  <h3>School Registration</h3>
                  <div className="checkbox-group">
                    <input 
                      type="checkbox" 
                      id="autoApproveSchools" 
                      name="autoApproveSchools" 
                      checked={systemSettings.autoApproveSchools} 
                      onChange={handleSystemSettingChange} 
                    />
                    <label htmlFor="autoApproveSchools">Auto-approve new school registrations</label>
                  </div>
                </div>
                
                <div className="form-section">
                  <h3>Appearance</h3>
                  <div className="form-group">
                    <label htmlFor="systemTheme">System Theme</label>
                    <select 
                      id="systemTheme" 
                      name="systemTheme" 
                      value={systemSettings.systemTheme} 
                      onChange={handleSystemSettingChange}
                    >
                      <option value="light">Light</option>
                      <option value="dark">Dark</option>
                      <option value="system">Use System Preference</option>
                    </select>
                  </div>
                </div>
                
                <button type="submit" className="save-button">Save System Settings</button>
              </form>
            </div>
          )}
          
          {activeTab === 'users' && (
            <div className="settings-panel">
              <h2>User Management</h2>
              <div className="user-controls">
                <button className="add-user-button">Add New Admin</button>
                <input type="text" placeholder="Search users..." className="user-search" />
              </div>
              
              <table className="users-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>John Admin</td>
                    <td>john.admin@scholarease.org</td>
                    <td>Super Admin</td>
                    <td><span className="status active">Active</span></td>
                    <td>
                      <button className="edit-button">Edit</button>
                    </td>
                  </tr>
                  <tr>
                    <td>Sarah Manager</td>
                    <td>sarah.m@scholarease.org</td>
                    <td>Donation Manager</td>
                    <td><span className="status active">Active</span></td>
                    <td>
                      <button className="edit-button">Edit</button>
                      <button className="delete-button">Deactivate</button>
                    </td>
                  </tr>
                  <tr>
                    <td>Michael Verifier</td>
                    <td>mike.v@scholarease.org</td>
                    <td>School Verifier</td>
                    <td><span className="status inactive">Inactive</span></td>
                    <td>
                      <button className="edit-button">Edit</button>
                      <button className="activate-button">Activate</button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminSettings;
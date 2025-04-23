import React, { useState, useEffect } from 'react';
import './ProfilePage.css';

const ProfilePage = () => {
  const [profile, setProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('personal');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    location: '',
    notificationPreferences: {
      email: true,
      sms: false,
      donationUpdates: true,
      impactReports: true,
      newsletterUpdates: false
    },
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    // This would be replaced with an actual API call
    const fetchUserProfile = async () => {
      setIsLoading(true);
      try {
        // Simulating API fetch with mock data
        setTimeout(() => {
          const mockProfile = {
            id: 1,
            name: 'Kisara Sandes',
            email: 'kisara.sandes@example.com',
            phone: '+94 76 123 4567',
            location: 'Colombo, Sri Lanka',
            notificationPreferences: {
              email: true,
              sms: false,
              donationUpdates: true,
              impactReports: true,
              newsletterUpdates: false
            },
            donationsCount: 12,
            memberSince: '2022'
          };
          
          setProfile(mockProfile);
          setFormData({
            name: mockProfile.name,
            email: mockProfile.email,
            phone: mockProfile.phone,
            location: mockProfile.location,
            notificationPreferences: mockProfile.notificationPreferences,
            currentPassword: '',
            newPassword: '',
            confirmPassword: ''
          });
          setIsLoading(false);
        }, 800);
      } catch (error) {
        console.error("Error fetching profile:", error);
        setIsLoading(false);
      }
    };

    fetchUserProfile();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleCheckboxChange = (e) => {
    const { name, checked } = e.target;
    setFormData({
      ...formData,
      notificationPreferences: {
        ...formData.notificationPreferences,
        [name]: checked
      }
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // This would be replaced with an actual API call to update the profile
    setSuccessMessage('Profile updated successfully!');
    
    // Clear success message after 3 seconds
    setTimeout(() => {
      setSuccessMessage('');
    }, 3000);
  };

  const handlePasswordSubmit = (e) => {
    e.preventDefault();
    // Password validation would go here
    if (formData.newPassword !== formData.confirmPassword) {
      alert("Passwords don't match");
      return;
    }
    
    // This would be replaced with an actual API call to update the password
    setSuccessMessage('Password updated successfully!');
    
    // Clear success message and form fields after 3 seconds
    setTimeout(() => {
      setSuccessMessage('');
      setFormData({
        ...formData,
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    }, 3000);
  };

  return (
    <div className="usr-profile-container">
      <div className="usr-profile-header">
        <h1>Edit Profile</h1>
        <p>Manage account & preferences</p>
      </div>

      {isLoading ? (
        <div className="usr-profile-loading-state">
          <div className="usr-profile-loading-spinner"></div>
          <p>Loading your profile...</p>
        </div>
      ) : profile ? (
        <div className="usr-profile-content">
          <div className="usr-profile-sidebar">
            <div className="usr-profile-card">
              <h2 className="usr-profile-name">{profile.name}</h2>
              <div className="usr-profile-stats">
                <div className="usr-profile-stat">
                  <span className="usr-profile-stat-value">{profile.donationsCount}</span>
                  <span className="usr-profile-stat-label">Donations</span>
                </div>
                <div className="usr-profile-stat">
                  <span className="usr-profile-stat-value">{profile.memberSince}</span>
                  <span className="usr-profile-stat-label">Member since</span>
                </div>
              </div>
            </div>
            
            <div className="usr-profile-tabs">
              <button 
                className={`usr-profile-tab-button ${activeTab === 'personal' ? 'active' : ''}`}
                onClick={() => setActiveTab('personal')}
              >
                Personal Information
              </button>
              <button 
                className={`usr-profile-tab-button ${activeTab === 'notifications' ? 'active' : ''}`}
                onClick={() => setActiveTab('notifications')}
              >
                Notification Settings
              </button>
              <button 
                className={`usr-profile-tab-button ${activeTab === 'security' ? 'active' : ''}`}
                onClick={() => setActiveTab('security')}
              >
                Password & Security
              </button>
            </div>
          </div>
          
          <div className="usr-profile-form-container">
            {successMessage && (
              <div className="usr-profile-success-message">
                {successMessage}
              </div>
            )}
            
            {activeTab === 'personal' && (
              <form onSubmit={handleSubmit} className="usr-profile-form">
                <h3 className="usr-profile-form-section-title">Personal Information</h3>
                <div className="usr-profile-form-group">
                  <label htmlFor="name">Full Name</label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                
                <div className="usr-profile-form-group">
                  <label htmlFor="email">Email Address</label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                
                <div className="usr-profile-form-group">
                  <label htmlFor="phone">Phone Number</label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                  />
                </div>
                
                <div className="usr-profile-form-group">
                  <label htmlFor="location">Location</label>
                  <input
                    type="text"
                    id="location"
                    name="location"
                    value={formData.location}
                    onChange={handleInputChange}
                  />
                </div>
                
                <div className="usr-profile-form-actions">
                  <button type="submit" className="usr-profile-btn-primary">Save Changes</button>
                </div>
              </form>
            )}
            
            {activeTab === 'notifications' && (
              <form onSubmit={handleSubmit} className="usr-profile-form">
                <h3 className="usr-profile-form-section-title">Notification Settings</h3>
                <div className="usr-profile-notification-preferences">
                  <h4 className="usr-profile-subsection-title">Notification Methods</h4>
                  <div className="usr-profile-checkbox-group">
                    <label className="usr-profile-checkbox-label">
                      <input
                        type="checkbox"
                        name="email"
                        checked={formData.notificationPreferences.email}
                        onChange={handleCheckboxChange}
                      />
                      <span>Email Notifications</span>
                    </label>
                  </div>
                  
                  <div className="usr-profile-checkbox-group">
                    <label className="usr-profile-checkbox-label">
                      <input
                        type="checkbox"
                        name="sms"
                        checked={formData.notificationPreferences.sms}
                        onChange={handleCheckboxChange}
                      />
                      <span>SMS Notifications</span>
                    </label>
                  </div>
                  
                  <h4 className="usr-profile-subsection-title">Notification Types</h4>
                  <div className="usr-profile-checkbox-group">
                    <label className="usr-profile-checkbox-label">
                      <input
                        type="checkbox"
                        name="donationUpdates"
                        checked={formData.notificationPreferences.donationUpdates}
                        onChange={handleCheckboxChange}
                      />
                      <span>Donation Status Updates</span>
                    </label>
                  </div>
                  
                  <div className="usr-profile-checkbox-group">
                    <label className="usr-profile-checkbox-label">
                      <input
                        type="checkbox"
                        name="impactReports"
                        checked={formData.notificationPreferences.impactReports}
                        onChange={handleCheckboxChange}
                      />
                      <span>Impact Reports</span>
                    </label>
                  </div>
                  
                  <div className="usr-profile-checkbox-group">
                    <label className="usr-profile-checkbox-label">
                      <input
                        type="checkbox"
                        name="newsletterUpdates"
                        checked={formData.notificationPreferences.newsletterUpdates}
                        onChange={handleCheckboxChange}
                      />
                      <span>Newsletter & Platform Updates</span>
                    </label>
                  </div>
                </div>
                
                <div className="usr-profile-form-actions">
                  <button type="submit" className="usr-profile-btn-primary">Save Preferences</button>
                </div>
              </form>
            )}
            
            {activeTab === 'security' && (
              <form onSubmit={handlePasswordSubmit} className="usr-profile-form">
                <h3 className="usr-profile-form-section-title">Password & Security</h3>
                <div className="usr-profile-form-group">
                  <label htmlFor="currentPassword">Current Password</label>
                  <input
                    type="password"
                    id="currentPassword"
                    name="currentPassword"
                    value={formData.currentPassword}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                
                <div className="usr-profile-form-group">
                  <label htmlFor="newPassword">New Password</label>
                  <input
                    type="password"
                    id="newPassword"
                    name="newPassword"
                    value={formData.newPassword}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                
                <div className="usr-profile-form-group">
                  <label htmlFor="confirmPassword">Confirm New Password</label>
                  <input
                    type="password"
                    id="confirmPassword"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                
                <div className="usr-profile-password-requirements">
                  <h4>Password Requirements:</h4>
                  <ul>
                    <li>At least 8 characters long</li>
                    <li>Include at least one uppercase letter</li>
                    <li>Include at least one number</li>
                    <li>Include at least one special character</li>
                  </ul>
                </div>
                
                <div className="usr-profile-form-actions">
                  <button type="submit" className="usr-profile-btn-primary">Update Password</button>
                </div>
              </form>
            )}
          </div>
        </div>
      ) : (
        <div className="usr-profile-error-state">
          <p>Failed to load profile information. Please try again.</p>
          <button className="usr-profile-btn-primary">Reload</button>
        </div>
      )}
    </div>
  );
};

export default ProfilePage;
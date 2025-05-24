import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../../../api';
import './ProfilePage.css';

const ProfilePage = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('personal');
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phoneNumber: '',
    address: '',
    latitude: null,
    longitude: null,
    notificationPreferences: {
      email: true,
      donationUpdates: true,
      impactReports: true,
    },
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const fetchUserProfile = async () => {
      setIsLoading(true);
      setErrorMessage('');
      setSuccessMessage('');
      try {
        const response = await api.get('/api/donors/profile');
        const data = response.data;

        setProfile(data);
        setFormData({
          fullName: data.fullName || '',
          email: data.email || '',
          phoneNumber: data.phoneNumber || '',
          address: data.address || '',
          latitude: data.latitude ?? null,
          longitude: data.longitude ?? null,
          notificationPreferences: {
            email: data.notificationPreferences?.email ?? true,
            donationUpdates: data.notificationPreferences?.donationUpdates ?? true,
            impactReports: data.notificationPreferences?.impactReports ?? true,
          },
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
        setIsLoading(false);
      } catch (error) {
        console.error("Error fetching profile:", error);
        setIsLoading(false);
        if (error.response && error.response.status === 401) {
            navigate('/donor-login');
             setErrorMessage('Session expired. Please log in again.');
        } else {
             setErrorMessage(error.response?.data?.message || 'Failed to load profile. Please try again.');
        }
      }
    };

    fetchUserProfile();
  }, [navigate]);

   useEffect(() => {
     if (successMessage || errorMessage) {
       const timer = setTimeout(() => {
         setSuccessMessage('');
         setErrorMessage('');
       }, 5000);
       return () => clearTimeout(timer);
     }
   }, [successMessage, errorMessage]);


  const handleInputChange = (e) => {
    const { name, value, type } = e.target;

     let parsedValue = value;
     if (type === 'number') {
         parsedValue = value === '' ? null : parseFloat(value);
     }


    setFormData({
      ...formData,
      [name]: parsedValue
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

   const handleGetCurrentLocation = () => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    setFormData(prevFormData => ({
                        ...prevFormData,
                        latitude: position.coords.latitude,
                        longitude: position.coords.longitude
                    }));
                     setSuccessMessage('Location fetched successfully.');
                     setErrorMessage('');
                },
                (error) => {
                    console.error("Error getting location:", error);
                    let locationError = 'Failed to get location.';
                    switch(error.code) {
                        case error.PERMISSION_DENIED:
                            locationError = "Location permission denied. Please enable location services in your browser/device settings.";
                            break;
                        case error.POSITION_UNAVAILABLE:
                            locationError = "Location information is unavailable.";
                            break;
                        case error.TIMEOUT:
                            locationError = "The request to get location timed out.";
                            break;
                         default:
                             locationError = "An unknown error occurred while fetching location.";
                             break;
                    }
                    setErrorMessage(locationError);
                    setSuccessMessage('');
                }
            );
        } else {
            setErrorMessage("Geolocation is not supported by this browser.");
            setSuccessMessage('');
        }
   };


  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setSuccessMessage('');
    setErrorMessage('');

    try {
      const updateData = {
          fullName: formData.fullName,
          email: formData.email,
          phoneNumber: formData.phoneNumber,
          address: formData.address,
          latitude: formData.latitude,
          longitude: formData.longitude,
          notificationPreferences: formData.notificationPreferences
      };

      const response = await api.put('/api/donors/profile', updateData);

      setProfile(prevProfile => ({
           ...prevProfile,
           ...response.data,
           donationsCount: response.data.donationsCount ?? prevProfile.donationsCount,
           memberSince: response.data.memberSince ?? prevProfile.memberSince
      }));


      setSuccessMessage('Profile updated successfully!');

    } catch (error) {
      console.error("Error updating profile:", error.response?.data || error.message);
      setErrorMessage(error.response?.data?.message || 'Failed to update profile.');
    } finally {
      setIsSaving(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setSuccessMessage('');
    setErrorMessage('');

    if (formData.newPassword !== formData.confirmPassword) {
      setErrorMessage("New password and confirm password do not match.");
      setIsSaving(false);
      return;
    }

     if (!formData.currentPassword || !formData.newPassword || !formData.confirmPassword) {
         setErrorMessage("Please fill in all password fields.");
         setIsSaving(false);
         return;
     }

     const password = formData.newPassword;
     if (password.length < 8) { setErrorMessage('Password must be at least 8 characters long.'); setIsSaving(false); return; }
     if (!/[A-Z]/.test(password)) { setErrorMessage('Password must contain at least one uppercase letter.'); setIsSaving(false); return; }
     if (!/[0-9]/.test(password)) { setErrorMessage('Password must contain at least one number.'); setIsSaving(false); return; }
     if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) { setErrorMessage('Password must contain at least one special character.'); setIsSaving(false); return; }


    try {
       const response = await api.put('/api/donors/profile/password', {
           currentPassword: formData.currentPassword,
           newPassword: formData.newPassword,
           confirmPassword: formData.confirmPassword
       });

       setSuccessMessage('Password updated successfully!');

       setFormData({
         ...formData,
         currentPassword: '',
         newPassword: '',
         confirmPassword: ''
       });

    } catch (error) {
      console.error("Error updating password:", error.response?.data || error.message);
      setErrorMessage(error.response?.data?.message || 'Failed to update password.');
    } finally {
      setIsSaving(false);
    }
  };

   const isSaveButtonDisabled = isSaving;


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
              <h2 className="usr-profile-name">{profile.fullName || 'Donor'}</h2>
              <div className="usr-profile-stats">
                <div className="usr-profile-stat">
                  <span className="usr-profile-stat-value">{profile.donationsCount !== undefined ? profile.donationsCount : 'N/A'}</span>
                  <span className="usr-profile-stat-label">Donations</span>
                </div>
                <div className="usr-profile-stat">
                  <span className="usr-profile-stat-value">{profile.memberSince || 'N/A'}</span>
                  <span className="usr-profile-stat-label">Member since</span>
                </div>
              </div>
            </div>

            <div className="usr-profile-tabs">
              <button
                className={`usr-profile-tab-button ${activeTab === 'personal' ? 'active' : ''}`}
                onClick={() => setActiveTab('personal')}
                disabled={isSaving}
              >
                Personal Information
              </button>
              <button
                className={`usr-profile-tab-button ${activeTab === 'notifications' ? 'active' : ''}`}
                onClick={() => setActiveTab('notifications')}
                 disabled={isSaving}
              >
                Notification Settings
              </button>
              <button
                className={`usr-profile-tab-button ${activeTab === 'security' ? 'active' : ''}`}
                onClick={() => setActiveTab('security')}
                 disabled={isSaving}
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
             {errorMessage && (
              <div className="usr-profile-error-message">
                {errorMessage}
              </div>
            )}

            {activeTab === 'personal' && (
              <form onSubmit={handleSubmit} className="usr-profile-form">
                <h3 className="usr-profile-form-section-title">Personal Information</h3>
                <div className="usr-profile-form-group">
                  <label htmlFor="fullName">Full Name</label>
                  <input
                    type="text"
                    id="fullName"
                    name="fullName"
                    value={formData.fullName}
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
                  <label htmlFor="phoneNumber">Phone Number</label>
                  <input
                    type="tel"
                    id="phoneNumber"
                    name="phoneNumber"
                    value={formData.phoneNumber}
                    onChange={handleInputChange}
                    placeholder="+94XXXXXXXXX or 0XXXXXXXXX"
                  />
                </div>

                <div className="usr-profile-form-group">
                  <label htmlFor="address">Address</label>
                  <input
                    type="text"
                    id="address"
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                  />
                </div>

                 <div className="usr-profile-form-group">
                    <label htmlFor="latitude">Latitude</label>
                    <input
                      type="number"
                      step="any"
                      id="latitude"
                      name="latitude"
                      value={formData.latitude ?? ''}
                      onChange={handleInputChange}
                      placeholder="e.g., 6.9271"
                    />
                 </div>
                 <div className="usr-profile-form-group">
                    <label htmlFor="longitude">Longitude</label>
                     <input
                       type="number"
                       step="any"
                       id="longitude"
                       name="longitude"
                       value={formData.longitude ?? ''}
                       onChange={handleInputChange}
                       placeholder="e.g., 79.8612"
                     />
                 </div>
                 <div className="usr-profile-form-group">
                      <button type="button" className="usr-profile-btn-secondary" onClick={handleGetCurrentLocation} disabled={isSaving}>
                         Get Current Location
                      </button>
                 </div>


                <div className="usr-profile-form-actions">
                  <button type="submit" className="usr-profile-btn-primary" disabled={isSaveButtonDisabled}>
                     {isSaving ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            )}

            {activeTab === 'notifications' && profile && (
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

                </div>

                <div className="usr-profile-form-actions">
                  <button type="submit" className="usr-profile-btn-primary" disabled={isSaveButtonDisabled}>
                     {isSaving ? 'Saving...' : 'Save Preferences'}
                  </button>
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
                  <button type="submit" className="usr-profile-btn-primary" disabled={isSaveButtonDisabled}>
                     {isSaving ? 'Updating...' : 'Update Password'}
                  </button>
                </div>

                 
              </form>
            )}
          </div>
        </div>
      ) : (
        !isLoading && errorMessage && (
             <div className="usr-profile-error-state">
              <p>{errorMessage}</p>
             </div>
        )
      )}
    </div>
  );
};

export default ProfilePage;
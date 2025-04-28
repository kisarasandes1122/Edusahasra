// frontend/src/components/Admin/AdminSettings/AdminSettings.jsx

import React, { useState, useEffect } from 'react';
import api from '../../../api'; // Import your API utility
import './AdminSettings.css';
import validator from 'validator'; // Import validator for email/password validation


const AdminSettings = () => {
  const [activeTab, setActiveTab] = useState('profile');

  // State for logged-in admin's role and ID
  const [loggedInAdminRole, setLoggedInAdminRole] = useState(null);
  const [loggedInAdminId, setLoggedInAdminId] = useState(null); // State to store logged-in admin's ID
  const [loadingRole, setLoadingRole] = useState(true);
  const [roleError, setRoleError] = useState(null);

  // State for the list of admin users fetched from the backend
  const [adminList, setAdminList] = useState([]); // State to hold the fetched list
  const [loadingUsers, setLoadingUsers] = useState(false); // State for loading admin list
  const [usersError, setUsersError] = useState(null); // State for admin list error


  // Mock user data for Profile/Notifications tabs (can be updated with fetched real data)
  // Ensure structure matches expected data from backend profile endpoint
  const [userData, setUserData] = useState({
    name: '', // Will be updated from profile fetch
    email: '', // Will be updated from profile fetch
    // Add other profile fields like phone, address, etc., if your Admin profile model includes them
    phone: '', // Example - Add this to your Admin model if needed
    notifications: { // Default notification prefs structure
      emailAlerts: true,
      newDonations: true,
      newSchools: true,
      systemUpdates: false
    },
  });

  // State for Change Password form
  const [passwordData, setPasswordData] = useState({
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
  });
  const [changingPassword, setChangingPassword] = useState(false);
  const [passwordChangeSuccess, setPasswordChangeSuccess] = useState(null);
  const [passwordChangeError, setPasswordChangeError] = useState(null);


  // State for "Add New Admin" modal
  const [showAddAdminModal, setShowAddAdminModal] = useState(false);
  const [newAdminData, setNewAdminData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'admin', // Default role for new admin
  });
  const [addAdminError, setAddAdminError] = useState(null);
  const [addAdminSuccess, setAddAdminSuccess] = useState(null);
  const [addingAdmin, setAddingAdmin] = useState(false);

   // State for user deletion
   const [deletingAdminId, setDeletingAdminId] = useState(null); // ID of admin being deleted


  // Fetch logged-in admin profile and admin list on mount
  useEffect(() => {
    const fetchAdminData = async () => {
      try {
        setLoadingRole(true);
        setLoadingUsers(true); // Start loading users too

        // 1. Fetch logged-in admin profile (for role and ID)
        const profileRes = await api.get('/api/admin/profile');
        setLoggedInAdminRole(profileRes.data.role);
        setLoggedInAdminId(profileRes.data._id); // Store the ID

        // Update profile state with fetched data
        setUserData(prev => ({
           ...prev,
           name: profileRes.data.name,
           email: profileRes.data.email,
            // Update other fields if available from backend profile endpoint
           // phone: profileRes.data.phoneNumber || '', // Assuming backend returns phoneNumber
           // notifications: profileRes.data.notificationPreferences || prev.notifications, // Assuming backend returns notificationPreferences
        }));
        setLoadingRole(false); // Finished loading role/profile

         // 2. Fetch list of all admins
         // Assumes backend GET /api/admin/admins exists and is protected by protectAdmin or isSuperAdmin
        const usersRes = await api.get('/api/admin/admins');
        setAdminList(usersRes.data); // Set the state with the fetched data
        setLoadingUsers(false); // Finished loading users

      } catch (error) {
        console.error('Failed to fetch admin data:', error);
        setRoleError(error.response?.data?.message || 'Failed to fetch initial admin data.');
        setUsersError('Failed to load admin list.');
        setLoadingRole(false);
        setLoadingUsers(false);
         // Important: AdminRoute handles 401 redirect, no need to explicitly redirect here
      }
    };
    fetchAdminData();
  }, []); // Empty dependency array ensures this runs only once on mount


  // Handle form input changes for Profile and Notifications
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


  // Handle input changes for Change Password form
  const handlePasswordChangeInput = (e) => {
      const { name, value } = e.target;
      setPasswordData({
          ...passwordData,
          [name]: value,
      });
  };


  // Handle Change Password form submission
  const handleChangePasswordSubmit = async (e) => {
      e.preventDefault();
      setChangingPassword(true);
      setPasswordChangeError(null);
      setPasswordChangeSuccess(null);

      const { currentPassword, newPassword, confirmPassword } = passwordData;

      // Client-side validation
      if (!currentPassword || !newPassword || !confirmPassword) {
          setPasswordChangeError('Please fill in all password fields.');
          setChangingPassword(false);
          return;
      }
      if (newPassword !== confirmPassword) {
          setPasswordChangeError('New password and confirm password do not match.');
          setChangingPassword(false);
          return;
      }
       // Add more sophisticated password validation if needed (e.g., length, complexity)
       // Use validator if imported:
       if (!validator.isLength(newPassword, { min: 8 })) {
            setPasswordChangeError('Password must be at least 8 characters long.');
            setChangingPassword(false);
            return;
       }
       // Add checks for uppercase, number, special character if required by backend model


      try {
           // Call the backend endpoint to change password
           // Assumes backend PUT /api/admin/profile/password exists and is protected by protectAdmin
          const res = await api.put('/api/admin/profile/password', {
              currentPassword,
              newPassword,
              confirmPassword // Although backend might only use newPassword and currentPassword, sending confirm is good practice for consistency
          });
          setPasswordChangeSuccess(res.data.message || 'Password changed successfully!');
          // Clear password fields on success
          setPasswordData({
              currentPassword: '',
              newPassword: '',
              confirmPassword: '',
          });
      } catch (error) {
          console.error('Failed to change password:', error);
          setPasswordChangeError(error.response?.data?.message || 'Failed to change password.');
      } finally {
          setChangingPassword(false);
      }
  };

   // Handle placeholder Save Settings for other sections (Profile, Notifications)
   // The Security tab now has its own specific submit handler for password
  const handleGeneralSaveSettings = async (e) => {
    e.preventDefault();
     // This function will only be called by forms in other tabs (Profile, Notifications)
    alert(`Save settings for ${activeTab} (Saving functionality not fully implemented for this section).`);
     // Add specific save logic for Profile and Notifications here if needed
     /*
     if (activeTab === 'profile') {
         // Call backend endpoint to update profile data
     } else if (activeTab === 'notifications') {
         // Call backend endpoint to update notification preferences
     }
     */
  };


  // Handle Add New Admin form input changes
  const handleAddAdminChange = (e) => {
    const { name, value } = e.target;
    setNewAdminData({
      ...newAdminData,
      [name]: value
    });
  };

  // Handle Create New Admin submission
  const handleCreateAdmin = async (e) => {
    e.preventDefault();
    setAddingAdmin(true);
    setAddAdminError(null);
    setAddAdminSuccess(null);

    // Basic client-side validation
    if (!newAdminData.name || !newAdminData.email || !newAdminData.password || !newAdminData.confirmPassword || !newAdminData.role) {
      setAddAdminError('Please fill in all fields.');
      setAddingAdmin(false);
      return;
    }
     if (newAdminData.password !== newAdminData.confirmPassword) {
         setAddAdminError('Passwords do not match.');
         setAddingAdmin(false);
         return;
     }
     // Add more validation (email format, password strength, e.g., using validator library)
     // Example: if (!validator.isEmail(newAdminData.email)) { setAddAdminError('Invalid email format'); setAddingAdmin(false); return; }


    try {
      // Call the backend register admin endpoint (requires Super Admin token)
      const res = await api.post('/api/admin/register', newAdminData);
      setAddAdminSuccess(`Admin "${res.data.name}" created successfully!`);

       // Add the newly created admin (from backend response) to the admin list state
       // The backend register endpoint returns the created admin object
       setAdminList(prevList => [...prevList, res.data]); // Use setAdminList

      setNewAdminData({ // Reset form for next entry
         name: '',
         email: '',
         password: '',
         confirmPassword: '',
         role: 'admin',
      });
      // Optional: Close modal automatically after a delay
      // setTimeout(() => setShowAddAdminModal(false), 3000);
    } catch (error) {
      console.error('Failed to create admin:', error);
      setAddAdminError(error.response?.data?.message || 'Failed to create admin.');
    } finally {
      setAddingAdmin(false);
    }
  };

  // Handle Delete Admin button click
  const handleDeleteAdmin = async (adminId) => {
      if (!window.confirm('Are you sure you want to delete this admin user? This action cannot be undone.')) {
          return; // Do nothing if user cancels
      }

      setDeletingAdminId(adminId); // Set state to indicate which admin is being deleted
      setUsersError(null); // Clear previous list errors

      try {
           // Call the backend delete admin endpoint (requires Super Admin token)
           // Assumes backend DELETE /api/admin/admins/:id exists and is protected by isSuperAdmin
          const res = await api.delete(`/api/admin/admins/${adminId}`);
          alert(res.data.message); // Show success message from backend

           // Remove the deleted admin from the list state
           setAdminList(prevList => prevList.filter(user => user._id !== adminId)); // Use setAdminList

      } catch (error) {
          console.error(`Failed to delete admin ${adminId}:`, error);
          setUsersError(error.response?.data?.message || 'Failed to delete admin.');
      } finally {
          setDeletingAdminId(null); // Clear deleting state
      }
  };


  return (
    <div className="adm-settings__container">
      <h1 className="adm-settings__title">Admin Settings</h1>

      <div className="adm-settings__layout">
        <div className="adm-settings__sidebar">
          <ul className="adm-settings__tabs">
            <li
              className={activeTab === 'profile' ? 'adm-settings__tab adm-settings__tab--active' : 'adm-settings__tab'}
              onClick={() => setActiveTab('profile')}
            >
              <i className="fas fa-user"></i> Profile Settings
            </li>
            <li
              className={activeTab === 'notifications' ? 'adm-settings__tab adm-settings__tab--active' : 'adm-settings__tab'}
              onClick={() => setActiveTab('notifications')}
            >
              <i className="fas fa-bell"></i> Notification Preferences
            </li>
            <li
              className={activeTab === 'security' ? 'adm-settings__tab adm-settings__tab--active' : 'adm-settings__tab'}
              onClick={() => setActiveTab('security')}
            >
              <i className="fas fa-shield-alt"></i> Security
            </li>
            <li
              className={activeTab === 'users' ? 'adm-settings__tab adm-settings__tab--active' : 'adm-settings__tab'}
              onClick={() => setActiveTab('users')}
            >
              <i className="fas fa-users"></i> User Management
            </li>
             {/* Optional: Add Logout tab if needed */}
             {/*
             <li className="adm-settings__tab adm-settings__tab--logout" onClick={() => alert('Logout clicked')}>
                <i className="fas fa-sign-out-alt"></i> Logout
             </li>
             */}
          </ul>
        </div>

        <div className="adm-settings__content">
          {activeTab === 'profile' && (
            <div className="adm-settings__panel">
              <h2>Profile Settings</h2>
              {/* Use the general save handler for this form */}
              <form onSubmit={handleGeneralSaveSettings}>
                <div className="adm-settings__form-group">
                  <label htmlFor="name">Full Name</label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={userData.name}
                    onChange={handleProfileChange}
                    required
                  />
                </div>

                <div className="adm-settings__form-group">
                  <label htmlFor="email">Email Address</label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={userData.email}
                    onChange={handleProfileChange}
                    required
                  />
                </div>

                {/* Add other profile fields like phone number here */}
                <div className="adm-settings__form-group">
                  <label htmlFor="phone">Phone Number</label>
                  <input
                    type="tel" // Consider 'tel' type for phone input
                    id="phone"
                    name="phone"
                    value={userData.phone} // Using mock phone from state
                    onChange={handleProfileChange}
                    // Add pattern and title for basic client-side validation if needed
                    // pattern="^(?:\+94|0)[0-9]{9}$" // Example pattern for Sri Lankan numbers
                    // title="Enter a valid Sri Lankan phone number (e.g., +94712345678 or 0712345678)"
                    // required // Make required if necessary
                  />
                </div>

                <button type="submit" className="adm-settings__save-btn">Save Profile</button>
              </form>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="adm-settings__panel">
              <h2>Notification Preferences</h2>
               {/* Use the general save handler for this form */}
              <form onSubmit={handleGeneralSaveSettings}>
                <div className="adm-settings__checkbox-group">
                  <input
                    type="checkbox"
                    id="emailAlerts"
                    name="emailAlerts"
                    checked={userData.notifications.emailAlerts}
                    onChange={handleNotificationChange}
                  />
                  <label htmlFor="emailAlerts">Email Alerts</label>
                </div>

                <div className="adm-settings__checkbox-group">
                  <input
                    type="checkbox"
                    id="newDonations"
                    name="newDonations"
                    checked={userData.notifications.newDonations}
                    onChange={handleNotificationChange}
                  />
                  <label htmlFor="newDonations">New Donation Notifications</label>
                </div>

                <div className="adm-settings__checkbox-group">
                  <input
                    type="checkbox"
                    id="newSchools"
                    name="newSchools"
                    checked={userData.notifications.newSchools}
                    onChange={handleNotificationChange}
                  />
                  <label htmlFor="newSchools">New School Registration Alerts</label>
                </div>

                <div className="adm-settings__checkbox-group">
                  <input
                    type="checkbox"
                    id="systemUpdates"
                    name="systemUpdates"
                    checked={userData.notifications.systemUpdates}
                    onChange={handleNotificationChange}
                  />
                  <label htmlFor="systemUpdates">System Update Notifications</label>
                </div>

                <button type="submit" className="adm-settings__save-btn">Save Preferences</button>
              </form>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="adm-settings__panel">
              <h2>Security Settings</h2>
              {/* Password Change Form */}
              <form onSubmit={handleChangePasswordSubmit}> {/* Use the specific password submit handler */}
                <div className="adm-settings__form-section">
                  <h3>Change Password</h3>
                  {passwordChangeError && <p className="adm-settings__error-message">{passwordChangeError}</p>}
                  {passwordChangeSuccess && <p className="adm-settings__success-message">{passwordChangeSuccess}</p>}

                  <div className="adm-settings__form-group">
                    <label htmlFor="currentPassword">Current Password</label>
                    <input
                        type="password"
                        id="currentPassword"
                        name="currentPassword"
                        value={passwordData.currentPassword}
                        onChange={handlePasswordChangeInput}
                        required
                    />
                  </div>

                  <div className="adm-settings__form-group">
                    <label htmlFor="newPassword">New Password</label>
                    <input
                        type="password"
                        id="newPassword"
                        name="newPassword"
                        value={passwordData.newPassword}
                        onChange={handlePasswordChangeInput}
                        required
                    />
                  </div>

                  <div className="adm-settings__form-group">
                    <label htmlFor="confirmPassword">Confirm New Password</label>
                    <input
                        type="password"
                        id="confirmPassword"
                        name="confirmPassword"
                        value={passwordData.confirmPassword}
                        onChange={handlePasswordChangeInput}
                        required
                    />
                  </div>
                </div>

                <button type="submit" className="adm-settings__save-btn" disabled={changingPassword}>
                    {changingPassword ? 'Changing...' : 'Change Password'}
                </button>
              </form>
            </div>
          )}

          {activeTab === 'users' && (
            <div className="adm-settings__panel">
              <h2>User Management</h2>
              <div className="adm-settings__user-controls">
                {/* Conditionally render Add New Admin button for SuperAdmins */}
                 {loadingRole ? (
                     // Render disabled button during loading
                    <button className="adm-settings__add-user-btn" disabled>
                        Loading...
                    </button>
                 ) : roleError ? (
                    <p className="adm-settings__error-message">{roleError}</p>
                 ) : loggedInAdminRole === 'superadmin' && (
                     // Render active button if Super Admin
                     <button
                        className="adm-settings__add-user-btn"
                        onClick={() => {
                           setShowAddAdminModal(true);
                           setAddAdminError(null); // Clear previous errors when opening
                           setAddAdminSuccess(null); // Clear success message too
                        }}
                     >
                        Add New Admin
                     </button>
                 )}
                <input type="text" placeholder="Search users..." className="adm-settings__user-search" />
                 {/* In a real app, searching would filter the fetched admin list */}
              </div>

               {loadingUsers ? (
                    <p>Loading users...</p>
               ) : usersError ? (
                    <p className="adm-settings__error-message">{usersError}</p>
               ) : (
                   <table className="adm-settings__users-table">
                     <thead>
                       <tr>
                         <th>Name</th>
                         <th>Email</th>
                         <th>Role</th>
                         <th>Actions</th> {/* Removed Status column header */}
                       </tr>
                     </thead>
                     <tbody>
                        {/* Map over the admin list */}
                       {adminList.map(user => (
                          <tr key={user._id}> {/* Use unique _id from data */}
                              <td>{user.name}</td>
                              <td>{user.email}</td>
                              <td>{user.role === 'superadmin' ? 'Super Admin' : 'Admin'}</td> {/* Display roles nicely */}
                              <td>
                                {/* Edit button - remains for all admins */}
                                {/* In a real app, this would open an edit modal */}
                                <button className="adm-settings__edit-btn" onClick={() => alert(`Edit user ${user.name}`)}>Edit</button>

                                {/* Delete button - conditional rendering */}
                                {/* Show delete button ONLY if loggedInAdmin is superadmin AND user is not loggedInAdmin AND user is not superadmin */}
                                {loggedInAdminRole === 'superadmin' &&
                                   user._id !== loggedInAdminId &&
                                   user.role !== 'superadmin' && (
                                       <button
                                           className="adm-settings__delete-btn"
                                           onClick={() => handleDeleteAdmin(user._id)}
                                           disabled={deletingAdminId === user._id} // Disable while deleting
                                       >
                                           {deletingAdminId === user._id ? 'Deleting...' : 'Delete'}
                                       </button>
                                   )
                                }
                              </td>
                          </tr>
                       ))}
                        {adminList.length === 0 && (
                           <tr>
                              <td colSpan="4" style={{ textAlign: 'center' }}>No admin users found.</td> {/* Adjusted colspan */}
                           </tr>
                        )}
                     </tbody>
                   </table>
               )}
            </div>
          )}
        </div>
      </div>

      {/* Add New Admin Modal */}
      {showAddAdminModal && (
         <div className="adm-settings__modal-overlay">
            <div className="adm-settings__modal-content">
               <h3>Add New Admin User</h3>
               {addAdminError && <p className="adm-settings__error-message">{addAdminError}</p>}
               {addAdminSuccess && <p className="adm-settings__success-message">{addAdminSuccess}</p>}
               <form onSubmit={handleCreateAdmin} className="adm-settings__add-admin-form">
                  <div className="adm-settings__form-group">
                     <label htmlFor="newAdminName">Full Name</label>
                     <input
                        type="text"
                        id="newAdminName"
                        name="name"
                        value={newAdminData.name}
                        onChange={handleAddAdminChange}
                        required
                     />
                  </div>
                  <div className="adm-settings__form-group">
                     <label htmlFor="newAdminEmail">Email Address</label>
                     <input
                        type="email"
                        id="newAdminEmail"
                        name="email"
                        value={newAdminData.email}
                        onChange={handleAddAdminChange}
                        required
                     />
                  </div>
                  <div className="adm-settings__form-group">
                     <label htmlFor="newAdminPassword">Password</label>
                     <input
                        type="password"
                        id="newAdminPassword"
                        name="password"
                        value={newAdminData.password}
                        onChange={handleAddAdminChange}
                        required
                     />
                  </div>
                  <div className="adm-settings__form-group">
                     <label htmlFor="newAdminConfirmPassword">Confirm Password</label>
                     <input
                        type="password"
                        id="newAdminConfirmPassword"
                        name="confirmPassword"
                        value={newAdminData.confirmPassword}
                        onChange={handleAddAdminChange}
                        required
                     />
                  </div>
                  {loggedInAdminRole === 'superadmin' && ( // Only show role select if logged in as Super Admin
                      <div className="adm-settings__form-group">
                         <label htmlFor="newAdminRole">Role</label>
                         <select
                            id="newAdminRole"
                            name="role"
                            value={newAdminData.role}
                            onChange={handleAddAdminChange}
                            required
                         >
                            <option value="admin">Admin</option>
                            <option value="superadmin">Super Admin</option>
                         </select>
                      </div>
                  )}

                  <div className="adm-settings__modal-actions">
                     <button type="submit" className="adm-settings__save-btn" disabled={addingAdmin}>
                        {addingAdmin ? 'Creating...' : 'Create Admin'}
                     </button>
                     <button
                        type="button"
                        className="adm-settings__cancel-btn"
                        onClick={() => setShowAddAdminModal(false)}
                        disabled={addingAdmin}
                     >
                        Cancel
                     </button>
                  </div>
               </form>
            </div>
         </div>
      )}

    </div>
  );
};

export default AdminSettings;
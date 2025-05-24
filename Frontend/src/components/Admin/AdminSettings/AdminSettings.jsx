import React, { useState, useEffect } from 'react';
import api from '../../../api';
import './AdminSettings.css';
import validator from 'validator';

const AdminSettings = () => {
  const [activeTab, setActiveTab] = useState('profile');

  const [loggedInAdminRole, setLoggedInAdminRole] = useState(null);
  const [loggedInAdminId, setLoggedInAdminId] = useState(null);
  const [loadingRole, setLoadingRole] = useState(true);
  const [roleError, setRoleError] = useState(null);

  const [adminList, setAdminList] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [usersError, setUsersError] = useState(null);

  const [userData, setUserData] = useState({
    name: '',
    email: '',
    phone: '',
    notifications: {
      emailAlerts: true,
      newDonations: true,
      newSchools: true,
      systemUpdates: false
    },
  });

  const [passwordData, setPasswordData] = useState({
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
  });
  const [changingPassword, setChangingPassword] = useState(false);
  const [passwordChangeSuccess, setPasswordChangeSuccess] = useState(null);
  const [passwordChangeError, setPasswordChangeError] = useState(null);

  const [showAddAdminModal, setShowAddAdminModal] = useState(false);
  const [newAdminData, setNewAdminData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'admin',
  });
  const [addAdminError, setAddAdminError] = useState(null);
  const [addAdminSuccess, setAddAdminSuccess] = useState(null);
  const [addingAdmin, setAddingAdmin] = useState(false);

  const [deletingAdminId, setDeletingAdminId] = useState(null);

  useEffect(() => {
    const fetchAdminData = async () => {
      try {
        setLoadingRole(true);
        setLoadingUsers(true);

        const profileRes = await api.get('/api/admin/profile');
        setLoggedInAdminRole(profileRes.data.role);
        setLoggedInAdminId(profileRes.data._id);

        setUserData(prev => ({
           ...prev,
           name: profileRes.data.name,
           email: profileRes.data.email,
        }));
        setLoadingRole(false);

        const usersRes = await api.get('/api/admin/admins');
        setAdminList(usersRes.data);
        setLoadingUsers(false);

      } catch (error) {
        console.error('Failed to fetch admin data:', error);
        setRoleError(error.response?.data?.message || 'Failed to fetch initial admin data.');
        setUsersError('Failed to load admin list.');
        setLoadingRole(false);
        setLoadingUsers(false);
      }
    };
    fetchAdminData();
  }, []);

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

  const handlePasswordChangeInput = (e) => {
      const { name, value } = e.target;
      setPasswordData({
          ...passwordData,
          [name]: value,
      });
  };

  const handleChangePasswordSubmit = async (e) => {
      e.preventDefault();
      setChangingPassword(true);
      setPasswordChangeError(null);
      setPasswordChangeSuccess(null);

      const { currentPassword, newPassword, confirmPassword } = passwordData;

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
       if (!validator.isLength(newPassword, { min: 8 })) {
            setPasswordChangeError('Password must be at least 8 characters long.');
            setChangingPassword(false);
            return;
       }

      try {
          const res = await api.put('/api/admin/profile/password', {
              currentPassword,
              newPassword,
              confirmPassword
          });
          setPasswordChangeSuccess(res.data.message || 'Password changed successfully!');
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

  const handleGeneralSaveSettings = async (e) => {
    e.preventDefault();
    alert(`Save settings for ${activeTab} (Saving functionality not fully implemented for this section).`);
  };

  const handleAddAdminChange = (e) => {
    const { name, value } = e.target;
    setNewAdminData({
      ...newAdminData,
      [name]: value
    });
  };

  const handleCreateAdmin = async (e) => {
    e.preventDefault();
    setAddingAdmin(true);
    setAddAdminError(null);
    setAddAdminSuccess(null);

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

    try {
      const res = await api.post('/api/admin/register', newAdminData);
      setAddAdminSuccess(`Admin "${res.data.name}" created successfully!`);

      setAdminList(prevList => [...prevList, res.data]);

      setNewAdminData({
         name: '',
         email: '',
         password: '',
         confirmPassword: '',
         role: 'admin',
      });
    } catch (error) {
      console.error('Failed to create admin:', error);
      setAddAdminError(error.response?.data?.message || 'Failed to create admin.');
    } finally {
      setAddingAdmin(false);
    }
  };

  const handleDeleteAdmin = async (adminId) => {
      if (!window.confirm('Are you sure you want to delete this admin user? This action cannot be undone.')) {
          return;
      }

      setDeletingAdminId(adminId);
      setUsersError(null);

      try {
          const res = await api.delete(`/api/admin/admins/${adminId}`);
          alert(res.data.message);

          setAdminList(prevList => prevList.filter(user => user._id !== adminId));

      } catch (error) {
          console.error(`Failed to delete admin ${adminId}:`, error);
          setUsersError(error.response?.data?.message || 'Failed to delete admin.');
      } finally {
          setDeletingAdminId(null);
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
          </ul>
        </div>

        <div className="adm-settings__content">
          {activeTab === 'profile' && (
            <div className="adm-settings__panel">
              <h2>Profile Settings</h2>
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

                <div className="adm-settings__form-group">
                  <label htmlFor="phone">Phone Number</label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={userData.phone}
                    onChange={handleProfileChange}
                  />
                </div>

                <button type="submit" className="adm-settings__save-btn">Save Profile</button>
              </form>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="adm-settings__panel">
              <h2>Notification Preferences</h2>
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
              <form onSubmit={handleChangePasswordSubmit}>
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
                 {loadingRole ? (
                    <button className="adm-settings__add-user-btn" disabled>
                        Loading...
                    </button>
                 ) : roleError ? (
                    <p className="adm-settings__error-message">{roleError}</p>
                 ) : loggedInAdminRole === 'superadmin' && (
                     <button
                        className="adm-settings__add-user-btn"
                        onClick={() => {
                           setShowAddAdminModal(true);
                           setAddAdminError(null);
                           setAddAdminSuccess(null);
                        }}
                     >
                        Add New Admin
                     </button>
                 )}
                <input type="text" placeholder="Search users..." className="adm-settings__user-search" />
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
                         <th>Actions</th>
                       </tr>
                     </thead>
                     <tbody>
                       {adminList.map(user => (
                          <tr key={user._id}>
                              <td>{user.name}</td>
                              <td>{user.email}</td>
                              <td>{user.role === 'superadmin' ? 'Super Admin' : 'Admin'}</td>
                              <td>
                                <button className="adm-settings__edit-btn" onClick={() => alert(`Edit user ${user.name}`)}>Edit</button>

                                {loggedInAdminRole === 'superadmin' &&
                                   user._id !== loggedInAdminId &&
                                   user.role !== 'superadmin' && (
                                       <button
                                           className="adm-settings__delete-btn"
                                           onClick={() => handleDeleteAdmin(user._id)}
                                           disabled={deletingAdminId === user._id}
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
                              <td colSpan="4" style={{ textAlign: 'center' }}>No admin users found.</td>
                           </tr>
                        )}
                     </tbody>
                   </table>
               )}
            </div>
          )}
        </div>
      </div>

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
                  {loggedInAdminRole === 'superadmin' && (
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
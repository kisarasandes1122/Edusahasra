import React, { useState, useEffect } from 'react';
import { FaArrowLeft, FaPlus, FaMapMarkerAlt, FaTimes, FaTrash, FaSpinner } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../../LanguageSelector/LanguageContext';
import api from '../../../api';
import './EditProfile.css';

const EditProfile = () => {
  const navigate = useNavigate();
  const { translations } = useLanguage() || { translations: {} };

  // --- State ---
  const [profileData, setProfileData] = useState({
      schoolName: '', streetAddress: '', city: '', district: '', province: '',
      postalCode: '', description: '', principalName: '', principalEmail: '',
      phoneNumber: '', latitude: null, longitude: null, images: [],
  });
  const [schoolImagesToUpload, setSchoolImagesToUpload] = useState([]);
  const [previewUrls, setPreviewUrls] = useState([]);
  const [imagesToDelete, setImagesToDelete] = useState([]);

  // --- Password Change State ---
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [passwordChanging, setPasswordChanging] = useState(false);
  const [passwordError, setPasswordError] = useState(null);
  const [passwordSuccess, setPasswordSuccess] = useState(null);


  // --- General Component State ---
  const [activeSection, setActiveSection] = useState('info'); // 'info' or 'password'
  const [locationState, setLocationState] = useState({ fetching: false, error: null });
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false); // For profile data save
  const [generalError, setGeneralError] = useState(null); // Renamed from 'error'


  // --- Fetch Profile Data ---
  useEffect(() => {
    let isMounted = true;
    const fetchProfile = async () => {
      setLoading(true);
      setGeneralError(null);
      try {
        const response = await api.get('/api/schools/profile');
        if (isMounted) {
            const data = response.data;
            setProfileData({
              schoolName: data.schoolName || '',
              streetAddress: data.streetAddress || '',
              city: data.city || '',
              district: data.district || '',
              province: data.province || '',
              postalCode: data.postalCode || '',
              description: data.description || '',
              principalName: data.principalName || '',
              principalEmail: data.principalEmail || '',
              phoneNumber: data.phoneNumber || '',
              latitude: data.latitude || null,
              longitude: data.longitude || null,
              images: data.images || [],
            });
        }
      } catch (err) {
         if (isMounted) {
            setGeneralError(err.response?.data?.message || err.message || 'Failed to load profile data.');
         }
      } finally {
         if (isMounted) {
            setLoading(false);
         }
      }
    };

    fetchProfile();

    return () => {
        isMounted = false;
        previewUrls.forEach(url => URL.revokeObjectURL(url));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty dependency array means this runs once on mount

  // --- Handlers ---
  const handleBack = () => navigate('/Dashboard');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProfileData((prevState) => ({
      ...prevState,
      [name]: value,
    }));
    if (generalError) setGeneralError(null); // Clear general error on profile data change
    if (locationState.error && (name === 'latitude' || name === 'longitude')) {
        setLocationState(prev => ({ ...prev, error: null })); // Clear location error if coords manually changed
    }
  };

   const handlePasswordInputChange = (e) => {
        const { name, value } = e.target;
        if (name === 'currentPassword') setCurrentPassword(value);
        else if (name === 'newPassword') setNewPassword(value);
        else if (name === 'confirmNewPassword') setConfirmNewPassword(value);

        // Clear password-specific messages on input
        setPasswordError(null);
        setPasswordSuccess(null);
    };


  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      setLocationState({ fetching: false, error: translations.geolocation_not_supported || 'Geolocation is not supported.'});
      return;
    }
    setLocationState({ fetching: true, error: null });
    setGeneralError(null); // Clear general error when fetching location
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setProfileData((prev) => ({
          ...prev,
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        }));
        setLocationState({ fetching: false, error: null });
         setGeneralError(null); // Clear any general error if location fetch succeeds
      },
      (err) => {
        setLocationState({ fetching: false, error: `${translations.location_error || 'Location Error'}: ${err.message}` });
        setProfileData((prev) => ({ ...prev, latitude: null, longitude: null }));
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  // --- Image Handling ---
  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    const currentImageCount = profileData.images.length - imagesToDelete.length + schoolImagesToUpload.length; // Account for images marked for deletion
    const maxImages = 10;
    const allowedNewCount = maxImages - currentImageCount;

    if (files.length === 0) return;
    if (allowedNewCount <= 0) {
        alert(translations.image_limit_exceeded || `Maximum ${maxImages} images allowed.`);
        e.target.value = null; // Clear the file input
        return;
    }
    const filesToProcess = files.slice(0, allowedNewCount);
    const validFiles = filesToProcess.filter(file => {
        if (!file.type.startsWith('image/')) {
            alert(translations.invalid_file_type_image || `File ${file.name} is not an image.`);
            return false;
        }
        if (file.size > 10 * 1024 * 1024) { // 10MB limit
            alert(translations.file_too_large || `File ${file.name} exceeds the 10MB size limit.`);
            return false;
        } return true;
    });

     if (filesToProcess.length > validFiles.length) {
         // Optional: more specific message if some files were invalid format or size
         const invalidCount = filesToProcess.length - validFiles.length;
         console.warn(`${invalidCount} files were filtered out due to type or size.`);
     }

    setSchoolImagesToUpload((prevImages) => [...prevImages, ...validFiles]);
    const newUrls = validFiles.map(file => URL.createObjectURL(file));
    setPreviewUrls(prev => [...prev, ...newUrls]);
    e.target.value = null; // Clear input for next selection
  };

  const handleRemovePreviewImage = (indexToRemove) => {
    URL.revokeObjectURL(previewUrls[indexToRemove]);
    setSchoolImagesToUpload(prev => prev.filter((_, index) => index !== indexToRemove));
    setPreviewUrls(prev => prev.filter((_, index) => index !== indexToRemove));
  };

  const handleDeleteExistingImage = (imageUrl) => {
    // Confirm before deleting
    if (window.confirm(translations.confirm_delete_image || 'Are you sure you want to delete this image?')) {
      // Add to list of images to delete on save
      setImagesToDelete(prev => [...prev, imageUrl]);

      // Remove from UI immediately
      setProfileData(prev => ({
        ...prev,
        images: prev.images.filter(img => img !== imageUrl)
      }));
    }
  };

  // --- Save Changes (Profile Data) ---
  const handleSaveChanges = async () => {
    setIsSaving(true);
    setGeneralError(null); // Clear general errors before saving
    setPasswordError(null); // Also clear password errors if saving profile

    const formDataToSend = new FormData();

    // 1. Append Text Fields from profileData state
    formDataToSend.append('schoolName', profileData.schoolName || '');
    formDataToSend.append('streetAddress', profileData.streetAddress || '');
    formDataToSend.append('city', profileData.city || '');
    formDataToSend.append('district', profileData.district || '');
    formDataToSend.append('province', profileData.province || '');
    formDataToSend.append('postalCode', profileData.postalCode || '');
    formDataToSend.append('description', profileData.description || '');
    formDataToSend.append('principalName', profileData.principalName || '');
    formDataToSend.append('principalEmail', profileData.principalEmail || '');
    formDataToSend.append('phoneNumber', profileData.phoneNumber || '');

    // 2. Append Latitude and Longitude
    // Send null/undefined if location was cleared or never set
    if (profileData.latitude !== null && profileData.latitude !== undefined) {
         const lat = parseFloat(profileData.latitude);
         if (!isNaN(lat)) formDataToSend.append('latitude', lat.toString());
         else formDataToSend.append('latitude', ''); // Send empty string for invalid float
    } else {
         // Explicitly send null or empty string if location was removed
         formDataToSend.append('latitude', ''); // Or null, depending on backend handling
    }
     if (profileData.longitude !== null && profileData.longitude !== undefined) {
         const lon = parseFloat(profileData.longitude);
         if (!isNaN(lon)) formDataToSend.append('longitude', lon.toString());
          else formDataToSend.append('longitude', ''); // Send empty string for invalid float
     } else {
          // Explicitly send null or empty string if location was removed
          formDataToSend.append('longitude', ''); // Or null
     }


    // 3. Append *NEW* File Objects
    schoolImagesToUpload.forEach((file) => {
      if (file instanceof File) {
        formDataToSend.append('profileImages', file); // 'profileImages' must match backend multer field name
      }
    });

    // 4. Append images to delete list
    if (imagesToDelete.length > 0) {
      formDataToSend.append('imagesToDelete', JSON.stringify(imagesToDelete)); // Send as JSON string
    }

    try {
      const response = await api.put('/api/schools/profile', formDataToSend, {
          // Axios automatically sets Content-Type to multipart/form-data for FormData
      });

      // Update local state with the authoritative data from backend response
      setProfileData(response.data);

      // Clear the upload queue and revoke preview URLs as they've been processed
      previewUrls.forEach(url => URL.revokeObjectURL(url));
      setSchoolImagesToUpload([]);
      setPreviewUrls([]);
      setImagesToDelete([]); // Clear the deletion queue

      alert(translations.changes_saved_successfully || 'Changes saved successfully!');

    } catch (err) {
      // Extract error message preference: backend response -> network error -> generic
      const backendMsg = err.response?.data?.message;
      const networkMsg = err.message;
      setGeneralError( // Use general error state
        backendMsg || networkMsg ||
        (translations.failed_to_save_changes || 'Failed to save changes. Please try again.')
      );
    } finally {
      setIsSaving(false);
    }
  };

  // --- Handle Password Change Submission ---
   const handleSubmitPasswordChange = async (e) => {
        e.preventDefault();
        setPasswordChanging(true);
        setPasswordError(null);
        setPasswordSuccess(null);
        setGeneralError(null); // Clear general errors if changing password

        // Frontend validation
        if (!currentPassword || !newPassword || !confirmNewPassword) {
            setPasswordError(translations.all_password_fields_required || 'All password fields are required.');
            setPasswordChanging(false);
            return;
        }
        if (newPassword !== confirmNewPassword) {
            setPasswordError(translations.new_passwords_do_not_match || 'New password and confirm password do not match.');
            setPasswordChanging(false);
            return;
        }
         // Basic password strength validation (should match backend)
         if (newPassword.length < 8 || !/[A-Z]/.test(newPassword) || !/[0-9]/.test(newPassword) || !/[!@#$%^&*(),.?":{}|<>]/.test(newPassword)) {
             setPasswordError(translations.password_strength_hint || 'Password must be at least 8 characters long and include uppercase, number, and special character.');
             setPasswordChanging(false);
             return;
         }


        try {
            const response = await api.put('/api/schools/profile/password', {
                currentPassword,
                newPassword,
                confirmPassword: confirmNewPassword // Fixed variable name to match state
            });

            setPasswordSuccess(response.data.message || (translations.password_changed_successfully || 'Password changed successfully!'));
            // Clear password fields on success
            setCurrentPassword('');
            setNewPassword('');
            setConfirmNewPassword('');

        } catch (err) {
             const backendMsg = err.response?.data?.message;
             const networkMsg = err.message;
             setPasswordError(
                backendMsg || networkMsg ||
                (translations.failed_to_change_password || 'Failed to change password. Please try again.')
             );
        } finally {
            setPasswordChanging(false);
        }
   };


  // --- Helper function to construct image URL (using frontend api.js helper) ---
  const getFullImageUrl = (relativePath) => {
      // Check if the path is already a full URL or includes /uploads
       if (!relativePath || typeof relativePath !== 'string') return '';
       if (relativePath.startsWith('http') || relativePath.startsWith('/uploads')) {
           // If it's already a full URL or starts with /uploads, assume it's ready or relative to base
           // For paths starting with /uploads, prepend base URL
           if (relativePath.startsWith('/uploads')) {
               // Use the original base URL from the api config
                return `${api.defaults.baseURL}${relativePath}`;
           }
            return relativePath; // Assume it's a full external URL
       }
       // If it's just a relative path (like 'school-profile-images/filename.jpg'), prepend /uploads/
       const cleanPath = relativePath.startsWith('/') ? relativePath.substring(1) : relativePath;
       return `${api.defaults.baseURL}/uploads/${cleanPath}`;
   };


  // --- Render ---
  if (loading) {
    return <div className="profile-container profile-loading">{translations.loading_profile || "Loading Profile..."}</div>;
  }

  // Determine if any saving/changing process is ongoing
  const isAnyProcessOngoing = isSaving || passwordChanging || locationState.fetching;


  return (
    <div className="profile-container">
      {/* Header */}
      <header className="profile-header">
         <div className="profile-title">
            <h1 className="profile-title-text">{translations.my_profile || "My Profile"}</h1>
         </div>
      </header>

      {/* Back Button */}
      <div className="profile-back-btn-container">
         <button className="profile-back-btn" onClick={handleBack} disabled={isAnyProcessOngoing}>
            <FaArrowLeft className="back-icon" />
            <span>{translations.back || "Back"}</span>
         </button>
      </div>

      {/* General Error Display (outside main content area) */}
      {generalError && (
         <div className="profile-error-section">
             <p className="error-message general-error">{generalError}</p>
         </div>
      )}

      {/* --- Main Content Wrapper (Sidebar + Content) --- */}
      <div className="profile-main-content-wrapper">
         {/* --- Sidebar Navigation --- */}
         <div className="profile-sidebar">
             <button
                 className={`profile-sidebar-link ${activeSection === 'info' ? 'active' : ''}`}
                 onClick={() => setActiveSection('info')}
                 disabled={isAnyProcessOngoing}
             >
                 {translations.school_information || "School Information"}
             </button>
             <button
                 className={`profile-sidebar-link ${activeSection === 'password' ? 'active' : ''}`}
                 onClick={() => setActiveSection('password')}
                  disabled={isAnyProcessOngoing}
             >
                 {translations.change_password || "Change Password"}
             </button>
             {/* Add more sections here if needed */}
         </div>

         {/* --- Main Content Area (Conditional Rendering) --- */}
         <div className="profile-content-area">

             {activeSection === 'info' && (
                 <>
                     {/* School Info Section */}
                     <div className="profile-form-section"> {/* Changed class name */}
                         <h3 className="section-title">{translations.school_information || "School Information"}</h3>
                         <form className="profile-form" onSubmit={(e) => { e.preventDefault(); handleSaveChanges(); }}>
                            <div className="form-group">
                                <label className="form-label" htmlFor="schoolName">{translations.school_name || "School Name"}</label>
                                <input type="text" id="schoolName" name="schoolName" value={profileData.schoolName} onChange={handleChange} className="form-input" disabled={isAnyProcessOngoing}/> {/* Disabled using generic check */}
                            </div>
                            <div className="form-group">
                                <label className="form-label" htmlFor="streetAddress">{translations.school_address || "School Address"}</label>
                                <input type="text" id="streetAddress" name="streetAddress" value={profileData.streetAddress} onChange={handleChange} className="form-input" disabled={isAnyProcessOngoing}/>
                            </div>
                            <div className="form-row">
                                <div className="form-group form-group-row"><label className="form-label" htmlFor="city">City</label><input type="text" id="city" name="city" value={profileData.city} onChange={handleChange} className="form-input" disabled={isAnyProcessOngoing}/></div>
                                <div className="form-group form-group-row"><label className="form-label" htmlFor="district">District</label><input type="text" id="district" name="district" value={profileData.district} onChange={handleChange} className="form-input" disabled={isAnyProcessOngoing}/></div>
                            </div>
                            <div className="form-row">
                                <div className="form-group form-group-row"><label className="form-label" htmlFor="province">Province</label><input type="text" id="province" name="province" value={profileData.province} onChange={handleChange} className="form-input" disabled={isAnyProcessOngoing}/></div>
                                <div className="form-group form-group-row"><label className="form-label" htmlFor="postalCode">Postal Code</label><input type="text" id="postalCode" name="postalCode" value={profileData.postalCode} onChange={handleChange} className="form-input" disabled={isAnyProcessOngoing}/></div>
                            </div>
                             {/* Location Input */}
                            <div className="form-group">
                                <label className="form-label">{translations.school_location || "School Location"}</label>
                                <div className="location-container">
                                    <div className="location-display">
                                        {(profileData.latitude !== null && profileData.latitude !== undefined) && (profileData.longitude !== null && profileData.longitude !== undefined) ? (
                                            <div className="location-coordinates">
                                                <span>Lat: {Number(profileData.latitude).toFixed(6)}</span>
                                                <span>Lon: {Number(profileData.longitude).toFixed(6)}</span>
                                            </div>
                                        ) : (<span className="no-location">{translations.no_location_set || "No location set"}</span>)}
                                    </div>
                                    <button type="button" onClick={handleGetLocation} className="get-location-btn" disabled={isAnyProcessOngoing}>
                                        <FaMapMarkerAlt className="location-icon" />
                                        {locationState.fetching ? (translations.getting || 'Getting...') : (translations.get_my_location || 'Get My Location')}
                                         {locationState.fetching && <FaSpinner className="fa-spin" />}
                                    </button>
                                </div>
                                {locationState.error && <div className="location-error password-message error">{locationState.error}</div>}
                            </div>
                            {/* Telephone */}
                             <div className="form-group">
                                <label className="form-label" htmlFor="phoneNumber">{translations.school_telephone_number || "Telephone"}</label>
                                <input type="text" id="phoneNumber" name="phoneNumber" value={profileData.phoneNumber} onChange={handleChange} className="form-input" disabled={isAnyProcessOngoing}/>
                            </div>
                            {/* Description */}
                            <div className="form-group">
                                <label className="form-label" htmlFor="description">{translations.description_about_the_school || "Description"}</label>
                                <textarea id="description" name="description" value={profileData.description} onChange={handleChange} className="form-textarea" rows="4" disabled={isAnyProcessOngoing}></textarea>
                            </div>

                             {/* Image Upload Section */}
                             <div className="profile-form-section"> {/* Nested section styling might be needed or adjust CSS */}
                                 <h3 className="section-title">{translations.school_pictures || "School Pictures"}</h3>
                                 {/* Display Existing Images */}
                                 {profileData.images && profileData.images.length > 0 && (
                                    <div className="uploaded-images existing-images">
                                         <h4 className="uploaded-images-title">{translations.current_images || "Current Images:"}</h4>
                                         <div className="image-grid">
                                            {profileData.images.map((imageUrl, index) => (
                                                <div key={`existing-${index}-${imageUrl}`} className="uploaded-image-item">
                                                    {/* Use getFullImageUrl helper for existing images */}
                                                    <img src={getFullImageUrl(imageUrl)} alt={`School ${index+1}`} className="image-preview-thumb" onError={(e) => {e.target.style.display='none'; console.error("Image failed to load:", getFullImageUrl(imageUrl));}}/>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleDeleteExistingImage(imageUrl)}
                                                        className="remove-existing-image-btn" // Changed class name for clarity
                                                        disabled={isAnyProcessOngoing}
                                                        aria-label={`Delete image ${index+1}`}
                                                    >
                                                        <FaTimes /> {/* Changed to FaTimes for consistency with preview remove */}
                                                    </button>
                                                </div>
                                            ))}
                                         </div>
                                    </div>
                                 )}
                                 {/* Display New Images Preview */}
                                {schoolImagesToUpload.length > 0 && (
                                  <div className="uploaded-images preview-images">
                                    <h4 className="uploaded-images-title">{translations.new_images_preview || "New Images Preview:"}</h4>
                                     <div className="image-grid">
                                        {schoolImagesToUpload.map((image, index) => (
                                          <div key={`new-${index}-${image.name}`} className="uploaded-image-item">
                                            <img src={previewUrls[index]} alt={image.name} className="image-preview-thumb"/>
                                            <button type="button" onClick={() => handleRemovePreviewImage(index)} className="remove-preview-image-btn" disabled={isAnyProcessOngoing} aria-label={`Remove ${image.name} from upload queue`}>
                                                <FaTimes />
                                            </button>
                                          </div>
                                        ))}
                                    </div>
                                  </div>
                                )}
                                 {/* File Input Trigger */}
                                {(profileData.images.length - imagesToDelete.length + schoolImagesToUpload.length) < 10 && ( // Only show if max images not reached
                                    <div className="image-upload-container">
                                      <label htmlFor="school-images-input" className={`image-upload-label ${isAnyProcessOngoing ? 'disabled' : ''}`}>
                                        <FaPlus className="upload-icon" />
                                        <div className="upload-text"><span className="upload-text-main">{translations.add_school_pictures || "Add Pictures"}</span></div>
                                      </label>
                                      <input type="file" id="school-images-input" accept="image/*" multiple onChange={handleImageUpload} className="image-upload-input" disabled={isAnyProcessOngoing}/>
                                    </div>
                                )}
                             </div> {/* Closing image section */}

                         </form>

                          {/* Save Profile Button Container - Keep separate from form */}
                           <div className="button-container"> {/* Changed class name */}
                             <button className="primary-button" onClick={handleSaveChanges} disabled={isAnyProcessOngoing}> {/* Updated class name, disabled using generic check */}
                               {isSaving ? (translations.saving || 'Saving Profile...') : (translations.save_changes || "Save Changes")}
                               {isSaving && <FaSpinner className="fa-spin" />}
                             </button>
                           </div>
                     </div> {/* Fix: Properly closing the school info section div */}
                 </>
             )}

             {activeSection === 'password' && (
                 <>
                     {/* Change Password Section */}
                     <div className="profile-form-section"> {/* Use the same section styling */}
                           <h3 className="section-title">{translations.change_password || "Change Password"}</h3>
                            <form className="profile-form" onSubmit={handleSubmitPasswordChange}> {/* Separate form */}
                                 {/* Current Password */}
                                 <div className="form-group">
                                     <label className="form-label" htmlFor="currentPassword">{translations.current_password || "Current Password"}</label>
                                     <input
                                         type="password"
                                         id="currentPassword"
                                         name="currentPassword"
                                         value={currentPassword}
                                         onChange={handlePasswordInputChange}
                                         className="form-input"
                                         disabled={isAnyProcessOngoing}
                                         required
                                     />
                                 </div>
                                  {/* New Password */}
                                 <div className="form-group">
                                     <label className="form-label" htmlFor="newPassword">{translations.new_password || "New Password"}</label>
                                     <input
                                         type="password"
                                         id="newPassword"
                                         name="newPassword"
                                         value={newPassword}
                                         onChange={handlePasswordInputChange}
                                         className="form-input"
                                         disabled={isAnyProcessOngoing}
                                         required
                                     />
                                 </div>
                                  {/* Confirm New Password */}
                                 <div className="form-group">
                                     <label className="form-label" htmlFor="confirmNewPassword">{translations.confirm_new_password || "Confirm New Password"}</label>
                                     <input
                                         type="password"
                                         id="confirmNewPassword"
                                         name="confirmNewPassword"
                                         value={confirmNewPassword}
                                         onChange={handlePasswordInputChange}
                                         className="form-input"
                                         disabled={isAnyProcessOngoing}
                                         required
                                     />
                                 </div>

                                 {/* Password Change Messages */}
                                {passwordError && <div className="password-message error">{passwordError}</div>}
                                {passwordSuccess && <div className="password-message success">{passwordSuccess}</div>}

                                 {/* Change Password Button Container (inside the form) */}
                                 <div className="button-container"> {/* Use the same container style */}
                                    <button type="submit" className="primary-button" disabled={isAnyProcessOngoing}> {/* Use the same button style, disabled using generic check */}
                                         {passwordChanging ? (translations.changing || 'Changing...') : (translations.change_password || "Change Password")}
                                        {passwordChanging && <FaSpinner className="fa-spin" />}
                                    </button>
                                 </div>
                            </form>
                       </div> {/* Properly closing password section */}
                 </>
             )}

         </div> {/* Closing profile-content-area */}

      </div> {/* Closing profile-main-content-wrapper */}


      {/* Contact Help (outside main content wrapper) */}
      <div className="profile-contact">
         <p>
            <span className="contact-text">{translations.need_help_contact_us || "Need help? Contact us:"}</span>
            <span className="contact-number">0789200730</span>
         </p>
      </div>
    </div>
  );
};

export default EditProfile;
import React, { useState, useEffect } from 'react';
import { FaArrowLeft, FaPlus, FaMapMarkerAlt, FaTimes, FaTrash } from 'react-icons/fa';
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
  const [locationState, setLocationState] = useState({ fetching: false, error: null });
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(null);

  // --- Fetch Profile Data ---
  useEffect(() => {
    let isMounted = true;
    const fetchProfile = async () => {
      setLoading(true);
      setError(null);
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
            setError(err.response?.data?.message || err.message || 'Failed to load profile data.');
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
  }, []);

  // --- Handlers ---
  const handleBack = () => navigate('/Dashboard');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProfileData((prevState) => ({
      ...prevState,
      [name]: value,
    }));
    if (error) setError(null);
    if (locationState.error && (name === 'latitude' || name === 'longitude')) {
        setLocationState(prev => ({ ...prev, error: null }));
    }
  };

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      setLocationState({ fetching: false, error: 'Geolocation is not supported.'});
      return;
    }
    setLocationState({ fetching: true, error: null });
    setError(null);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setProfileData((prev) => ({
          ...prev,
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        }));
        setLocationState({ fetching: false, error: null });
      },
      (err) => {
        setLocationState({ fetching: false, error: `Location Error: ${err.message}` });
        setProfileData((prev) => ({ ...prev, latitude: null, longitude: null }));
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  // --- Image Handling ---
  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    const currentImageCount = profileData.images.length + schoolImagesToUpload.length;
    const maxImages = 10;
    const allowedNewCount = maxImages - currentImageCount;

    if (files.length === 0) return;
    if (allowedNewCount <= 0) {
        alert(`Maximum ${maxImages} images allowed.`); return;
    }
    const filesToProcess = files.slice(0, allowedNewCount);
    const validFiles = filesToProcess.filter(file => {
        if (!file.type.startsWith('image/')) return false;
        if (file.size > 10 * 1024 * 1024) {
            alert(`File ${file.name} exceeds the 10MB size limit.`); return false;
        } return true;
    });
    if (filesToProcess.length > allowedNewCount) alert(`You can only add ${allowedNewCount} more image(s).`);
    setSchoolImagesToUpload((prevImages) => [...prevImages, ...validFiles]);
    const newUrls = validFiles.map(file => URL.createObjectURL(file));
    setPreviewUrls(prev => [...prev, ...newUrls]);
    e.target.value = null;
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

  // --- Save Changes ---
  const handleSaveChanges = async () => {
    setIsSaving(true);
    setError(null);

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

    // 2. Append Latitude and Longitude (ONLY if they are valid numbers)
    const lat = parseFloat(profileData.latitude);
    const lon = parseFloat(profileData.longitude);
    if (!isNaN(lat)) {
        formDataToSend.append('latitude', lat.toString());
    }
    if (!isNaN(lon)) {
        formDataToSend.append('longitude', lon.toString());
    }

    // 3. Append *NEW* File Objects
    schoolImagesToUpload.forEach((file) => {
      if (file instanceof File) {
        formDataToSend.append('profileImages', file);
      }
    });

    // 4. Append images to delete
    if (imagesToDelete.length > 0) {
      formDataToSend.append('imagesToDelete', JSON.stringify(imagesToDelete));
    }

    try {
      const response = await api.put('/api/schools/profile', formDataToSend);
      
      // Update local state with the authoritative data from backend response
      setProfileData(response.data);

      // Clear the upload queue and revoke preview URLs as they've been processed
      previewUrls.forEach(url => URL.revokeObjectURL(url));
      setSchoolImagesToUpload([]);
      setPreviewUrls([]);
      setImagesToDelete([]);

      alert(translations.changes_saved_successfully || 'Changes saved successfully!');

    } catch (err) {
      // Extract error message preference: backend response -> network error -> generic
      const backendMsg = err.response?.data?.message;
      const networkMsg = err.message;
      setError(
        backendMsg || networkMsg ||
        (translations.failed_to_save_changes || 'Failed to save changes. Please try again.')
      );
    } finally {
      setIsSaving(false);
    }
  };

  // --- Render ---
  if (loading) {
    return <div className="profile-container profile-loading">Loading Profile...</div>;
  }

  const IMAGE_BASE_URL = api.defaults.baseURL || '';

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
         <button className="profile-back-btn" onClick={handleBack} disabled={isSaving}>
            <FaArrowLeft className="back-icon" />
            <span>{translations.back || "Back"}</span>
         </button>
      </div>

      {/* General Error Display */}
      {error && (
         <div className="profile-section profile-error-section">
             <p className="error-message general-error">{error}</p>
         </div>
      )}

      {/* School Info Section */}
      <div className="profile-section">
         <h3 className="section-title">{translations.school_information || "School Information"}</h3>
         <div className="profile-form">
            <div className="form-group">
                <label className="form-label" htmlFor="schoolName">{translations.school_name || "School Name"}</label>
                <input type="text" id="schoolName" name="schoolName" value={profileData.schoolName} onChange={handleChange} className="form-input" disabled={isSaving}/>
            </div>
            <div className="form-group">
                <label className="form-label" htmlFor="streetAddress">{translations.school_address || "School Address"}</label>
                <input type="text" id="streetAddress" name="streetAddress" value={profileData.streetAddress} onChange={handleChange} className="form-input" disabled={isSaving}/>
            </div>
            <div className="form-row">
                <div className="form-group form-group-row"><label className="form-label" htmlFor="city">City</label><input type="text" id="city" name="city" value={profileData.city} onChange={handleChange} className="form-input" disabled={isSaving}/></div>
                <div className="form-group form-group-row"><label className="form-label" htmlFor="district">District</label><input type="text" id="district" name="district" value={profileData.district} onChange={handleChange} className="form-input" disabled={isSaving}/></div>
            </div>
            <div className="form-row">
                <div className="form-group form-group-row"><label className="form-label" htmlFor="province">Province</label><input type="text" id="province" name="province" value={profileData.province} onChange={handleChange} className="form-input" disabled={isSaving}/></div>
                <div className="form-group form-group-row"><label className="form-label" htmlFor="postalCode">Postal Code</label><input type="text" id="postalCode" name="postalCode" value={profileData.postalCode} onChange={handleChange} className="form-input" disabled={isSaving}/></div>
            </div>
             {/* Location Input */}
            <div className="form-group">
                <label className="form-label">{translations.school_location || "School Location"}</label>
                <div className="location-container">
                    <div className="location-display">
                        {profileData.latitude !== null && profileData.longitude !== null ? (
                            <div className="location-coordinates">
                                <span>Lat: {Number(profileData.latitude).toFixed(6)}</span>
                                <span>Lon: {Number(profileData.longitude).toFixed(6)}</span>
                            </div>
                        ) : (<span className="no-location">No location set</span>)}
                    </div>
                    <button type="button" onClick={handleGetLocation} className="get-location-btn" disabled={locationState.fetching || isSaving}>
                        <FaMapMarkerAlt className="location-icon" />
                        {locationState.fetching ? 'Getting...' : (translations.get_my_location || 'Get My Location')}
                    </button>
                </div>
                {locationState.error && <div className="location-error error-message">{locationState.error}</div>}
            </div>
            {/* Telephone */}
             <div className="form-group">
                <label className="form-label" htmlFor="phoneNumber">{translations.school_telephone_number || "Telephone"}</label>
                <input type="text" id="phoneNumber" name="phoneNumber" value={profileData.phoneNumber} onChange={handleChange} className="form-input" disabled={isSaving}/>
            </div>
            {/* Description */}
            <div className="form-group">
                <label className="form-label" htmlFor="description">{translations.description_about_the_school || "Description"}</label>
                <textarea id="description" name="description" value={profileData.description} onChange={handleChange} className="form-textarea" rows="4" disabled={isSaving}></textarea>
            </div>
         </div>
      </div>

      {/* Contact Info Section */}
      <div className="profile-section">
        <h3 className="section-title">{translations.contact_information || "Contact Information"}</h3>
        <div className="profile-form">
           {/* Principal Name */}
           <div className="form-group">
              <label className="form-label" htmlFor="principalName">{translations.name || "Name"}</label>
              <input type="text" id="principalName" name="principalName" value={profileData.principalName} onChange={handleChange} className="form-input" disabled={isSaving}/>
           </div>
           {/* Principal Email */}
           <div className="form-group">
              <label className="form-label" htmlFor="principalEmail">{translations.email_address || "Email"}</label>
              <input type="email" id="principalEmail" name="principalEmail" value={profileData.principalEmail} onChange={handleChange} className="form-input" disabled={isSaving} />
           </div>
        </div>
      </div>

      {/* Image Upload Section */}
      <div className="profile-section">
         <h3 className="section-title">{translations.school_pictures || "School Pictures"}</h3>
         {/* Display Existing Images */}
         {profileData.images && profileData.images.length > 0 && (
            <div className="uploaded-images existing-images">
                 <h4 className="uploaded-images-title">{translations.current_images || "Current Images:"}</h4>
                 <div className="image-grid">
                    {profileData.images.map((imageUrl, index) => (
                        <div key={`existing-${index}-${imageUrl}`} className="uploaded-image-item">
                            <img src={`${IMAGE_BASE_URL}${imageUrl.startsWith('/') ? imageUrl : '/' + imageUrl}`} alt={`School ${index+1}`} className="image-preview-thumb" onError={(e) => e.target.style.display='none'}/>
                            <button 
                                type="button" 
                                onClick={() => handleDeleteExistingImage(imageUrl)} 
                                className="delete-existing-image-btn" 
                                disabled={isSaving}
                                aria-label={`Delete image ${index+1}`}
                            >
                                <FaTrash />
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
                    <button type="button" onClick={() => handleRemovePreviewImage(index)} className="remove-preview-image-btn" disabled={isSaving} aria-label={`Remove ${image.name} from upload queue`}>
                        <FaTimes />
                    </button>
                  </div>
                ))}
            </div>
          </div>
        )}
         {/* File Input Trigger */}
        <div className="image-upload-container">
          <label htmlFor="school-images-input" className={`image-upload-label ${isSaving ? 'disabled' : ''}`}>
            <FaPlus className="upload-icon" />
            <div className="upload-text"><span className="upload-text-main">{translations.add_school_pictures || "Add Pictures"}</span></div>
          </label>
          <input type="file" id="school-images-input" accept="image/*" multiple onChange={handleImageUpload} className="image-upload-input" disabled={isSaving}/>
        </div>
      </div>

      {/* Save Button */}
      <div className="profile-save-container">
        <button className="profile-save-btn" onClick={handleSaveChanges} disabled={isSaving || loading}>
          <span className="save-text">{isSaving ? (translations.saving || 'Saving...') : (translations.save_changes || "Save Changes")}</span>
        </button>
      </div>

      {/* Contact Help */}
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
import React, { useState } from 'react';
import { FaArrowLeft, FaPlus, FaMapMarkerAlt } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../../LanguageContext';
import './EditProfile.css';

const EditProfile = () => {
  const navigate = useNavigate();
  const { translations } = useLanguage();

  const [schoolInfo, setSchoolInfo] = useState({
    name: 'Sri Sumangala College',
    address: 'Pannipitiya, Battaramulla',
    telephone: '0112345678',
    description: 'Our school was established in 1902. Currently about 2500 students are studying.'
  });

  const [contactInfo, setContactInfo] = useState({
    name: 'Danushka Perera',
    email: 'danushka@example.com',
    telephone: '0771234567'
  });
  
  const [schoolImages, setSchoolImages] = useState([]);
  
  const [location, setLocation] = useState({
    latitude: '',
    longitude: '',
    fetching: false,
    error: null
  });

  const handleBack = () => {
    navigate('/Dashboard');
  };

  const handleSchoolInfoChange = (e) => {
    const { name, value } = e.target;
    setSchoolInfo(prevState => ({
      ...prevState,
      [name]: value
    }));
  };

  const handleContactInfoChange = (e) => {
    const { name, value } = e.target;
    setContactInfo(prevState => ({
      ...prevState,
      [name]: value
    }));
  };

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    setSchoolImages(prevImages => [...prevImages, ...files]);
  };
  
  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      setLocation(prev => ({
        ...prev,
        error: 'Geolocation is not supported by your browser'
      }));
      return;
    }
    
    setLocation(prev => ({ ...prev, fetching: true, error: null }));
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          fetching: false,
          error: null
        });
      },
      (error) => {
        setLocation({
          latitude: '',
          longitude: '',
          fetching: false,
          error: `Error getting location: ${error.message}`
        });
      },
      {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0
      }
    );
  };

  const handleSaveChanges = () => {
    console.log('School Info:', schoolInfo);
    console.log('Contact Info:', contactInfo);
    console.log('Images:', schoolImages);
    console.log('Location:', location);

    alert('Changes saved successfully!');

    navigate('/Dashboard');
  };

  return (
    <div className="profile-container">
      <header className="profile-header">
        <div className="profile-title">
          <h1 className="profile-title-text">{translations.my_profile}</h1>
        </div>
      </header>

      <div className="profile-back-btn-container">
        <button className="profile-back-btn" onClick={handleBack}>
          <FaArrowLeft className="back-icon" />
          <span>{translations.back}</span>
        </button>
      </div>

      <div className="profile-section">
        <h3 className="section-title">{translations.school_information}</h3>

        <div className="profile-form">
          <div className="form-group">
            <label className="form-label">{translations.school_name}</label>
            <input
              type="text"
              name="name"
              value={schoolInfo.name}
              onChange={handleSchoolInfoChange}
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label className="form-label">{translations.school_address}</label>
            <input
              type="text"
              name="address"
              value={schoolInfo.address}
              onChange={handleSchoolInfoChange}
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label className="form-label">{translations.school_location}</label>
            <div className="location-container">
              <div className="location-display">
                {location.latitude && location.longitude ? (
                  <div className="location-coordinates">
                    <span>Latitude: {location.latitude.toFixed(6)}</span>
                    <span>Longitude: {location.longitude.toFixed(6)}</span>
                  </div>
                ) : (
                  <span className="no-location">No location data</span>
                )}
              </div>
              <button 
                type="button" 
                onClick={handleGetLocation} 
                className="get-location-btn"
                disabled={location.fetching}
              >
                <FaMapMarkerAlt className="location-icon" />
                {location.fetching ? 'Getting location...' : translations.get_my_location}
              </button>
            </div>
            {location.error && <div className="location-error">{location.error}</div>}
          </div>

          <div className="form-group">
            <label className="form-label">{translations.school_telephone_number}</label>
            <input
              type="text"
              name="telephone"
              value={schoolInfo.telephone}
              onChange={handleSchoolInfoChange}
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label className="form-label">{translations.description_about_the_school}</label>
            <textarea
              name="description"
              value={schoolInfo.description}
              onChange={handleSchoolInfoChange}
              className="form-textarea"
              rows="4"
            ></textarea>
          </div>
        </div>
      </div>

      <div className="profile-section">
        <h3 className="section-title">{translations.contact_information}</h3>

        <div className="profile-form">
          <div className="form-group">
            <label className="form-label">{translations.name}</label>
            <input
              type="text"
              name="name"
              value={contactInfo.name}
              onChange={handleContactInfoChange}
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label className="form-label">{translations.email_address}</label>
            <input
              type="email"
              name="email"
              value={contactInfo.email}
              onChange={handleContactInfoChange}
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label className="form-label">{translations.telephone_number}</label>
            <input
              type="text"
              name="telephone"
              value={contactInfo.telephone}
              onChange={handleContactInfoChange}
              className="form-input"
            />
          </div>
        </div>
      </div>

      <div className="profile-section">
        <div className="image-upload-container">
          <label htmlFor="school-images" className="image-upload-label">
            <FaPlus className="upload-icon" />
            <div className="upload-text">
              <span className="upload-text-main">{translations.add_school_pictures}</span>
            </div>
          </label>
          <input
            type="file"
            id="school-images"
            accept="image/*"
            multiple
            onChange={handleImageUpload}
            className="image-upload-input"
          />
        </div>

        {schoolImages.length > 0 && (
          <div className="uploaded-images">
            {schoolImages.map((image, index) => (
              <div key={index} className="uploaded-image-item">
                {image.name}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="profile-save-container">
        <button className="profile-save-btn" onClick={handleSaveChanges}>
          <span className="save-text">{translations.save_changes}</span>
        </button>
      </div>

      <div className="profile-contact">
        <p>
          <span className="contact-text">{translations.need_help_contact_us}</span>
          <span className="contact-number">0789200730</span>
        </p>
      </div>
    </div>
  );
};

export default EditProfile;
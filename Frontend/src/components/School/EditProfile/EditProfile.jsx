import React, { useState } from 'react';
import { FaArrowLeft, FaPlus, FaMapMarkerAlt } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import './EditProfile.css';

const EditProfile = () => {
  const navigate = useNavigate();

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
          <h1 className="profile-title-text">My Profile</h1>
        </div>
      </header>

      <div className="profile-back-btn-container">
        <button className="profile-back-btn" onClick={handleBack}>
          <FaArrowLeft className="back-icon" />
          <span>Back</span>
        </button>
      </div>

      <div className="profile-section">
        <h3 className="section-title">School Information</h3>

        <div className="profile-form">
          <div className="form-group">
            <label className="form-label">School Name</label>
            <input
              type="text"
              name="name"
              value={schoolInfo.name}
              onChange={handleSchoolInfoChange}
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label className="form-label">School Address</label>
            <input
              type="text"
              name="address"
              value={schoolInfo.address}
              onChange={handleSchoolInfoChange}
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label className="form-label">School Location</label>
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
                {location.fetching ? 'Getting location...' : 'Get my location'}
              </button>
            </div>
            {location.error && <div className="location-error">{location.error}</div>}
          </div>

          <div className="form-group">
            <label className="form-label">School Telephone Number</label>
            <input
              type="text"
              name="telephone"
              value={schoolInfo.telephone}
              onChange={handleSchoolInfoChange}
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Description about the School</label>
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
        <h3 className="section-title">Contact Information</h3>

        <div className="profile-form">
          <div className="form-group">
            <label className="form-label">Name</label>
            <input
              type="text"
              name="name"
              value={contactInfo.name}
              onChange={handleContactInfoChange}
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input
              type="email"
              name="email"
              value={contactInfo.email}
              onChange={handleContactInfoChange}
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Telephone Number</label>
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
              <span className="upload-text-main">Add School Pictures</span>
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
          <span className="save-text">Save Changes</span>
        </button>
      </div>

      <div className="profile-contact">
        <p>
          <span className="contact-text">Need help? Contact us: </span>
          <span className="contact-number">0789200730</span>
        </p>
      </div>
    </div>
  );
};

export default EditProfile;
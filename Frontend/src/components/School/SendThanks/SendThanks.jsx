import React, { useState, useRef } from 'react';
import { FaArrowLeft, FaPlus, FaCheck, FaTimes } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../../LanguageContext';
import './SendThanks.css';

const SendThanks = () => {
  const navigate = useNavigate();
  const { translations } = useLanguage();
  
  const [selectedDonor, setSelectedDonor] = useState(0);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [customMessage, setCustomMessage] = useState('');
  const [isCustomMessage, setIsCustomMessage] = useState(false);
  const [uploadedImages, setUploadedImages] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [availableDonors, setAvailableDonors] = useState([
    {
      id: 1,
      name: 'Kisara Sandes',
      donated: '40 Notebooks, 50 Pencils',
      date: 'March 10, 2025'
    },
    {
      id: 2,
      name: 'Kisara Sandes',
      donated: '40 Notebooks, 50 Pencils',
      date: 'March 10, 2025'
    },
    {
      id: 3,
      name: 'Kisara Sandes',
      donated: '40 Notebooks, 50 Pencils',
      date: 'March 10, 2025'
    }
  ]);
  const fileInputRef = useRef(null);

  const thankYouMessages = [
    {
      id: 1,
      message: translations.thank_you_message_1
    },
    {
      id: 2,
      message: translations.thank_you_message_2
    },
    {
      id: 3,
      message: translations.thank_you_message_3
    },
    {
      id: 4,
      message: translations.thank_you_message_4
    }
  ];

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    if (files.length) {
      const newImages = [...uploadedImages, ...files];
      setUploadedImages(newImages);
      
      const newPreviews = [...imagePreviews];
      files.forEach(file => {
        const reader = new FileReader();
        reader.onloadend = () => {
          newPreviews.push(reader.result);
          setImagePreviews([...newPreviews]);
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files);
    if (files.length) {
      const newImages = [...uploadedImages, ...files];
      setUploadedImages(newImages);
      
      const newPreviews = [...imagePreviews];
      files.forEach(file => {
        const reader = new FileReader();
        reader.onloadend = () => {
          newPreviews.push(reader.result);
          setImagePreviews([...newPreviews]);
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const removeImage = (index) => {
    const newImages = [...uploadedImages];
    const newPreviews = [...imagePreviews];
    newImages.splice(index, 1);
    newPreviews.splice(index, 1);
    setUploadedImages(newImages);
    setImagePreviews(newPreviews);
  };

  const handleMessageSelection = (index) => {
    setSelectedMessage(index);
    setIsCustomMessage(false);
  };

  const toggleCustomMessage = () => {
    setIsCustomMessage(!isCustomMessage);
    setSelectedMessage(null);
  };

  const resetForm = () => {
    setCustomMessage('');
    setSelectedMessage(null);
    setIsCustomMessage(false);
    setUploadedImages([]);
    setImagePreviews([]);
    
    if (availableDonors.length > 0) {
      setSelectedDonor(0);
    }
  };

  const handleSendThanks = () => {
    const currentDonor = availableDonors[selectedDonor];
  
    const thankYouData = {
      donorId: currentDonor.id,
      message: isCustomMessage 
        ? customMessage 
        : selectedMessage !== null 
          ? thankYouMessages[selectedMessage].message 
          : null,
      images: uploadedImages
    };
    
    console.log('Sending thank you data:', thankYouData);
  
    const updatedDonors = [...availableDonors];
    updatedDonors.splice(selectedDonor, 1);
    setAvailableDonors(updatedDonors);
    resetForm();
    alert(translations.thank_you_sent_successfully);
  };

  const handleBack = () => {
    navigate('/Dashboard');
  };

  return (
    <div className="send-thanks-container">
      <header className="send-thanks-header">
        <div className="send-thanks-title">
          <h1>{translations.send_thanks}</h1>
        </div>
      </header>

      <div className="send-thanks-content">
        <button className="back-button" onClick={handleBack}>
          <FaArrowLeft className="back-icon" />
          <span>{translations.back}</span>
        </button>

        <div className="instruction-box">
          <p>{translations.send_thanks_instruction}</p>
        </div>

        {availableDonors.length > 0 ? (
          <div className="thankyou-form-container">
            <h3 className="form-heading">
              {translations.send_thanks_to_donors}
            </h3>

            <div className="donor-selection-section">
              <p className="selection-heading">{translations.select_donor_to_thank}</p>

              <div className="donors-list">
                {availableDonors.map((donor, index) => (
                  <div 
                    key={donor.id} 
                    className={`donor-item ${selectedDonor === index ? 'selected' : ''}`}
                    onClick={() => setSelectedDonor(index)}
                  >
                    <div className="donor-info">
                      <h4 className="donor-name">{donor.name}</h4>
                      <p className="donor-donated">{translations.donated}: {donor.donated}</p>
                      <p className="donor-date">{translations.date}: {donor.date}</p>
                    </div>
                    <div className={`select-circle ${selectedDonor === index ? 'selected' : ''}`}>
                      {selectedDonor === index && <FaCheck className="check-icon" />}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="message-selection-section">
              <p className="message-heading">{translations.say_thank_you}</p>

              <div className="message-options">
                {thankYouMessages.map((message, index) => (
                  <div 
                    key={index} 
                    className={`message-option ${selectedMessage === index ? 'selected' : ''}`}
                    onClick={() => handleMessageSelection(index)}
                  >
                    <div className="message-content">
                      <p className="message-text">{message.message}</p>
                    </div>
                    <div className={`select-circle ${selectedMessage === index ? 'selected' : ''}`}>
                      {selectedMessage === index && <FaCheck className="check-icon" />}
                    </div>
                  </div>
                ))}
                
                <div 
                  className={`message-option custom-message-option ${isCustomMessage ? 'selected' : ''}`}
                  onClick={toggleCustomMessage}
                >
                  <div className="message-content">
                    <p className="message-text">{translations.want_to_say_something_else}</p>
                  </div>
                  <div className={`select-circle ${isCustomMessage ? 'selected' : ''}`}>
                    {isCustomMessage && <FaCheck className="check-icon" />}
                  </div>
                </div>
              </div>

              {isCustomMessage && (
                <div className="custom-message-container">
                  <div className="custom-message-inputs">
                    <div className="input-group">
                      <label className="input-label">{translations.your_message}:</label>
                      <textarea 
                        className="custom-message-textarea"
                        value={customMessage}
                        onChange={(e) => setCustomMessage(e.target.value)}
                        placeholder={translations.type_your_message_here}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="photo-upload-section">
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                ref={fileInputRef}
                style={{ display: 'none' }}
                multiple
              />
              
              <div 
                className="photo-upload-button"
                onClick={() => fileInputRef.current.click()}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
              >
                <FaPlus className="plus-icon" />
                <div className="button-text">
                  {translations.add_photos_optional}
                </div>
              </div>

              {imagePreviews.length > 0 && (
                <div className="images-preview-grid">
                  {imagePreviews.map((preview, index) => (
                    <div key={index} className="image-preview-container">
                      <div className="image-preview-header">
                        <span className="preview-text">{translations.photo} {index + 1}</span>
                        <button className="remove-image-button" onClick={() => removeImage(index)}>
                          <FaTimes />
                        </button>
                      </div>
                      <img src={preview} alt={`Preview ${index + 1}`} className="image-preview" />
                    </div>
                  ))}
                </div>
              )}
            </div>

            <button 
              className="send-thanks-button"
              onClick={handleSendThanks}
              disabled={!((selectedMessage !== null || (isCustomMessage && customMessage)))}
            >
              {translations.send_thank_you}
            </button>
          </div>
        ) : (
          <div className="no-donors-message">
            <h3>{translations.all_donors_thanked}</h3>
            <p>{translations.no_more_donors}</p>
            <button onClick={() => navigate('/dashboard')} className="return-dashboard-button">
              {translations.return_to_dashboard}
            </button>
          </div>
        )}

        <div className="support-contact">
          <p>
            <span>{translations.need_help_contact_us}</span>
            <span className="contact-number">0789200730</span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default SendThanks;
import React, { useState, useRef } from 'react';
import { FaArrowLeft, FaPlus, FaCheck, FaTimes } from 'react-icons/fa';
import './SendThanks.css';

const SendThanks = () => {
  const [selectedDonor, setSelectedDonor] = useState(0);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [customMessage, setCustomMessage] = useState({ sinhala: '', english: '' });
  const [isCustomMessage, setIsCustomMessage] = useState(false);
  const [uploadedImage, setUploadedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const fileInputRef = useRef(null);

  const donors = [
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
  ];

  const thankYouMessages = [
    {
      id: 1,
      sinhala: 'පොතත් පෑන් සහ පැන්සල් දුන්න ස්තුතියි අපෙ ශිෂ්‍ය වට ගොඩක් භාවිතා කරනු ඇත.',
      english: 'Thank you for the notebooks and pencils! Our students will use them well.'
    },
    {
      id: 2,
      sinhala: 'මෙම පාසල් ද්‍රව්‍ය අපගේ පන්ති කාමරවල ඇති වෙනසක් කරනු ඇත. ඔබගේ කාරුණාව ස්තුතියි!',
      english: 'These school supplies will make a real difference in our classrooms. Thank you for your kindness!'
    },
    {
      id: 3,
      sinhala: 'ඔබගේ තෝරාගත් පරිත්‍යාගය ගැන ඔබට වෙතින්. අපගේ පාසැල සහයෝගය දැක්වීම ගැන ස්තුතියි!',
      english: 'We are grateful for your generous donation. Thank you for supporting our school!'
    },
    {
      id: 4,
      sinhala: 'ඔබගේ සහයෝගයට බොහොම ස්තුතියි! මෙම සැපයුම් අපට ලොකු උදව්වක් වන ඇත.',
      english: 'Thank you very much for your support! These supplies will be a great help to us.'
    }
  ];

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setUploadedImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) {
      setUploadedImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setUploadedImage(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleMessageSelection = (index) => {
    setSelectedMessage(index);
    setIsCustomMessage(false);
  };

  const toggleCustomMessage = () => {
    setIsCustomMessage(!isCustomMessage);
    setSelectedMessage(null);
  };

  const handleSendThanks = () => {
    // Prepare data for submission
    const thankYouData = {
      donorId: donors[selectedDonor].id,
      message: isCustomMessage 
        ? customMessage 
        : selectedMessage !== null 
          ? thankYouMessages[selectedMessage] 
          : null,
      image: uploadedImage
    };
    
    // Here you would typically send this data to your backend
    console.log('Sending thank you data:', thankYouData);
    
    // Reset form or redirect as needed
    alert('Thank you message sent successfully!');
    // Additional logic for success handling or redirection
  };

  return (
    <div className="send-thanks-container">
      <header className="send-thanks-header">
        <div className="send-thanks-title">
          <h1 className="send-thanks-title-sinhala">ස්තුතිය ප්‍රකාශන්න</h1>
          <h2 className="send-thanks-title-english">Send Thanks</h2>
        </div>
      </header>

      <div className="send-thanks-content">
        <a href="/dashboard" className="back-button">
          <FaArrowLeft className="back-icon" />
          <span>ආපසු</span>
        </a>

        <div className="instruction-box">
          <p className="instruction-sinhala">
            ඔබේ පාසලට සැපයුම් යැවූ පරිත්‍යාගශීලියෙකු තෝරන්න. ඔවුන්ට ස්තුති පණිවුඩයක් සහ 
            ඡායාරූප යවන්න. ඔබගේ ස්තුතිය පරිත්‍යාගශීලීන් අගය කරන අතර තවත් සහයෝගීත්වය 
            දිරිගන්වයි
          </p>
          <p className="instruction-english">
            Choose a donor who sent supplies to your school. Send them a thank you message and a photo. Your
            thanks helps donors feel appreciated and encourages more support.
          </p>
        </div>

        <div className="thankyou-form-container">
          <h3 className="form-heading">
            <span className="heading-sinhala">පරිත්‍යාගශීලීන්ට ස්තුතිය යවන්න | </span>
            <span className="heading-english">Send Thanks to Donors</span>
          </h3>

          <div className="donor-selection-section">
            <p className="selection-heading-sinhala">ස්තුති කිරීමට අදහස පරිත්‍යාගශීලියෙකු තෝරන්න</p>
            <p className="selection-heading-english">Select Donor to Thank:</p>

            <div className="donors-list">
              {donors.map((donor, index) => (
                <div 
                  key={donor.id} 
                  className={`donor-item ${selectedDonor === index ? 'selected' : ''}`}
                  onClick={() => setSelectedDonor(index)}
                >
                  <div className="donor-info">
                    <h4 className="donor-name">{donor.name}</h4>
                    <p className="donor-donated">Donated: {donor.donated}</p>
                    <p className="donor-date">Date: {donor.date}</p>
                  </div>
                  <div className={`select-circle ${selectedDonor === index ? 'selected' : ''}`}>
                    {selectedDonor === index && <FaCheck className="check-icon" />}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="message-selection-section">
            <p className="message-heading-sinhala">ස්තුතිය ප්‍රකාශ කරන්න</p>
            <p className="message-heading-english">Say Thank You:</p>

            <div className="message-options">
              {thankYouMessages.map((message, index) => (
                <div 
                  key={index} 
                  className={`message-option ${selectedMessage === index ? 'selected' : ''}`}
                  onClick={() => handleMessageSelection(index)}
                >
                  <div className="message-content">
                    <p className="message-text-sinhala">{message.sinhala}</p>
                    <p className="message-text-english">{message.english}</p>
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
                  <p className="message-text-sinhala">තවත් මොකක්ද කියන්න කැමතිද?</p>
                  <p className="message-text-english">Want to say something else?</p>
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
                    <label className="input-label">සිංහලෙන්:</label>
                    <textarea 
                      className="custom-message-textarea"
                      value={customMessage.sinhala}
                      onChange={(e) => setCustomMessage({...customMessage, sinhala: e.target.value})}
                      placeholder="ඔබගේ සිංහල පණිවිඩය මෙහි ලියන්න..."
                    />
                  </div>
                  <div className="input-group">
                    <label className="input-label">In English:</label>
                    <textarea 
                      className="custom-message-textarea"
                      value={customMessage.english}
                      onChange={(e) => setCustomMessage({...customMessage, english: e.target.value})}
                      placeholder="Type your English message here..."
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
            />
            
            {!imagePreview ? (
              <div 
                className="photo-upload-button"
                onClick={() => fileInputRef.current.click()}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
              >
                <FaPlus className="plus-icon" />
                <div className="button-text">
                  <span className="button-text-sinhala">ඡායාරූපයක් එකතු කරන්න (විකල්ප)</span>
                  <span className="button-text-english">Add Photo (Optional)</span>
                </div>
              </div>
            ) : (
              <div className="image-preview-container">
                <div className="image-preview-header">
                  <span className="preview-text">Photo Preview</span>
                  <button className="remove-image-button" onClick={removeImage}>
                    <FaTimes />
                  </button>
                </div>
                <img src={imagePreview} alt="Preview" className="image-preview" />
              </div>
            )}
          </div>

          <button 
            className="send-thanks-button"
            onClick={handleSendThanks}
            disabled={!((selectedMessage !== null || (isCustomMessage && (customMessage.sinhala || customMessage.english))))}
          >
            <span className="button-text-sinhala">ස්තුතිය යවන්න</span>
            <span className="button-text-english">Send Thank You</span>
          </button>
        </div>

        <div className="support-contact">
          <p>
            <span className="contact-sinhala">උදව් අවශ්‍යද? අපිට කථා කරන්න : </span>
            <span className="contact-number">0789200730</span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default SendThanks;
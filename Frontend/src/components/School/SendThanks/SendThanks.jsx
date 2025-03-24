import React, { useState, useRef } from 'react';
import { FaArrowLeft, FaPlus, FaCheck, FaTimes } from 'react-icons/fa';
import './SendThanks.css';

const SendThanks = () => {
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
      message: 'Thank you for the notebooks and pencils! Our students will use them well. / පොතත් පෑන් සහ පැන්සල් දුන්න ස්තුතියි අපෙ ශිෂ්‍ය වට ගොඩක් භාවිතා කරනු ඇත.'
    },
    {
      id: 2,
      message: 'These school supplies will make a real difference in our classrooms. Thank you for your kindness! / මෙම පාසල් ද්‍රව්‍ය අපගේ පන්ති කාමරවල ඇති වෙනසක් කරනු ඇත. ඔබගේ කාරුණාව ස්තුතියි!'
    },
    {
      id: 3,
      message: 'We are grateful for your generous donation. Thank you for supporting our school! / ඔබගේ තෝරාගත් පරිත්‍යාගය ගැන ඔබට වෙතින්. අපගේ පාසැල සහයෝගය දැක්වීම ගැන ස්තුතියි!'
    },
    {
      id: 4,
      message: 'Thank you very much for your support! These supplies will be a great help to us. / ඔබගේ සහයෝගයට බොහොම ස්තුතියි! මෙම සැපයුම් අපට ලොකු උදව්වක් වන ඇත.'
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
    alert('Thank you message sent successfully!');
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
            Choose a donor who sent supplies to your school. Send them a thank you message and photos. Your
            thanks helps donors feel appreciated and encourages more support.
          </p>
        </div>

        {availableDonors.length > 0 ? (
          <div className="thankyou-form-container">
            <h3 className="form-heading">
              <span className="heading-sinhala">පරිත්‍යාගශීලීන්ට ස්තුතිය යවන්න | </span>
              <span className="heading-english">Send Thanks to Donors</span>
            </h3>

            <div className="donor-selection-section">
              <p className="selection-heading-sinhala">ස්තුති කිරීමට අදහස පරිත්‍යාගශීලියෙකු තෝරන්න</p>
              <p className="selection-heading-english">Select Donor to Thank:</p>

              <div className="donors-list">
                {availableDonors.map((donor, index) => (
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
                    <p className="message-text">Want to say something else? / තවත් මොකක්ද කියන්න කැමතිද?</p>
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
                      <label className="input-label">Your message / ඔබගේ පණිවිඩය:</label>
                      <textarea 
                        className="custom-message-textarea"
                        value={customMessage}
                        onChange={(e) => setCustomMessage(e.target.value)}
                        placeholder="Type your message here... / ඔබගේ පණිවිඩය මෙහි ලියන්න..."
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
                  <span className="add-button-text-sinhala">ඡායාරූප එකතු කරන්න (විකල්ප)</span>
                  <span className="add-button-text-english">Add Photos (Optional)</span>
                </div>
              </div>

              {imagePreviews.length > 0 && (
                <div className="images-preview-grid">
                  {imagePreviews.map((preview, index) => (
                    <div key={index} className="image-preview-container">
                      <div className="image-preview-header">
                        <span className="preview-text">Photo {index + 1}</span>
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
              <span className="button-text-sinhala">ස්තුතිය යවන්න</span>
              <span className="button-text-english">Send Thank You</span>
            </button>
          </div>
        ) : (
          <div className="no-donors-message">
            <h3>All donors have been thanked!</h3>
            <p>There are no more donors to thank at this time.</p>
            <a href="/dashboard" className="return-dashboard-button">
              Return to Dashboard
            </a>
          </div>
        )}

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
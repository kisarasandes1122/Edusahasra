import React, { useState, useRef, useEffect, useCallback } from 'react';
import { FaArrowLeft, FaPlus, FaCheck, FaTimes, FaSpinner } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../../LanguageSelector/LanguageContext';
import api from '../../../api';
import './SendThanks.css';

const SendThanks = () => {
  const navigate = useNavigate();
  const { translations } = useLanguage();

  const [eligibleDonors, setEligibleDonors] = useState([]);
  const [selectedDonorIndex, setSelectedDonorIndex] = useState(null);
  const [selectedMessageIndex, setSelectedMessageIndex] = useState(null);
  const [customMessage, setCustomMessage] = useState('');
  const [isCustomMessage, setIsCustomMessage] = useState(false);
  const [uploadedImageFiles, setUploadedImageFiles] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const fileInputRef = useRef(null);

  const thankYouMessages = React.useMemo(() => [
    { id: 1, message: translations.thank_you_message_1 },
    { id: 2, message: translations.thank_you_message_2 },
    { id: 3, message: translations.thank_you_message_3 },
    { id: 4, message: translations.thank_you_message_4 },
  ], [translations]);

  const fetchEligibleDonors = useCallback(async () => {
    setLoading(true);
    setError(null);
    setEligibleDonors([]);
    setSelectedDonorIndex(null);
    console.log("Fetching eligible donations for thanks...");

    try {
      const response = await api.get('/api/thankyous/eligible-donations');
      console.log("Eligible donations response:", response.data);
      setEligibleDonors(response.data || []);
      if (response.data && response.data.length > 0) {
      }
    } catch (err) {
      console.error("Error fetching eligible donations:", err);
      setError(translations.error_fetching_eligible_donors || 'Failed to load donors eligible for thanks.');
      if (err.response) {
          console.error("Error response:", err.response.data);
      }
    } finally {
      setLoading(false);
      console.log("Fetching eligible donations complete.");
    }
  }, [translations.error_fetching_eligible_donors]);

  useEffect(() => {
    fetchEligibleDonors();
  }, [fetchEligibleDonors]);

  const handleImageUpload = (event) => {
    const files = Array.from(event.target.files);
    processFiles(files);
     if (fileInputRef.current) {
        fileInputRef.current.value = "";
     }
  };

  const handleDragOver = (event) => {
    event.preventDefault();
  };

  const handleDrop = (event) => {
    event.preventDefault();
    const files = Array.from(event.dataTransfer.files);
    processFiles(files);
  };

  const processFiles = (files) => {
    if (!files || files.length === 0) return;

    const currentCount = uploadedImageFiles.length;
    const allowedNewCount = 5 - currentCount;
    const filesToAdd = files.slice(0, allowedNewCount);

    if (files.length > allowedNewCount) {
        alert(translations.max_files_limit || `You can upload a maximum of 5 images. ${files.length - allowedNewCount} files were ignored.`);
    }


    const newImageFiles = [...uploadedImageFiles, ...filesToAdd];
    const newImagePreviews = [...imagePreviews];

    filesToAdd.forEach(file => {
      if (!file.type.startsWith('image/')) {
         alert(`${file.name} is not a valid image file.`);
         return;
      }
      if (file.size > 5 * 1024 * 1024) {
         alert(`${file.name} exceeds the 5MB size limit.`);
         return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        newImagePreviews.push(reader.result);
        setImagePreviews([...newImagePreviews]);
      };
      reader.onerror = () => {
         console.error("Error reading file:", file.name);
      };
      reader.readAsDataURL(file);
    });

    setUploadedImageFiles(newImageFiles);
  };


  const removeImage = (indexToRemove) => {
    setUploadedImageFiles(prevFiles => prevFiles.filter((_, index) => index !== indexToRemove));
    setImagePreviews(prevPreviews => prevPreviews.filter((_, index) => index !== indexToRemove));
  };

  const handleDonorSelection = (index) => {
    setSelectedDonorIndex(index);
  };

  const handleMessageSelection = (index) => {
    setSelectedMessageIndex(index);
    setIsCustomMessage(false);
    setCustomMessage('');
  };

  const toggleCustomMessage = () => {
    setIsCustomMessage(true);
    setSelectedMessageIndex(null);
  };

  const resetForm = () => {
    setSelectedMessageIndex(null);
    setCustomMessage('');
    setIsCustomMessage(false);
    setUploadedImageFiles([]);
    setImagePreviews([]);
    setSubmitting(false);
    setSubmitSuccess(false);
    setError(null);
  };

  const handleSendThanks = async () => {
    if (selectedDonorIndex === null) {
      alert(translations.please_select_donor || 'Please select a donor to thank.');
      return;
    }
    if (selectedMessageIndex === null && !isCustomMessage) {
      alert(translations.please_select_message || 'Please select or write a thank you message.');
      return;
    }
    if (isCustomMessage && !customMessage.trim()) {
        alert(translations.please_enter_custom_message || 'Please enter your custom message.');
        return;
    }


    setSubmitting(true);
    setError(null);
    setSubmitSuccess(false);

    const selectedDonationData = eligibleDonors[selectedDonorIndex];
    const messageToSend = isCustomMessage
      ? customMessage.trim()
      : thankYouMessages[selectedMessageIndex].message;

    const formData = new FormData();
    formData.append('donationId', selectedDonationData.donationId);
    formData.append('message', messageToSend);

    uploadedImageFiles.forEach(file => {
      formData.append('images', file);
    });

    console.log('Sending thank you data (FormData):');
    for (let [key, value] of formData.entries()) {
        console.log(`${key}:`, value);
    }


    try {
      const response = await api.post('/api/thankyous', formData);

      console.log('Thank you sent successfully:', response.data);
      setSubmitSuccess(true);
      alert(translations.thank_you_sent_successfully || 'Thank you message sent successfully!');

      resetForm();
      fetchEligibleDonors();

    } catch (err) {
      console.error('Error sending thank you:', err);
      let errorMsg = translations.error_sending_thank_you || 'Failed to send thank you message.';
      if (err.response && err.response.data && err.response.data.message) {
          errorMsg = `${errorMsg} ${err.response.data.message}`;
      }
      setError(errorMsg);
      alert(errorMsg);
      setSubmitting(false);
    }
  };


  const handleBack = () => {
    navigate('/Dashboard');
  };

   const formatDate = (dateString) => {
     if (!dateString) return 'N/A';
     try {
       const options = { year: 'numeric', month: 'long', day: 'numeric' };
       return new Date(dateString).toLocaleDateString(undefined, options);
     } catch (e) {
       return dateString;
     }
   };


  return (
    <div className="send-thanks-container">
      <header className="send-thanks-header">
        <div className="send-thanks-title">
          <h1>{translations.send_thanks || 'Send Thanks'}</h1>
        </div>
      </header>

      <div className="send-thanks-content">
        <button className="back-button" onClick={handleBack}>
          <FaArrowLeft className="back-icon" />
          <span>{translations.back || 'Back'}</span>
        </button>

        <div className="instruction-box">
          <p>{translations.send_thanks_instruction || 'Select a donor, choose a message, add photos, and send your thanks!'}</p>
        </div>

        {loading && (
            <div className="loading-message">
                <FaSpinner className="fa-spin" /> {translations.loading_eligible_donors || 'Loading eligible donors...'}
            </div>
        )}

        {!loading && error && (
            <div className="error-message">{error}</div>
        )}

        {!loading && !error && (
            <>
                {eligibleDonors.length > 0 ? (
                  <div className="thankyou-form-container">
                    <div className="donor-selection-section">
                      <h3 className="selection-heading-english">{translations.sendthanks_select_donor_to_thank || '1. Select Donor to Thank'}</h3>
                      <div className="donors-list">
                        {eligibleDonors.map((donorData, index) => (
                          <div
                            key={donorData.donationId}
                            className={`donor-item ${selectedDonorIndex === index ? 'selected' : ''}`}
                            onClick={() => handleDonorSelection(index)}
                            role="radio"
                            aria-checked={selectedDonorIndex === index}
                            tabIndex={0}
                            onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && handleDonorSelection(index)}
                          >
                            <div className="donor-info">
                              <h4 className="donor-name">{donorData.donorName}</h4>
                              <p className="donor-donated">{translations.donated || 'Donated'}: {donorData.donatedItemsSummary}</p>
                              <p className="donor-date">{translations.date || 'Date'}: {formatDate(donorData.confirmationDate)}</p>
                            </div>
                            <div className={`select-circle ${selectedDonorIndex === index ? 'selected' : ''}`}>
                              {selectedDonorIndex === index && <FaCheck className="check-icon" />}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="message-selection-section">
                       <h3 className="message-heading-english">{translations.sendthanks_say_thank_you || '2. Choose or Write Message'}</h3>
                      <div className="message-options">
                        {thankYouMessages.map((msg, index) => (
                          <div
                            key={msg.id}
                            className={`message-option ${selectedMessageIndex === index ? 'selected' : ''}`}
                            onClick={() => handleMessageSelection(index)}
                             role="radio"
                             aria-checked={selectedMessageIndex === index}
                             tabIndex={0}
                             onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && handleMessageSelection(index)}
                          >
                            <p className="message-text">{msg.message}</p>
                            <div className={`select-circle ${selectedMessageIndex === index ? 'selected' : ''}`}>
                              {selectedMessageIndex === index && <FaCheck className="check-icon" />}
                            </div>
                          </div>
                        ))}
                        <div
                          className={`message-option custom-message-toggle ${isCustomMessage ? 'selected' : ''}`}
                          onClick={toggleCustomMessage}
                           role="radio"
                           aria-checked={isCustomMessage}
                           tabIndex={0}
                           onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && toggleCustomMessage()}
                        >
                          <p className="message-text">{translations.want_to_say_something_else || 'Want to say something else?'}</p>
                          <div className={`select-circle ${isCustomMessage ? 'selected' : ''}`}>
                            {isCustomMessage && <FaCheck className="check-icon" />}
                          </div>
                        </div>
                      </div>

                      {isCustomMessage && (
                        <div className="custom-message-container">
                          <label htmlFor="customMessage" className="input-label">{translations.sendthanks_your_message || 'Your Message'}:</label>
                          <textarea
                            id="customMessage"
                            className="custom-message-textarea"
                            value={customMessage}
                            onChange={(e) => setCustomMessage(e.target.value)}
                            placeholder={translations.type_your_message_here || 'Type your message here...'}
                            rows={4}
                            maxLength={1000}
                          />
                        </div>
                      )}
                    </div>

                    <div className="photo-upload-section">
                      <h3 className="selection-heading-english">{translations.sendthanks_add_photos_optional || '3. Add Photos (Optional)'}</h3>
                      <input
                        type="file"
                        accept="image/jpeg, image/png, image/gif"
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
                        role="button"
                        tabIndex={0}
                        aria-label={translations.upload_photos_area || 'Upload photos area, click or drag and drop'}
                         onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && fileInputRef.current.click()}
                      >
                        <FaPlus className="plus-icon" />
                        <span className="button-text">{translations.add_photos_optional || 'Add Photos (Optional)'}</span>
                         <span style={{fontSize: '12px', color: '#718096', marginLeft: '10px'}}> (Max 5 images, 5MB each)</span>
                      </div>

                      {imagePreviews.length > 0 && (
                        <div className="images-preview-grid">
                          {imagePreviews.map((preview, index) => (
                            <div key={index} className="image-preview-container">
                              <div className="image-preview-header">
                                <span className="preview-text">{translations.photo || 'Photo'} {index + 1}</span>
                                <button
                                   className="remove-image-button"
                                   onClick={() => removeImage(index)}
                                   aria-label={`${translations.remove_image || 'Remove image'} ${index + 1}`}
                                >
                                  <FaTimes />
                                </button>
                              </div>
                              <img src={preview} alt={`${translations.preview || 'Preview'} ${index + 1}`} className="image-preview" />
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <button
                      className="send-thanks-button"
                      onClick={handleSendThanks}
                      disabled={submitting || selectedDonorIndex === null || (selectedMessageIndex === null && !isCustomMessage) || (isCustomMessage && !customMessage.trim())}
                    >
                      {submitting ? (
                         <FaSpinner className="fa-spin" />
                      ) : (
                         translations.send_thank_you || 'Send Thank You'
                      )}
                    </button>

                    {error && submitting === false && (
                         <div className="error-message" style={{marginTop: '15px', textAlign: 'center'}}>{error}</div>
                    )}

                  </div>
                ) : (
                  <div className="no-donors-message" style={{ textAlign: 'center', padding: '30px', backgroundColor: '#f1f8f4', borderRadius: '8px' }}>
                    <h3>{translations.all_donors_thanked || 'All donors have been thanked!'}</h3>
                    <p>{translations.no_more_donors || 'There are no more donors to thank at this time.'}</p>
                    <button onClick={handleBack} className="back-button" style={{marginTop: '15px', display: 'inline-flex'}}>
                       {translations.return_to_dashboard || 'Return to Dashboard'}
                    </button>
                  </div>
                )}
            </>
        )}

        <div className="support-contact">
          <p>
            <span>{translations.need_help_contact_us || 'Need help? Contact us:'} </span>
            <span className="contact-number">0789200730</span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default SendThanks;
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaSpinner } from 'react-icons/fa';
import { useLanguage } from '../../LanguageSelector/LanguageContext';
import api from '../../../api';
import LoadingSpinner from '../../Common/LoadingSpinner/LoadingSpinner';
import './WriteImpactStoriesPage.css';

const WriteImpactStoriesPage = () => {
  const { translations } = useLanguage();
  const navigate = useNavigate();

  const [eligibleDonations, setEligibleDonations] = useState([]);
  const [selectedDonationId, setSelectedDonationId] = useState('');
  const [title, setTitle] = useState('');
  const [storyText, setStoryText] = useState('');
  const [quote, setQuote] = useState('');
  const [quoteAuthor, setQuoteAuthor] = useState('');
  const [images, setImages] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);

  const [loadingDonations, setLoadingDonations] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const fetchEligibleDonations = async () => {
    setLoadingDonations(true);
    try {
      const response = await api.get('/api/impact-stories/eligible-donations');
      console.log("Eligible Donations Response:", response.data); 
      setEligibleDonations(response.data);
      if (response.data.length > 0) {
        setSelectedDonationId(response.data[0].donationId); 
      } else {
        setSelectedDonationId(''); 
      }
    } catch (err) {
      console.error('Error fetching eligible donations:', err);
      setError(err.response?.data?.message || translations.error_fetching_eligible_donations || 'Failed to load eligible donations.');
      if (err.response) {
        console.error("Error response details:", err.response.data);
        console.error("Error status:", err.response.status);
      }
    } finally {
      setLoadingDonations(false);
    }
  };

  useEffect(() => {
    fetchEligibleDonations();
  }, []);  

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);

    imagePreviews.forEach(url => URL.revokeObjectURL(url)); 

    const totalImages = files.length; 

    if (totalImages > 10) { 
      alert(translations.image_limit_exceeded || 'You can only upload a maximum of 10 images.');
      e.target.value = null; 
      setImages([]); 
      setImagePreviews([]); 
      return;
    }

    setImages(files);

    const previews = files.map(file => URL.createObjectURL(file));
    setImagePreviews(previews);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccess(null);

    if (!selectedDonationId) {
      setError(translations.select_donation_required || 'Please select a donation.');
      setSubmitting(false);
      return;
    }
    if (!title.trim()) {
      setError(translations.title_required || 'Title is required.');
      setSubmitting(false);
      return;
    }
    if (!storyText.trim()) {
      setError(translations.story_text_required || 'Story text is required.');
      setSubmitting(false);
      return;
    }
    if (images.length === 0) {
      setError(translations.images_required || 'Please upload at least one image showing the impact.');
      setSubmitting(false);
      return;
    }

    const formData = new FormData();
    formData.append('donationId', selectedDonationId);
    formData.append('title', title.trim());
    formData.append('storyText', storyText.trim());
    if (quote.trim()) formData.append('quote', quote.trim());
    if (quoteAuthor.trim()) formData.append('quoteAuthor', quoteAuthor.trim());

    images.forEach(image => {
      formData.append('images', image); 
    });

    try {
      const response = await api.post('/api/impact-stories', formData, {
        headers: {
        },
      });

      setSuccess(response.data.message || translations.story_submit_success || 'Impact story submitted successfully!');
      setSelectedDonationId(eligibleDonations.length > 0 ? eligibleDonations[0].donationId : ''); 
      setTitle('');
      setStoryText('');
      setQuote('');
      setQuoteAuthor('');
      setImages([]);
      setImagePreviews([]);
      
      fetchEligibleDonations(); 

    } catch (err) {
      console.error('Error submitting impact story:', err);
      setError(err.response?.data?.message || translations.story_submit_failed || 'Failed to submit impact story.');
      if (err.response) {
        console.error("Error response details:", err.response.data);
        console.error("Error status:", err.response.status);
      }
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    return () => {
      imagePreviews.forEach(url => URL.revokeObjectURL(url));
    };
  }, [imagePreviews]); 

  const handleBack = () => {
    navigate('/Dashboard'); 
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return 'Invalid Date';
      }
      return date.toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (error) {
      console.error("Error formatting date:", dateString, error);
      return 'Invalid Date';
    }
  };

  return (
    <>
      <div className="view-donations-back-btn-container">
        <button className="view-donations-back-btn" onClick={handleBack}>
          <FaArrowLeft className="view-donations-back-icon" />
          <span>{translations.back || 'Back'}</span>
        </button>
      </div>

      <div className="write-impact-story-container">
        <h1 className="page-title">{translations.write_impact_story || 'Write Your Impact Story'}</h1>
        <p className="page-subtitle">
          {translations.share_your_story_text || 'Share how a donation has positively impacted your school and students. Select a confirmed donation below.'}
        </p>

        {error && <div className="alert error">{error}</div>}
        {success && <div className="alert success">{success}</div>}

        {loadingDonations ? (
          <LoadingSpinner />
        ) : eligibleDonations.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📚</div>
            <h3>{translations.no_eligible_donations || 'No eligible donations found'}</h3>
            <p>{translations.no_eligible_donations_text || 'You can write an impact story after a donation has been confirmed as received and no story has been written for it yet.'}</p>
            <button onClick={() => navigate('/view-donations')} className="btn primary">{translations.view_donations || 'View Donations'}</button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="impact-story-form">
            <div className="form-group">
              <label htmlFor="donation">{translations.select_donation || 'Select Donation'}</label>
              <select
                id="donation"
                value={selectedDonationId}
                onChange={(e) => setSelectedDonationId(e.target.value)}
                disabled={submitting || loadingDonations}
                required
              >
                {eligibleDonations.map(donation => (
                  <option key={donation.donationId} value={donation.donationId}>
                    {`${formatDate(donation.confirmationDate)} - ${donation.donatedItemsSummary}`}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="title">{translations.story_title || 'Story Title'}</label>
              <input
                type="text"
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={translations.title_placeholder || 'e.g., New Books for Our Library'}
                maxLength="150"
                disabled={submitting}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="storyText">{translations.main_story || 'Main Story'}</label>
              <textarea
                id="storyText"
                value={storyText}
                onChange={(e) => setStoryText(e.target.value)}
                placeholder={translations.story_text_placeholder || 'Describe the impact of the donation...'}
                rows="8"
                maxLength="3000"
                disabled={submitting}
                required
              ></textarea>
            </div>

            <div className="form-group">
              <label htmlFor="quote">{translations.optional_quote || 'Quote (Optional)'}</label>
              <textarea
                id="quote"
                value={quote}
                onChange={(e) => setQuote(e.target.value)}
                placeholder={translations.quote_placeholder || 'An impactful quote from a student, teacher, or principal...'}
                rows="3"
                maxLength="500"
                disabled={submitting}
              ></textarea>
            </div>

            {quote.trim() && (
              <div className="form-group">
                <label htmlFor="quoteAuthor">{translations.quote_author || 'Quote Author'}</label>
                <input
                  type="text"
                  id="quoteAuthor"
                  value={quoteAuthor}
                  onChange={(e) => setQuoteAuthor(e.target.value)}
                  placeholder={translations.quote_author_placeholder || 'Name and title (e.g., Ms. Silva, Grade 5 Teacher)'}
                  maxLength="100"
                  disabled={submitting}
                />
              </div>
            )}

            <div className="form-group">
              <label htmlFor="images">{translations.upload_photos || 'Upload Photos (Max 10)'}</label>
              <input
                type="file"
                id="images"
                accept="image/*" 
                multiple 
                onChange={handleImageChange}
                disabled={submitting}
                required 
              />
              {imagePreviews.length > 0 && (
                <div className="image-previews">
                  {imagePreviews.map((previewUrl, index) => (
                    <img key={index} src={previewUrl} alt={`Preview ${index + 1}`} className="image-preview" />
                  ))}
                </div>
              )}
            </div>

            <button type="submit" className="btn primary submit-button" disabled={submitting}>
              {submitting ? (translations.submitting || 'Submitting...') : (translations.submit_story || 'Submit Story')}
              {submitting && <FaSpinner className="fa-spin" />}
            </button>
          </form>
        )}
      </div>
    </>
  );
};

export default WriteImpactStoriesPage;
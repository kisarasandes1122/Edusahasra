// frontend/src/components/School/WriteImpactStoriesPage/WriteImpactStoriesPage.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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


  // --- Fetch Eligible Donations ---
  useEffect(() => {
    const fetchEligibleDonations = async () => {
      setLoadingDonations(true);
      try {
        const response = await api.get('/api/impact-stories/eligible-donations');
        setEligibleDonations(response.data);
        if (response.data.length > 0) {
          setSelectedDonationId(response.data[0].donationId); // Auto-select first eligible donation
        } else {
            setSelectedDonationId(''); // Ensure no donation is selected if list is empty
        }
      } catch (err) {
        console.error('Error fetching eligible donations:', err);
        setError(err.response?.data?.message || translations.error_fetching_eligible_donations || 'Failed to load eligible donations.');
      } finally {
        setLoadingDonations(false);
      }
    };

    fetchEligibleDonations();
  }, [translations.error_fetching_eligible_donations]); // Add translations as dependency


  // --- Handle Image Selection ---
  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);

    // Combine existing previews with new ones temporarily for limit check
    const totalImages = imagePreviews.length + files.length;

     // Limit to 10 images total
     if (totalImages > 10) {
         alert(translations.image_limit_exceeded || 'You can only upload a maximum of 10 images.');
         // Optionally clear current selection or handle more gracefully
         e.target.value = null; // Clear the file input
         return;
     }

    // Clear previous previews if not adding to existing (assuming replacement for simplicity)
    // If you want to ADD images, you need to manage the state differently (e.g., an array of file objects and an array of preview URLs)
    // For this simple implementation, we replace the selection each time.
    imagePreviews.forEach(url => URL.revokeObjectURL(url)); // Clean up old previews

    setImages(files);

    // Create new previews
    const previews = files.map(file => URL.createObjectURL(file));
    setImagePreviews(previews);

     // No need for the cleanup return here if previews are always replaced
  };


  // --- Handle Form Submission ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccess(null);

    // Frontend Validation - Added checks for title, story text, and images
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
      formData.append('images', image); // 'images' must match the field name in multer config
    });

    try {
      const response = await api.post('/api/impact-stories', formData, {
        headers: {
          // 'Content-Type': 'multipart/form-data', // Axios sets this automatically with FormData
        },
      });

      setSuccess(response.data.message || translations.story_submit_success || 'Impact story submitted successfully!');
      // Clear form
      setSelectedDonationId(eligibleDonations.length > 0 ? eligibleDonations[0].donationId : ''); // Reset to first eligible or empty
      setTitle('');
      setStoryText('');
      setQuote('');
      setQuoteAuthor('');
      setImages([]);
      setImagePreviews([]);
      // Consider re-fetching eligible donations to remove the one that was just storied
      // Or just remove it from state?
      // const updatedEligible = eligibleDonations.filter(d => d.donationId !== selectedDonationId);
      // setEligibleDonations(updatedEligible);


    } catch (err) {
      console.error('Error submitting impact story:', err);
      setError(err.response?.data?.message || translations.story_submit_failed || 'Failed to submit impact story.');
    } finally {
      setSubmitting(false);
    }
  };

  // --- Cleanup Object URLs on component unmount ---
   useEffect(() => {
       // Cleanup when the component unmounts
       return () => {
           imagePreviews.forEach(url => URL.revokeObjectURL(url));
       };
   }, [imagePreviews]); // Re-run effect if imagePreviews changes (though handleImageChange already cleans up previous)


  // --- Define formatDate function ---
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
       // Check if the date is valid
       if (isNaN(date.getTime())) {
           return 'Invalid Date';
       }
      // Use toLocaleDateString for a user-friendly format
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
           <p>{translations.no_eligible_donations_text || 'You can write an impact story after a donation has been confirmed as received.'}</p>
           <button onClick={() => navigate('/view-donations')} className="btn primary">{translations.view_donations || 'View Donations'}</button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="impact-story-form">
          {/* Select Donation */}
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
                  {`${formatDate(donation.confirmationDate)} - ${donation.donatedItemsSummary}`} {/* Using the defined function */}
                </option>
              ))}
            </select>
          </div>

          {/* Title */}
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

          {/* Story Text */}
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

          {/* Quote (Optional) */}
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

          {/* Quote Author (Optional) */}
          {quote.trim() && ( // Only show author input if quote is entered
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


          {/* Images */}
          <div className="form-group">
            <label htmlFor="images">{translations.upload_photos || 'Upload Photos (Max 10)'}</label>
            <input
              type="file"
              id="images"
              accept="image/*" // Accept any image type
              multiple // Allow multiple file selection
              onChange={handleImageChange}
              disabled={submitting}
              required // Make images required
            />
            {/* Image Previews */}
             {imagePreviews.length > 0 && (
                 <div className="image-previews">
                     {imagePreviews.map((previewUrl, index) => (
                         <img key={index} src={previewUrl} alt={`Preview ${index + 1}`} className="image-preview" />
                     ))}
                 </div>
             )}
          </div>


          {/* Submit Button */}
          <button type="submit" className="btn primary submit-button" disabled={submitting}>
            {submitting ? (translations.submitting || 'Submitting...') : (translations.submit_story || 'Submit Story')}
            {submitting && <LoadingSpinner size="sm" />}
          </button>
        </form>
      )}
    </div>
  );
};

export default WriteImpactStoriesPage;
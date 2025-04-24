import React, { useState, useEffect } from 'react';
import {
  MapPin,
  BookOpen,
  CalendarDays,
  Quote,
  ArrowRight,
  Heart,
  School // Added school icon potential
} from 'lucide-react';
import './ImpactStoriesPage.css';
import LoadingSpinner from '../../Common/LoadingSpinner/LoadingSpinner';
import api, { getFullImageUrl } from '../../../api'; // Import api and getFullImageUrl

// Removed mock data

// Helper function to format date
const formatDate = (timestamp) => {
  if (!timestamp) return 'N/A';
  try {
    const date = new Date(timestamp);
    if (isNaN(date.getTime())) {
        return 'Invalid Date';
    }
    return date.toLocaleDateString('en-LK', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  } catch (e) {
    console.error("Error formatting date:", e);
    return 'Invalid Date';
  }
};

const ImpactStoriesPage = () => {
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchStories = async () => {
      setLoading(true);
      setError(null);
      try {
        // --- Fetch Approved Stories from Backend ---
        const response = await api.get('/api/impact-stories/public');
        console.log('Fetched impact stories:', response.data); // Log fetched data
        setStories(response.data);

      } catch (err) {
        console.error("Error fetching impact stories:", err);
        setError("Failed to load impact stories. Please try again.");
        setStories([]); // Clear stories on error
      } finally {
        setLoading(false);
      }
    };

    fetchStories();
  }, []); // Empty dependency array means run once on mount

  const handleImageError = (e) => {
     console.warn("Failed to load image:", e.target.src);
     e.target.style.display = 'none'; // Hide the broken image
  };

  return (
    <div className="impact-stories-container">
      {/* Header Section */}
      <header className="impact-stories-header">
        <h1 className="impact-stories-title">Stories of Impact</h1>
        <p className="impact-stories-subtitle">
          See how your donations are making a real difference in schools and students' lives across Sri Lanka.
        </p>
      </header>

      {/* Stories Section */}
      <section className="impact-stories-list">
        {loading ? (
          <LoadingSpinner />
        ) : error ? (
          <div className="impact-stories-error-message">Error: {error}</div>
        ) : stories.length > 0 ? (
          // Map through the fetched stories
          stories.map(story => (
            <div key={story._id} className="impact-story-card"> {/* Use _id from Mongoose */}
              {/* Story Details */}
              <div className="story-details">
                 {/* School Name */}
                <h3 className="story-school-name">
                     {/* Use school.schoolName from backend */}
                    <School size={20} className="meta-icon" style={{ marginRight: '8px' }} />
                    {story.school?.schoolName || 'Unknown School'}
                </h3>
                {/* Metadata */}
                <div className="story-meta">
                  {story.school?.city && (
                     <span className="story-location">
                         <MapPin size={16} className="meta-icon"/>
                         {`${story.school.city}, ${story.school.province || story.school.district}`}
                    </span>
                  )}
                  {story.approvedAt && ( // Use approvedAt for public display date
                    <span className="story-date">
                       <CalendarDays size={16} className="meta-icon"/>
                       Published: {formatDate(story.approvedAt)}
                    </span>
                  )}
                   {/* Optional: Link to donation details? */}
                   {/* <span className="story-items">
                       <BookOpen size={16} className="meta-icon"/>
                       Donation ID: {story.donationId}
                   </span> */}
                </div>
                 <hr className="story-divider"/>
                {/* Main Story Text */}
                <p className="story-text">{story.storyText}</p>

                {/* Optional Quote */}
                 {story.quote && (
                     <div className="story-quote">
                         <Quote size={24} className="quote-icon"/>
                         <p className="quote-text">{story.quote}</p>
                         {story.quoteAuthor && <p className="quote-author">— {story.quoteAuthor}</p>}
                     </div>
                 )}
              </div>

              {/* Photo Gallery */}
               {story.images && story.images.length > 0 && (
                   <div className="story-gallery">
                       <h4 className="gallery-title">Photos from the School</h4>
                       <div className="gallery-grid">
                           {story.images.map((imageUrl, index) => (
                               // Use index as key if image URLs might not be unique, or a unique id if backend provided
                               <div key={index} className="gallery-item">
                                   <img
                                       src={getFullImageUrl(imageUrl)} // Use getFullImageUrl helper
                                       alt={`${story.school?.schoolName || 'School'} - Impact Photo ${index + 1}`}
                                       className="gallery-photo"
                                       onError={handleImageError}
                                    />
                               </div>
                           ))}
                       </div>
                   </div>
               )}
            </div>
          ))
        ) : (
          // Empty state if no stories are found
          <div className="impact-stories-empty">
            <div className="empty-icon">🌱</div>
            <h3>No Impact Stories Yet</h3>
            <p>We're still collecting and verifying stories from schools. Check back later!</p>
             {/* Link to browse needs for donors */}
             <a href="/needs" className="impact-stories-button">Browse School Needs</a>
          </div>
        )}
      </section>

      {/* Optional: Call to Action */}
       <section className="impact-stories-cta">
            <div className="cta-content">
                <h2 className="cta-title">Ready to Create an Impact Story?</h2>
                <p className="cta-subtitle">Browse school needs and make a donation that helps students in need.</p>
                 <a href="/needs" className="impact-stories-button cta-button">Browse Needs Now <ArrowRight size={18}/></a>
            </div>
       </section>

    </div>
  );
};

export default ImpactStoriesPage;
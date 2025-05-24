import React, { useState, useEffect } from 'react';
import {
  MapPin,
  BookOpen,
  CalendarDays,
  Quote,
  ArrowRight,
  Heart,
  School 
} from 'lucide-react';
import './ImpactStoriesPage.css';
import LoadingSpinner from '../../Common/LoadingSpinner/LoadingSpinner';
import api, { getFullImageUrl } from '../../../api'; 


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
        
        const response = await api.get('/api/impact-stories/public');
        console.log('Fetched impact stories:', response.data); 
        setStories(response.data);

      } catch (err) {
        console.error("Error fetching impact stories:", err);
        setError("Failed to load impact stories. Please try again.");
        setStories([]); 
      } finally {
        setLoading(false);
      }
    };

    fetchStories();
  }, []); 

  const handleImageError = (e) => {
     console.warn("Failed to load image:", e.target.src);
     e.target.style.display = 'none'; 
  };

  return (
    <div className="impact-stories-container">
      
      <header className="impact-stories-header">
        <h1 className="impact-stories-title">Stories of Impact</h1>
        <p className="impact-stories-subtitle">
          See how your donations are making a real difference in schools and students' lives across Sri Lanka.
        </p>
      </header>

      
      <section className="impact-stories-list">
        {loading ? (
          <LoadingSpinner />
        ) : error ? (
          <div className="impact-stories-error-message">Error: {error}</div>
        ) : stories.length > 0 ? (
          
          stories.map(story => (
            <div key={story._id} className="impact-story-card"> 
              
              <div className="story-details">
                 
                <h3 className="story-school-name">
                     
                    <School size={20} className="meta-icon" style={{ marginRight: '8px' }} />
                    {story.school?.schoolName || 'Unknown School'}
                </h3>
                
                <div className="story-meta">
                  {story.school?.city && (
                     <span className="story-location">
                         <MapPin size={16} className="meta-icon"/>
                         {`${story.school.city}, ${story.school.province || story.school.district}`}
                    </span>
                  )}
                  {story.approvedAt && ( 
                    <span className="story-date">
                       <CalendarDays size={16} className="meta-icon"/>
                       Published: {formatDate(story.approvedAt)}
                    </span>
                  )}
                   
                   
                </div>
                 <hr className="story-divider"/>
                
                <p className="story-text">{story.storyText}</p>

                
                 {story.quote && (
                     <div className="story-quote">
                         <Quote size={24} className="quote-icon"/>
                         <p className="quote-text">{story.quote}</p>
                         {story.quoteAuthor && <p className="quote-author">— {story.quoteAuthor}</p>}
                     </div>
                 )}
              </div>

              
               {story.images && story.images.length > 0 && (
                   <div className="story-gallery">
                       <h4 className="gallery-title">Photos from the School</h4>
                       <div className="gallery-grid">
                           {story.images.map((imageUrl, index) => (
                               
                               <div key={index} className="gallery-item">
                                   <img
                                       src={getFullImageUrl(imageUrl)} 
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
          
          <div className="impact-stories-empty">
            <div className="empty-icon">🌱</div>
            <h3>No Impact Stories Yet</h3>
            <p>We're still collecting and verifying stories from schools. Check back later!</p>
             
             <a href="/needs" className="impact-stories-button">Browse School Needs</a>
          </div>
        )}
      </section>

      
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
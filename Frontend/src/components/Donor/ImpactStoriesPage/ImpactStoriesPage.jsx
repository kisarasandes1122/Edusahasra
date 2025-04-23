// frontend/src/components/Donor/ImpactStoriesPage/ImpactStoriesPage.jsx
import React, { useState, useEffect } from 'react';
import {
  MapPin,        // Icon for location meta
  BookOpen,      // Icon for items meta
  CalendarDays,  // Icon for date meta
  Quote,         // Icon for quotes
  ArrowRight,    // Icon for buttons (This is the one!)
  TrendingUp,    // Icon example (used in previous HowItWorks but kept here)
  Users,         // Icon example for stats (not used in final stats)
  Heart          // Icon for CTA section
} from 'lucide-react'; // Import necessary icons

import './ImpactStoriesPage.css'; // Import the CSS file
import LoadingSpinner from '../../Common/LoadingSpinner/LoadingSpinner'; // Assuming you have a spinner

// Mock Data (Replace with API call in a real application)
// You might get this data from the backend, possibly linked to confirmed donations
// and thank-you messages with photos.
const mockImpactStories = [
  {
    id: 1,
    schoolName: "Sri Vidyaloka Vidyalaya",
    location: "Kegalle, Sabaragamuwa",
    itemsSummary: "Notebooks, pens, pencils, school bags",
    date: "2023-11-15T10:00:00Z", // ISO string or Date object
    story: "Thanks to the generous donations, our primary students received essential stationery kits just before their exams. This significantly boosted their morale and readiness.",
    quote: "Seeing the smiles on the children's faces when they received the new books and bags was priceless. It's more than just supplies; it's hope.",
    quoteAuthor: "Mrs. Perera, Principal",
    images: [
      '/images/impact-story-1a.jpg', // Placeholder paths
      '/images/impact-story-1b.jpg',
      '/images/impact-story-1c.jpg',
    ],
  },
  {
    id: 2,
    schoolName: "Dhammananda Kanishta Vidyalaya",
    location: "Matara, Southern",
    itemsSummary: "Library books (Science & English), dictionaries",
    date: "2024-01-20T14:30:00Z",
    story: "The donation of science and English books greatly enhanced our small school library collection. Students now have access to resources previously unavailable, sparking new interest in reading.",
    quote: "Our students' eyes light up with excitement when they discover new stories and facts in these books. Thank you for opening up their world.",
    quoteAuthor: "Mr. Silva, Librarian",
     images: [
      '/images/impact-story-2a.jpg',
      '/images/impact-story-2b.jpg',
    ],
  },
   {
    id: 3,
    schoolName: "Kadugannawa Primary School",
    location: "Kandy, Central",
    itemsSummary: "Uniform fabric and sewing kits",
    date: "2024-02-10T09:15:00Z",
    story: "Many families struggle with providing uniforms. This donation allowed us to provide uniform fabric and sewing kits to students, ensuring they can attend school comfortably and confidently.",
    quote: "A proper uniform instills pride and belonging. This donation removed a significant burden for many parents and boosted attendance.",
    quoteAuthor: "Mr. Fernando, Teacher",
     images: [
      '/images/impact-story-3a.jpg',
    ],
  },
];

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

  // Simulate fetching data on component mount
  useEffect(() => {
    const fetchStories = async () => {
      setLoading(true);
      setError(null);
      try {
        // In a real app: Replace this with your API call
        // const response = await api.get('/api/impact-stories');
        // setStories(response.data);

        // Using mock data with a delay to simulate network latency
        await new Promise(resolve => setTimeout(resolve, 800));
        setStories(mockImpactStories);

      } catch (err) {
        console.error("Error fetching impact stories:", err);
        setError("Failed to load impact stories. Please try again.");
        setStories([]);
      } finally {
        setLoading(false);
      }
    };

    fetchStories();
  }, []); // Empty dependency array means run once on mount

  // Helper to handle image loading errors (replace with a fallback image if needed)
  const handleImageError = (e) => {
     console.warn("Failed to load image:", e.target.src);
     // Option 1: Hide the broken image
     e.target.style.display = 'none';
     // Option 2: Replace with a generic placeholder image
     // e.target.src = '/path/to/placeholder.jpg';
     // e.target.onerror = null; // Prevent infinite loop if placeholder also fails
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
          <LoadingSpinner /> // Show loading spinner
        ) : error ? (
          <div className="impact-stories-error-message">Error: {error}</div> // Show error message
        ) : stories.length > 0 ? (
          // Map through the fetched (or mock) stories
          stories.map(story => (
            <div key={story.id} className="impact-story-card">
              {/* Story Details */}
              <div className="story-details">
                <h3 className="story-school-name">{story.schoolName}</h3>
                <div className="story-meta">
                  <span className="story-location"><MapPin size={16} className="meta-icon"/> {story.location}</span>
                  <span className="story-date"><CalendarDays size={16} className="meta-icon"/> {formatDate(story.date)}</span>
                  <span className="story-items"><BookOpen size={16} className="meta-icon"/> Donated: {story.itemsSummary}</span>
                </div>
                 <hr className="story-divider"/>
                <p className="story-text">{story.story}</p>

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
                               // Use index as key if image URLs might not be unique
                               <div key={index} className="gallery-item">
                                   <img
                                       src={imageUrl} // Use the image URL from data
                                       alt={`${story.schoolName} - Impact Photo ${index + 1}`}
                                       className="gallery-photo"
                                       onError={handleImageError} // Handle loading errors
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
            <div className="empty-icon">🌱</div> {/* Leaf or similar icon */}
            <h3>No Impact Stories Yet</h3>
            <p>We're still collecting and verifying stories from schools. Check back later!</p>
            {/* Optional: Link to browse needs */}
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
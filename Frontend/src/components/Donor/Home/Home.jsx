import React, { useState, useEffect } from 'react'; // Import hooks
import { useNavigate } from 'react-router-dom';    // Import useNavigate
import { ArrowRight, School, Users, Gift, TrendingUp, Clock, BookOpen, GraduationCap, Heart, MapPin, User } from 'lucide-react';
import api from '../../../api'; // Import your api instance
import './Home.css';
import LoadingSpinner from '../../Common/LoadingSpinner/LoadingSpinner'; // Optional: if you have one

// Import images (keep these)
import rural1 from '../../../assets/images/image1.jpg';
import rural2 from '../../../assets/images/image2.webp';
import rural3 from '../../../assets/images/image3.jpg';

// Helper function to shuffle an array (Fisher-Yates shuffle)
function shuffleArray(array) {
  let currentIndex = array.length, randomIndex;
  while (currentIndex !== 0) {
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;
    [array[currentIndex], array[randomIndex]] = [
      array[randomIndex], array[currentIndex]];
  }
  return array;
}

// Helper function to format location (similar to SchoolsInNeedPage)
const formatLocation = (school) => {
    if (!school) return 'Location Unavailable';
    const parts = [school.city, school.district, school.province].filter(Boolean);
    return parts.join(', ') || 'Location details missing';
}


const Home = () => {
  const navigate = useNavigate(); // Initialize navigate

  // --- State for fetched requests ---
  const [featuredRequests, setFeaturedRequests] = useState([]);
  const [loadingRequests, setLoadingRequests] = useState(true);
  const [fetchError, setFetchError] = useState(null);

  // --- Fetch featured requests on component mount ---
  useEffect(() => {
    const fetchRequests = async () => {
      setLoadingRequests(true);
      setFetchError(null);
      try {
        // Fetch a few requests (e.g., 9 lowest progress ones) to get a pool
        const response = await api.get('/api/requests', {
          params: { limit: 9, sortBy: 'lowest' } // Fetch 9 lowest progress requests
        });

        if (response.data && response.data.requests) {
          // Shuffle the fetched requests and take the first 3
          const shuffled = shuffleArray([...response.data.requests]);
          setFeaturedRequests(shuffled.slice(0, 3));
        } else {
          setFeaturedRequests([]);
        }
      } catch (err) {
        console.error("Error fetching featured requests:", err);
        setFetchError("Could not load school requests.");
        setFeaturedRequests([]);
      } finally {
        setLoadingRequests(false);
      }
    };

    fetchRequests();
  }, []); // Empty dependency array means run once on mount

  // --- Keep other static data ---
  const impactStats = [
    { id: 1, icon: <School className="home__impact-icon" />, count: '70+', label: 'Schools Supported' },
    { id: 2, icon: <Users className="home__impact-icon" />, count: '12,000+', label: 'Students Reached' },
    { id: 3, icon: <Gift className="home__impact-icon" />, count: '3,200+', label: 'Donations Made' }
  ];

  const testimonials = [
    {
      id: 1,
      quote: "EduSahasra made it so easy to connect with schools that truly need our help. I can see exactly where my donations are going and the impact they're making.",
      name: "Anura Perera",
      role: "Regular Donor"
    },
    {
      id: 2,
      quote: "Thanks to the donations we received through EduSahasra, our students now have access to essential learning materials that were previously unaffordable.",
      name: "Mrs. Kumari",
      role: "Principal, Galle Central College"
    },
    {
      id: 3,
      quote: "I appreciate being able to track my donation from start to finish. The transparency gives me confidence that my contribution is making a real difference.",
      name: "Dinesha Fernando",
      role: "First-time Donor"
    }
  ];

  const howItWorks = [
    {
      id: 1,
      icon: <School className="home__how-works-icon" />,
      title: "Schools Request",
      description: "Verified schools list their specific resource needs on our platform."
    },
    {
      id: 2,
      icon: <Users className="home__how-works-icon" />,
      title: "Donors Choose",
      description: "Donors browse needs and select schools or specific supplies to support."
    },
    {
      id: 3,
      icon: <Gift className="home__how-works-icon" />,
      title: "Resources Delivered",
      description: "Donations are delivered via our logistics network or self-delivery by donors."
    },
    {
      id: 4,
      icon: <Clock className="home__how-works-icon" />,
      title: "Track Impact",
      description: "Follow your donation journey and see the difference you're making."
    }
  ];

  // REMOVED the static schoolDonations array

  return (
    <div className="home">
      {/* Hero Section */}
      <section className="home__hero">
        {/* ... hero content ... */}
         <div className="home__hero-slideshow">
          <div className="home__hero-slide" style={{ backgroundImage: `url(${rural1})` }}></div>
          <div className="home__hero-slide" style={{ backgroundImage: `url(${rural2})` }}></div>
          <div className="home__hero-slide" style={{ backgroundImage: `url(${rural3})` }}></div>
          <div className="home__hero-overlay"></div>
        </div>
        <div className="home__hero-content">
          <h1 className="home__hero-title">Bridge the Education Gap in Rural Sri Lanka</h1>
          <p className="home__hero-subtitle">
            Connect directly with schools in need and provide essential educational resources
            to students who need them most
          </p>
          <div className="home__hero-buttons">
            <a href="/donor-register" className="home__button home__button--primary">
              Start Donating Today
            </a>
            <a href="/needs" className="home__button home__button--secondary">
              Browse School Requests
            </a>
          </div>
        </div>
      </section>

      {/* Schools Donation Section - NOW DYNAMIC */}
      <section className="home__schools">
        <div className="home__section-container">
          <h2 className="home__section-title">Schools Currently Seeking Support</h2>
          <p className="home__section-subtitle">
            These schools have verified needs waiting for your support. Every donation makes a difference in a student's education journey.
          </p>

          {loadingRequests ? (
            <LoadingSpinner /> // Show loading spinner while fetching
          ) : fetchError ? (
            <p className="home__error-message">{fetchError}</p> // Show error message
          ) : featuredRequests.length > 0 ? (
            <div className="home__schools-grid">
              {/* Map over the fetched featuredRequests */}
              {featuredRequests.map((request) => (
                <div key={request._id} className="home__school-card"> {/* Use request._id */}
                  <h3 className="home__school-name">{request.schoolInfo?.schoolName || 'School Name Unavailable'}</h3>
                  <div className="home__school-info">
                    <div className="home__school-location">
                      <MapPin size={16} />
                      {/* Use helper function for location */}
                      <span>{formatLocation(request.schoolInfo)}</span>
                    </div>
                    {/* Removed student count as it's not reliably in the request data */}
                    {/* <div className="home__school-students">
                      <User size={16} />
                      <span>{request.schoolInfo?.studentCount} Students in need</span>
                    </div> */}
                    <div className="home__school-needs-list">
                      <div className="home__needs-header">Needs Summary:</div>
                       {/* Summarize requested items */}
                      <div className="home__needs-items">
                          {request.requestedItems
                              ?.map(item => item.categoryNameEnglish) // Just show names for brevity
                              .slice(0, 3) // Show first 3
                              .join(', ')}
                          {request.requestedItems?.length > 3 ? '...' : ''}
                      </div>
                    </div>
                  </div>
                  <div className="home__progress-section">
                    <div className="home__progress-label">Progress</div>
                    {/* Use progress from fetched data */}
                    <div className="home__progress-percentage">{Math.round(request.progress || 0)}% Done</div>
                  </div>
                  <div className="home__progress-bar-container">
                    <div className="home__progress-bar" style={{ width: `${request.progress || 0}%` }}></div>
                  </div>
                  {/* Link to the Request Details page */}
                  <button
                      onClick={() => navigate(`/requests/${request._id}`)} // Use navigate
                      className="home__donate-button"
                    >
                      View Details & Donate
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p>No active donation requests found at the moment.</p> // Message if no requests fetched
          )}

          <div className="home__view-all-container">
            <a href="/needs" className="home__view-all-button">
              View All Requests <ArrowRight size={16} />
            </a>
          </div>
        </div>
      </section>

      {/* Impact Statistics Section */}
      <section className="home__impact">
         {/* ... impact content ... */}
          <div className="home__impact-background"></div>
          <div className="home__section-container">
            <h2 className="home__section-title">Our Impact</h2>
            <p className="home__section-subtitle">
              Together, we're creating meaningful change in education across rural Sri Lanka
            </p>

            <div className="home__impact-stats-container">
              {impactStats.map((stat) => (
                <div key={stat.id} className="home__impact-stat-card">
                  <div className="home__impact-icon-container">
                    {stat.icon}
                  </div>
                  <div className="home__impact-stat-count">{stat.count}</div>
                  <div className="home__impact-stat-label">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
      </section>


      {/* How It Works Section */}
      <section className="home__how-works">
         {/* ... how it works content ... */}
         <div className="home__section-container">
          <h2 className="home__section-title">How EduSahasra Works</h2>
          <p className="home__section-subtitle">
            Our platform makes it easy to connect donors with schools in need through a simple, transparent process
          </p>

          <div className="home__how-works-grid">
            {howItWorks.map((item) => (
              <div key={item.id} className="home__how-works-card">
                <div className="home__how-works-icon-container">
                  {item.icon}
                </div>
                <h3 className="home__how-works-title">{item.title}</h3>
                <p className="home__how-works-description">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Get Involved CTA Section */}
      <section className="home__get-involved">
         {/* ... get involved content ... */}
          <div className="home__section-container">
          <div className="home__get-involved-content">
            <h2 className="home__get-involved-title">Ready to Make a Difference?</h2>
            <p className="home__get-involved-description">
              Join thousands of donors who are helping bridge the education gap in rural Sri Lanka.
              Every donation, no matter how small, creates a brighter future for students in need.
            </p>
            <div className="home__get-involved-buttons">
              <a href="/donor-register" className="home__button--get-involved-primary">
                Start Donating
              </a>
              <a href="/needs" className="home__button--get-involved-secondary">
                Browse Requests <ArrowRight size={16} />
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="home__testimonials">
         {/* ... testimonials content ... */}
         <div className="home__section-container">
          <h2 className="home__section-title">What People Say</h2>
          <p className="home__section-subtitle">
            Hear from donors and schools about their experience with EduSahasra
          </p>

          <div className="home__testimonials-grid">
            {testimonials.map((testimonial) => (
              <div key={testimonial.id} className="home__testimonial-card">
                <div className="home__quote-icon">"</div>
                <p className="home__testimonial-quote">{testimonial.quote}</p>
                <div className="home__testimonial-author">
                  <p className="home__testimonial-name">{testimonial.name}</p>
                  <p className="home__testimonial-role">{testimonial.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
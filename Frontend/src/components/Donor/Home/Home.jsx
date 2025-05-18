// Home.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion'; // Import motion
import { ArrowRight, School, Users, Gift, TrendingUp, Clock, BookOpen, GraduationCap, Heart, MapPin, User } from 'lucide-react';
import api from '../../../api';
import './Home.css';
import LoadingSpinner from '../../Common/LoadingSpinner/LoadingSpinner';

import rural1 from '../../../assets/images/image1.jpg';
import rural2 from '../../../assets/images/image2.webp';
import rural3 from '../../../assets/images/image3.jpg';

// Helper function to shuffle an array
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

// Helper function to format location
const formatLocation = (school) => {
    if (!school) return 'Location Unavailable';
    const parts = [school.city, school.district, school.province].filter(Boolean);
    return parts.join(', ') || 'Location details missing';
}

// --- Animation Variants ---
const sectionVariant = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: "easeOut"
    }
  }
};

const cardGridVariant = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2
    }
  }
};

const cardItemVariant = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
      ease: "easeOut"
    }
  }
};

const buttonHoverTap = {
  hover: { scale: 1.05, y: -3 },
  tap: { scale: 0.95 }
};

const cardHoverEffect = {
  hover: { y: -5, boxShadow: "0 8px 16px rgba(0, 0, 0, 0.1)" },
};


const Home = () => {
  const navigate = useNavigate();

  const [featuredRequests, setFeaturedRequests] = useState([]);
  const [loadingRequests, setLoadingRequests] = useState(true);
  const [fetchError, setFetchError] = useState(null);

  useEffect(() => {
    const fetchRequests = async () => {
      setLoadingRequests(true);
      setFetchError(null);
      try {
        const response = await api.get('/api/requests', {
          params: { limit: 9, sortBy: 'lowest' }
        });
        if (response.data && response.data.requests) {
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
  }, []);

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

  return (
    <div className="home">
      {/* Hero Section */}
      <section className="home__hero">
         <div className="home__hero-slideshow">
          <div className="home__hero-slide" style={{ backgroundImage: `url(${rural1})` }}></div>
          <div className="home__hero-slide" style={{ backgroundImage: `url(${rural2})` }}></div>
          <div className="home__hero-slide" style={{ backgroundImage: `url(${rural3})` }}></div>
          <div className="home__hero-overlay"></div>
        </div>
        <motion.div 
          className="home__hero-content"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3, ease: "easeOut" }}
        >
          <motion.h1 
            className="home__hero-title"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5, ease: "easeOut" }}
          >
            Bridge the Education Gap in Rural Sri Lanka
          </motion.h1>
          <motion.p 
            className="home__hero-subtitle"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.7, ease: "easeOut" }}
          >
            Connect directly with schools in need and provide essential educational resources
            to students who need them most
          </motion.p>
          <motion.div 
            className="home__hero-buttons"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.9, ease: "easeOut" }}
          >
            <motion.a 
              href="/donor-register" 
              className="home__button home__button--primary"
              whileHover="hover"
              whileTap="tap"
              variants={buttonHoverTap}
            >
              Start Donating Today
            </motion.a>
            <motion.a 
              href="/school-register" 
              className="home__button home__button--secondary"
              whileHover="hover"
              whileTap="tap"
              variants={buttonHoverTap}
            >
              Request Donations
            </motion.a>
          </motion.div>
        </motion.div>
      </section>

      {/* Schools Donation Section */}
      <motion.section 
        className="home__schools"
        variants={sectionVariant}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
      >
        <div className="home__section-container">
          <h2 className="home__section-title">Schools Currently Seeking Support</h2>
          <p className="home__section-subtitle">
            These schools have verified needs waiting for your support. Every donation makes a difference in a student's education journey.
          </p>

          {loadingRequests ? (
            <LoadingSpinner />
          ) : fetchError ? (
            <p className="home__error-message">{fetchError}</p>
          ) : featuredRequests.length > 0 ? (
            <motion.div 
              className="home__schools-grid"
              variants={cardGridVariant}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.2 }}
            >
              {featuredRequests.map((request) => (
                <motion.div 
                  key={request._id} 
                  className="home__school-card" 
                  variants={cardItemVariant}
                  // Removed cardHoverEffect for now, as it has more complex content
                >
                  <h3 className="home__school-name">{request.schoolInfo?.schoolName || 'School Name Unavailable'}</h3>
                  <div className="home__school-info">
                    <div className="home__school-location">
                      <MapPin size={16} />
                      <span>{formatLocation(request.schoolInfo)}</span>
                    </div>
                    <div className="home__school-needs-list">
                      <div className="home__needs-header">Needs Summary:</div>
                      <div className="home__needs-items">
                          {request.requestedItems
                              ?.map(item => item.categoryNameEnglish)
                              .slice(0, 3)
                              .join(', ')}
                          {request.requestedItems?.length > 3 ? '...' : ''}
                      </div>
                    </div>
                  </div>
                  <div className="home__progress-section">
                    <div className="home__progress-label">Progress</div>
                    <div className="home__progress-percentage">{Math.round(request.progress || 0)}% Done</div>
                  </div>
                  <div className="home__progress-bar-container">
                    <div className="home__progress-bar" style={{ width: `${request.progress || 0}%` }}></div>
                  </div>
                  <motion.button
                      onClick={() => navigate(`/requests/${request._id}`)}
                      className="home__donate-button"
                      whileHover={{ scale: 1.03, y: -2, backgroundColor: "#3d9c40" }}
                      whileTap={{ scale: 0.97 }}
                      transition={{ duration: 0.2 }}
                    >
                      View Details & Donate
                  </motion.button>
                </motion.div>
              ))}
            </motion.div>
          ) : (
            <p>No active donation requests found at the moment.</p>
          )}

          <motion.div 
            className="home__view-all-container"
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.5 }}
            transition={{ delay: 0.3 }}
          >
            <motion.a 
              href="/needs" 
              className="home__view-all-button"
              whileHover={{ scale: 1.05, backgroundColor: "#043f2e", color: "white", gap: "12px" }}
              whileTap={{ scale: 0.95 }}
              transition={{ duration: 0.2 }}
            >
              View All Requests <ArrowRight size={16} />
            </motion.a>
          </motion.div>
        </div>
      </motion.section>

      {/* Impact Statistics Section */}
      <motion.section 
        className="home__impact"
        variants={sectionVariant}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
      >
          <div className="home__impact-background"></div>
          <div className="home__section-container">
            <h2 className="home__section-title">Our Impact</h2>
            <p className="home__section-subtitle">
              Together, we're creating meaningful change in education across rural Sri Lanka
            </p>
            <motion.div 
              className="home__impact-stats-container"
              variants={cardGridVariant}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.2 }}
            >
              {impactStats.map((stat) => (
                <motion.div 
                  key={stat.id} 
                  className="home__impact-stat-card"
                  variants={cardItemVariant}
                  whileHover={{ y: -5, scale: 1.03 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="home__impact-icon-container">
                    {stat.icon}
                  </div>
                  <div className="home__impact-stat-count">{stat.count}</div>
                  <div className="home__impact-stat-label">{stat.label}</div>
                </motion.div>
              ))}
            </motion.div>
          </div>
      </motion.section>


      {/* How It Works Section */}
      <motion.section 
        className="home__how-works"
        variants={sectionVariant}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
      >
         <div className="home__section-container">
          <h2 className="home__section-title">How EduSahasra Works</h2>
          <p className="home__section-subtitle">
            Our platform makes it easy to connect donors with schools in need through a simple, transparent process
          </p>
          <motion.div 
            className="home__how-works-grid"
            variants={cardGridVariant}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
          >
            {howItWorks.map((item) => (
              <motion.div 
                key={item.id} 
                className="home__how-works-card"
                variants={cardItemVariant}
                whileHover={cardHoverEffect.hover} // using defined object
                transition={{ duration: 0.2 }}
              >
                <div className="home__how-works-icon-container">
                  {item.icon}
                </div>
                <h3 className="home__how-works-title">{item.title}</h3>
                <p className="home__how-works-description">{item.description}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </motion.section>

      {/* Get Involved CTA Section */}
      <motion.section 
        className="home__get-involved"
        // No sectionVariant here, as it has a background gradient that might look odd fading
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 0.7 }}
      >
          <div className="home__section-container">
          <motion.div 
            className="home__get-involved-content"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.5 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <h2 className="home__get-involved-title">Ready to Make a Difference?</h2>
            <p className="home__get-involved-description">
              Join thousands of donors who are helping bridge the education gap in rural Sri Lanka.
              Every donation, no matter how small, creates a brighter future for students in need.
            </p>
            <motion.div 
              className="home__get-involved-buttons"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={{
                visible: { transition: { staggerChildren: 0.2, delayChildren: 0.4 }}
              }}
            >
              <motion.a 
                href="/donor-register" 
                className="home__button--get-involved-primary"
                variants={cardItemVariant} // Reuse for simple fade-up
                whileHover={{ scale: 1.05, y: -2, backgroundColor: "#f0f0f0" }}
                whileTap={{ scale: 0.95 }}
                transition={{ duration: 0.2 }}
              >
                Start Donating
              </motion.a>
              <motion.a 
                href="/needs" 
                className="home__button--get-involved-secondary"
                variants={cardItemVariant} // Reuse for simple fade-up
                whileHover={{ scale: 1.05, y: -2, backgroundColor: "rgba(255, 255, 255, 0.3)", gap: "12px" }}
                whileTap={{ scale: 0.95 }}
                transition={{ duration: 0.2 }}
              >
                Browse Requests <ArrowRight size={16} />
              </motion.a>
            </motion.div>
          </motion.div>
        </div>
      </motion.section>

      {/* Testimonials Section */}
      <motion.section 
        className="home__testimonials"
        variants={sectionVariant}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
      >
         <div className="home__section-container">
          <h2 className="home__section-title">What People Say</h2>
          <p className="home__section-subtitle">
            Hear from donors and schools about their experience with EduSahasra
          </p>
          <motion.div 
            className="home__testimonials-grid"
            variants={cardGridVariant}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
          >
            {testimonials.map((testimonial) => (
              <motion.div 
                key={testimonial.id} 
                className="home__testimonial-card"
                variants={cardItemVariant}
                whileHover={cardHoverEffect.hover} // using defined object
                transition={{ duration: 0.2 }}
              >
                <div className="home__quote-icon">"</div>
                <p className="home__testimonial-quote">{testimonial.quote}</p>
                <div className="home__testimonial-author">
                  <p className="home__testimonial-name">{testimonial.name}</p>
                  <p className="home__testimonial-role">{testimonial.role}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </motion.section>
    </div>
  );
};

export default Home;
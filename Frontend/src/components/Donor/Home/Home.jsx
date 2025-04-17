import React from 'react';
import { ArrowRight, School, Users, Gift, TrendingUp, Clock, BookOpen, GraduationCap, Heart, MapPin, User } from 'lucide-react';
import './Home.css';

// Import images
import rural1 from '../../../assets/images/image1.jpg';
import rural2 from '../../../assets/images/image2.webp';
import rural3 from '../../../assets/images/image3.jpg';

const Home = () => {
  const impactStats = [
    { id: 1, icon: <School className="impact-icon" />, count: '70+', label: 'Schools Supported' },
    { id: 2, icon: <Users className="impact-icon" />, count: '12,000+', label: 'Students Reached' },
    { id: 3, icon: <Gift className="impact-icon" />, count: '3,200+', label: 'Donations Made' }
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
      icon: <School className="how-works-icon" />,
      title: "Schools Request",
      description: "Verified schools list their specific resource needs on our platform."
    },
    {
      id: 2,
      icon: <Users className="how-works-icon" />,
      title: "Donors Choose",
      description: "Donors browse needs and select schools or specific supplies to support."
    },
    {
      id: 3,
      icon: <Gift className="how-works-icon" />,
      title: "Resources Delivered",
      description: "Donations are delivered via our logistics network or self-delivery by donors."
    },
    {
      id: 4,
      icon: <Clock className="how-works-icon" />,
      title: "Track Impact",
      description: "Follow your donation journey and see the difference you're making."
    }
  ];

  const schoolDonations = [
    {
      id: 1,
      name: "Mahasen Primary School",
      location: "Anuradhapura, North Central Province",
      studentCount: 150,
      needs: ["Textbooks", "Pens", "Pencils", "Notebooks"],
      progress: 45
    },
    {
      id: 2,
      name: "Galle Central College",
      location: "Galle, Southern Province",
      studentCount: 200,
      needs: ["Textbooks", "Pens", "Pencils", "Bags"],
      progress: 35
    },
    {
      id: 3,
      name: "Vidyaloka College",
      location: "Galle, Southern Province",
      studentCount: 180,
      needs: ["Science Equipment", "Library Books", "Stationery"],
      progress: 65
    }
  ];

  return (
    <div className="home-container">
      {/* Hero Section with Slideshow */}
      <section className="hero-section">
        <div className="hero-slideshow">
          <div className="slide" style={{ backgroundImage: `url(${rural1})` }}></div>
          <div className="slide" style={{ backgroundImage: `url(${rural2})` }}></div>
          <div className="slide" style={{ backgroundImage: `url(${rural3})` }}></div>
          <div className="hero-overlay"></div>
        </div>
        <div className="hero-content">
          <h1 className="hero-title">Bridge the Education Gap in Rural Sri Lanka</h1>
          <p className="hero-subtitle">
            Connect directly with schools in need and provide essential educational resources
            to students who need them most
          </p>
          <div className="hero-buttons">
            <a href="/donor-register" className="hero-button primary">
              Start Donating Today
            </a>
            <a href="/needs" className="hero-button secondary">
              Browse School Requests
            </a>
          </div>
        </div>
      </section>
      
      {/* Schools Donation Section */}
      <section className="schools-donations-section">
        <div className="section-container">
          <h2 className="section-title">Schools Currently Seeking Support</h2>
          <p className="section-subtitle">
            These schools have verified needs waiting for your support. Every donation makes a difference in a student's education journey.
          </p>
          
          <div className="schools-grid">
            {schoolDonations.map((school) => (
              <div key={school.id} className="school-card">
                <h3 className="school-name">{school.name}</h3>
                <div className="school-info">
                  <div className="school-location">
                    <MapPin size={16} />
                    <span>{school.location}</span>
                  </div>
                  <div className="school-students">
                    <User size={16} />
                    <span>{school.studentCount} Students in need</span>
                  </div>
                  <div className="school-needs-list">
                    <div className="needs-header">Needs:</div>
                    <div className="needs-items">{school.needs.join(', ')}</div>
                  </div>
                </div>
                <div className="progress-section">
                  <div className="progress-label">Progress</div>
                  <div className="progress-percentage">{school.progress}% Done</div>
                </div>
                <div className="progress-bar-container">
                  <div className="progress-bar" style={{ width: `${school.progress}%` }}></div>
                </div>
                <a href={`/donate/${school.id}`} className="donate-now-button">
                  Donate Now
                </a>
              </div>
            ))}
          </div>
          
          <div className="view-all-container">
            <a href="/needs" className="view-all-button">
              View All Requests <ArrowRight size={16} />
            </a>
          </div>
        </div>
      </section>

      {/* Impact Statistics Section */}
      <section className="impact-section">
        <div className="impact-background"></div>
        <div className="section-container">
          <h2 className="section-title">Our Impact</h2>
          <p className="section-subtitle">
            Together, we're creating meaningful change in education across rural Sri Lanka
          </p>
          
          <div className="impact-stats-container">
            {impactStats.map((stat) => (
              <div key={stat.id} className="impact-stat-card">
                <div className="impact-icon-container">
                  {stat.icon}
                </div>
                <div className="impact-stat-count">{stat.count}</div>
                <div className="impact-stat-label">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>
      
      
      {/* How It Works Section */}
      <section className="how-works-section">
        <div className="section-container">
          <h2 className="section-title">How EduSahasra Works</h2>
          <p className="section-subtitle">
            Our platform makes it easy to connect donors with schools in need through a simple, transparent process
          </p>
          
          <div className="how-works-grid">
            {howItWorks.map((item) => (
              <div key={item.id} className="how-works-card">
                <div className="how-works-icon-container">
                  {item.icon}
                </div>
                <h3 className="how-works-title">{item.title}</h3>
                <p className="how-works-description">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      
      {/* Get Involved CTA Section */}
      <section className="get-involved-section">
        <div className="section-container">
          <div className="get-involved-content">
            <h2 className="get-involved-title">Ready to Make a Difference?</h2>
            <p className="get-involved-description">
              Join thousands of donors who are helping bridge the education gap in rural Sri Lanka. 
              Every donation, no matter how small, creates a brighter future for students in need.
            </p>
            <div className="get-involved-buttons">
              <a href="/donor-register" className="primary-button">
                Start Donating
              </a>
              <a href="/needs" className="secondary-button">
                Browse Requests <ArrowRight size={16} />
              </a>
            </div>
          </div>
        </div>
      </section>
      
      {/* Testimonials Section */}
      <section className="testimonials-section">
        <div className="section-container">
          <h2 className="section-title">What People Say</h2>
          <p className="section-subtitle">
            Hear from donors and schools about their experience with EduSahasra
          </p>
          
          <div className="testimonials-grid">
            {testimonials.map((testimonial) => (
              <div key={testimonial.id} className="testimonial-card">
                <div className="quote-icon">"</div>
                <p className="testimonial-quote">{testimonial.quote}</p>
                <div className="testimonial-author">
                  <p className="testimonial-name">{testimonial.name}</p>
                  <p className="testimonial-role">{testimonial.role}</p>
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
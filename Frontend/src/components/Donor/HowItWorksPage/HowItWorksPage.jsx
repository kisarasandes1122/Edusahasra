// frontend/src/components/Donor/HowItWorksPage/HowItWorksPage.jsx
import React from 'react';
import {
  BookOpen,
  Package,
  Truck,
  Handshake,
  TrendingUp,
  ArrowRight,
  Users,
  Heart
} from 'lucide-react';

import './HowItWorksPage.css';

const HowItWorksPage = () => {
  // Define the process steps specifically for Donors
  const donorProcessSteps = [
    {
      id: 1,
      icon: <BookOpen className="hiw-icon" />,
      title: "Browse School Needs",
      description: "Explore requests from verified schools. Filter by location, needed items, or urgency to find a cause that resonates with you.",
    },
    {
      id: 2,
      icon: <Package className="hiw-icon" />,
      title: "Select Items to Donate",
      description: "Choose specific items from a school's request list. See real-time status of what's been pledged or received for each item.",
    },
    {
      id: 3,
      icon: <Handshake className="hiw-icon" />,
      title: "Commit to Your Donation",
      description: "Confirm your pledge to donate the selected items. Schools are instantly notified of your commitment through our platform.",
    },
    {
      id: 4,
      icon: <Truck className="hiw-icon" />,
      title: "Coordinate Delivery",
      description: "Choose between self-delivery directly to the school or use our partner courier service for convenient pickup from your location.",
    },
    {
      id: 5,
      icon: <TrendingUp className="hiw-icon" />,
      title: "See Your Impact",
      description: "Track your donation journey through your dashboard and receive gratitude messages and photos directly from the schools you've helped.",
    },
  ];

  const impactStats = [
    { value: "10,000+", label: "Students Supported" },
    { value: "500+", label: "Schools Helped" },
    { value: "25,000+", label: "Items Donated" },
    { value: "92%", label: "Schools Report Improved Learning" }
  ];

  return (
    <div className="hiw-container">
      {/* Hero Section */}
      <section className="hiw-hero">
        <div className="hiw-hero-content">
          <h1 className="hiw-title">Make a Difference in 5 Simple Steps</h1>
          <p className="hiw-subtitle">
            Your generous donations directly support students' educational journeys. Here's how the process works from start to finish.
          </p>
          <div className="hiw-hero-buttons">
            <a href="/needs" className="hiw-button hiw-button-primary">
              Find School Needs <ArrowRight size={18} />
            </a>
          </div>
        </div>
        <div className="hiw-hero-stats">
          {impactStats.map((stat, index) => (
            <div key={index} className="hiw-stat-item">
              <div className="hiw-stat-value">{stat.value}</div>
              <div className="hiw-stat-label">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Process Steps Section */}
      <section className="hiw-process-section">
        <h2 className="hiw-section-title">Your Donation Journey</h2>
        
        <div className="hiw-steps-container">
          {donorProcessSteps.map((step, index) => (
            <div key={step.id} className="hiw-step-card">
              <div className="hiw-step-number">{step.id}</div>
              <div className="hiw-step-content">
                <div className="hiw-icon-container">
                  {step.icon}
                </div>
                <h3 className="hiw-step-title">{step.title}</h3>
                <p className="hiw-step-description">{step.description}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="hiw-testimonials-section">
        <h2 className="hiw-section-title">What Our Donors Say</h2>
        <div className="hiw-testimonials-container">
          <div className="hiw-testimonial-card">
            <div className="hiw-testimonial-quote">"Donating through EduSahasra was seamless. I could see exactly where my donations were going and received heartfelt thank-you notes from students!"</div>
            <div className="hiw-testimonial-author">— Priya S., Regular Donor</div>
          </div>
          <div className="hiw-testimonial-card">
            <div className="hiw-testimonial-quote">"As a corporate donor, we appreciate the transparency and ease of coordinating bulk donations to multiple schools through this platform."</div>
            <div className="hiw-testimonial-author">— Rajesh K., Corporate Giving Manager</div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="hiw-faq-section">
        <h2 className="hiw-section-title">Common Questions</h2>
        <div className="hiw-faq-container">
          <details className="hiw-faq-item">
            <summary className="hiw-faq-question">How are schools verified on the platform?</summary>
            <div className="hiw-faq-answer">
              All schools undergo a thorough verification process including documentation checks, physical verification, and assessment of needs before they can receive donations through our platform.
            </div>
          </details>
          <details className="hiw-faq-item">
            <summary className="hiw-faq-question">Can I donate money instead of items?</summary>
            <div className="hiw-faq-answer">
              Currently, our platform focuses on in-kind donations. This ensures that students receive exactly what they need while providing complete transparency to donors about where their contributions go.
            </div>
          </details>
          <details className="hiw-faq-item">
            <summary className="hiw-faq-question">How much does delivery cost if I use the courier service?</summary>
            <div className="hiw-faq-answer">
              Delivery costs vary based on location and package size. We've partnered with courier services to provide discounted rates for our donors. You'll see the exact cost before confirming your donation.
            </div>
          </details>
        </div>
      </section>

      {/* Call to Action Section */}
      <section className="hiw-cta-section">
        <div className="hiw-cta-content">
          <div className="hiw-cta-icon"><Heart size={48} /></div>
          <h2 className="hiw-cta-title">Ready to Start Your Giving Journey?</h2>
          <p className="hiw-cta-description">
            Join thousands of donors who are making education accessible to all students.
          </p>
          <div className="hiw-cta-buttons">
            <a href="/needs" className="hiw-button hiw-button-primary">
              Browse School Needs <ArrowRight size={18} />
            </a>
            <a href="/donor-register" className="hiw-button hiw-button-secondary">
              Create Donor Account <ArrowRight size={18} />
            </a>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HowItWorksPage;
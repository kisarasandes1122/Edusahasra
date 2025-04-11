import React from 'react';
import { FaSignOutAlt, FaEye, FaHandHoldingHeart, FaThumbsUp, FaUserCircle } from 'react-icons/fa';
import { useLanguage } from '../../LanguageSelector/LanguageContext';
import './SchoolDashboard.css';

const SchoolDashboard = () => {
  const { translations } = useLanguage();

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <div className="dashboard-title">
          <h1>{translations.dashboard}</h1>
        </div>
        <button className="dashboard-logout">
          <FaSignOutAlt className="dashboard-logout-icon" />
          <span>{translations.logout}</span>
        </button>
      </header>

      <div className="dashboard-welcome">
        <p>{translations.welcome_message}</p>
      </div>

      <div className="dashboard-grid">
        <a href="/view-donations" className="dashboard-card action-card"> 
          <FaEye className="card-icon" />
          <div className="card-content">
            <h3>{translations.view_donations}</h3>
          </div>
        </a>

        <a href="/request-donations" className="dashboard-card action-card">
          <FaHandHoldingHeart className="card-icon" />
          <div className="card-content">
            <h3>{translations.request_donations}</h3>
          </div>
        </a>

        <a href="/send-thanks" className="dashboard-card action-card">
          <FaThumbsUp className="card-icon" />
          <div className="card-content">
            <h3>{translations.send_thanks}</h3>
          </div>
        </a>

        <a href="/edit-profile" className="dashboard-card action-card">
          <FaUserCircle className="card-icon" />
          <div className="card-content">
            <h3>{translations.edit_profile}</h3>
          </div>
        </a>
      </div>

      <div className="dashboard-section recent-donations">
        <h3 className="section-title">
          {translations.recent_donations}
        </h3>

        <div className="donation-list">
          <div className="donation-item">
            <p>60 of 100 Notebooks Received</p>
          </div>

          <div className="donation-item">
            <p>30 of 60 Pens/Pencils Received</p>
          </div>
        </div>
      </div>

      <div className="dashboard-section contact">
        <p>
          {translations.need_help_contact_us}
          <span className="contact-number">0789200730</span>
        </p>
      </div>
    </div>
  );
};

export default SchoolDashboard;
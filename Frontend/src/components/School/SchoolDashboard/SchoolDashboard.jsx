import React from 'react';
import { FaSignOutAlt, FaEye, FaHandHoldingHeart, FaThumbsUp, FaUserCircle, FaPhone } from 'react-icons/fa';
import './SchoolDashboard.css';

const SchoolDashboard = () => {
  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <div className="dashboard-title">
          <h1 className="dashboard-title-sinhala">ප්‍රධාන තීරය</h1>
          <h2 className="dashboard-title-english">Dashboard</h2>
        </div>
        <button className="dashboard-logout">
          <FaSignOutAlt className="dashboard-logout-icon" />
          <span>Logout</span>
        </button>
      </header>

      <div className="dashboard-welcome">
        <p>මෙහී අලුත්ද? පියවරෙන් පියවර මගපෙන්වීම සදහා ක්ලික් කරන්න</p>
      </div>

      <div className="dashboard-grid">
        <a href="/view-donations" className="dashboard-card action-card"> 
          <FaEye className="card-icon" />
          <div className="card-content">
            <h3 className="card-title-sinhala">පරිත්‍යාග බලන්න</h3>
            <p className="card-title-english">View Donations</p>
          </div>
        </a>

        <a href="/request-donations" className="dashboard-card action-card">
          <FaHandHoldingHeart className="card-icon" />
          <div className="card-content">
            <h3 className="card-title-sinhala">සැපයුම් ඉල්ලන්න</h3>
            <p className="card-title-english">Request Donations</p>
          </div>
        </a>

        <a href="/send-thanks" className="dashboard-card action-card">
          <FaThumbsUp className="card-icon" />
          <div className="card-content">
            <h3 className="card-title-sinhala">ස්තුතිය ප්‍රකාශන්න</h3>
            <p className="card-title-english">Send Thanks</p>
          </div>
        </a>

        <a href="/my-profile" className="dashboard-card action-card">
          <FaUserCircle className="card-icon" />
          <div className="card-content">
            <h3 className="card-title-sinhala">මගේ විස්තර</h3>
            <p className="card-title-english">My Profile</p>
          </div>
        </a>
      </div>

      <div className="dashboard-section recent-donations">
        <h3 className="section-title">
          <span className="title-sinhala">මෑතකාලීන පරිත්‍යාග - </span>
          <span className="title-english">Recent Donations</span>
        </h3>

        <div className="donation-list">
          <div className="donation-item">
            <p>
              <span className="donation-sinhala">සටහන් පොත් 100න් 60ක් ලැබුණි - </span>
              <span className="donation-english">60 of 100 Notebooks Received</span>
            </p>
          </div>

          <div className="donation-item">
            <p>
              <span className="donation-sinhala">පැන්/පැන්සල් 60ක් 30ක් ලැබුණි - </span>
              <span className="donation-english">30 of 60 Pens/Pencils Received</span>
            </p>
          </div>
        </div>
      </div>

      <div className="dashboard-section contact">
        <p>
          <span className="contact-sinhala">උදව් අවශ්‍යද? අපිට කථා කරන්න : </span>
          <span className="contact-number">0789200730</span>
        </p>
      </div>
    </div>
  );
};

export default SchoolDashboard;
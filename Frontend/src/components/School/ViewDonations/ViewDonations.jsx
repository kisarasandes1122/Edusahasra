import React, { useState } from 'react';
import { FaArrowLeft } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../../LanguageSelector/LanguageContext';
import './ViewDonations.css';

const ViewDonations = () => {
  const navigate = useNavigate();
  const { translations } = useLanguage();
  
  // Initial state for donations that need confirmation
  const [pendingConfirmations, setPendingConfirmations] = useState([
    {
      id: 1,
      type: 'Notebooks',
      count: 30
    },
    {
      id: 2,
      type: 'Pens/Pencils',
      count: 40
    }
  ]);
  
  // Initial state for all donations
  const [allDonations, setAllDonations] = useState([
    {
      id: 1,
      type: 'Notebooks',
      requested: 60,
      received: 30
    },
    {
      id: 2,
      type: 'Pens/Pencils',
      requested: 60,
      received: 30
    },
    {
      id: 3,
      type: 'Crayons',
      requested: 60,
      received: 30
    }
  ]);

  const handleBack = () => {
    navigate('/Dashboard');
  };
  
  // Function to handle donation confirmation
  const handleConfirmDonation = (donationId) => {
    // Find the donation to confirm
    const donationToConfirm = pendingConfirmations.find(item => item.id === donationId);
    
    if (!donationToConfirm) return;
    
    // Update the allDonations state to reflect the confirmed donation
    setAllDonations(prevDonations => {
      return prevDonations.map(donation => {
        // Update the matching donation type
        if (donation.type === donationToConfirm.type) {
          return {
            ...donation,
            received: donation.received + donationToConfirm.count
          };
        }
        return donation;
      });
    });
    
    // Remove the confirmed donation from pending confirmations
    setPendingConfirmations(prevConfirmations => 
      prevConfirmations.filter(item => item.id !== donationId)
    );
  };

  return (
    <div className="donations-container">
      <header className="donations-header">
        <div className="donations-title">
          <h1>{translations.view_donations}</h1>
        </div>
      </header>

      <div className="donations-back-btn-container">
        <button className="donations-back-btn" onClick={handleBack}>
          <FaArrowLeft className="back-icon" />
          <span>{translations.back}</span>
        </button>
      </div>

      <div className="donations-section">
        <h3 className="section-title">
          {translations.upcoming_donations}
        </h3>

        <div className="donation-list">
          <div className="donation-item">
            <div className="donation-details">
              <div className="donation-type">
                {/* Keep the English name directly instead of translating */}
                <span className="donation-count">30 Notebooks</span>
              </div>
              <div className="donation-date">
                {translations.expected_to_receive}: {translations.june} 24, 2025
              </div>
            </div>
            <div className="donation-status transit">
              <span>{translations.in_transit}</span>
            </div>
          </div>

          <div className="donation-item">
            <div className="donation-details">
              <div className="donation-type">
                {/* Keep the English name directly instead of translating */}
                <span className="donation-count">40 Pens/Pencils</span>
              </div>
              <div className="donation-date">
                {translations.expected_to_receive}: {translations.june} 24, 2025
              </div>
            </div>
            <div className="donation-status preparing">
              <span>{translations.preparing}</span>
            </div>
          </div>
        </div>
      </div>

      {pendingConfirmations.length > 0 && (
        <div className="donations-section">
          <h3 className="section-title">
            {translations.confirm_donations}
          </h3>

          <div className="donation-list">
            {pendingConfirmations.map(donation => (
              <div className="donation-item" key={donation.id}>
                <div className="donation-details">
                  <div className="donation-type">
                    <span className="donation-count">
                      {/* Simply use the type as is, without translation */}
                      {donation.count} {donation.type}
                    </span>
                  </div>
                </div>
                <button 
                  className="donation-confirm-btn"
                  onClick={() => handleConfirmDonation(donation.id)}
                >
                  <span>{translations.confirm}</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="donations-section">
        <h3 className="section-title">
          {translations.all_donations}
        </h3>

        <div className="donation-list">
          {allDonations.map(donation => (
            <div className="donation-item all-donation" key={donation.id}>
              <div className="all-donation-details">
                <div className="donation-type">
                  <span className="donation-name">
                    {/* Use the English type directly */}
                    {donation.type}
                  </span>
                </div>
                <div className="donation-counts">
                  <span>{translations.requested_amount}: {donation.requested} | </span>
                  <span>{translations.received_amount}: {donation.received}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="donations-contact">
        <p style={{ textAlign: 'center', padding: '15px 0' }}>
          <span>{translations.need_help_contact_us} </span>
          <span className="contact-number">0789200730</span>
        </p>
      </div>
    </div>
  );
};

export default ViewDonations;
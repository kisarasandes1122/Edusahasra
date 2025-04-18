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
    <div className="view-donations-container">
      <header className="view-donations-header">
        <div className="view-donations-title">
          <h1>{translations.view_donations}</h1>
        </div>
      </header>

      <div className="view-donations-back-btn-container">
        <button className="view-donations-back-btn" onClick={handleBack}>
          <FaArrowLeft className="view-donations-back-icon" />
          <span>{translations.back}</span>
        </button>
      </div>

      <div className="view-donations-section">
        <h3 className="view-donations-section-title">
          {translations.upcoming_donations}
        </h3>

        <div className="view-donations-list">
          <div className="view-donations-item">
            <div className="view-donations-details">
              <div className="view-donations-type">
                {/* Keep the English name directly instead of translating */}
                <span className="view-donations-count">30 Notebooks</span>
              </div>
              <div className="view-donations-date">
                {translations.expected_to_receive}: {translations.june} 24, 2025
              </div>
            </div>
            <div className="view-donations-status view-donations-transit">
              <span>{translations.in_transit}</span>
            </div>
          </div>

          <div className="view-donations-item">
            <div className="view-donations-details">
              <div className="view-donations-type">
                {/* Keep the English name directly instead of translating */}
                <span className="view-donations-count">40 Pens/Pencils</span>
              </div>
              <div className="view-donations-date">
                {translations.expected_to_receive}: {translations.june} 24, 2025
              </div>
            </div>
            <div className="view-donations-status view-donations-preparing">
              <span>{translations.preparing}</span>
            </div>
          </div>
        </div>
      </div>

      {pendingConfirmations.length > 0 && (
        <div className="view-donations-section">
          <h3 className="view-donations-section-title">
            {translations.confirm_donations}
          </h3>

          <div className="view-donations-list">
            {pendingConfirmations.map(donation => (
              <div className="view-donations-item" key={donation.id}>
                <div className="view-donations-details">
                  <div className="view-donations-type">
                    <span className="view-donations-count">
                      {/* Simply use the type as is, without translation */}
                      {donation.count} {donation.type}
                    </span>
                  </div>
                </div>
                <button 
                  className="view-donations-confirm-btn"
                  onClick={() => handleConfirmDonation(donation.id)}
                >
                  <span>{translations.confirm}</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="view-donations-section">
        <h3 className="view-donations-section-title">
          {translations.all_donations}
        </h3>

        <div className="view-donations-list">
          {allDonations.map(donation => (
            <div className="view-donations-item view-donations-all-item" key={donation.id}>
              <div className="view-donations-all-details">
                <div className="view-donations-type">
                  <span className="view-donations-name">
                    {/* Use the English type directly */}
                    {donation.type}
                  </span>
                </div>
                <div className="view-donations-counts">
                  <span>{translations.requested_amount}: {donation.requested} | </span>
                  <span>{translations.received_amount}: {donation.received}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="view-donations-contact">
        <p style={{ textAlign: 'center', padding: '15px 0' }}>
          <span>{translations.need_help_contact_us} </span>
          <span className="view-donations-contact-number">0789200730</span>
        </p>
      </div>
    </div>
  );
};

export default ViewDonations;
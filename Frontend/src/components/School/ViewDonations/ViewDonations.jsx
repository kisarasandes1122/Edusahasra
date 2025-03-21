import React, { useState } from 'react';
import { FaArrowLeft } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import './ViewDonations.css';

const ViewDonations = () => {
  const navigate = useNavigate();
  
  // Initial state for donations that need confirmation
  const [pendingConfirmations, setPendingConfirmations] = useState([
    {
      id: 1,
      type: 'පොතක් ගෙන්',
      nameEn: 'Notebooks',
      count: 30
    },
    {
      id: 2,
      type: 'පැන්/පැන්සල්',
      nameEn: 'Pens/Pencils',
      count: 40
    }
  ]);
  
  // Initial state for all donations
  const [allDonations, setAllDonations] = useState([
    {
      id: 1,
      type: 'පොතක් ගෙන්',
      nameEn: 'Notebooks',
      requested: 60,
      received: 30
    },
    {
      id: 2,
      type: 'පැන්/පැන්සල්',
      nameEn: 'Pens/Pencils',
      requested: 60,
      received: 30
    },
    {
      id: 3,
      type: 'පාට පැන්සල්',
      nameEn: 'Crayons',
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
        if (donation.nameEn === donationToConfirm.nameEn) {
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
          <h1 className="donations-title-sinhala">පරිත්‍යාග බලන්න</h1>
          <h2 className="donations-title-english">View Donations</h2>
        </div>
      </header>

      <div className="donations-back-btn-container">
        <button className="donations-back-btn" onClick={handleBack}>
          <FaArrowLeft className="back-icon" />
          <span>ආපසු</span>
        </button>
      </div>

      <div className="donations-section">
        <h3 className="section-title">
          <span className="title-sinhala">ළඟ එන පරිත්‍යාග | </span>
          <span className="title-english">Upcoming Donations</span>
        </h3>

        <div className="donation-list">
          <div className="donation-item">
            <div className="donation-details">
              <div className="donation-type">
                <span className="donation-count">30 පොතක් ගෙන් | </span>
                <span className="donation-name">Notebooks</span>
              </div>
              <div className="donation-date">
                අපේක්ෂිත ලැබීමට: ජූනි 24, 2025
              </div>
            </div>
            <div className="donation-status transit">
              <span>ගමනේ - In Transit</span>
            </div>
          </div>

          <div className="donation-item">
            <div className="donation-details">
              <div className="donation-type">
                <span className="donation-count">40 පැන්/පැන්සල් | </span>
                <span className="donation-name">Pens/Pencils</span>
              </div>
              <div className="donation-date">
                අපේක්ෂිත ලැබීමට: ජූනි 24, 2025
              </div>
            </div>
            <div className="donation-status preparing">
              <span>සූදානම් කරමින් - Preparing</span>
            </div>
          </div>
        </div>
      </div>

      {pendingConfirmations.length > 0 && (
        <div className="donations-section">
          <h3 className="section-title">
            <span className="title-sinhala">පරිත්‍යාග තහවුරු කරන්න | </span>
            <span className="title-english">Confirm Donations</span>
          </h3>

          <div className="donation-list">
            {pendingConfirmations.map(donation => (
              <div className="donation-item" key={donation.id}>
                <div className="donation-details">
                  <div className="donation-type">
                    <span className="donation-count">{donation.count} {donation.type} | </span>
                    <span className="donation-name">{donation.nameEn}</span>
                  </div>
                </div>
                <button 
                  className="donation-confirm-btn"
                  onClick={() => handleConfirmDonation(donation.id)}
                >
                  <span>තහවුරු කරන්න - Confirm</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="donations-section">
        <h3 className="section-title">
          <span className="title-sinhala">සියළුම පරිත්‍යාග | </span>
          <span className="title-english">All Donations</span>
        </h3>

        <div className="donation-list">
          {allDonations.map(donation => (
            <div className="donation-item all-donation" key={donation.id}>
              <div className="all-donation-details">
                <div className="donation-type">
                  <span className="donation-name">{donation.type} | {donation.nameEn}</span>
                </div>
                <div className="donation-counts">
                  <span>ඉල්ලූ ප්‍රමාණය: {donation.requested} | </span>
                  <span>ලැබුණු ප්‍රමාණය: {donation.received} </span>
                  <span className="donation-summary">(Requested: {donation.requested} | Received: {donation.received})</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="donations-contact">
        <p>
          <span className="contact-sinhala">දැවේ අවශ්‍යද? අපට කතා කරන්න : </span>
          <span className="contact-number">0789200730</span>
        </p>
      </div>
    </div>
  );
};

export default ViewDonations;
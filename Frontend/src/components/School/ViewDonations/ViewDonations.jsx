import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import './ViewDonations.css';

const ViewDonations = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const upcomingDonations = [
    {
      id: 1,
      item: 'notebooks',
      quantity: 30,
      expectedDate: 'June 24, 2025',
      status: 'in_transit'
    },
    {
      id: 2,
      item: 'pens_pencils',
      quantity: 40,
      expectedDate: 'June 24, 2025',
      status: 'preparing'
    }
  ];

  const donationsToConfirm = [
    {
      id: 1,
      item: 'notebooks',
      quantity: 30
    },
    {
      id: 2,
      item: 'pens_pencils',
      quantity: 40
    }
  ];

  const allDonations = [
    {
      id: 1,
      item: 'notebooks',
      requestedAmount: 60,
      receivedAmount: 30
    },
    {
      id: 2,
      item: 'pens_pencils',
      requestedAmount: 60,
      receivedAmount: 30
    },
    {
      id: 3,
      item: 'crayons',
      requestedAmount: 60,
      receivedAmount: 30
    }
  ];

  const handleConfirm = (id) => {
    console.log('Confirmed donation', id);
    // Implement confirmation logic here
  };

  const handleBack = () => {
    navigate('/dashboard');
  };

  return (
    <div className="view-donations-container">
      <h1>{t('view_donations')}</h1>
      
      <button className="back-button" onClick={handleBack}>
        <span>←</span> {t('back')}
      </button>

      <div className="donations-section">
        <h2>{t('upcoming_donations')}</h2>
        <div className="donations-list">
          {upcomingDonations.map((donation) => (
            <div key={donation.id} className="donation-item">
              <div className="donation-details">
                <p className="donation-quantity">{donation.quantity} {t(donation.item)}</p>
                <p className="donation-date">{t('expected_to_receive')}: {donation.expectedDate}</p>
              </div>
              <div className={`status-label ${donation.status}`}>
                {t(donation.status)}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="donations-section">
        <h2>{t('confirm_donations')}</h2>
        <div className="donations-list">
          {donationsToConfirm.map((donation) => (
            <div key={donation.id} className="donation-item">
              <div className="donation-details">
                <p className="donation-quantity">{donation.quantity} {t(donation.item)}</p>
              </div>
              <button 
                className="confirm-button"
                onClick={() => handleConfirm(donation.id)}
              >
                {t('confirm')}
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="donations-section">
        <h2>{t('all_donations')}</h2>
        <div className="donations-list">
          {allDonations.map((donation) => (
            <div key={donation.id} className="donation-item">
              <div className="donation-details">
                <p className="donation-name">{t(donation.item)}</p>
                <p className="donation-amounts">
                  {t('requested_amount')}: {donation.requestedAmount} | {t('received_amount')}: {donation.receivedAmount}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ViewDonations;
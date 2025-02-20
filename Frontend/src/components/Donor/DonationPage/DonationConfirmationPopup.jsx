import React from 'react';
import './DonationConfirmationPopup.css';

const DonationConfirmationPopup = ({ isVisible, onClose, deliveryMode, donationId, items }) => {
  if (!isVisible) return null;

  const isPartnerDelivery = deliveryMode === 'partner';
  const totalItems = Object.values(items).reduce((sum, qty) => sum + qty, 0);
  
  // Current date for comparison
  const pickupDate = new Date();
  pickupDate.setDate(pickupDate.getDate() + 5); // 5 days from now
  
  const deliveryDate = new Date();
  deliveryDate.setDate(deliveryDate.getDate() + 15); // 15 days from now
  
  // Format dates
  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Function to handle home navigation
  const handleHomeNavigation = () => {
    // Close the popup first (optional, depending on your needs)
    if (onClose) onClose();
    // Redirect to home page
    window.location.href = '/';
  };

  return (
    <div className="confirmPopup__overlay">
      <div className="confirmPopup__container">
        <div className="confirmPopup__content">
          {/* Checkmark Icon */}
          <div className="confirmPopup__iconWrapper">
            <svg className="confirmPopup__checkIcon" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" fill="currentColor" />
            </svg>
          </div>
          
          {/* Thank You Message */}
          <h2 className="confirmPopup__title">Thank You for Your Donation!</h2>
          <p className="confirmPopup__message">Your donations has been confirmed. The school will be notified.</p>
          
          {/* Tracking Details */}
          <div className="confirmPopup__trackingSection">
            <h3 className="confirmPopup__trackingTitle">Tracking Details</h3>
            <div className="confirmPopup__trackingDetails">
              <p className="confirmPopup__trackingItem">Donation ID : #{donationId || 'D13GD36'}</p>
              <p className="confirmPopup__trackingItem">Delivery Mode : {isPartnerDelivery ? 'Logistic Service' : 'Self Delivery'}</p>
              
              {isPartnerDelivery ? (
                <>
                  <p className="confirmPopup__trackingItem">Pickup Date : {formatDate(pickupDate)}</p>
                  <p className="confirmPopup__trackingItem">Estimated Delivery Date: {formatDate(deliveryDate)}</p>
                </>
              ) : (
                <p className="confirmPopup__trackingItem">Please deliver the donation within 1-2 weeks.</p>
              )}
            </div>
          </div>
          
          {/* Back Home Button */}
          <button 
            onClick={handleHomeNavigation}
            className="confirmPopup__backButton"
          >
            Back Home
          </button>
        </div>
      </div>
    </div>
  );
};

export default DonationConfirmationPopup;
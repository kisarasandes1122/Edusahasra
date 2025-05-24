import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './DonationConfirmationPopup.css';

const DonationConfirmationPopup = ({ isVisible, onClose, deliveryMode, donationId, items }) => {
  const navigate = useNavigate();

  useEffect(() => {
    if (isVisible) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isVisible]);

  if (!isVisible) {
    return null;
  }

  const isPartnerDelivery = deliveryMode === 'partner';

  const pickupDate = new Date();
  pickupDate.setDate(pickupDate.getDate() + 3);

  const deliveryDate = new Date();
  deliveryDate.setDate(deliveryDate.getDate() + 15);

  const formatDate = (date) => {
    if (!date || !(date instanceof Date)) {
       console.error("Invalid date passed to formatDate:", date);
       return "Invalid Date";
    }
    try {
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    } catch (error) {
        console.error("Error formatting date:", error);
        return "Formatting Error";
    }
  };

  const handleHomeNavigation = () => {
    if (onClose) onClose();
    navigate('/');
  };

  return (
    <div className="confirmPopup__overlay" onClick={onClose}>
      <div className="confirmPopup__container" onClick={(e) => e.stopPropagation()}>
        <div className="confirmPopup__content">
          <div className="confirmPopup__iconWrapper">
            <svg className="confirmPopup__checkIcon" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" fill="currentColor" />
            </svg>
          </div>

          <h2 className="confirmPopup__title">Thank You for Your Donation!</h2>
          <p className="confirmPopup__message">Your donation commitment has been recorded. The school will be notified.</p>

          <div className="confirmPopup__trackingSection">
            <h3 className="confirmPopup__trackingTitle">Donation Details</h3>
            <div className="confirmPopup__trackingDetails">
              <p className="confirmPopup__trackingItem">Donation ID: #{donationId || 'N/A'}</p>
              <p className="confirmPopup__trackingItem">Delivery Mode: {isPartnerDelivery ? 'Partner Logistic Service' : 'Self Delivery'}</p>

              {isPartnerDelivery ? (
                <>
                  <p className="confirmPopup__trackingItem">Estimated Pickup Date: {formatDate(pickupDate)}</p>
                  <p className="confirmPopup__trackingItem">Estimated Delivery Date: {formatDate(deliveryDate)}</p>
                  <p className="confirmPopup__trackingItem" style={{fontSize: '0.9em', color: '#555', marginTop: '5px'}}>(Courier will contact you to arrange pickup)</p>
                </>
              ) : (
                <p className="confirmPopup__trackingItem">Please deliver the donation to the school within 1-2 weeks.</p>
              )}
            </div>
          </div>

          <button
            onClick={handleHomeNavigation}
            className="confirmPopup__backButton"
          >
            Back to Home
          </button>
        </div>
      </div>
    </div>
  );
};

export default DonationConfirmationPopup;
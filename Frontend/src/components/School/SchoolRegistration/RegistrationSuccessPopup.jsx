import React from 'react';
import { FaCheckCircle } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import './RegistrationSuccessPopup.css';

const RegistrationSuccessPopup = ({ isVisible }) => {
  const navigate = useNavigate();

  const handleBackToHome = () => {
    navigate('/');
  };

  if (!isVisible) {
    return null;
  }

  return (
    <div className="rs_overlay">
      <div className="rs_popup">
        <div className="rs_success_icon">
          <FaCheckCircle size={60} color="#4CAF50" />
        </div>
        <h2 className="rs_title">Registration Completed!</h2>
        <div className="rs_message">
          <p>
            Thank you for registering your school with us. Your application has been received and is now being processed.
          </p>
          <p className="rs_verification_note">
            Verification takes 24 to 72 hours. You will receive an email once your account is approved. After that, you can log into your account using the email and password you provided.
          </p>
        </div>
        <button 
          className="rs_back_home_button" 
          onClick={handleBackToHome}
        >
          Back to Home
        </button>
      </div>
    </div>
  );
};

export default RegistrationSuccessPopup;
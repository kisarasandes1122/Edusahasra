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
        <h2 className="rs_title">Registration Completed! | ලියාපදිංචිය සම්පූර්ණයි!</h2>
        <div className="rs_message">
          <p>
            Thank you for registering your school with us. Your application has been received and is now being processed. | ඔබගේ පාසල අප සමඟ ලියාපදිංචි කිරීම ගැන ස්තූතියි. ඔබගේ අයදුම්පත ලැබී දැන් සකසමින් පවතී.
          </p>
          <p className="rs_verification_note">
            Verification takes 24 to 72 hours. You will receive an email once your account is approved. After that, you can log into your account using the email and password you provided. | තහවුරු කිරීම පැය 24 සිට 72 දක්වා ගත වේ. ඔබගේ ගිණුම අනුමත වූ පසු ඔබට විද්‍යුත් තැපෑලක් ලැබෙනු ඇත. ඉන් පසු, ඔබ ලබා දුන් විද්‍යුත් තැපෑල සහ මුරපදය භාවිතයෙන් ඔබගේ ගිණුමට පිවිසිය හැකිය.
          </p>
        </div>
        <button 
          className="rs_back_home_button" 
          onClick={handleBackToHome}
        >
          Back to Home | මුල් පිටුවට
        </button>
      </div>
    </div>
  );
};

export default RegistrationSuccessPopup;
import React, { useState } from 'react';
import { FaArrowLeft, FaPlus, FaCheck } from 'react-icons/fa';
import './SendThanks.css';

const SendThanks = () => {
  const [selectedDonor, setSelectedDonor] = useState(0);

  const donors = [
    {
      id: 1,
      name: 'Kisara Sandes',
      donated: '40 Notebooks, 50 Pencils',
      date: 'March 10, 2025'
    },
    {
      id: 2,
      name: 'Kisara Sandes',
      donated: '40 Notebooks, 50 Pencils',
      date: 'March 10, 2025'
    },
    {
      id: 3,
      name: 'Kisara Sandes',
      donated: '40 Notebooks, 50 Pencils',
      date: 'March 10, 2025'
    }
  ];

  const thankYouMessages = [
    {
      sinhala: 'පොතත් පෑන් සහ පැන්සල් දුන්න ස්තුතියි අපෙ ශිෂ්‍ය වට ගොඩක් භාවිතා කරනු ඇත.',
      english: 'Thank you for the notebooks and pencils! Our students will use them well.'
    },
    {
      sinhala: 'මෙම පාසල් ද්‍රව්‍ය අපගේ පන්ති කාමරවල ඇති වෙනසක් කරනු ඇත. ඔබගේ කාරුණාව ස්තුතියි!',
      english: 'These school supplies will make a real difference in our classrooms. Thank you for your kindness!'
    },
    {
      sinhala: 'ඔබගේ තෝරාගත් පරිත්‍යාගය ගැන ඔබට වෙතින්. අපගේ පාසැල සහයෝගය දැක්වීම ගැන ස්තුතියි!',
      english: 'We are grateful for your generous donation. Thank you for supporting our school!'
    },
    {
      sinhala: 'ඔබගේ සහයෝගයට බොහොම ස්තුතියි! මෙම සැපයුම් අපට ලොකු උදව්වක් වන ඇත.',
      english: 'Thank you very much for your support! These supplies will be a great help to us.'
    }
  ];

  return (
    <div className="send-thanks-container">
      <header className="send-thanks-header">
        <div className="send-thanks-title">
          <h1 className="send-thanks-title-sinhala">ස්තුතිය ප්‍රකාශන්න</h1>
          <h2 className="send-thanks-title-english">Send Thanks</h2>
        </div>
      </header>

      <div className="send-thanks-content">
        <a href="/dashboard" className="back-button">
          <FaArrowLeft className="back-icon" />
          <span>ආපසු</span>
        </a>

        <div className="instruction-box">
          <p className="instruction-sinhala">
            ඔබේ පාසලට සැපයුම් යැවූ පරිත්‍යාගශීලියෙකු තෝරන්න. ඔවුන්ට ස්තුති පණිවුඩයක් සහ 
            ඡායාරූප යවන්න. ඔබගේ ස්තුතිය පරිත්‍යාගශීලීන් අගය කරන අතර තවත් සහයෝගීත්වය 
            දිරිගන්වයි
          </p>
          <p className="instruction-english">
            Choose a donor who sent supplies to your school. Send them a thank you message and a photo. Your
            thanks helps donors feel appreciated and encourages more support.
          </p>
        </div>

        <div className="thankyou-form-container">
          <h3 className="form-heading">
            <span className="heading-sinhala">පරිත්‍යාගශීලීන්ට ස්තුතිය යවන්න | </span>
            <span className="heading-english">Send Thanks to Donors</span>
          </h3>

          <div className="donor-selection-section">
            <p className="selection-heading-sinhala">ස්තුති කිරීමට අදහස පරිත්‍යාගශීලියෙකු තෝරන්න</p>
            <p className="selection-heading-english">Select Donor to Thank:</p>

            <div className="donors-list">
              {donors.map((donor, index) => (
                <div 
                  key={donor.id} 
                  className={`donor-item ${selectedDonor === index ? 'selected' : ''}`}
                  onClick={() => setSelectedDonor(index)}
                >
                  <div className="donor-info">
                    <h4 className="donor-name">{donor.name}</h4>
                    <p className="donor-donated">Donated: {donor.donated}</p>
                    <p className="donor-date">Date: {donor.date}</p>
                  </div>
                  <div className={`select-circle ${selectedDonor === index ? 'selected' : ''}`}>
                    {selectedDonor === index && <FaCheck className="check-icon" />}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="message-selection-section">
            <p className="message-heading-sinhala">ස්තුතිය ප්‍රකාශ කරන්න</p>
            <p className="message-heading-english">Say Thank You:</p>

            <div className="message-options">
              {thankYouMessages.map((message, index) => (
                <div key={index} className="message-option">
                  <p className="message-text-sinhala">{message.sinhala}</p>
                  <p className="message-text-english">{message.english}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="photo-upload-section">
            <button className="photo-upload-button">
              <FaPlus className="plus-icon" />
              <div className="button-text">
                <span className="button-text-sinhala">ඡායාරූපයක් එකතු කරන්න (විකල්ප)</span>
                <span className="button-text-english">Add Photo (Optional)</span>
              </div>
            </button>
          </div>

          <button className="send-thanks-button">
            <span className="button-text-sinhala">ස්තුතිය යවන්න</span>
            <span className="button-text-english">Send Thank You</span>
          </button>
        </div>

        <div className="support-contact">
          <p>
            <span className="contact-sinhala">උදව් අවශ්‍යද? අපිට කථා කරන්න : </span>
            <span className="contact-number">0789200730</span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default SendThanks;
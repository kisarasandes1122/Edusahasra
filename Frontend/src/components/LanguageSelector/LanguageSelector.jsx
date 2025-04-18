import React from 'react';
import { useLanguage } from './LanguageContext'; // Import languages object is not needed here anymore
import './LanguageSelector.css';

const LanguageSelector = () => {
  // Destructure languages directly from the useLanguage hook
  const { currentLanguage, changeLanguage, languages } = useLanguage();

  const handleLanguageChange = (e) => {
    changeLanguage(e.target.value);
  };

  return (
    <div className="Scl-language-selector">
      {/* Add aria-label for accessibility */}
      <select
        value={currentLanguage}
        onChange={handleLanguageChange}
        className="language-select"
        aria-label="Select language"
      >
        {/* Use Object.entries for potentially easier access to code and name */}
        {Object.entries(languages).map(([langCode, langDetails]) => (
          <option key={langCode} value={langCode}>
            {langDetails.name} {/* Display the language name */}
          </option>
        ))}
      </select>
    </div>
  );
};

export default LanguageSelector;
import React from 'react';
import { useLanguage } from './LanguageContext';
import './LanguageSelector.css';

const LanguageSelector = () => {
  const { currentLanguage, changeLanguage, languages } = useLanguage();

  const handleLanguageChange = (e) => {
    changeLanguage(e.target.value);
  };

  return (
    <div className="Scl-language-selector">
      <select
        value={currentLanguage}
        onChange={handleLanguageChange}
        className="language-select"
        aria-label="Select language"
      >
        {Object.entries(languages).map(([langCode, langDetails]) => (
          <option key={langCode} value={langCode}>
            {langDetails.name}
          </option>
        ))}
      </select>
    </div>
  );
};

export default LanguageSelector;
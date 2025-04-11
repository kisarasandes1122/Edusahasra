import React from 'react';
import { useLanguage, languages } from './LanguageContext';
import './LanguageSelector.css';

const LanguageSelector = () => {
  const { currentLanguage, changeLanguage } = useLanguage();

  const handleLanguageChange = (e) => {
    changeLanguage(e.target.value);
  };

  return (
    <div className="language-selector">
      <select 
        value={currentLanguage} 
        onChange={handleLanguageChange} 
        className="language-select"
      >
        {Object.keys(languages).map((langCode) => (
          <option key={langCode} value={langCode}>
            {languages[langCode].name}
          </option>
        ))}
      </select>
    </div>
  );
};

export default LanguageSelector;
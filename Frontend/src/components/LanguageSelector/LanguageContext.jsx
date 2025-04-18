import React, { createContext, useState, useContext, useEffect } from 'react';
import enTranslations from '../../translations/en.json';
import siTranslations from '../../translations/si.json';

// Create the context
const LanguageContext = createContext();

// Available languages
export const languages = {
  en: {
    code: 'en',
    name: 'English',
    translations: enTranslations
  },
  si: {
    code: 'si',
    name: 'සිංහල', // Sinhala
    translations: siTranslations
  }
};

// Provider component
export const LanguageProvider = ({ children }) => {
  // Get initial language from localStorage or default to Sinhala
  const [currentLanguage, setCurrentLanguage] = useState(() => {
    const savedLanguage = localStorage.getItem('language');
    // Ensure the saved language is one of the available keys
    return savedLanguage && languages[savedLanguage] ? savedLanguage : 'si';
  });

  // Get translations for current language or default to 'si' if something goes wrong
  const translations = languages[currentLanguage]?.translations || languages.si.translations;

  // Function to change language
  const changeLanguage = (langCode) => {
    if (languages[langCode]) {
      setCurrentLanguage(langCode);
      localStorage.setItem('language', langCode);
    } else {
      // Fallback if an invalid langCode is somehow passed
      console.warn(`Attempted to change to unsupported language: ${langCode}`);
      setCurrentLanguage('si');
      localStorage.setItem('language', 'si');
    }
  };

  // When language changes, update document language
  useEffect(() => {
    document.documentElement.lang = currentLanguage;
  }, [currentLanguage]);

  return (
    <LanguageContext.Provider value={{
      currentLanguage,
      changeLanguage,
      translations,
      languages // Expose available languages object
    }}>
      {children}
    </LanguageContext.Provider>
  );
};

// Custom hook to use the language context
export const useLanguage = () => useContext(LanguageContext);

// Default export is the context itself, if needed elsewhere directly
export default LanguageContext;
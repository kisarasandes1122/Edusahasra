import React, { createContext, useState, useContext, useEffect } from 'react';
import enTranslations from '../../translations/en.json';
import siTranslations from '../../translations/si.json';

const LanguageContext = createContext();

export const languages = {
  en: {
    code: 'en',
    name: 'English',
    translations: enTranslations
  },
  si: {
    code: 'si',
    name: 'සිංහල',
    translations: siTranslations
  }
};

export const LanguageProvider = ({ children }) => {
  const [currentLanguage, setCurrentLanguage] = useState(() => {
    const savedLanguage = localStorage.getItem('language');
    return savedLanguage && languages[savedLanguage] ? savedLanguage : 'si';
  });

  const translations = languages[currentLanguage]?.translations || languages.si.translations;

  const changeLanguage = (langCode) => {
    if (languages[langCode]) {
      setCurrentLanguage(langCode);
      localStorage.setItem('language', langCode);
    } else {
      console.warn(`Attempted to change to unsupported language: ${langCode}`);
      setCurrentLanguage('si');
      localStorage.setItem('language', 'si');
    }
  };

  useEffect(() => {
    document.documentElement.lang = currentLanguage;
  }, [currentLanguage]);

  return (
    <LanguageContext.Provider value={{
      currentLanguage,
      changeLanguage,
      translations,
      languages
    }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);

export default LanguageContext;
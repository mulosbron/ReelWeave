import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

const LanguageSelector = () => {
  const { i18n, t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const languages = [
    { code: 'en', name: t('language.english') },
    { code: 'tr', name: t('language.turkish') }
  ];

  const changeLanguage = (langCode) => {
    i18n.changeLanguage(langCode);
    setIsOpen(false);
  };

  // Click dışında dropdown'u kapat
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Body scroll'u durdur (mobil için)
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);
  
  // Backdrop tıklaması ile menüyü kapat
  const handleBackdropClick = () => {
    setIsOpen(false);
  };

  // Mevcut dili bul
  const currentLanguage = languages.find(lang => lang.code === i18n.language) || languages[0];

  return (
    <div className="language-selector" ref={dropdownRef}>
      <button 
        className="language-selector-toggle" 
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
      >
        <span className="language-icon">🌐</span>
        <span className="language-text">{currentLanguage.name}</span>
      </button>
      
      {isOpen && (
        <>
          <div className="dropdown-backdrop" onClick={handleBackdropClick}></div>
          <div className="language-dropdown">
            <ul>
              {languages.map((language) => (
                <li key={language.code}>
                  <button
                    className={`language-option ${language.code === i18n.language ? 'active' : ''}`}
                    onClick={() => changeLanguage(language.code)}
                  >
                    {language.name}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </>
      )}
    </div>
  );
};

export default LanguageSelector; 
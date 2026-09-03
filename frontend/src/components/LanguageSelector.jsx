import React, { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';

const LanguageSelector = ({ style = {} }) => {
  const { language, setLanguage, supportedLanguages, getCurrentLanguage } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);

  const handleLanguageChange = (langCode) => {
    setLanguage(langCode);
    setIsOpen(false);
  };

  const currentLang = getCurrentLanguage();

  return (
    <div style={{ ...selectorStyle, ...style }}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={buttonStyle}
        className="language-selector-button"
      >
        <span style={flagStyle}>{currentLang.flag}</span>
        <span style={labelStyle}>{currentLang.nativeName}</span>
        <span style={arrowStyle}>{isOpen ? '▲' : '▼'}</span>
      </button>

      {isOpen && (
        <div style={dropdownStyle} className="language-dropdown">
          {supportedLanguages.map((lang) => (
            <button
              key={lang.code}
              onClick={() => handleLanguageChange(lang.code)}
              style={{
                ...optionStyle,
                ...(lang.code === language ? activeOptionStyle : {})
              }}
              className="language-option"
            >
              <span style={flagStyle}>{lang.flag}</span>
              <div style={optionTextStyle}>
                <span style={nativeNameStyle}>{lang.nativeName}</span>
                <span style={englishNameStyle}>{lang.label}</span>
              </div>
              {lang.code === language && <span style={checkStyle}>✓</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

const selectorStyle = {
  position: 'relative',
  display: 'inline-block',
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, sans-serif',
  marginLeft: '0.8rem'
};

const buttonStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.35rem',
  padding: '0.4rem 0.7rem',
  backgroundColor: 'white',
  border: '2px solid #e8e8e8',
  borderRadius: '8px',
  cursor: 'pointer',
  fontSize: '0.75rem',
  fontWeight: '600',
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  boxShadow: '0 2px 6px rgba(0,0,0,0.08)',
  color: '#2e7d32'
};

const flagStyle = {
  fontSize: '1rem',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '1.2rem',
  height: '1.2rem'
};

const labelStyle = {
  flex: 1,
  textAlign: 'left',
  fontWeight: '600',
  color: '#2e7d32'
};

const arrowStyle = {
  fontSize: '0.6rem',
  color: '#2e7d32',
  transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  marginLeft: '0.3rem'
};

const dropdownStyle = {
  position: 'absolute',
  top: '100%',
  left: 0,
  right: 0,
  backgroundColor: 'white',
  border: 'none',
  borderRadius: '12px',
  boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
  zIndex: 1000,
  marginTop: '0.6rem',
  overflow: 'hidden',
  minWidth: '200px',
  backdropFilter: 'blur(10px)'
};

const optionStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.6rem',
  padding: '0.75rem 1rem',
  width: '100%',
  border: 'none',
  backgroundColor: 'white',
  cursor: 'pointer',
  fontSize: '0.8rem',
  transition: 'all 0.2s ease',
  textAlign: 'left',
  borderBottom: '1px solid #f0f0f0'
};

const activeOptionStyle = {
  backgroundColor: '#f0f9f4',
  color: '#1b5e20',
  borderLeft: '4px solid #2e7d32',
  paddingLeft: 'calc(1rem - 4px)'
};

const optionTextStyle = {
  display: 'flex',
  flexDirection: 'column',
  flex: 1
};

const nativeNameStyle = {
  fontWeight: '600',
  fontSize: '0.85rem',
  color: '#1a1a1a'
};

const englishNameStyle = {
  fontSize: '0.7rem',
  color: '#999',
  marginTop: '0.1rem',
  fontWeight: '400'
};

const checkStyle = {
  color: '#2e7d32',
  fontWeight: 'bold',
  fontSize: '1rem',
  marginLeft: 'auto',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center'
};

// Add hover effects
const style = document.createElement('style');
style.textContent = `
  .language-selector-button:hover {
    border-color: #2e7d32 !important;
    box-shadow: 0 4px 12px rgba(46, 125, 50, 0.1) !important;
    background-color: #fafafa !important;
    transform: translateY(-1px);
  }
  
  .language-selector-button:active {
    transform: translateY(0);
  }
  
  .language-option:not(.active):hover {
    background-color: #f8f9fa !important;
  }
  
  .language-option:last-child {
    border-bottom: none !important;
  }
`;
document.head.appendChild(style);

export default LanguageSelector;

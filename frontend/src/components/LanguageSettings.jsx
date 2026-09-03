import React, { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';

const LanguageSettings = () => {
  const { language, setLanguage, supportedLanguages, getCurrentLanguage, t } = useLanguage();
  const [showDetails, setShowDetails] = useState(false);

  const handleLanguageChange = (langCode) => {
    setLanguage(langCode);
    // Show confirmation
    const lang = supportedLanguages.find(l => l.code === langCode);
    alert(`Language changed to ${lang.nativeName}`);
  };

  return (
    <div style={containerStyle}>
      <div style={headerStyle}>
        <h3 style={titleStyle}>{t('language_preferences')}</h3>
        <p style={subtitleStyle}>{t('choose_language')}</p>
      </div>

      <div style={currentLangStyle}>
        <div style={currentLangHeaderStyle}>
          <span style={flagStyle}>{getCurrentLanguage().flag}</span>
          <div>
            <div style={currentLangNameStyle}>{getCurrentLanguage().nativeName}</div>
            <div style={currentLangSubStyle}>{t('current_language')}</div>
          </div>
        </div>
      </div>

      <div style={languageGridStyle}>
        {supportedLanguages.map((lang) => (
          <div
            key={lang.code}
            onClick={() => handleLanguageChange(lang.code)}
            style={{
              ...languageCardStyle,
              ...(lang.code === language ? activeCardStyle : {})
            }}
            className="language-card"
          >
            <div style={cardFlagStyle}>{lang.flag}</div>
            <div style={cardTextStyle}>
              <div style={cardNativeStyle}>{lang.nativeName}</div>
              <div style={cardEnglishStyle}>{lang.label}</div>
            </div>
            {lang.code === language && (
              <div style={selectedBadgeStyle}>✓</div>
            )}
          </div>
        ))}
      </div>

      <div style={detailsStyle}>
        <button
          onClick={() => setShowDetails(!showDetails)}
          style={detailsButtonStyle}
        >
          {showDetails ? t('close_chat') : t('select_language')}
        </button>

        {showDetails && (
          <div style={detailsContentStyle}>
            <h4 style={detailsTitleStyle}>{t('language_information')}</h4>
            <div style={infoGridStyle}>
              <div style={infoItemStyle}>
                <strong>{t('current_label')}</strong> {getCurrentLanguage().nativeName}
              </div>
              <div style={infoItemStyle}>
                <strong>{t('code_label')}</strong> {language}
              </div>
              <div style={infoItemStyle}>
                <strong>{t('available_label')}</strong> {supportedLanguages.length} {t('languages_count')}
              </div>
              <div style={infoItemStyle}>
                <strong>{t('auto_detect_label')}</strong> {t('browser_language_detection')}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const containerStyle = {
  backgroundColor: 'white',
  borderRadius: '16px',
  padding: '2rem',
  boxShadow: '0 8px 24px rgba(0,0,0,0.1)',
  maxWidth: '600px',
  margin: '2rem auto'
};

const headerStyle = {
  textAlign: 'center',
  marginBottom: '2rem'
};

const titleStyle = {
  fontSize: '1.8rem',
  fontWeight: 'bold',
  color: '#2e7d32',
  margin: '0 0 0.5rem 0'
};

const subtitleStyle = {
  color: '#666',
  fontSize: '1rem',
  margin: 0
};

const currentLangStyle = {
  backgroundColor: '#e8f5e8',
  borderRadius: '12px',
  padding: '1.5rem',
  marginBottom: '2rem',
  border: '2px solid #2e7d32'
};

const currentLangHeaderStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '1rem'
};

const flagStyle = {
  fontSize: '2rem'
};

const currentLangNameStyle = {
  fontSize: '1.3rem',
  fontWeight: 'bold',
  color: '#2e7d32'
};

const currentLangSubStyle = {
  fontSize: '0.9rem',
  color: '#666'
};

const languageGridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
  gap: '1rem',
  marginBottom: '2rem'
};

const languageCardStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '1rem',
  padding: '1.5rem',
  border: '2px solid #e0e0e0',
  borderRadius: '12px',
  cursor: 'pointer',
  transition: 'all 0.3s ease',
  position: 'relative'
};

const activeCardStyle = {
  borderColor: '#2e7d32',
  backgroundColor: '#f8fff8',
  transform: 'translateY(-2px)',
  boxShadow: '0 4px 12px rgba(46, 125, 50, 0.2)'
};

const cardFlagStyle = {
  fontSize: '1.5rem'
};

const cardTextStyle = {
  flex: 1
};

const cardNativeStyle = {
  fontSize: '1.1rem',
  fontWeight: '600',
  color: '#333'
};

const cardEnglishStyle = {
  fontSize: '0.9rem',
  color: '#666'
};

const selectedBadgeStyle = {
  position: 'absolute',
  top: '0.5rem',
  right: '0.5rem',
  backgroundColor: '#2e7d32',
  color: 'white',
  borderRadius: '50%',
  width: '24px',
  height: '24px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: '0.8rem',
  fontWeight: 'bold'
};

const detailsStyle = {
  borderTop: '1px solid #e0e0e0',
  paddingTop: '1.5rem'
};

const detailsButtonStyle = {
  backgroundColor: '#f8f9fa',
  border: '1px solid #e0e0e0',
  borderRadius: '8px',
  padding: '0.75rem 1.5rem',
  cursor: 'pointer',
  fontSize: '0.9rem',
  color: '#666',
  transition: 'all 0.3s ease'
};

const detailsContentStyle = {
  marginTop: '1rem',
  padding: '1rem',
  backgroundColor: '#f8f9fa',
  borderRadius: '8px'
};

const detailsTitleStyle = {
  fontSize: '1rem',
  fontWeight: '600',
  color: '#333',
  marginBottom: '1rem'
};

const infoGridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
  gap: '0.5rem'
};

const infoItemStyle = {
  fontSize: '0.9rem',
  color: '#666'
};

// Add hover effects
const style = document.createElement('style');
style.textContent = `
  .language-card:hover {
    border-color: #2e7d32 !important;
    transform: translateY(-2px) !important;
    box-shadow: 0 4px 12px rgba(46, 125, 50, 0.15) !important;
  }
`;
document.head.appendChild(style);

export default LanguageSettings;

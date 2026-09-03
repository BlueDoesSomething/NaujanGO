import React, { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';

const Contact = () => {
  const { t } = useLanguage();
  const [formData, setFormData] = useState({ name: '', email: '', subject: '', message: '' });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 3000);
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div style={pageStyle}>
      {/* Hero Section */}
      <section style={heroSection}>
        <div style={container}>
          <h1 style={heroTitle}>{t('get_in_touch')}</h1>
          <p style={heroSubtitle}>{t('contact_text')}</p>
        </div>
      </section>

      {/* Contact Content */}
      <section style={contentSection}>
        <div style={container}>
          <div style={contactGrid}>
            {/* Contact Form */}
            <div style={formSection}>
              <h2 style={sectionTitle}>{t('send_message')}</h2>
              {submitted && (
                <div style={successMessage}>
                  {t('form_submit_success')}
                </div>
              )}
              <form onSubmit={handleSubmit} style={form}>
                <div style={inputGroup}>
                  <input
                    type="text"
                    name="name"
                    placeholder={t('your_name')}
                    value={formData.name}
                    onChange={handleChange}
                    style={inputStyle}
                    required
                  />
                  <input
                    type="email"
                    name="email"
                    placeholder={t('your_email')}
                    value={formData.email}
                    onChange={handleChange}
                    style={inputStyle}
                    required
                  />
                </div>
                <input
                  type="text"
                  name="subject"
                  placeholder={t('subject')}
                  value={formData.subject}
                  onChange={handleChange}
                  style={inputStyle}
                  required
                />
                <textarea
                  name="message"
                  placeholder={t('message')}
                  value={formData.message}
                  onChange={handleChange}
                  style={textareaStyle}
                  rows="6"
                  required
                />
                <button type="submit" style={submitButton}>{t('send_message')}</button>
              </form>
            </div>

            {/* Contact Info */}
            <div style={infoSection}>
              <h2 style={sectionTitle}>{t('contact_info') || 'Contact Information'}</h2>
              
              <div style={contactCard}>
                <div style={contactIcon}>📍</div>
                <div>
                  <h4>{t('contact_visit_us')}</h4>
                  <p>{t('contact_naujan_hall')}<br/>{t('contact_naujan_city_province')}<br/>{t('contact_philippines_zip')}</p>
                </div>
              </div>

              <div style={contactCard}>
                <div style={contactIcon}>📞</div>
                <div>
                  <h4>{t('contact_call_us')}</h4>
                  <p>{t('contact_phone_1')}<br/>{t('contact_phone_2')}</p>
                </div>
              </div>

              <div style={contactCard}>
                <div style={contactIcon}>✉️</div>
                <div>
                  <h4>{t('contact_email_us')}</h4>
                  <p>{t('contact_info_email')}<br/>{t('contact_support_email')}</p>
                </div>
              </div>

              <div style={contactCard}>
                <div style={contactIcon}>🕒</div>
                <div>
                  <h4>{t('contact_office_hours')}</h4>
                  <p>{t('contact_hours_weekday')}<br/>{t('contact_hours_saturday')}<br/>{t('contact_hours_sunday')}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section style={faqSection}>
        <div style={container}>
          <h2 style={sectionTitle}>{t('faq_title')}</h2>
          <div style={faqGrid}>
            <div style={faqCard}>
              <h4>{t('faq_report_issue_question')}</h4>
              <p>{t('faq_report_issue_answer')}</p>
            </div>
            <div style={faqCard}>
              <h4>{t('faq_suggest_attractions_question')}</h4>
              <p>{t('faq_suggest_attractions_answer')}</p>
            </div>
            <div style={faqCard}>
              <h4>{t('faq_offline_app_question')}</h4>
              <p>{t('faq_offline_app_answer')}</p>
            </div>
            <div style={faqCard}>
              <h4>{t('faq_update_frequency_question')}</h4>
              <p>{t('faq_update_frequency_answer')}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Emergency Contacts */}
      <section style={emergencySection}>
        <div style={container}>
          <h2 style={sectionTitle}>{t('emergency_contact')}</h2>
          <div style={emergencyGrid}>
            <div style={emergencyCard}>
              <div style={emergencyIcon}>🚨</div>
              <h4>{t('emergency_police')}</h4>
              <p>{t('emergency_police_number')}</p>
            </div>
            <div style={emergencyCard}>
              <div style={emergencyIcon}>🏥</div>
              <h4>{t('emergency_hospital')}</h4>
              <p>{t('emergency_hospital_name')}<br/>{t('emergency_hospital_number')}</p>
            </div>
            <div style={emergencyCard}>
              <div style={emergencyIcon}>🚒</div>
              <h4>{t('emergency_fire')}</h4>
              <p>{t('emergency_fire_number')}</p>
            </div>
            <div style={emergencyCard}>
              <div style={emergencyIcon}>🌊</div>
              <h4>{t('emergency_coast_guard')}</h4>
              <p>{t('emergency_coast_guard_number')}</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

const pageStyle = {
  /* Responsive Change: allow sections to scale naturally across devices */
  backgroundColor: '#ffffff',
  minHeight: '100vh'
};

const heroSection = {
  backgroundColor: '#2e7d32',
  color: 'white',
  padding: 'clamp(2.5rem, 6vw, 4rem) 0',
  textAlign: 'center'
};

const container = {
  width: 'min(100%, 1200px)',
  margin: '0 auto',
  padding: '0 clamp(0.75rem, 3vw, 2rem)'
};

const heroTitle = {
  fontSize: 'clamp(1.9rem, 5vw, 3rem)',
  marginBottom: '1rem',
  fontWeight: 'bold'
};

const heroSubtitle = {
  fontSize: 'clamp(1rem, 2.4vw, 1.3rem)',
  opacity: 0.9
};

const contentSection = {
  padding: 'clamp(2.5rem, 6vw, 4rem) 0'
};

const contactGrid = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(min(320px, 100%), 1fr))',
  gap: 'clamp(1.25rem, 4vw, 4rem)',
  alignItems: 'start'
};

const formSection = {
  backgroundColor: '#f8f9fa',
  padding: 'clamp(1rem, 3vw, 2rem)',
  borderRadius: 'clamp(14px, 2vw, 20px)'
};

const sectionTitle = {
  fontSize: 'clamp(1.4rem, 3vw, 2rem)',
  marginBottom: 'clamp(1rem, 3vw, 2rem)',
  color: '#2e7d32'
};

const form = {
  display: 'flex',
  flexDirection: 'column',
  gap: '1rem'
};

const inputGroup = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(min(220px, 100%), 1fr))',
  gap: '1rem'
};

const inputStyle = {
  padding: '0.95rem 1rem',
  border: '2px solid #e0e0e0',
  borderRadius: '10px',
  fontSize: '1rem',
  minHeight: '46px',
  transition: 'border-color 0.3s ease',
  boxSizing: 'border-box',
  width: '100%'
};

const textareaStyle = {
  ...inputStyle,
  resize: 'vertical',
  minHeight: '120px'
};

const submitButton = {
  padding: '0.95rem 1.25rem',
  backgroundColor: '#2e7d32',
  color: 'white',
  border: 'none',
  borderRadius: '50px',
  fontSize: 'clamp(0.95rem, 2vw, 1.1rem)',
  cursor: 'pointer',
  transition: 'transform 0.3s ease',
  width: 'min(100%, 260px)',
  minHeight: '48px',
  alignSelf: 'flex-start'
};

const successMessage = {
  backgroundColor: '#d4edda',
  color: '#155724',
  padding: '1rem',
  borderRadius: '10px',
  marginBottom: '1rem',
  textAlign: 'center'
};

const infoSection = {
  display: 'flex',
  flexDirection: 'column',
  gap: '1rem'
};

const contactCard = {
  display: 'flex',
  gap: '1rem',
  padding: 'clamp(1rem, 3vw, 1.5rem)',
  backgroundColor: 'white',
  borderRadius: '15px',
  boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
  alignItems: 'flex-start',
  flexWrap: 'wrap'
};

const contactIcon = {
  fontSize: 'clamp(1.5rem, 4vw, 2rem)',
  minWidth: '50px'
};

const faqSection = {
  backgroundColor: '#f8f9fa',
  padding: 'clamp(2.5rem, 6vw, 4rem) 0'
};

const faqGrid = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(min(260px, 100%), 1fr))',
  gap: 'clamp(1rem, 3vw, 2rem)'
};

const faqCard = {
  backgroundColor: 'white',
  padding: 'clamp(1rem, 3vw, 2rem)',
  borderRadius: '15px',
  boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
};

const emergencySection = {
  backgroundColor: '#fff3cd',
  padding: 'clamp(2.5rem, 6vw, 4rem) 0'
};

const emergencyGrid = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(min(220px, 100%), 1fr))',
  gap: 'clamp(1rem, 3vw, 2rem)'
};

const emergencyCard = {
  backgroundColor: 'white',
  padding: 'clamp(1rem, 3vw, 2rem)',
  borderRadius: '15px',
  textAlign: 'center',
  boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
  border: '2px solid #ffc107'
};

const emergencyIcon = {
  fontSize: 'clamp(2rem, 5vw, 3rem)',
  marginBottom: '1rem'
};

export default Contact;

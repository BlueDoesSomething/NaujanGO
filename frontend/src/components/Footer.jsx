import React, { useState, useEffect } from 'react';
import './Footer.css';
import { Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { getApiBaseUrl } from '../api';
import { loadCachedSetting, saveCachedSetting } from '../utils/siteSettingsCache';

const Footer = () => {
  const currentYear = new Date().getFullYear();
  const { t } = useLanguage();
  const [footerSettings, setFooterSettings] = useState(() => loadCachedSetting('footer-settings'));
  const [branding, setBranding] = useState(() => loadCachedSetting('branding'));

  useEffect(() => {
    const base = getApiBaseUrl();
    fetch(`${base}/api/admin/footer-settings`)
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        if (!d) return;
        saveCachedSetting('footer-settings', d);
        setFooterSettings(d);
      })
      .catch(() => {});
    fetch(`${base}/api/admin/branding`)
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        if (!d) return;
        saveCachedSetting('branding', d);
        setBranding(d);
      })
      .catch(() => {});
  }, []);

  const siteName   = branding?.siteName   || t('brand') || 'NaujanGO';
  const tagline    = footerSettings?.tagline    || `${t('welcome_description')} ${t('local_expertise')}`;
  const copyright  = footerSettings?.copyright  || t('footer_copyright_default');
  const address    = footerSettings?.contactAddress || 'Naujan, Oriental Mindoro';
  const phone      = footerSettings?.contactPhone   || '+63 43 XXX-XXXX';
  const email      = footerSettings?.contactEmail   || 'info@naujango.ph';
  const facebook   = footerSettings?.facebook   || 'https://facebook.com/naujantourism';
  const instagram  = footerSettings?.instagram  || 'https://instagram.com/naujantourism';
  const twitter    = footerSettings?.twitter    || '';
  const youtube    = footerSettings?.youtube    || '';

  return (
    <footer className="footer" aria-label={t('aria_site_footer')}>
      <div className="footer-container">
        {/* About Section */}
        <section className="footer-about" aria-label={t('aria_about_naujango')}>
          <div className="footer-brand">
            <h3 className="footer-brand-name">{siteName}</h3>
          </div>
          <p className="footer-description">{tagline}</p>
          <div className="footer-highlights">
            <div className="highlight-item">
              <svg className="highlight-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" width="20" height="20">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
              </svg>
              <span>{t('tourist_attractions')}</span>
            </div>
            <div className="highlight-item">
              <svg className="highlight-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" width="20" height="20">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{t('footer_highlight_beaches')}</span>
            </div>
            <div className="highlight-item">
              <svg className="highlight-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" width="20" height="20">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              <span>{t('footer_highlight_cultural_heritage')}</span>
            </div>
          </div>
        </section>

        {/* Quick Links */}
        <nav className="footer-nav" aria-label={t('aria_quick_links')}>
          <h3 className="footer-title">{t('footer_explore_section')}</h3>
          <ul className="footer-links">
            <li><Link to="/" className="footer-link">{t('home')}</Link></li>
            <li><Link to="/attractions" className="footer-link">{t('attractions')}</Link></li>
            <li><Link to="/dining" className="footer-link">{t('footer_dining_link')}</Link></li>
            <li><Link to="/accommodation" className="footer-link">{t('footer_stay_link')}</Link></li>
            <li><Link to="/about" className="footer-link">{t('about')}</Link></li>
          </ul>
        </nav>

        {/* Contact Information */}
        <section className="footer-contact" aria-label={t('aria_contact_information')}>
          <h3 className="footer-title">{t('footer_contact_section')}</h3>
          <address className="footer-contact-info">
            <div className="contact-item">
              <svg className="contact-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" width="18" height="18">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <p>{address}</p>
            </div>
            <div className="contact-item">
              <svg className="contact-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" width="18" height="18">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
              <p>{phone}</p>
            </div>
            <div className="contact-item">
              <svg className="contact-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" width="18" height="18">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              <p>{email}</p>
            </div>
          </address>
        </section>

        {/* Social Media */}
        <section className="footer-social" aria-label={t('aria_social_media')}>
          <h3 className="footer-title">{t('footer_follow_us_section')}</h3>
          <div className="social-links">
            {facebook && (
            <a href={facebook} target="_blank" rel="noopener noreferrer" className="social-link" aria-label={t('aria_facebook')}>
              <svg className="social-icon" fill="currentColor" viewBox="0 0 24 24" width="20" height="20">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
              <span>{t('social_facebook_label')}</span>
            </a>
            )}
            {instagram && (
            <a href={instagram} target="_blank" rel="noopener noreferrer" className="social-link" aria-label={t('aria_instagram')}>
              <svg className="social-icon" fill="currentColor" viewBox="0 0 24 24" width="20" height="20">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
              </svg>
              <span>{t('social_instagram_label')}</span>
            </a>
            )}
            {twitter && (
            <a href={twitter} target="_blank" rel="noopener noreferrer" className="social-link" aria-label={t('aria_twitter_x')}>
              <svg className="social-icon" fill="currentColor" viewBox="0 0 24 24" width="20" height="20">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.73-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
              </svg>
              <span>{t('social_twitter_label')}</span>
            </a>
            )}
            {youtube && (
            <a href={youtube} target="_blank" rel="noopener noreferrer" className="social-link" aria-label={t('aria_youtube')}>
              <svg className="social-icon" fill="currentColor" viewBox="0 0 24 24" width="20" height="20">
                <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
              </svg>
              <span>{t('social_youtube_label')}</span>
            </a>
            )}
          </div>
        </section>
      </div>
      
      <div className="footer-bottom">
        <div className="footer-bottom-content">
          <p className="copyright">© {currentYear} {copyright}</p>
          <div className="footer-bottom-links">
            <Link to="/privacy" className="bottom-link">{t('footer_privacy_policy_link')}</Link>
            <Link to="/terms" className="bottom-link">{t('footer_terms_of_service_link')}</Link>
            <Link to="/accessibility" className="bottom-link">{t('footer_accessibility_link')}</Link>
          </div>
          <p className="developed-by">
            {t('footer_developed_sustainability_mission')}
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

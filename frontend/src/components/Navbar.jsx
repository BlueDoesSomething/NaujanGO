import React, { useState, useEffect, useRef } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api';
import '../styles/layout.css';
import './Navbar.css';
import { useLanguage } from '../context/LanguageContext';
import LanguageSelector from './LanguageSelector';
import { useTheme } from '../context/ThemeContext';

const Navbar = () => {
  const { isLoggedIn, user, logout, loading } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  
  // Debug logging
  React.useEffect(() => {
    console.log('[Navbar] isLoggedIn:', isLoggedIn, 'loading:', loading, 'path:', location.pathname, 'user:', user?.email);
  }, [isLoggedIn, loading, location.pathname]);
  
  const { t } = useLanguage();
  const { isDark, toggleDark } = useTheme();
  const [showDropdown, setShowDropdown] = useState(false);
  const [showAboutDropdown, setShowAboutDropdown] = useState(false);
  const [activeAboutSection, setActiveAboutSection] = useState('overview');
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const dropdownRef = useRef(null);
  const buttonRef = useRef(null);
  const aboutDropdownRef = useRef(null);
  const aboutButtonRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target)
      ) {
        setShowDropdown(false);
      }
      
      if (
        aboutDropdownRef.current &&
        !aboutDropdownRef.current.contains(event.target) &&
        aboutButtonRef.current &&
        !aboutButtonRef.current.contains(event.target)
      ) {
        setShowAboutDropdown(false);
      }
    };
    
    const handleScroll = () => {
      const isScrolled = window.scrollY > 50;
      setScrolled(isScrolled);
      
      // Track active section on about pages
      if (window.location.pathname.startsWith('/about/')) {
        const sectionId = window.location.pathname.split('/about/')[1];
        setActiveAboutSection(sectionId);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('scroll', handleScroll);
    window.addEventListener('hashchange', handleScroll);
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('hashchange', handleScroll);
    };
  }, []);

  const handleLogout = async () => {
    console.log('[Navbar] handleLogout called, calling logout()...');
    try {
      await logout();  // Wait for logout to complete
      console.log('[Navbar] logout() completed');
      setShowDropdown(false);
      setShowAboutDropdown(false);
      setMenuOpen(false);
      // Redirect to login page after logout
      navigate('/login', { replace: true });
    } catch (error) {
      console.error('[Navbar] logout error:', error);
      // Still close dropdowns and redirect even if error
      setShowDropdown(false);
      setShowAboutDropdown(false);
      setMenuOpen(false);
      navigate('/login', { replace: true });
    }
  };

  // Safety effect: On login/register page, ensure auth buttons show (not account dropdown)
  useEffect(() => {
    if (location.pathname === '/login' || location.pathname === '/register') {
      // Always close account dropdown on auth pages
      setShowDropdown(false);
      setShowAboutDropdown(false);
    }
  }, [location.pathname]);

  const handleNavClick = () => {
    setMenuOpen(false);
    setShowDropdown(false);
    setShowAboutDropdown(false);
    window.scrollTo(0, 0);
  };

  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
    setShowDropdown(false);
    setShowAboutDropdown(false);
  };

  const toggleDropdown = () => {
    setShowDropdown(!showDropdown);
  };

  const toggleAboutDropdown = () => {
    setShowAboutDropdown(!showAboutDropdown);
  };

  const aboutSections = [
    { label: 'Overview', id: 'overview', path: '/about/overview', tKey: 'about_overview' },
    { label: 'Vision & Mission', id: 'vision-mission', path: '/about/vision-mission', tKey: 'about_vision_mission' },
    { label: 'History', id: 'history', path: '/about/history', tKey: 'about_history' },
    { label: 'Leadership', id: 'leadership', path: '/about/leadership', tKey: 'about_leadership' },
    { label: 'Quick Facts', id: 'quick-facts', path: '/about/quick-facts', tKey: 'about_quick_facts' },
    { label: 'Indigenous Communities', id: 'indigenous', path: '/about/indigenous', tKey: 'about_indigenous_communities' },
    { label: 'Alangan People', id: 'alangan', path: '/about/alangan', tKey: 'about_alangan_people' },
    { label: 'People & Culture', id: 'culture', path: '/about/culture', tKey: 'about_people_culture' },
    { label: 'Economy & Livelihood', id: 'economy', path: '/about/economy', tKey: 'about_economy_livelihood' },
    { label: 'Tourism', id: 'tourism', path: '/about/tourism', tKey: 'about_tourism' }
  ];

  const handleAboutSectionClick = (sectionId) => {
    setShowAboutDropdown(false);
    setMenuOpen(false);
    setActiveAboutSection(sectionId);
  };

  return (
    <nav className={`navbar ${scrolled ? 'scrolled' : ''}`} role="navigation" aria-label="Main navigation">
      <div className="navbar-container">
        <Link to="/" className="navbar-logo" aria-label="NaujanGO Home">
          <div className="logo-content">
            <span className="logo-text">{t('brand')}</span>
            <span className="logo-subtitle">{t('discover_naujan')}</span>
          </div>
        </Link>

        <button
          className="navbar-toggle"
          aria-controls="primary-navigation"
          aria-expanded={menuOpen}
          aria-label="Toggle menu"
          onClick={toggleMenu}
        >
          <span className="hamburger" />
        </button>

        <div className={`nav-content ${menuOpen ? 'mobile-open' : ''}`}>
          <ul
            className={`navbar-links ${menuOpen ? 'active' : ''}`}
            id="primary-navigation"
            role="menu"
          >
            <li role="none">
              <NavLink
                to="/"
                className={({ isActive }) =>
                  isActive ? 'navbar-link active' : 'navbar-link'
                }
                role="menuitem"
                onClick={handleNavClick}
              >
                <span className="link-text">{t('home')}</span>
              </NavLink>
            </li>
            <li role="none">
              <NavLink
                to="/attractions"
                className={({ isActive }) =>
                  isActive ? 'navbar-link active' : 'navbar-link'
                }
                role="menuitem"
                onClick={handleNavClick}
              >
                <span className="link-text">{t('attractions')}</span>
              </NavLink>
            </li>
            <li role="none">
              <NavLink
                to="/hotels"
                className={({ isActive }) =>
                  isActive ? 'navbar-link active' : 'navbar-link'
                }
                role="menuitem"
                onClick={handleNavClick}
              >
                <span className="link-text">{t('accommodation')}</span>
              </NavLink>
            </li>

            {isLoggedIn && (
              <li role="none">
                <NavLink
                  to="/itinerary"
                  className={({ isActive }) =>
                    isActive ? 'navbar-link active' : 'navbar-link'
                  }
                  role="menuitem"
                  onClick={handleNavClick}
                >
                  <span className="link-text">{t('create_itinerary')}</span>
                </NavLink>
              </li>
            )}
            <li role="none">
              <NavLink
                to="/map"
                className={({ isActive }) =>
                  isActive ? 'navbar-link active' : 'navbar-link'
                }
                role="menuitem"
                onClick={handleNavClick}
              >
                <span className="link-text">{t('interactive_map')}</span>
              </NavLink>
            </li>
            <li role="none" className="navbar-dropdown-item" ref={aboutDropdownRef}>
              <button
                ref={aboutButtonRef}
                onClick={toggleAboutDropdown}
                className={`navbar-link about-dropdown-btn ${window.location.pathname.startsWith('/about') ? 'active' : ''}`}
                role="menuitem"
                aria-haspopup="true"
                aria-expanded={showAboutDropdown}
              >
                <span className="link-text">{t('about')}</span>
                <span className="dropdown-arrow">▼</span>
              </button>
              {showAboutDropdown && (
                <ul className="navbar-about-dropdown" role="menu" aria-label="About Naujan sections">
                  {aboutSections.map((section) => (
                    <li key={section.id} role="none">
                      <a
                        href={section.path}
                        className={`about-dropdown-link ${window.location.pathname === section.path ? 'active' : ''}`}
                        role="menuitem"
                        onClick={() => handleAboutSectionClick(section.id)}
                      >
                        {t(section.tKey)}
                      </a>
                    </li>
                  ))}
                </ul>
              )}
            </li>
          </ul>

          <div className="navbar-utilities mobile-utilities" aria-label="Display and language controls">
            <div className="lang-selector-wrapper">
              <LanguageSelector />
            </div>
            <button
              type="button"
              className="dark-mode-toggle"
              onClick={toggleDark}
              aria-label={isDark ? t('switch_to_light_mode') : t('switch_to_dark_mode')}
              title={isDark ? t('light_mode') : t('dark_mode')}
            >
              <span className="dark-mode-icon" aria-hidden="true">{isDark ? '☀' : '🌙'}</span>
            </button>
          </div>

          <div className="mobile-auth-panel" aria-label="Account actions">
            {loading ? null : isLoggedIn ? (
              <>
                <div className="mobile-auth-heading">
                  {user?.username || t('myAccount')}
                </div>
                <div className="mobile-auth-links">
                  <Link to="/profile" className="mobile-auth-link" onClick={handleNavClick}>
                    {t('profile')}
                  </Link>
                  <Link to="/bookings" className="mobile-auth-link" onClick={handleNavClick}>
                    {t('my_bookings')}
                  </Link>
                  {user?.role === 'admin' && (
                    <Link to="/admin" className="mobile-auth-link" onClick={handleNavClick}>
                      {t('admin_dashboard')}
                    </Link>
                  )}
                  {(user?.role === 'owner' || user?.role === 'admin') && (
                    <Link to="/owner" className="mobile-auth-link" onClick={handleNavClick}>
                      {t('owner_dashboard')}
                    </Link>
                  )}
                  <button type="button" className="mobile-auth-link mobile-auth-logout" onClick={handleLogout}>
                    {t('logout')}
                  </button>
                </div>
              </>
            ) : (
              <div className="mobile-auth-buttons">
                <NavLink to="/login" className="auth-btn login-btn mobile-auth-btn" onClick={handleNavClick}>
                  {t('login')}
                </NavLink>
                <NavLink to="/register" className="auth-btn register-btn mobile-auth-btn" onClick={handleNavClick}>
                  {t('register')}
                </NavLink>
              </div>
            )}
          </div>
        </div>

        <div className="navbar-actions">
            <div className="navbar-utilities desktop-utilities" aria-label={t('display_language_controls')}>
              <div className="lang-selector-wrapper">
                <LanguageSelector />
              </div>

              <button
                type="button"
                className="dark-mode-toggle"
                onClick={toggleDark}
                aria-label={isDark ? t('switch_to_light_mode') : t('switch_to_dark_mode')}
                title={isDark ? t('light_mode') : t('dark_mode')}
              >
                <span className="dark-mode-icon" aria-hidden="true">{isDark ? '☀' : '🌙'}</span>
              </button>
            </div>

            {loading ? (
              // Show nothing while loading auth check
              null
            ) : isLoggedIn ? (
              // Show account dropdown if logged in
              <div
                ref={dropdownRef}
                className="account-dropdown"
                role="none"
              >
                <button
                  ref={buttonRef}
                  onClick={toggleDropdown}
                  className="account-button"
                  aria-haspopup="true"
                  aria-expanded={showDropdown}
                  aria-controls="account-menu"
                  role="menuitem"
                >
                  {!loading && user?.profile_picture ? (
                    <img 
                      src={user.profile_picture} 
                      alt="Profile" 
                      className="account-avatar-img"
                    />
                  ) : (
                    <span className="account-avatar">
                      {user?.username ? user.username.charAt(0).toUpperCase() : 'U'}
                    </span>
                  )}
                  <span className="account-name">
                    {user?.username || t('myAccount')}
                  </span>
                  <span className="dropdown-arrow">▼</span>
                </button>
                {showDropdown && (
                  <ul
                    className="dropdown-menu"
                    id="account-menu"
                    role="menu"
                    aria-label="Account options"
                  >
                    <li className="dropdown-item" role="none">
                      <Link
                        to="/profile"
                        className="dropdown-link"
                        role="menuitem"
                        onClick={() => {
                          setShowDropdown(false);
                          setMenuOpen(false);
                        }}
                      >
                        <svg className="dropdown-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" width="20" height="20">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        {t('profile')}
                      </Link>
                    </li>
                    <li className="dropdown-item" role="none">
                      <Link
                        to="/bookings"
                        className="dropdown-link"
                        role="menuitem"
                        onClick={() => {
                          setShowDropdown(false);
                          setMenuOpen(false);
                        }}
                      >
                        <svg className="dropdown-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" width="20" height="20">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                        {t('my_bookings')}
                      </Link>
                    </li>
                    {user?.role === 'admin' && (
                      <li className="dropdown-item" role="none">
                        <Link
                          to="/admin"
                          className="dropdown-link admin-link"
                          role="menuitem"
                          onClick={() => {
                            setShowDropdown(false);
                            setMenuOpen(false);
                          }}
                        >
                          <svg className="dropdown-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" width="20" height="20">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                          </svg>
                          {t('admin_dashboard')}
                        </Link>
                      </li>
                    )}
                    {(user?.role === 'owner' || user?.role === 'admin') && (
                      <li className="dropdown-item" role="none">
                        <Link
                          to="/owner"
                          className="dropdown-link owner-link"
                          role="menuitem"
                          onClick={() => {
                            setShowDropdown(false);
                            setMenuOpen(false);
                          }}
                        >
                          <svg className="dropdown-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" width="20" height="20">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                          </svg>
                          {t('owner_dashboard')}
                        </Link>
                      </li>
                    )}
                    <li className="dropdown-item" role="none">
                      <button
                        onClick={handleLogout}
                        className="dropdown-link logout-button"
                        role="menuitem"
                      >
                        <svg className="dropdown-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" width="20" height="20">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        {t('logout')}
                      </button>
                    </li>
                  </ul>
                )}
              </div>
            ) : (
              // Show login buttons if not logged in
              <div className="auth-buttons">
                <NavLink
                  to="/login"
                  className="auth-btn login-btn"
                  onClick={() => setMenuOpen(false)}
                >
                  {t('login')}
                </NavLink>
                <NavLink
                  to="/register"
                  className="auth-btn register-btn"
                  onClick={() => setMenuOpen(false)}
                >
                  {t('register')}
                </NavLink>
              </div>
            )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;

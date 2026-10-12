import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// Site-wide reminder shown under the navbar for OAuth users who skipped
// gender / visitor type during registration. Same condition and dismissal
// key as the Profile page banner, so both hide together.
const DemographicsReminder = () => {
  const { isLoggedIn, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [dismissed, setDismissed] = useState(false);
  const [navOffset, setNavOffset] = useState(0);

  useEffect(() => {
    if (user?.user_id) {
      const stored = localStorage.getItem(`demographics_reminder_${user.user_id}`);
      setDismissed(stored === 'true');
    }
  }, [user?.user_id]);

  // On mobile the navbar is position: fixed and takes no flow space, so the
  // banner must be pushed down by the navbar's real height (it changes with
  // the .scrolled padding). Desktop navbar is sticky (in flow) → no offset.
  useEffect(() => {
    const measure = () => {
      const nav = document.querySelector('.navbar');
      const isFixed = window.matchMedia('(max-width: 768px)').matches;
      setNavOffset(isFixed && nav ? nav.offsetHeight : 0);
    };
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, []);

  const needsDemographics =
    user?.is_oauth_user === true &&
    (!user?.gender || user.gender === 'prefer_not_to_say') &&
    (!user?.user_type || user.user_type === 'foreigner');

  if (!isLoggedIn || !needsDemographics || dismissed || location.pathname === '/profile') {
    return null;
  }

  const handleDismiss = () => {
    setDismissed(true);
    if (user?.user_id) {
      localStorage.setItem(`demographics_reminder_${user.user_id}`, 'true');
    }
  };

  return (
    <div
      style={{ ...bannerStyle, marginTop: `calc(${navOffset}px + 6px)` }}
      role="alert"
      aria-live="polite"
    >
      <div style={iconStyle} aria-hidden="true">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="12" y1="8" x2="12" y2="12"></line>
          <line x1="12" y1="16" x2="12.01" y2="16"></line>
        </svg>
      </div>
      <div style={bodyStyle}>
        <div style={headRowStyle}>
          <strong style={titleStyle}>Complete your profile</strong>
          <div style={actionsStyle}>
            <button
              type="button"
              style={btnStyle}
              onClick={() => navigate('/profile?edit=demographics')}
            >
              Set Now
            </button>
            <button
              type="button"
              style={dismissBtnStyle}
              onClick={handleDismiss}
              aria-label="Dismiss reminder"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>
        </div>
        <p style={textStyle}>
          Please set your <strong>Gender</strong> and <strong>Visitor Type</strong> so we can personalize your experience and improve NaujanGO for everyone.
        </p>
      </div>
    </div>
  );
};

const bannerStyle = {
  margin: '0.5rem clamp(1rem, 3vw, 2rem)',
  padding: '0.85rem 1rem',
  backgroundColor: '#fffbeb',
  border: '1px solid #fcd34d',
  borderRadius: '12px',
  display: 'flex',
  alignItems: 'flex-start',
  gap: '0.7rem'
};

const iconStyle = {
  width: '36px',
  height: '36px',
  minWidth: '36px',
  borderRadius: '9px',
  backgroundColor: '#fef3c7',
  color: '#d97706',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0,
  lineHeight: 0
};

const bodyStyle = {
  flex: 1,
  minWidth: 0
};

const headRowStyle = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  flexWrap: 'wrap',
  gap: '0.5rem'
};

const titleStyle = {
  fontSize: '0.9rem',
  fontWeight: '700',
  color: '#92400e'
};

const textStyle = {
  margin: '0.25rem 0 0',
  fontSize: '0.82rem',
  color: '#a16207',
  lineHeight: '1.45'
};

const actionsStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.4rem',
  flexShrink: 0
};

const btnStyle = {
  padding: '0.42rem 0.85rem',
  backgroundColor: '#d97706',
  color: 'white',
  border: 'none',
  borderRadius: '8px',
  fontSize: '0.82rem',
  fontWeight: '600',
  cursor: 'pointer',
  whiteSpace: 'nowrap',
  transition: 'background-color 0.2s'
};

const dismissBtnStyle = {
  width: '30px',
  height: '30px',
  borderRadius: '8px',
  border: '1px solid #fcd34d',
  backgroundColor: 'transparent',
  color: '#a16207',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'pointer',
  padding: 0
};

export default DemographicsReminder;

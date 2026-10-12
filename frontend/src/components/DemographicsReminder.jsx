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

  useEffect(() => {
    if (user?.user_id) {
      const stored = localStorage.getItem(`demographics_reminder_${user.user_id}`);
      setDismissed(stored === 'true');
    }
  }, [user?.user_id]);

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
    <div style={bannerStyle} role="alert" aria-live="polite">
      <div style={iconStyle} aria-hidden="true">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="12" y1="8" x2="12" y2="12"></line>
          <line x1="12" y1="16" x2="12.01" y2="16"></line>
        </svg>
      </div>
      <div style={bodyStyle}>
        <strong style={titleStyle}>Complete your profile</strong>
        <p style={textStyle}>
          Please set your <strong>Gender</strong> and <strong>Visitor Type</strong> so we can personalize your experience and improve NaujanGO for everyone.
        </p>
      </div>
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
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>
    </div>
  );
};

const bannerStyle = {
  margin: '0.75rem clamp(1rem, 3vw, 2rem)',
  padding: '1rem 1.25rem',
  backgroundColor: '#fffbeb',
  border: '1px solid #fcd34d',
  borderRadius: '12px',
  display: 'flex',
  alignItems: 'flex-start',
  gap: '0.875rem',
  flexWrap: 'wrap'
};

const iconStyle = {
  width: '40px',
  height: '40px',
  minWidth: '40px',
  borderRadius: '10px',
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
  minWidth: '200px'
};

const titleStyle = {
  display: 'block',
  fontSize: '0.95rem',
  fontWeight: '700',
  color: '#92400e',
  marginBottom: '0.25rem'
};

const textStyle = {
  margin: 0,
  fontSize: '0.85rem',
  color: '#a16207',
  lineHeight: '1.5'
};

const actionsStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.5rem',
  flexShrink: 0
};

const btnStyle = {
  padding: '0.5rem 1rem',
  backgroundColor: '#d97706',
  color: 'white',
  border: 'none',
  borderRadius: '8px',
  fontSize: '0.85rem',
  fontWeight: '600',
  cursor: 'pointer',
  whiteSpace: 'nowrap',
  transition: 'background-color 0.2s'
};

const dismissBtnStyle = {
  width: '32px',
  height: '32px',
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

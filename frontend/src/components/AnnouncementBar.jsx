import React, { useState, useEffect } from 'react';
import { getApiBaseUrl } from '../api';
import { loadCachedSetting, saveCachedSetting } from '../utils/siteSettingsCache';

const DISMISSED_KEY = 'naujan_announcement_dismissed';

const AnnouncementBar = () => {
  const [settings, setSettings] = useState(() => loadCachedSetting('announcement'));
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const base = getApiBaseUrl();
    fetch(`${base}/api/admin/announcement`)
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data) {
          saveCachedSetting('announcement', data);
          setSettings(data);
          // Reset dismiss state if the message changed since last dismiss
          const lastDismissed = sessionStorage.getItem(DISMISSED_KEY);
          if (lastDismissed !== data.message) {
            setDismissed(false);
          } else {
            setDismissed(true);
          }
        }
      })
      .catch(() => {});
  }, []);

  // Live-update: when admin saves Announcement settings in the same tab,
  // reflect the change immediately without a page reload.
  useEffect(() => {
    const handleUpdate = (e) => {
      if (e.detail.key !== 'announcement') return;
      const data = e.detail.data;
      saveCachedSetting('announcement', data);
      setSettings(data);
      const lastDismissed = sessionStorage.getItem(DISMISSED_KEY);
      if (lastDismissed !== data.message) setDismissed(false);
    };
    window.addEventListener('naujan:settings-updated', handleUpdate);
    return () => window.removeEventListener('naujan:settings-updated', handleUpdate);
  }, []);

  if (!settings || !settings.enabled || dismissed) return null;

  const handleDismiss = () => {
    sessionStorage.setItem(DISMISSED_KEY, settings.message);
    setDismissed(true);
  };

  return (
    <div
      role="banner"
      aria-live="polite"
      style={{
        background: settings.bgColor || '#16a34a',
        color: settings.textColor || '#ffffff',
        padding: '0.55rem 1.25rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '0.75rem',
        fontSize: '0.875rem',
        fontWeight: 600,
        position: 'relative',
        zIndex: 1100,
        textAlign: 'center',
        lineHeight: 1.4,
      }}
    >
      <span>
        {settings.message}
        {settings.linkUrl && settings.linkLabel && (
          <>
            {' — '}
            <a
              href={settings.linkUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: 'inherit', textDecoration: 'underline', marginLeft: '0.2rem' }}
            >
              {settings.linkLabel}
            </a>
          </>
        )}
      </span>
      {settings.dismissible && (
        <button
          onClick={handleDismiss}
          aria-label="Dismiss announcement"
          style={{
            background: 'transparent',
            border: 'none',
            color: 'inherit',
            cursor: 'pointer',
            fontSize: '1.1rem',
            lineHeight: 1,
            opacity: 0.75,
            padding: '0 0.25rem',
            position: 'absolute',
            right: '1rem',
            top: '50%',
            transform: 'translateY(-50%)',
          }}
        >
          ✕
        </button>
      )}
    </div>
  );
};

export default AnnouncementBar;

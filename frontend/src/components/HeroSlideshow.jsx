import React, { useState, useEffect } from 'react';
import { getApiBaseUrl } from '../api';
import { loadCachedSetting, saveCachedSetting } from '../utils/siteSettingsCache';

const DEFAULT_IMAGES = [
  'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1920&q=80',
  'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=1920&q=80',
  'https://images.unsplash.com/photo-1501594907352-04cda38ebc29?w=1920&q=80',
  'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=1920&q=80',
  'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=1920&q=80',
];

const hexToRgb = (hex) => {
  const r = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return r ? `${parseInt(r[1], 16)}, ${parseInt(r[2], 16)}, ${parseInt(r[3], 16)}` : '22, 163, 74';
};

const HeroSlideshow = ({ title, subtitle, height = '500px', images: customImages, showControls = true, autoPlay = true, className = '' }) => {
  const [currentImage, setCurrentImage] = useState(0);
  const [heroSettings, setHeroSettings] = useState(() => loadCachedSetting('hero-settings'));
  const [heroExtended, setHeroExtended] = useState(() => loadCachedSetting('hero-extended'));

  useEffect(() => {
    const base = getApiBaseUrl();
    if (!customImages) {
      fetch(`${base}/api/admin/hero-settings`)
        .then(r => r.json())
        .then(data => {
          saveCachedSetting('hero-settings', data);
          setHeroSettings(data);
        })
        .catch(() => {});
    }
    fetch(`${base}/api/admin/hero-extended`)
      .then(r => r.json())
      .then(data => {
        saveCachedSetting('hero-extended', data);
        setHeroExtended(data);
      })
      .catch(() => {});
  }, [customImages]);

  const images = customImages || heroSettings?.images || DEFAULT_IMAGES;
  const overlayColor = heroSettings?.overlayColor || '#16a34a';
  const overlayOpacity = heroSettings?.overlayOpacity ?? 0.5;
  const rgb = hexToRgb(overlayColor);
  const overlayBg = `linear-gradient(135deg, rgba(${rgb}, ${(overlayOpacity * 0.9).toFixed(2)}) 0%, rgba(${rgb}, ${overlayOpacity.toFixed(2)}) 100%)`;

  const effectiveTitle = title || heroExtended?.title || 'Discover Naujan';
  const effectiveSubtitle = subtitle || heroExtended?.subtitle || '';
  const effectiveAutoPlay = heroExtended ? heroExtended.autoplay : autoPlay;
  const intervalMs = heroExtended?.intervalSeconds ? heroExtended.intervalSeconds * 1000 : 5000;

  useEffect(() => {
    if (!effectiveAutoPlay || images.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentImage((prev) => (prev + 1) % images.length);
    }, intervalMs);
    return () => clearInterval(interval);
  }, [images.length, effectiveAutoPlay, intervalMs]);

  const nextSlide = () => setCurrentImage((prev) => (prev + 1) % images.length);
  const prevSlide = () => setCurrentImage((prev) => (prev - 1 + images.length) % images.length);

  return (
    <div className={className} style={{ ...styles.heroContainer, height }}>
      {images.map((image, index) => (
        <div
          key={index}
          style={{
            ...styles.slideImage,
            backgroundImage: `url(${image})`,
            opacity: currentImage === index ? 1 : 0,
            zIndex: currentImage === index ? 1 : 0,
          }}
        />
      ))}
      
      <div style={{ ...styles.overlay, background: overlayBg }} />
      
      <div style={styles.content}>
        <h1 style={styles.title}>{effectiveTitle}</h1>
        {effectiveSubtitle && <p style={styles.subtitle}>{effectiveSubtitle}</p>}
      </div>

      {showControls && images.length > 1 && (
        <>
          <button onClick={prevSlide} style={{...styles.navButton, left: '2rem'}} aria-label={t('button_previous')}>
            ‹
          </button>
          <button onClick={nextSlide} style={{...styles.navButton, right: '2rem'}} aria-label={t('button_next')}>
            ›
          </button>
          <div style={styles.indicators}>
            {images.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentImage(index)}
                style={{
                  ...styles.indicator,
                  ...(currentImage === index ? styles.indicatorActive : {}),
                }}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
};

const styles = {
  heroContainer: {
    position: 'relative',
    width: '100%',
    overflow: 'hidden',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  slideImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat',
    transition: 'opacity 1.5s ease-in-out',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    background: 'linear-gradient(135deg, rgba(64, 161, 100, 0.45) 0%, rgba(64, 161, 100, 0.59) 100%)',
    zIndex: 2,
  },
  content: {
    position: 'relative',
    zIndex: 3,
    textAlign: 'center',
    color: 'white',
    padding: '2rem',
    maxWidth: '1200px',
    margin: '0 auto',
  },
  title: {
    fontSize: 'clamp(2.5rem, 5vw, 3.8rem)',
    fontWeight: '950',
    textShadow: '0 4px 20px rgba(0,0,0,0.4), 0 2px 8px rgba(0,0,0,0.3)',
    animation: 'fadeInUp 0.8s ease',
    color: '#FFFFFF',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", sans-serif',
    letterSpacing: '-1px',
    lineHeight: '1.1',
    maxWidth: '90%',
    margin: '0 auto 1.5rem',
  },
  subtitle: {
    fontSize: '1.3rem',
    margin: 0,
    opacity: 0.95,
    textShadow: '0 2px 8px rgba(0,0,0,0.5), 0 1px 3px rgba(0,0,0,0.3)',
    animation: 'fadeInUp 0.8s ease 0.2s both',
    color: 'white',
  },
  indicators: {
    position: 'absolute',
    bottom: '2rem',
    left: '50%',
    transform: 'translateX(-50%)',
    display: 'flex',
    gap: '0.75rem',
    zIndex: 4,
  },
  indicator: {
    width: '12px',
    height: '12px',
    borderRadius: '50%',
    border: '2px solid white',
    background: 'transparent',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    padding: 0,
  },
  indicatorActive: {
    background: 'white',
    transform: 'scale(1.2)',
  },
  navButton: {
    position: 'absolute',
    top: '50%',
    transform: 'translateY(-50%)',
    background: 'rgba(255, 255, 255, 0.2)',
    backdropFilter: 'blur(10px)',
    border: '2px solid rgba(255, 255, 255, 0.5)',
    color: 'white',
    fontSize: '2rem',
    width: '50px',
    height: '50px',
    borderRadius: '50%',
    cursor: 'pointer',
    zIndex: 4,
    transition: 'all 0.3s ease',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
};

export default HeroSlideshow;

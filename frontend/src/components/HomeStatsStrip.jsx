/**
 * Home Stats Strip
 * Gradient stat band with glass cards and animated count-up numbers.
 * Shared by the public and logged-in homepages.
 */

import React, { useEffect, useRef, useState } from 'react';
import Icons from './Icons';
import { useLanguage } from '../context/LanguageContext';
import './HomeStatsStrip.css';

const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);

const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  typeof window.matchMedia === 'function' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const useCountUp = (target) => {
  const [value, setValue] = useState(0);
  const rafRef = useRef(null);

  useEffect(() => {
    if (prefersReducedMotion()) {
      setValue(target);
      return undefined;
    }
    const start = performance.now();
    const duration = 950;
    const tick = (now) => {
      const progress = Math.min((now - start) / duration, 1);
      setValue(Math.round(easeOutCubic(progress) * target));
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(tick);
      }
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [target]);

  return value;
};

const StatCard = ({ icon: Icon, count, label, accent }) => {
  const display = useCountUp(count);
  return (
    <div className="home-stat-card">
      <span className={`stat-icon-chip ${accent}`}>
        <Icon size={20} />
      </span>
      <div className="home-stat-meta">
        <strong className="stat-count">{display.toLocaleString()}</strong>
        <span className="stat-label">{label}</span>
      </div>
    </div>
  );
};

const HomeStatsStrip = ({ attractions = 0, hotels = 0, restaurants = 0 }) => {
  const { t, supportedLanguages } = useLanguage();

  if (attractions + hotels + restaurants <= 0) return null;

  return (
    <section className="home-stats-strip" aria-label={t('quick_stats')}>
      <div className="home-stats-grid">
        {attractions > 0 && (
          <StatCard
            icon={Icons.Attraction}
            count={attractions}
            label={t('attractions')}
            accent="accent-green"
          />
        )}
        {hotels > 0 && (
          <StatCard
            icon={Icons.Hotel}
            count={hotels}
            label={t('hotels')}
            accent="accent-blue"
          />
        )}
        {restaurants > 0 && (
          <StatCard
            icon={Icons.Utensils}
            count={restaurants}
            label={t('featured_dining')}
            accent="accent-amber"
          />
        )}
        <StatCard
          icon={Icons.Globe}
          count={supportedLanguages.length}
          label={t('supported_languages')}
          accent="accent-violet"
        />
      </div>
    </section>
  );
};

export default HomeStatsStrip;
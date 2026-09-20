/**
 * Home Stats Strip - minimal one-line info bar
 * Displays live counts (attractions, hotels, languages) in a clean,
 * modern single line with subtle count-up numbers.
 */

import React, { useEffect, useRef, useState } from 'react';
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
    const duration = 650;
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

const Stat = ({ count, label }) => {
  const display = useCountUp(count);
  return (
    <span className="home-stat-inline">
      <strong>{display.toLocaleString()}</strong>
      <span>{label}</span>
    </span>
  );
};

const HomeStatsStrip = ({ attractions = 0, hotels = 0 }) => {
  const { t, supportedLanguages } = useLanguage();

  if (attractions + hotels <= 0) return null;

  return (
    <section className="home-stats-strip" aria-label={t('quick_stats')}>
      <Stat count={attractions} label={t('attractions').toLowerCase()} />
      <span className="home-stat-sep" aria-hidden="true">
        ·
      </span>
      <Stat count={hotels} label={t('hotels').toLowerCase()} />
      <span className="home-stat-sep" aria-hidden="true">
        ·
      </span>
      <Stat count={supportedLanguages.length} label={t('supported_languages').toLowerCase()} />
    </section>
  );
};

export default HomeStatsStrip;
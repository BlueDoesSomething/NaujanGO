import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import Icons from './Icons';
import './MobileBottomNav.css';

const MobileBottomNav = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useLanguage();
  const path = location.pathname || '/';

  const isActive = (key) => {
    if (key === 'home') return path === '/';
    if (key === 'attraction') return path.startsWith('/attractions');
    if (key === 'explore') return path.startsWith('/map');
    if (key === 'about') return path.startsWith('/about');
    return false;
  };

  const items = [
    { key: 'home', label: t('mobile_home'), icon: Icons.MapPin, to: '/' },
    { key: 'attraction', label: t('mobile_attraction'), icon: Icons.Attraction, to: '/attractions' },
    { key: 'explore', label: t('mobile_explore'), icon: Icons.Compass, to: '/map' },
    { key: 'about', label: t('mobile_about'), icon: Icons.Info, to: '/about' },
  ];

  const renderItem = (item) => {
    const Icon = item.icon;
    return (
      <button
        key={item.key}
        className={`nav-item${isActive(item.key) ? ' active' : ''}`}
        onClick={() => navigate(item.to)}
      >
        <Icon size={20} />
        <span>{item.label}</span>
      </button>
    );
  };

  return (
    <nav className="eco-mobile-nav" aria-label={t('explore_button')}>
      {items.slice(0, 2).map(renderItem)}
      <button className="nav-center" onClick={() => navigate('/map')} aria-label={t('interactive_map')}>
        <Icons.Compass size={22} />
      </button>
      {items.slice(2).map(renderItem)}
    </nav>
  );
};

export default MobileBottomNav;

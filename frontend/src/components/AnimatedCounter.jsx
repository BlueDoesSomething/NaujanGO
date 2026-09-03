import React, { useState, useEffect, useRef } from 'react';

const AnimatedCounter = ({ value, label, icon: Icon, color = 'primary' }) => {
  const [count, setCount] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !isVisible) {
        setIsVisible(true);
      }
    }, { threshold: 0.5 });

    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [isVisible]);

  useEffect(() => {
    if (!isVisible) return;

    const numValue = parseInt(value.toString().replace(/,/g, '')) || 0;
    const duration = 2000;
    const steps = 60;
    const stepValue = numValue / steps;
    let currentStep = 0;

    const timer = setInterval(() => {
      currentStep++;
      if (currentStep >= steps) {
        setCount(numValue);
        clearInterval(timer);
      } else {
        setCount(Math.floor(stepValue * currentStep));
      }
    }, duration / steps);

    return () => clearInterval(timer);
  }, [isVisible, value]);

  const colorClass = {
    primary: '#16a34a',
    blue: '#3b82f6',
    purple: '#8b5cf6',
    orange: '#f97316'
  }[color] || '#16a34a';

  return (
    <div ref={ref} style={{
      background: 'white',
      padding: '3rem 2.5rem',
      borderRadius: '12px',
      textAlign: 'center',
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
      border: '1px solid rgba(22, 163, 74, 0.1)',
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '1rem'
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.transform = 'translateY(-4px)';
      e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.1)';
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.transform = 'translateY(0)';
      e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)';
    }}>
      {Icon && <Icon size={40} style={{ color: colorClass }} />}
      <div style={{
        fontSize: 'clamp(1.5rem, 5vw, 2.5rem)',
        fontWeight: 800,
        color: colorClass,
        lineHeight: 1.1
      }}>
        {count.toLocaleString()}
      </div>
      <div style={{
        fontSize: '0.95rem',
        fontWeight: 600,
        color: '#6b7280'
      }}>
        {label}
      </div>
    </div>
  );
};

export default AnimatedCounter;

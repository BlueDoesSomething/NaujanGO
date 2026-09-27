import React, { useState, useEffect, useMemo, useRef } from 'react';
import Icons from './Icons';
import './FloatingLeaves.css';

const FloatingLeaves = () => {
  const leafIconVariants = useMemo(() => [Icons.Leaf, Icons.Seedling], []);
  const leafSeqRef = useRef(0);
  const [leaves, setLeaves] = useState([]);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const createLeaf = () => {
      const id = leafSeqRef.current++;
      const Icon = leafIconVariants[Math.floor(Math.random() * leafIconVariants.length)];
      setLeaves(prev => {
        const next = [...prev, {
          id,
          Icon,
          left: Math.random() * 100,
          size: Math.random() * 20 + 12,
          dur: Math.random() * 15 + 15,
          delay: Math.random() * 5,
        }];
        const excess = next.length - 40;
        return excess > 0 ? next.slice(excess) : next;
      });
    };
    const seedTimers = [];
    for (let i = 0; i < 8; i++) seedTimers.push(setTimeout(createLeaf, i * 2000));
    const interval = setInterval(createLeaf, 4000);
    return () => { seedTimers.forEach(clearTimeout); clearInterval(interval); };
  }, []);

  return (
    <div className="floating-leaves" aria-hidden="true">
      {leaves.map(l => (
        <span
          key={l.id}
          className="floating-leaf"
          style={{ left: `${l.left}%`, fontSize: `${l.size}px`, animationDuration: `${l.dur}s`, animationDelay: `${l.delay}s` }}
        >
          <l.Icon size={Math.round(l.size)} />
        </span>
      ))}
    </div>
  );
};

export default FloatingLeaves;

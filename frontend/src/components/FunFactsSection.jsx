import React from 'react';
import Icons from './Icons';
import '../styles/FunFacts.css';

const FunFactsSection = ({ facts = [] }) => {
  if (!facts || facts.length === 0) {
    return (
      <div className="fun-facts-container">
        <p>No fun facts available</p>
      </div>
    );
  }

  const getIconComponent = (iconName) => {
    const iconMap = {
      lake: Icons.Waves,
      history: Icons.Clock,
      community: Icons.Users,
      agriculture: Icons.Leaf,
      landscape: Icons.Mountain,
      people: Icons.Heart,
    };
    return iconMap[iconName] || Icons.Sparkles;
  };

  return (
    <div className="fun-facts-container">
      <div className="fun-facts-grid">
        {facts.map((fact, index) => {
          const IconComponent = getIconComponent(fact.icon);
          return (
            <div key={index} className="fun-fact-card">
              <div className="fun-fact-icon">
                <IconComponent size={40} />
              </div>
              <h3 className="fun-fact-title">{fact.title}</h3>
              <p className="fun-fact-description">{fact.description}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default FunFactsSection;

import React from 'react';
import AnimatedCounter from '../../components/AnimatedCounter';
import Icons from '../../components/Icons';
import Breadcrumb from '../../components/Breadcrumb';
import { useLanguage } from '../../context/LanguageContext';

const AboutQuickFactsContent = () => {
  const { t } = useLanguage();
  const stats = [
    { label: 'Population (2024)', value: '109,122', icon: 'Users' },
    { label: 'Land Area', value: '503.10 km²', icon: 'Map' },
    { label: 'Population Density', value: '216–218/km²', icon: 'Grid' },
    { label: 'Barangays', value: '70', icon: 'Layers' },
    { label: 'Rank', value: '2nd in Prov.', icon: 'Trophy' },
    { label: 'Class', value: '1st Class', icon: 'Star' }
  ];

  return (
    <section className="about-section about-section-facts section-visible">
      <div className="about-container">
        <Breadcrumb items={[
          { label: t('home'), href: '/' },
          { label: t('about'), href: '/about' },
          { label: t('about_quick_facts'), active: true }
        ]} />
        <h2 className="about-section-title">{t('about_quick_facts')}</h2>
        
        <div className="about-stats-grid">
          {stats.map((stat, idx) => {
            const IconComponent = stat.icon ? Icons[stat.icon] : null;
            return (
              <AnimatedCounter
                key={idx}
                value={stat.value}
                label={stat.label}
                icon={IconComponent}
                color={['primary', 'blue', 'purple', 'orange'][idx % 4]}
              />
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default AboutQuickFactsContent;

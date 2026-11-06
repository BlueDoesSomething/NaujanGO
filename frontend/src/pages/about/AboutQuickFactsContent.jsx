import React from 'react';
import Icons from '../../components/Icons';
import Breadcrumb from '../../components/Breadcrumb';
import { useLanguage } from '../../context/LanguageContext';
import { useAboutContent } from '../../context/AboutContentContext';
import { aboutNumber } from '../../utils/aboutContent';

const AboutQuickFactsContent = () => {
  const { t } = useLanguage();
  const { settings } = useAboutContent();
  const stats = [
    { label: 'Population', value: aboutNumber(settings?.population), icon: 'Users' },
    { label: 'Land Area (km²)', value: aboutNumber(settings?.land_area_sq_km), icon: 'Map' },
    { label: 'Population Density (per km²)', value: aboutNumber(settings?.density_per_sq_km), icon: 'Grid' },
    { label: 'Barangays', value: aboutNumber(settings?.num_barangays), icon: 'Layers' },
    { label: 'Municipal rank', value: settings?.municipal_rank || 'Not available', icon: 'Trophy' }
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
              <div className="about-stat-card" key={stat.label}>{IconComponent && <IconComponent size={28} />}<strong className="about-stat-value">{stat.value}</strong><span className="about-stat-label">{stat.label}</span></div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default AboutQuickFactsContent;

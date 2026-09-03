import React from 'react';
import Breadcrumb from '../../components/Breadcrumb';
import { useLanguage } from '../../context/LanguageContext';

const AboutEconomyContent = () => {
  const { t } = useLanguage();
  const features = [
    {
      title: 'Agriculture',
      description: 'Rice, coconut, fruits (banana, mango, rambutan, lanzones), and root crops (cassava, camote, gabi).'
    },
    {
      title: 'Fishing',
      description: 'Naujan Lake provides tilapia, bangus, dalag, and hito, supporting local communities.'
    },
    {
      title: 'Local Products',
      description: 'Water lily handicrafts, baskets, woven items, beaded accessories, and Mangyan textiles.'
    }
  ];

  return (
    <section className="about-section about-section-economy section-visible">
      <div className="about-container">
        <Breadcrumb items={[
          { label: t('home'), href: '/' },
          { label: t('about'), href: '/about' },
          { label: t('about_economy_livelihood'), active: true }
        ]} />
        <h2 className="about-section-title">{t('about_economy_livelihood')}</h2>
        
        <div className="about-feature-cards">
          {features.map((feature, idx) => (
            <div key={idx} className="about-feature-card">
              <div className="about-feature-content">
                <h4>{feature.title}</h4>
                <p>{feature.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default AboutEconomyContent;

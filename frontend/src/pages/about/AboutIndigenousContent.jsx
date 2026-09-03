import React from 'react';
import Breadcrumb from '../../components/Breadcrumb';
import { useLanguage } from '../../context/LanguageContext';

const AboutIndigenousContent = () => {
  const { t } = useLanguage();
  const barangays = [
    { name: 'Paitan', description: 'Upland barangay with Mangyan communities, rivers, forests, and views of Mt. Halcon. The people practice upland farming.' },
    { name: 'Caburo', description: 'Inhabited mostly by Mangyan-Alangan communities in traditional bamboo houses, relying on subsistence farming.' },
    { name: 'Balite', description: 'A farming community supported by government programs.' },
    { name: 'Magtibay', description: 'High Mangyan population that preserves traditional leadership systems.' },
    { name: 'Banuton', description: 'Mountainous barangay where people practice traditional farming.' }
  ];

  return (
    <section className="about-section about-section-indigenous section-visible">
      <div className="about-container">
        <Breadcrumb items={[
          { label: t('home'), href: '/' },
          { label: t('about'), href: '/about' },
          { label: t('about_indigenous_communities'), active: true }
        ]} />
        <h2 className="about-section-title">{t('about_indigenous_communities')}</h2>
        
        <p style={{ color: '#374151', lineHeight: '1.8', marginBottom: '2rem' }}>
          The indigenous people of Naujan include the Mangyan-Alangan and Mangyan-Tadyawan groups, representing centuries of cultural heritage. Other Mangyan groups are also present, each with unique traditions and connections to the land.
        </p>
        
        <div className="about-barangays-grid">
          {barangays.map((barangay, idx) => (
            <div key={idx} className="about-barangay-card">
              <h4>{barangay.name}</h4>
              <p>{barangay.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default AboutIndigenousContent;

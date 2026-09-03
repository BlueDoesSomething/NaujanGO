import React from 'react';
import Breadcrumb from '../../components/Breadcrumb';
import { useLanguage } from '../../context/LanguageContext';

const AboutAlangangContent = () => {
  const { t } = useLanguage();
  const alangangInfo = [
    { title: 'Location & Population', content: 'Located near Mount Halcon with approximately 2,150 speakers.' },
    { title: 'Traditional Practices', content: 'Practice kaingin farming and live in shared houses called Balaylakoy.' },
    { title: 'Rituals & Traditions', content: 'Perform rituals such as pamago and maintain traditional clothing made of woven fibers.' },
    { title: 'Social Structure', content: 'Maintain distinctive traditional leadership systems and community governance.' }
  ];

  const sanama = [
    { heading: 'SANAMA (Alangan Mangyan Association)', items: [
      'Represents and advocates for Mangyan-Alangan communities',
      'Protects ancestral land and cultural heritage',
      'Provides education, livelihood, and development programs',
      'Supports cultural preservation initiatives'
    ] }
  ];

  const culturalPreservation = [
    'Protection of indigenous heritage and ancestral lands',
    'Preservation of historical landmarks and sacred sites',
    'Promotion of cultural celebrations and festivals',
    'Environmental protection initiatives for Naujan Lake region',
    'Youth involvement in ecological conservation programs',
    'Documentation of traditional knowledge and practices'
  ];

  return (
    <section className="about-section about-section-alangan section-visible">
      <div className="about-container">
        <Breadcrumb items={[
          { label: t('home'), href: '/' },
          { label: t('about'), href: '/about' },
          { label: t('about_alangan_culture'), active: true }
        ]} />
        <h2 className="about-section-title">{t('about_alangan_culture')}</h2>
        
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: 'var(--space-4)',
          marginBottom: 'var(--space-6)'
        }}>
          {alangangInfo.map((item, idx) => (
            <div key={idx} style={{
              background: 'var(--bg-lighter)',
              padding: 'var(--space-4)',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--border-color)'
            }}>
              <h4 style={{ color: 'var(--primary)', marginBottom: 'var(--space-2)' }}>{item.title}</h4>
              <p style={{ margin: 0, color: 'var(--text-secondary)' }}>{item.content}</p>
            </div>
          ))}
        </div>

        <div style={{ marginBottom: 'var(--space-6)' }}>
          <h3 style={{ fontSize: 'var(--font-lg)', marginBottom: 'var(--space-3)', color: 'var(--primary)' }}>
            SANAMA (Alangan Mangyan Association)
          </h3>
          <div style={{
            background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1), rgba(16, 185, 129, 0.05))',
            padding: 'var(--space-4)',
            borderRadius: 'var(--radius-lg)',
            borderLeft: '4px solid var(--primary)'
          }}>
            <ul style={{ margin: 0, paddingLeft: 'var(--space-4)' }}>
              {sanama[0].items.map((item, idx) => (
                <li key={idx} style={{ marginBottom: 'var(--space-2)', color: 'var(--text-primary)' }}>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div>
          <h3 style={{ fontSize: 'var(--font-lg)', marginBottom: 'var(--space-3)', color: 'var(--primary)' }}>
            Cultural Preservation Initiatives
          </h3>
          <ul style={{ columns: 2, gap: 'var(--space-4)', columnGap: 'var(--space-6)' }}>
            {culturalPreservation.map((item, idx) => (
              <li key={idx} style={{ marginBottom: 'var(--space-2)', color: 'var(--text-primary)', breakInside: 'avoid' }}>
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
};

export default AboutAlangangContent;

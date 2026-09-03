import React from 'react';
import Breadcrumb from '../../components/Breadcrumb';
import { useLanguage } from '../../context/LanguageContext';

const AboutGovernanceContent = () => {
  const { t } = useLanguage();
  const theBest = [
    { label: 'Turismong Maipagmamalaki', icon: 'RouteIcon' },
    { label: 'Hakbanging Pang Agrikultura', icon: 'Leaf' },
    { label: 'Edukasyon Para sa Lahat', icon: 'BookOpen' },
    { label: 'Bayang Mapagkalinga', icon: 'Heart' },
    { label: 'Ekonomiyang Masigla', icon: 'Money' },
    { label: 'Sapat na Imprastraktura', icon: 'Building' },
    { label: 'Tapat na Pamamahala', icon: 'Shield' }
  ];

  return (
    <section className="about-section about-section-governance section-visible">
      <div className="about-container">
        <Breadcrumb items={[
          { label: t('home'), href: '/' },
          { label: t('about'), href: '/about' },
          { label: t('about_governance_development'), active: true }
        ]} />
        <h2 className="about-section-title">{t('about_governance_development')}</h2>
        
        <div style={{
          background: 'linear-gradient(135deg, #f3f4f6, #e5e7eb)',
          padding: '2rem',
          borderRadius: '12px',
          borderLeft: '4px solid #10b981',
          lineHeight: '1.8',
          color: '#374151',
          marginBottom: '2rem'
        }}>
          <p style={{ margin: 0, marginBottom: '1rem' }}>
            The governance of Naujan focuses on sustainable tourism, agricultural growth, infrastructure development, community programs, and environmental protection. The Local Government Unit works in partnership with barangay officials and community leaders to ensure people-centered governance and equitable development.
          </p>
          <p style={{ marginBottom: '0' }}>
            Our commitment to transparent, accountable, and participatory governance ensures that all stakeholders have a voice in shaping the future of our municipality.
          </p>
        </div>

        <div>
          <h3 style={{ fontSize: 'var(--font-lg)', marginBottom: '1.5rem', color: 'var(--text-primary)' }}>
            THE BEST (Naujan Development Pillars)
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-3)' }}>
            {theBest.map((item, idx) => (
              <div key={idx} style={{
                background: 'linear-gradient(135deg, rgba(22, 163, 74, 0.1), rgba(22, 163, 74, 0.05))',
                padding: 'var(--space-4)',
                borderRadius: 'var(--radius-lg)',
                border: '2px solid var(--primary-light)',
                textAlign: 'center',
                transition: 'all 0.3s ease'
              }}>
                <div style={{ color: 'var(--primary)', marginBottom: 'var(--space-2)', fontWeight: '700', fontSize: 'var(--font-base)' }}>
                  {item.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default AboutGovernanceContent;

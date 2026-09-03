import React from 'react';
import Breadcrumb from '../../components/Breadcrumb';
import Icons from '../../components/Icons';
import { useLanguage } from '../../context/LanguageContext';

const AboutTourismContent = () => {
  const { t } = useLanguage();
  const years = [
    { year: '2022', arrivals: '15,605', growth: '-', icon: 'RouteIcon' },
    { year: '2023', arrivals: '42,561', growth: '+172.74%', icon: 'TrendingUp' },
    { year: '2024', arrivals: '62,788', growth: '+47.52%', icon: 'TrendingUp' },
    { year: '2025', arrivals: '36,074', growth: '-42.55%', icon: 'TrendingDown' }
  ];

  const employment = [
    { label: 'Total Employment', value: '580', icon: 'Users' },
    { label: 'Tourist Attractions', value: '475', icon: 'MapPin', breakdown: ['Female: 296', 'Male: 179'] },
    { label: 'Accommodation', value: '105', icon: 'Building', breakdown: ['Female: 42', 'Male: 63'] }
  ];

  const jobRoles = [
    { role: 'Tourism Office Staff', icon: 'Briefcase' },
    { role: 'Tour Guide', icon: 'MapPin' },
    { role: 'Hotel & Accommodation Staff', icon: 'Building' },
    { role: 'Travel & Tour Operator', icon: 'RouteIcon' },
    { role: 'Souvenir and Handicrafts Maker', icon: 'Palette' },
    { role: 'Restaurant or Culinary Staff', icon: 'UtensilsCrossed' },
    { role: 'Farm Tourism Worker', icon: 'Leaf' },
    { role: 'Boat Operator or Tourist Transport Driver', icon: 'Anchor' }
  ];

  const festivals = [
    { name: 'Pandanggitab Festival', placement: '3rd Place', icon: 'Trophy' },
    { name: 'Mahal Tana Festival', placement: 'Participant', icon: 'Star' }
  ];

  const cbsto = [
    { name: 'Montelago Tour Guide Association', icon: 'Users' },
    { name: 'Montemayor Adventure Traveller Operations Association', icon: 'RouteIcon' },
    { name: 'Dao Waterlily Association', icon: 'Leaf' },
    { name: 'Malvar Tourist Attraction Association', icon: 'MapPin' },
    { name: 'Melgar B Duluhan Cottage Association', icon: 'Building' },
    { name: 'Oric Sa Bathala Adventure Association', icon: 'Mountain' },
    { name: 'Night Market Association', icon: 'ShoppingCart' },
    { name: 'SANAMA (Alangan Mangyan Association)', icon: 'Users' },
    { name: 'Bibingka Vendors Association', icon: 'UtensilsCrossed' },
    { name: 'Montelago Hotspring and Forest Falls Association', icon: 'Droplets' },
    { name: 'Imay Food and Agri Association', icon: 'Leaf' }
  ];

  return (
    <section className="about-section about-section-tourism section-visible">
      <div className="about-container">
        <Breadcrumb items={[
          { label: t('home'), href: '/' },
          { label: t('about'), href: '/about' },
          { label: t('about_tourism_growth'), active: true }
        ]} />
        <h2 className="about-section-title">{t('about_tourism_growth')}</h2>
        
        <div className="about-stats-timeline">
          <div className="about-growth-chart">
            <h4>Visitor Arrivals (2022–2025)</h4>
            {years.map((g, idx) => {
              const IconComponent = Icons[g.icon];
              return (
                <div key={idx} className="about-growth-bar" style={{ marginBottom: 'var(--space-3)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-1)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                      {IconComponent && (
                        <span style={{ color: 'var(--primary)' }}>
                          <IconComponent size={20} />
                        </span>
                      )}
                      <span className="about-growth-year" style={{ fontWeight: '600' }}>{g.year}</span>
                    </div>
                    <span style={{ fontSize: 'var(--font-sm)', color: 'var(--text-secondary)' }}>Growth: {g.growth}</span>
                  </div>
                  <div style={{ 
                    background: 'var(--primary)',
                    color: 'white',
                    padding: 'var(--space-2)',
                    borderRadius: 'var(--radius-md)',
                    textAlign: 'right',
                    fontWeight: '600'
                  }}>
                    {g.arrivals} visitors
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div style={{ marginTop: 'var(--space-6)', paddingTop: 'var(--space-6)', borderTop: '1px solid var(--border-light)' }}>
          <h3 style={{ fontSize: 'var(--font-lg)', marginBottom: 'var(--space-4)' }}>Tourism Employment</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 'var(--space-4)', marginBottom: 'var(--space-6)' }}>
            {employment.map((e, idx) => {
              const IconComponent = Icons[e.icon];
              return (
                <div key={idx} style={{
                  background: 'var(--bg-lighter)',
                  padding: 'var(--space-4)',
                  borderRadius: 'var(--radius-lg)',
                  border: '1px solid var(--border-color)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-2)' }}>
                    {IconComponent && (
                      <span style={{ color: 'var(--primary)' }}>
                        <IconComponent size={20} />
                      </span>
                    )}
                    <div style={{ fontSize: 'var(--font-sm)', color: 'var(--text-secondary)' }}>{e.label}</div>
                  </div>
                  <div style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--primary)', marginBottom: 'var(--space-2)' }}>{e.value}</div>
                  {e.breakdown && (
                    <div style={{ fontSize: 'var(--font-sm)', color: 'var(--text-secondary)' }}>
                      {e.breakdown.map((b, i) => <div key={i}>{b}</div>)}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div style={{ marginTop: 'var(--space-6)', paddingTop: 'var(--space-6)', borderTop: '1px solid var(--border-light)' }}>
          <h3 style={{ fontSize: 'var(--font-lg)', marginBottom: 'var(--space-3)' }}>Tourism Job Roles</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-2)' }}>
            {jobRoles.map((item, idx) => {
              const IconComponent = Icons[item.icon];
              return (
                <div key={idx} style={{
                  padding: 'var(--space-3)',
                  background: 'var(--primary-lighter)',
                  borderRadius: 'var(--radius-md)',
                  borderLeft: '3px solid var(--primary)',
                  fontSize: 'var(--font-sm)',
                  color: 'var(--text-primary)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--space-2)'
                }}>
                  {IconComponent && (
                    <span style={{ color: 'var(--primary)', flexShrink: 0 }}>
                      <IconComponent size={18} />
                    </span>
                  )}
                  <span>{item.role}</span>
                </div>
              );
            })}
          </div>
        </div>

        <div style={{ marginTop: 'var(--space-6)', paddingTop: 'var(--space-6)', borderTop: '1px solid var(--border-light)' }}>
          <h3 style={{ fontSize: 'var(--font-lg)', marginBottom: 'var(--space-3)' }}>Festival Participation</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 'var(--space-3)' }}>
            {festivals.map((fest, idx) => {
              const IconComponent = Icons[fest.icon];
              return (
                <div key={idx} style={{
                  padding: 'var(--space-4)',
                  background: 'linear-gradient(135deg, rgba(22, 163, 74, 0.1), rgba(22, 163, 74, 0.05))',
                  borderRadius: 'var(--radius-lg)',
                  border: '2px solid var(--primary-light)',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 'var(--space-3)'
                }}>
                  {IconComponent && (
                    <span style={{ color: 'var(--primary)', flexShrink: 0, marginTop: '0.25rem' }}>
                      <IconComponent size={24} />
                    </span>
                  )}
                  <div>
                    <div style={{ fontWeight: '600', color: 'var(--text-primary)', marginBottom: 'var(--space-1)' }}>{fest.name}</div>
                    <div style={{ fontSize: 'var(--font-sm)', color: 'var(--primary)', fontWeight: '600' }}>{fest.placement}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div style={{ marginTop: 'var(--space-6)', paddingTop: 'var(--space-6)', borderTop: '1px solid var(--border-light)' }}>
          <h3 style={{ fontSize: 'var(--font-lg)', marginBottom: 'var(--space-3)' }}>Community-Based Sustainable Tourism Organizations (CBSTO)</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 'var(--space-3)' }}>
            {cbsto.map((item, idx) => {
              const IconComponent = Icons[item.icon];
              return (
                <div key={idx} style={{
                  padding: 'var(--space-3)',
                  background: 'var(--bg-lighter)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-color)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--space-2)'
                }}>
                  {IconComponent && (
                    <span style={{ color: 'var(--primary)', flexShrink: 0 }}>
                      <IconComponent size={20} />
                    </span>
                  )}
                  <span style={{ fontSize: 'var(--font-sm)', color: 'var(--text-primary)' }}>{item.name}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};

export default AboutTourismContent;

import React from 'react';
import Breadcrumb from '../../components/Breadcrumb';
import LeadershipCard from '../../components/LeadershipCard';
import { useLanguage } from '../../context/LanguageContext';
import { getApiBaseUrl } from '../../api';

const leaderKey = (role, name, term) => `${role}:${name}:${term}`;

const AboutLeadershipContent = ({ onEdit, isAdmin }) => {
  const { t } = useLanguage();
  const [photos, setPhotos] = React.useState({});
  const [roster, setRoster] = React.useState(null);

  React.useEffect(() => {
    fetch(`${getApiBaseUrl()}/api/about-leadership-photos`)
      .then((response) => response.ok ? response.json() : {})
      .then(setPhotos)
      .catch(() => {});
    fetch(`${getApiBaseUrl()}/api/about-leadership-roster`)
      .then((response) => response.ok ? response.json() : [])
      .then((savedRoster) => setRoster(Array.isArray(savedRoster) && savedRoster.length ? savedRoster : null))
      .catch(() => {});
  }, []);
  const defaultContent = {
    mayor: 'Henry Joel C. Teves',
    mayorTerm: '2022–Present',
    mayorPhotoUrl: photos[leaderKey('mayor', 'Henry Joel C. Teves', '2022–Present')] || null,
    viceMayor: 'Candido J. Melgar Jr.',
    viceMayorTerm: '2025–Present',
    viceMayorPhotoUrl: photos[leaderKey('vice-mayor', 'Candido J. Melgar Jr.', '2025–Present')] || null
  };

  const mayors = [
    { name: 'Carlos Basa Sr.', term: '1903' },
    { name: 'Bonifacio Evora', term: '1903' },
    { name: 'Leon Garong', term: '1903–1916' },
    { name: 'Agustin Garong', term: '1916–1922' },
    { name: 'Jose L. Basa', term: '1922–1927' },
    { name: 'Santiago Garong', term: '1928–1934' },
    { name: 'Porfirio Comia', term: '1935–1940' },
    { name: 'Cirilo S. Gaba', term: '1941–1942' },
    { name: 'Agustin Garong Sr.', term: '1942–1945' },
    { name: 'Felicisimo Garing', term: '1942–1945' },
    { name: 'Marciano Roldan', term: '1946, 1948–1951' },
    { name: 'Ambrocio L. Salva', term: '1946' },
    { name: 'Amando G. Melgar', term: '1952–1959' },
    { name: 'Porfirio Comia', term: '1950–1962' },
    { name: 'Manuel R. Marcos', term: '1962–1967' },
    { name: 'Armando Melgar Sr.', term: '1968–1975' },
    { name: 'Manuel Marcos', term: '1975–1986' },
    { name: 'Dr. Rolando R. Mendoza', term: '1986–1987' },
    { name: 'Arnulfo Bautista', term: '1987' },
    { name: 'Audel Arago', term: '1987–1988' },
    { name: 'Nelson Melgar', term: '1988–1997' },
    { name: 'Norberto M. Mendoza', term: '1997–2007' },
    { name: 'Romar G. Marcos', term: '2007–2010' },
    { name: 'Wilson A. Viray', term: '2010' },
    { name: 'Maria Angeles C. Casubuan', term: '2010–2013' },
    { name: 'Dein Z. Arago', term: '2010–2013' },
    { name: 'Mark N. Marcos', term: '2013–2022' },
    { name: 'Henry Joel C. Teves', term: '2022–Present', current: true }
  ];

  const viceMayors = [
    { name: 'Henry Joel C. Teves', term: '2013–2016' },
    { name: 'Sheryl Bacay Morales', term: '2016–2019' },
    { name: 'Sheryl Bacay Morales', term: '2019–2022' },
    { name: 'Great Mangubat Delos Reyes', term: '2022–2025' },
    { name: 'Candido J. Melgar Jr.', term: '2025–Present', current: true }
  ];

  const savedMayors = roster?.filter((person) => person.role === 'mayor') || mayors;
  const savedViceMayors = roster?.filter((person) => person.role === 'vice-mayor') || viceMayors;
  const currentMayor = savedMayors.find((person) => person.current) || savedMayors[savedMayors.length - 1];
  const currentViceMayor = savedViceMayors.find((person) => person.current) || savedViceMayors[savedViceMayors.length - 1];

  return (
    <section className="about-section about-section-leadership section-visible">
      <div className="about-container">
        <Breadcrumb items={[
          { label: t('home'), href: '/' },
          { label: t('about'), href: '/about' },
          { label: t('about_leadership_governance'), active: true }
        ]} />
        <h2 className="about-section-title">{t('about_leadership_governance')}</h2>
        
        <div style={{ marginTop: '2rem' }}>
          <h3 style={{ textAlign: 'center', marginBottom: '2rem', color: '#111827' }}>
            Current Leadership
          </h3>
          
          <div className="about-leadership-grid">
            <LeadershipCard
              name={currentMayor?.name || defaultContent.mayor}
              title="Mayor"
              term={currentMayor?.term || defaultContent.mayorTerm}
              photoUrl={photos[leaderKey('mayor', currentMayor?.name, currentMayor?.term)] || defaultContent.mayorPhotoUrl}
              index={0}
              isAdmin={isAdmin}
              onEdit={onEdit}
            />
            <LeadershipCard
              name={currentViceMayor?.name || defaultContent.viceMayor}
              title="Vice Mayor"
              term={currentViceMayor?.term || defaultContent.viceMayorTerm}
              photoUrl={photos[leaderKey('vice-mayor', currentViceMayor?.name, currentViceMayor?.term)] || defaultContent.viceMayorPhotoUrl}
              index={1}
              isAdmin={isAdmin}
              onEdit={onEdit}
            />
          </div>
        </div>

        <div style={{ marginTop: '3rem', paddingTop: '2rem', borderTop: '1px solid #e5e7eb' }}>
          <h3 style={{ marginBottom: '1.5rem', color: '#111827', fontSize: 'var(--font-lg)' }}>Mayors of Naujan (Historical)</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: 'var(--space-3)' }}>
            {savedMayors.map((mayor, idx) => (
              <div key={idx} style={{
                padding: 'var(--space-3)',
                background: mayor.current ? 'var(--primary-lighter)' : 'var(--bg-lighter)',
                borderLeft: mayor.current ? '4px solid var(--primary)' : '4px solid var(--border-color)',
                borderRadius: 'var(--radius-md)'
              }}>
                {photos[leaderKey('mayor', mayor.name, mayor.term)] && <img className="leadership-history-photo" src={photos[leaderKey('mayor', mayor.name, mayor.term)]} alt={mayor.name} />}
                <div style={{ fontWeight: '600', color: 'var(--text-primary)', marginBottom: '0.25rem' }}>{mayor.name}</div>
                <div style={{ fontSize: 'var(--font-sm)', color: 'var(--text-secondary)' }}>{mayor.term}</div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ marginTop: '2rem', paddingTop: '2rem', borderTop: '1px solid #e5e7eb' }}>
          <h3 style={{ marginBottom: '1.5rem', color: '#111827', fontSize: 'var(--font-lg)' }}>Vice Mayors of Naujan (Historical)</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: 'var(--space-3)' }}>
            {savedViceMayors.map((viceM, idx) => (
              <div key={idx} style={{
                padding: 'var(--space-3)',
                background: viceM.current ? 'var(--primary-lighter)' : 'var(--bg-lighter)',
                borderLeft: viceM.current ? '4px solid var(--primary)' : '4px solid var(--border-color)',
                borderRadius: 'var(--radius-md)'
              }}>
                {photos[leaderKey('vice-mayor', viceM.name, viceM.term)] && <img className="leadership-history-photo" src={photos[leaderKey('vice-mayor', viceM.name, viceM.term)]} alt={viceM.name} />}
                <div style={{ fontWeight: '600', color: 'var(--text-primary)', marginBottom: '0.25rem' }}>{viceM.name}</div>
                <div style={{ fontSize: 'var(--font-sm)', color: 'var(--text-secondary)' }}>{viceM.term}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default AboutLeadershipContent;

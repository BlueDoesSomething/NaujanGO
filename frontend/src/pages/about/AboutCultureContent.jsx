import React from 'react';
import Breadcrumb from '../../components/Breadcrumb';
import { useLanguage } from '../../context/LanguageContext';
import { getApiBaseUrl } from '../../api';

const API_BASE_URL = getApiBaseUrl();

const AboutCultureContent = () => {
  const { t } = useLanguage();
  const culturalItems = [
    {
      title: 'Traditional Weaving',
      description: 'Ancient textile art using natural fibers and traditional patterns passed down through generations of Mangyan artisans.'
    },
    {
      title: 'Saranggola (Kite-Making)',
      description: 'Traditional craft celebrating creativity and community spirit through colorful kite competitions.'
    },
    {
      title: 'Dabalistihit Festival',
      description: 'Celebrated on September 10, featuring freshwater fish species (Dalag, Banak, Banglis, Tilapia, Hito) through vibrant street dancing and cultural costumes.'
    },
    {
      title: 'Community Festivals',
      description: 'Various festivals celebrating Naujan\'s heritage and cultural identity throughout the year.'
    }
  ];

  const defaultQueens = [
    { id: 'queen-1', year: 2025, name: 'Merry Leveliet Ocampo', photo: null },
    { id: 'queen-2', year: 2024, name: 'Ronnete C. Castillo', photo: null },
    { id: 'queen-3', year: 2023, name: 'Myrea Manely V. Caccam', photo: null },
    { id: 'queen-4', year: 2022, name: 'Cribari Brandy M. Motol', photo: null },
  ];
  const [beautyQueens, setBeautyQueens] = React.useState(defaultQueens);

  React.useEffect(() => {
    fetch(`${API_BASE_URL}/api/about-pageant-queens`)
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (Array.isArray(data) && data.length) setBeautyQueens(data); })
      .catch(() => {});
  }, []);

  const PageantCard = ({ queen, idx }) => {
    const [hovered, setHovered] = React.useState(false);
    const isCurrent = idx === 0;
    return (
      <div
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          position: 'relative',
          overflow: 'hidden',
          background: isCurrent ? 'var(--about-ink)' : 'rgba(255,253,247,0.82)',
          border: '1px solid var(--about-line)',
          borderRadius: '2px',
          boxShadow: hovered ? '0 18px 38px rgba(24,51,45,0.13)' : '0 14px 32px rgba(24,51,45,0.06)',
          transform: hovered ? 'translateY(-5px)' : 'none',
          transition: 'transform 0.25s ease, box-shadow 0.25s ease, border-color 0.25s ease',
          borderColor: hovered ? 'rgba(196,95,60,0.55)' : 'var(--about-line)',
        }}
      >
        {/* Year tag — top left */}
        <div style={{
          position: 'absolute', top: '14px', left: '14px', zIndex: 3,
          background: 'var(--about-rust)', color: '#f8f4e9',
          fontFamily: 'var(--about-body)', fontWeight: 700,
          fontSize: '0.65rem', letterSpacing: '0.14em',
          padding: '4px 10px',
        }}>{queen.year}</div>

        {/* MISS NAUJAN label — top right */}
        <div style={{
          position: 'absolute', top: '14px', right: '14px', zIndex: 3,
          color: isCurrent ? '#e7aa88' : 'var(--about-rust)',
          fontFamily: 'var(--about-body)', fontWeight: 700,
          fontSize: '0.6rem', letterSpacing: '0.18em',
          textTransform: 'uppercase',
        }}>Miss Naujan</div>

        {/* Photo */}
        <div style={{ position: 'relative', paddingBottom: '115%', overflow: 'hidden', background: 'var(--about-sage)' }}>
          <img
            src={queen.photo || '/assets/default-profile.svg'}
            alt={queen.name}
            style={{
              position: 'absolute', top: 0, left: 0,
              width: '100%', height: '100%',
              objectFit: 'cover', objectPosition: 'top center',
              filter: 'saturate(0.82) contrast(1.03)',
              transform: hovered ? 'scale(1.04)' : 'scale(1)',
              transition: 'transform 0.4s ease',
            }}
          />
          <div style={{
            position: 'absolute', bottom: 0, left: 0, right: 0, height: '56px',
            background: isCurrent
              ? 'linear-gradient(to top, var(--about-ink), transparent)'
              : 'linear-gradient(to top, rgba(247,245,239,0.95), transparent)',
          }} />
          {!queen.photo && (
            <div style={{
              position: 'absolute', bottom: '12px', left: '14px',
              color: isCurrent ? '#c8d6cc' : 'var(--about-muted)',
              fontFamily: 'var(--about-body)', fontSize: '0.65rem',
              fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase',
            }}>Photo pending</div>
          )}
        </div>

        {/* Divider rule */}
        <div style={{ height: '3px', background: 'var(--about-rust)' }} />

        {/* Name block */}
        <div style={{ padding: '18px 20px 20px' }}>
          <div style={{
            fontFamily: 'var(--about-display)',
            fontWeight: 400, fontSize: '1.2rem', lineHeight: 1.1,
            color: isCurrent ? '#f8f4e9' : 'var(--about-ink)',
            marginBottom: '6px',
          }}>{queen.name}</div>
          {isCurrent && (
            <div style={{
              display: 'inline-block',
              background: 'var(--about-rust)', color: '#f8f4e9',
              fontFamily: 'var(--about-body)', fontWeight: 700,
              fontSize: '0.6rem', letterSpacing: '0.14em',
              padding: '3px 8px', marginTop: '4px',
            }}>REIGNING</div>
          )}
        </div>
      </div>
    );
  };

  return (
    <section className="about-section about-section-culture section-visible">
      <div className="about-container">
        <Breadcrumb items={[
          { label: t('home'), href: '/' },
          { label: t('about'), href: '/about' },
          { label: t('about_culture_arts'), active: true }
        ]} />
        <h2 className="about-section-title">{t('about_culture_arts')}</h2>

        <div className="about-card-grid">
          {culturalItems.map((card, idx) => (
            <details key={idx} className="about-image-card about-culture-story">
              <div className="about-image-card-content">
                <summary><h4>{card.title}</h4><span aria-hidden="true">+</span></summary>
                <p>{card.description}</p>
              </div>
            </details>
          ))}
        </div>

        {/* Miss Naujan section */}
        <div style={{ marginTop: '52px', paddingTop: '28px', borderTop: '1px solid var(--about-line)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '28px', alignItems: 'end', marginBottom: '28px' }}>
            <div>
              <p className="about-story-label">08 / PAGEANTRY</p>
              <h3 style={{ margin: 0, fontFamily: 'var(--about-display)', fontWeight: 400, fontSize: 'clamp(1.8rem,3vw,2.8rem)', lineHeight: 1.05, color: 'var(--about-ink)' }}>Miss Naujan</h3>
            </div>
            <p style={{ margin: 0, color: 'var(--about-muted)', fontSize: '0.95rem', lineHeight: 1.7 }}>
              Beauty queens who have represented the pride, grace, and culture of Naujan.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
            {beautyQueens.map((queen, idx) => (
              <PageantCard key={idx} queen={queen} idx={idx} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default AboutCultureContent;

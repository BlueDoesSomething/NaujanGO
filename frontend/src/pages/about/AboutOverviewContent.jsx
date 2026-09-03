import React from 'react';
import Breadcrumb from '../../components/Breadcrumb';
import Icons from '../../components/Icons';
import { useLanguage } from '../../context/LanguageContext';
import { aboutCopy } from './aboutTranslations';

const AboutOverviewContent = () => {
  const { t, getCurrentLanguage } = useLanguage();
  const copy = (key, fallback) => aboutCopy(getCurrentLanguage()?.code || 'en', key, fallback);
  const journey = [
    { number: '01', label: copy('land', 'The land'), title: copy('landTitle', 'Water and soil'), text: copy('landText', 'Begin with Naujan Lake, mountain air, and the agricultural landscapes that sustain the municipality.'), href: '/about/quick-facts', icon: 'Map' },
    { number: '02', label: copy('people', 'The people'), title: copy('peopleTitle', 'Many roots, one home'), text: copy('peopleText', 'Meet the Mangyan communities and local families carrying knowledge forward through everyday life.'), href: '/about/indigenous', icon: 'Users' },
    { number: '03', label: copy('memory', 'The memory'), title: copy('memoryTitle', 'Stories in stone'), text: copy('memoryText', 'Follow the places and turning points that shaped Naujan across centuries of change.'), href: '/about/history', icon: 'Archive' },
    { number: '04', label: copy('invitation', 'The invitation'), title: copy('invitationTitle', 'Come closer'), text: copy('invitationText', 'Find nature, culture, food, and community experiences worth making time for.'), href: '/attractions', icon: 'RouteIcon' }
  ];

  const voices = [
    { quote: copy('voiceOne', 'Naujan is where the lake, the farms, and the community meet.'), role: copy('voiceOneRole', 'A place shaped by water and work') },
    { quote: copy('voiceTwo', 'Our traditions are not only from the past. They are part of how we live today.'), role: copy('voiceTwoRole', 'A living cultural heritage') },
    { quote: copy('voiceThree', 'Every visitor has a chance to leave with a deeper story than the one they arrived with.'), role: copy('voiceThreeRole', 'A warmer way to travel') }
  ];
  const defaultContent = {
    title: t('about_overview_title') === 'about_overview_title' ? 'Welcome to Naujan' : t('about_overview_title'),
    introduction: t('about_overview_intro') === 'about_overview_intro'
      ? 'Naujan is a first-class municipality in Oriental Mindoro, known for its agricultural landscapes, living cultural heritage, and growing nature-based tourism.'
      : t('about_overview_intro'),
    highlights: [
      { label: 'Barangays', value: '70', icon: 'Map' },
      { label: 'Population (2024)', value: '109,122', icon: 'Users' },
      { label: 'Classification', value: '1st Class', icon: 'Trophy' },
      { label: 'Land Area', value: '503.10 km²', icon: 'Globe' }
    ],
    keyStrengths: [
      {
        icon: 'Leaf',
        title: 'Agricultural Hub',
        description: 'Known for rice, coconut, fruits, and sustainable farming practices supporting the province\'s food security.'
      },
      {
        icon: 'RouteIcon',
        title: 'Tourism Destination',
        description: 'Growing tourism sector with nature-based attractions, cultural experiences, and community-based tourism initiatives.'
      },
      {
        icon: 'Users',
        title: 'Cultural Diversity',
        description: 'Rich cultural heritage with indigenous Mangyan communities and vibrant local traditions.'
      },
      {
        icon: 'Mountain',
        title: 'Natural Resources',
        description: 'Home to Naujan Lake, pristine forests, and scenic mountains offering ecotourism opportunities.'
      }
    ],
    keyFacts: [
      { stat: '2nd', label: 'Most Populous Municipality in Oriental Mindoro' },
      { stat: '+172%', label: 'Tourism Growth Rate (2022-2023)' },
      { stat: '5', label: 'Indigenous People Barangays' },
      { stat: '580', label: 'Tourism Sector Jobs (2024)' }
    ]
  };

  return (
    <section className="about-section about-section-overview section-visible">
      <div className="about-container">
        <Breadcrumb items={[
          { label: t('home'), href: '/' },
          { label: t('about'), href: '/about' },
          { label: defaultContent.title, active: true }
        ]} />
        
        <h2 className="about-section-title">{defaultContent.title}</h2>
        
        {/* Introduction */}
        <div style={{
          fontSize: '1.1rem',
          lineHeight: '1.8',
          color: 'var(--text-primary)',
          marginBottom: 'var(--space-6)',
          maxWidth: '100%'
        }}>
          {defaultContent.introduction}
        </div>
        <div className="about-story-intro">
          <div>
            <p className="about-story-label">{copy('follow', 'Follow the thread')}</p>
            <h3>{copy('moreThan', 'A place is more than a pin on a map.')}</h3>
          </div>
          <p>{copy('journeyText', 'Move through Naujan by following the connections between landscape, people, memory, and invitation.')}</p>
        </div>

        <div className="about-journey-grid">
          {journey.map((step) => {
            const IconComponent = Icons[step.icon];
            return (
              <a key={step.number} href={step.href} className="about-journey-card">
                <div className="about-journey-topline">
                  <span>{step.number}</span>
                  {IconComponent && <IconComponent size={22} />}
                </div>
                <p>{step.label}</p>
                <h4>{step.title}</h4>
                <span className="about-journey-text">{step.text}</span>
                <span className="about-journey-link">Explore story <span aria-hidden="true">↗</span></span>
              </a>
            );
          })}
        </div>

        {/* Key Highlights Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: 'var(--space-4)',
          marginBottom: 'var(--space-8)'
        }}>
          {defaultContent.highlights.map((highlight, idx) => {
            const IconComponent = Icons[highlight.icon];
            return (
              <div key={idx} style={{
                background: 'linear-gradient(135deg, rgba(22, 163, 74, 0.1), rgba(22, 163, 74, 0.05))',
                padding: 'var(--space-4)',
                borderRadius: 'var(--radius-lg)',
                border: '2px solid var(--primary-light)',
                textAlign: 'center',
                transition: 'all 0.3s ease'
              }}>
                {IconComponent && (
                  <div style={{ marginBottom: 'var(--space-2)', color: 'var(--primary)' }}>
                    <IconComponent size={32} />
                  </div>
                )}
                <div style={{
                  fontSize: '1.75rem',
                  fontWeight: '700',
                  color: 'var(--primary)',
                  marginBottom: 'var(--space-1)'
                }}>
                  {highlight.value}
                </div>
                <div style={{
                  fontSize: 'var(--font-sm)',
                  color: 'var(--text-secondary)',
                  fontWeight: '600'
                }}>
                  {highlight.label}
                </div>
              </div>
            );
          })}
        </div>

        {/* Key Strengths Section */}
        <div style={{ marginBottom: 'var(--space-8)' }}>
          <h3 style={{
            fontSize: 'var(--font-xl)',
            fontWeight: '700',
            color: 'var(--text-primary)',
            marginBottom: 'var(--space-4)'
          }}>
            {t('about_key_strengths_heading') === 'about_key_strengths_heading' ? 'What makes Naujan remarkable' : t('about_key_strengths_heading')}
          </h3>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: 'var(--space-4)'
          }}>
            {defaultContent.keyStrengths.map((strength, idx) => {
              const IconComponent = Icons[strength.icon];
              return (
                <div key={idx} style={{
                  background: 'var(--bg-white)',
                  padding: 'var(--space-4)',
                  borderRadius: 'var(--radius-lg)',
                  border: '1px solid var(--border-color)',
                  boxShadow: 'var(--shadow-sm)',
                  transition: 'all 0.3s ease',
                  ':hover': {
                    boxShadow: 'var(--shadow-md)',
                    transform: 'translateY(-4px)'
                  }
                }}>
                  {IconComponent && (
                    <div style={{
                      width: '50px',
                      height: '50px',
                      background: 'var(--primary-lighter)',
                      borderRadius: 'var(--radius-lg)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginBottom: 'var(--space-3)',
                      color: 'var(--primary)'
                    }}>
                      <IconComponent size={24} />
                    </div>
                  )}
                  <h4 style={{
                    fontSize: 'var(--font-base)',
                    fontWeight: '700',
                    color: 'var(--text-primary)',
                    marginBottom: 'var(--space-2)',
                    margin: 0
                  }}>
                    {strength.title}
                  </h4>
                  <p style={{
                    fontSize: 'var(--font-sm)',
                    color: 'var(--text-secondary)',
                    lineHeight: '1.6',
                    margin: 0
                  }}>
                    {strength.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Key Facts Section */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(22, 163, 74, 0.05), rgba(22, 163, 74, 0.02))',
          padding: 'var(--space-6)',
          borderRadius: 'var(--radius-xl)',
          border: '1px solid var(--border-light)',
          marginBottom: 'var(--space-6)'
        }}>
          <h3 style={{
            fontSize: 'var(--font-xl)',
            fontWeight: '700',
            color: 'var(--text-primary)',
            marginBottom: 'var(--space-4)'
          }}>
            {t('about_by_the_numbers') === 'about_by_the_numbers' ? 'Naujan by the numbers' : t('about_by_the_numbers')}
          </h3>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: 'var(--space-4)'
          }}>
            {defaultContent.keyFacts.map((fact, idx) => (
              <div key={idx} style={{
                textAlign: 'center',
                padding: 'var(--space-3)'
              }}>
                <div style={{
                  fontSize: '2.5rem',
                  fontWeight: '800',
                  color: 'var(--primary)',
                  marginBottom: 'var(--space-2)',
                  lineHeight: '1'
                }}>
                  {fact.stat}
                </div>
                <div style={{
                  fontSize: 'var(--font-sm)',
                  color: 'var(--text-secondary)',
                  fontWeight: '600'
                }}>
                  {fact.label}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="about-voices-block">
          <div className="about-voices-heading">
            <p className="about-story-label">{copy('voices', 'Voices of Naujan')}</p>
            <h3>{copy('listen', 'Listen to the place.')}</h3>
          </div>
          <div className="about-voices-grid">
            {voices.map((voice, index) => (
              <figure key={index} className="about-voice-card">
                <span className="about-quote-mark" aria-hidden="true">“</span>
                <blockquote>{voice.quote}</blockquote>
                <figcaption>{voice.role}</figcaption>
              </figure>
            ))}
          </div>
        </div>

        <div className="about-visit-band">
          <div>
            <p className="about-story-label">{copy('nextChapter', 'Your next chapter')}</p>
            <h3>{copy('slower', 'Make room for a slower kind of discovery.')}</h3>
            <p>{copy('visitText', 'Use the map to find places to pause, then pair your route with a stay and an experience.')}</p>
          </div>
          <div className="about-visit-actions">
            <a href="/itinerary" className="about-visit-primary">{copy('itinerary', 'Build an itinerary')} <span aria-hidden="true">↗</span></a>
            <a href="/map" className="about-visit-primary">{copy('map', 'Open the map')} <span aria-hidden="true">↗</span></a>
            <a href="/attractions" className="about-visit-secondary">{copy('attractions', 'Browse attractions')}</a>
          </div>
        </div>

        {/* Call to Action */}
        <div style={{
          background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%)',
          color: 'white',
          padding: 'var(--space-6)',
          borderRadius: 'var(--radius-xl)',
          textAlign: 'center'
        }}>
          <h3 style={{
            fontSize: 'var(--font-lg)',
            fontWeight: '700',
            margin: '0 0 var(--space-2) 0'
          }}>
            {t('about_discover_cta') === 'about_discover_cta' ? 'Start your Naujan story' : t('about_discover_cta')}
          </h3>
          <p style={{
            fontSize: 'var(--font-base)',
            margin: '0 0 var(--space-3) 0',
            opacity: 0.95
          }}>
            Explore our cultural heritage, agricultural excellence, and emerging tourism destinations. Whether you're interested in history, nature, or community experiences, Naujan welcomes you.
          </p>
          <a href="/about/tourism" style={{
            display: 'inline-block',
            background: 'white',
            color: 'var(--primary)',
            padding: 'var(--space-2) var(--space-4)',
            borderRadius: 'var(--radius-lg)',
            textDecoration: 'none',
            fontWeight: '600',
            transition: 'all 0.3s ease'
          }}>
            {t('learn_about_tourism') === 'learn_about_tourism' ? 'Explore tourism' : t('learn_about_tourism')}
          </a>
        </div>
      </div>
    </section>
  );
};

export default AboutOverviewContent;

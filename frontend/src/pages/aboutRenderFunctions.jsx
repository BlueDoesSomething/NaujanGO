import React from 'react';
import Icons from '../components/Icons';

// Animated Counter Component
const AnimatedCounter = ({ targetValue, duration = 2000 }) => {
  const [count, setCount] = React.useState(0);
  const countRef = React.useRef(null);

  React.useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && count === 0) {
          let start = 0;
          const increment = (targetValue / (duration / 16)) || 1;
          const timer = setInterval(() => {
            start += increment;
            if (start >= targetValue) {
              setCount(targetValue);
              clearInterval(timer);
            } else {
              setCount(Math.floor(start));
            }
          }, 16);
          return () => clearInterval(timer);
        }
      },
      { threshold: 0.5 }
    );

    if (countRef.current) {
      observer.observe(countRef.current);
    }

    return () => {
      if (countRef.current) {
        observer.unobserve(countRef.current);
      }
    };
  }, [targetValue, duration, count]);

  return <span ref={countRef}>{count.toLocaleString()}</span>;
};

// Section Divider Component
const SectionDivider = () => (
  <div className="about-section-divider">
    <div className="about-divider-line"></div>
  </div>
);

// CTA Section Component
const CTASection = ({ title, description, showExplore = true, showHotels = true }) => (
  <div className="about-cta-section">
    <div className="about-container" style={{ position: 'relative', zIndex: 2 }}>
      <h2>{title}</h2>
      <p>{description}</p>
      <div className="about-cta-buttons">
        {showExplore && (
          <a href="/attractions" className="about-cta-button about-cta-primary">
            <Icons.MapPin size={20} />
            Explore Attractions
          </a>
        )}
        {showHotels && (
          <a href="/hotels" className="about-cta-button about-cta-primary">
            <Icons.Hotel size={20} />
            Find Accommodation
          </a>
        )}
      </div>
    </div>
  </div>
);

// Shared render functions for About pages
export const renderSectionByType = (section) => {
  switch (section.type) {
    case 'text-image':
      return renderTextImage(section);
    case 'split-cards':
      return renderSplitCards(section);
    case 'timeline':
      return renderTimeline(section);
    case 'leadership':
      return renderLeadership(section);
    case 'stats-grid':
      return renderStatsGrid(section);
    case 'card-grid':
      return renderCardGrid(section);
    case 'feature-cards':
      return renderFeatureCards(section);
    case 'featured-image':
      return renderFeaturedImage(section);
    case 'stats-timeline':
      return renderStatsTimeline(section);
    case 'text-simple':
      return renderTextSimple(section);
    default:
      return null;
  }
};

export const renderTextImage = (section) => (
  <div className={`about-text-image ${section.layout}`}>
    {section.image && (
      <div className="about-text-image-img">
        <img src={section.image} alt={section.title} loading="lazy" />
      </div>
    )}
    <div className="about-text-image-content">
      <p className="about-section-description">{section.content}</p>
      {section.highlights && (
        <div className="about-highlights-grid">
          {section.highlights.map((h, idx) => (
            <div key={idx} className="about-highlight-box">
              <div className="about-highlight-value">{h.value}</div>
              <div className="about-highlight-label">{h.label}</div>
            </div>
          ))}
        </div>
      )}
      {section.barangays && (
        <div className="about-barangays-grid">
          {section.barangays.map((b, idx) => (
            <div key={idx} className="about-barangay-card">
              {b.image && <img src={b.image} alt={b.name} loading="lazy" />}
              <h4>{b.name}</h4>
              <p>{b.description}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  </div>
);

export const renderSplitCards = (section) => (
  <div className="about-split-cards">
    <div className="about-card about-vision-card">
      <div className="about-card-icon"><Icons.Sparkles size={40} /></div>
      <h3>{section.vision.title}</h3>
      <p>{section.vision.content}</p>
    </div>
    <div className="about-card about-mission-card">
      <div className="about-card-icon"><Icons.Heart size={40} filled /></div>
      <h3>{section.mission.title}</h3>
      <p>{section.mission.content}</p>
    </div>
  </div>
);

export const renderTimeline = (section) => (
  <div className="about-timeline">
    {section.timeline.map((item, idx) => (
      <div key={idx} className="about-timeline-item">
        <div className="about-timeline-marker">
          <span className="about-timeline-year">{item.year}</span>
        </div>
        <div className="about-timeline-content">
          {item.image && (
            <div className="about-timeline-image">
              <img src={item.image} alt={item.title} loading="lazy" />
            </div>
          )}
          <h4>{item.title}</h4>
          <p>{item.description}</p>
        </div>
      </div>
    ))}
  </div>
);

export const renderLeadership = (section) => {
  const [showFormer, setShowFormer] = React.useState(false);

  return (
    <div className="about-leadership-container">
      {/* Current Leadership */}
      <div className="about-leadership-current">
        <h3 className="about-leadership-subtitle">Current Leadership</h3>
        <div className="about-leadership-grid">
          <div className="about-leadership-card current">
            <div className="about-leadership-badge">Mayor</div>
            <h4 className="about-leadership-name">{section.current.mayor}</h4>
            <p className="about-leadership-term">{section.current.mayorTerm}</p>
          </div>
          <div className="about-leadership-card current">
            <div className="about-leadership-badge">Vice Mayor</div>
            <h4 className="about-leadership-name">{section.current.viceMayor}</h4>
            <p className="about-leadership-term">{section.current.viceMayorTerm}</p>
          </div>
        </div>
      </div>

      {/* Former Leaders Toggle */}
      <div className="about-leadership-former-section">
        <button
          className="about-leadership-toggle"
          onClick={() => setShowFormer(!showFormer)}
          aria-expanded={showFormer}
        >
          <span>{showFormer ? '▼' : '▶'} View Historical Leadership</span>
          <span className="about-leadership-toggle-count">
            ({section.formerMayors.length + section.formerViceMayors.length} former leaders)
          </span>
        </button>

        {/* Former Leaders List */}
        {showFormer && (
          <div className="about-leadership-former-content">
            {/* Former Mayors */}
            <div className="about-leadership-former-group">
              <h4 className="about-leadership-former-title">Mayors of Naujan</h4>
              <div className="about-leadership-timeline-list">
                {section.formerMayors.map((mayor, idx) => (
                  <div key={idx} className="about-leadership-timeline-item">
                    <div className="about-leadership-timeline-dot"></div>
                    <div className="about-leadership-timeline-content">
                      <p className="about-leadership-former-name">{mayor.name}</p>
                      <p className="about-leadership-former-term">{mayor.term}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Former Vice Mayors */}
            <div className="about-leadership-former-group">
              <h4 className="about-leadership-former-title">Vice Mayors of Naujan</h4>
              <div className="about-leadership-timeline-list">
                {section.formerViceMayors.map((viceMayor, idx) => (
                  <div key={idx} className="about-leadership-timeline-item">
                    <div className="about-leadership-timeline-dot"></div>
                    <div className="about-leadership-timeline-content">
                      <p className="about-leadership-former-name">{viceMayor.name}</p>
                      <p className="about-leadership-former-term">{viceMayor.term}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export const renderStatsGrid = (section) => {
  const parseNumericValue = (value) => {
    const num = parseInt(value.toString().replace(/,/g, ''), 10);
    return isNaN(num) ? 0 : num;
  };

  return (
    <>
      <div className="about-stats-grid">
        {section.stats.map((stat, idx) => {
          const numValue = parseNumericValue(stat.value);
          const isNumeric = numValue > 0;
          const IconComponent = Icons[stat.icon];

          return (
            <div key={idx} className="about-stat-card">
              {IconComponent && (
                <div className="about-stat-icon">
                  <IconComponent size={24} />
                </div>
              )}
              <div className="about-stat-value">
                {isNumeric ? <AnimatedCounter targetValue={numValue} /> : stat.value}
                {isNumeric && numValue === 70 && <span>+</span>}
                {isNumeric && (numValue === 109122 || numValue === 218) && ',000'}
              </div>
              <div className="about-stat-label">{stat.label}</div>
            </div>
          );
        })}
      </div>
      <CTASection
        title="Discover More About Naujan"
        description="Explore the attractions, accommodations, and experiences that make Naujan special."
        showExplore={true}
        showHotels={true}
      />
    </>
  );
};

export const renderCardGrid = (section) => (
  <div className="about-card-grid">
    {section.cards.map((card, idx) => (
      <div key={idx} className="about-image-card">
        {card.image && <img src={card.image} alt={card.title} loading="lazy" />}
        <div className="about-image-card-content">
          <h4>{card.title}</h4>
          <p>{card.description}</p>
        </div>
      </div>
    ))}
  </div>
);

export const renderFeatureCards = (section) => (
  <div className="about-feature-cards">
    {section.features.map((feature, idx) => (
      <div key={idx} className="about-feature-card">
        <div className="about-feature-image">
          <img src={feature.image} alt={feature.title} loading="lazy" />
        </div>
        <div className="about-feature-content">
          <h4>{feature.title}</h4>
          <p>{feature.description}</p>
        </div>
      </div>
    ))}
  </div>
);

export const renderFeaturedImage = (section) => (
  <div className="about-featured-section" style={{ backgroundImage: `url(${section.backgroundImage})` }}>
    <div className={`about-featured-overlay ${section.overlay ? 'with-overlay' : ''}`}>
      <div className="about-featured-content">
        <h3>{section.title}</h3>
        <p>{section.content}</p>
      </div>
    </div>
  </div>
);

export const renderStatsTimeline = (section) => (
  <div className="about-stats-timeline">
    <div className="about-growth-chart">
      <h4>Visitor Growth</h4>
      {section.growth.map((g, idx) => (
        <div key={idx} className="about-growth-bar">
          <span className="about-growth-year">{g.year}</span>
          <div className="about-growth-value">{g.arrivals}</div>
        </div>
      ))}
    </div>
    <div className="about-employment-stats">
      <h4>Employment Impact</h4>
      {section.employment.map((e, idx) => (
        <div key={idx} className="about-employment-item">
          <span>{e.label}</span>
          <strong>{e.value}</strong>
        </div>
      ))}
    </div>
  </div>
);

export const renderTextSimple = (section) => (
  <div className="about-text-simple">
    <p>{section.content}</p>
  </div>
);

// Export helper components for other uses
export { AnimatedCounter, SectionDivider, CTASection };

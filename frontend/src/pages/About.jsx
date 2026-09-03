import React, { useState, useEffect, lazy, Suspense } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import api from '../api';
import Icons from '../components/Icons';
import './About.css';
import { aboutCopy } from './about/aboutTranslations';

// Lazy load all section components for code splitting
const AboutOverviewContent = lazy(() => import('./about/AboutOverviewContent'));
const AboutVisionMissionContent = lazy(() => import('./about/AboutVisionMissionContent'));
const AboutHistoryContent = lazy(() => import('./about/AboutHistoryContent'));
const AboutLeadershipContent = lazy(() => import('./about/AboutLeadershipContent'));
const AboutQuickFactsContent = lazy(() => import('./about/AboutQuickFactsContent'));
const AboutIndigenousContent = lazy(() => import('./about/AboutIndigenousContent'));
const AboutAlangangContent = lazy(() => import('./about/AboutAlangangContent'));
const AboutCultureContent = lazy(() => import('./about/AboutCultureContent'));
const AboutEconomyContent = lazy(() => import('./about/AboutEconomyContent'));
const AboutTourismContent = lazy(() => import('./about/AboutTourismContent'));
const AboutGovernanceContent = lazy(() => import('./about/AboutGovernanceContent'));
const AboutAccomplishmentsContent = lazy(() => import('./about/AboutAccomplishmentsContent'));

const getSections = (t) => ({
  overview: { id: 'overview', title: t('about_welcome_naujan'), component: AboutOverviewContent },
  'vision-mission': { id: 'vision-mission', title: t('about_vision_mission'), component: AboutVisionMissionContent },
  history: { id: 'history', title: t('about_history_naujan'), component: AboutHistoryContent },
  leadership: { id: 'leadership', title: t('about_leadership_governance'), component: AboutLeadershipContent },
  'quick-facts': { id: 'quick-facts', title: t('about_quick_facts'), component: AboutQuickFactsContent },
  indigenous: { id: 'indigenous', title: t('about_indigenous_communities'), component: AboutIndigenousContent },
  alangan: { id: 'alangan', title: t('about_alangan_culture'), component: AboutAlangangContent },
  culture: { id: 'culture', title: t('about_culture_arts'), component: AboutCultureContent },
  economy: { id: 'economy', title: t('about_economy_livelihood'), component: AboutEconomyContent },
  tourism: { id: 'tourism', title: t('about_tourism_growth'), component: AboutTourismContent },
  governance: { id: 'governance', title: t('about_governance_development'), component: AboutGovernanceContent },
  accomplishments: { id: 'accomplishments', title: 'Accomplishments & Milestones', component: AboutAccomplishmentsContent }
});

const SECTION_ICONS = {
  'overview': 'Info',
  'vision-mission': 'Sparkles',
  'history': 'Archive',
  'leadership': 'Users',
  'quick-facts': 'ChartLineUp',
  'indigenous': 'Leaf',
  'alangan': 'Mountain',
  'culture': 'Palette',
  'economy': 'Money',
  'tourism': 'RouteIcon',
  'governance': 'Shield',
  'accomplishments': 'Trophy'
};

const About = () => {
  const { user } = useAuth();
  const { t, getCurrentLanguage } = useLanguage();
  const copy = (key, fallback) => aboutCopy(getCurrentLanguage?.()?.code || 'en', key, fallback);
  const location = useLocation();
  const navigate = useNavigate();
  const SECTIONS = getSections(t);
  
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);

  // Extract section from URL
  const pathParts = location.pathname.split('/').filter(Boolean);
  const currentSection = pathParts.length > 1 ? pathParts[1] : 'overview';
  const viewMode = pathParts.length > 1 ? 'single' : 'all';

  const handleSectionClick = (sectionId) => {
    navigate(`/about/${sectionId}`);
    setMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Scroll progress tracking
  useEffect(() => {
    const handleScroll = () => {
      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight - windowHeight;
      const scrolled = window.scrollY;
      const progress = (scrolled / documentHeight) * 100;
      
      setScrollProgress(progress);
      setShowBackToTop(scrolled > 400);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, [location.pathname]);

  const handleLeadershipUpdate = async (index, field, value) => {
    if (!user?.isAdmin) return;
    
    try {
      if (field === 'photo' && value instanceof File) {
        const formData = new FormData();
        const photoField = index === 0 ? 'mayorPhoto' : 'viceMayorPhoto';
        formData.append('file', value);
        formData.append('type', photoField);
        formData.append(
          'leaderKey',
          index === 0
            ? 'mayor:Henry Joel C. Teves:2022–Present'
            : 'vice-mayor:Candido J. Melgar Jr.:2025–Present'
        );
        
        await api.post('/admin/leader-photo', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      }
    } catch (err) {
      console.error('Error updating leadership:', err);
    }
  };

  // Loading fallback
  const LoadingFallback = () => (
    <section className="about-section section-visible">
      <div className="about-container">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '400px' }}>
          <Icons.Loader size={48} />
        </div>
      </div>
    </section>
  );

  return (
    <div className="about-page">
      {/* Scroll Progress Bar */}
      <div className="about-scroll-progress" style={{ width: `${scrollProgress}%` }} />

      {/* Mobile Menu Button */}
      <button
        className="about-mobile-menu-btn"
        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        aria-expanded={mobileMenuOpen}
        aria-controls="about-navigation"
        aria-label={mobileMenuOpen ? 'Close About navigation' : 'Open About navigation'}
      >
        <span></span>
        <span></span>
        <span></span>
      </button>

      <header className="about-masthead">
        <div className="about-masthead-inner">
          <div className="about-masthead-copy">
              <p className="about-kicker">{copy('fieldGuide', 'A field guide to place')}</p>
              <h1>{copy('mastheadTitle', 'Meet Naujan')}<span>.</span></h1>
            <p className="about-masthead-lede">
                {copy('mastheadLede', 'A living municipality shaped by water, soil, memory, and the people who call Oriental Mindoro home.')}
            </p>
          </div>
          <div className="about-masthead-mark" aria-hidden="true">
            <Icons.Mountain size={76} strokeWidth={1.2} />
            <span>Oriental<br />Mindoro</span>
          </div>
        </div>
      </header>

      {/* Main Layout Wrapper */}
      <div className={`about-main-wrapper ${viewMode === 'single' ? 'single-section-mode' : 'all-sections-mode'}`}>
        
        {/* Navigation Sidebar */}
        <div className={`about-nav-sidebar ${mobileMenuOpen ? 'mobile-open' : ''}`}>
        <div className="about-nav-header">
          <Icons.Document size={24} />
          <h3>{t('contents')}</h3>
        </div>
        <nav className="about-nav" id="about-navigation">
          {Object.entries(SECTIONS).map(([key, section]) => {
            const IconComponent = Icons[SECTION_ICONS[key]];
            const isActive = viewMode === 'single' 
              ? currentSection === key 
              : false;
            
            return (
              <button
                key={key}
                className={`about-nav-link ${isActive ? 'active' : ''}`}
                onClick={() => handleSectionClick(key)}
                title={section.title}
              >
                <div className="about-nav-left">
                  {IconComponent && (
                    <span className="about-nav-icon">
                      <IconComponent size={20} />
                    </span>
                  )}
                  <span className="about-nav-text">{section.title}</span>
                </div>
                <span className="about-nav-arrow">
                  <Icons.ChevronRight size={16} />
                </span>
              </button>
            );
          })}
        </nav>
        </div>

        {/* Content Area */}
        <div className="about-sections-container">
        <Suspense fallback={<LoadingFallback />}>
          {viewMode === 'single' && SECTIONS[currentSection] ? (
            (() => {
              const Component = SECTIONS[currentSection].component;
              return <Component 
                onEdit={handleLeadershipUpdate} 
                isAdmin={user?.isAdmin}
              />;
            })()
          ) : !viewMode || viewMode === 'all' ? (
            // Show all sections
            Object.entries(SECTIONS).map(([key, section]) => {
              const Component = section.component;
              return (
                <Component 
                  key={key}
                  onEdit={handleLeadershipUpdate}
                  isAdmin={user?.isAdmin}
                />
              );
            })
          ) : (
            <section className="about-section">
              <div className="about-container">
                <p>{t('section_not_found')} <a href="/about">{t('back_to_about')}</a></p>
              </div>
            </section>
          )}
        </Suspense>
      </div>
      </div>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div 
          className="about-mobile-overlay visible" 
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Back to Top Button */}
      {showBackToTop && (
        <button 
          className="about-back-to-top" 
          onClick={scrollToTop}
          aria-label={t('back_to_top')}
          title={t('back_to_top')}
        >
          <Icons.ChevronUp size={24} />
        </button>
      )}

    </div>
  );
};

export default About;

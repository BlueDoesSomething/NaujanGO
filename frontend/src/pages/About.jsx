import React, { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { AboutContentProvider, useAboutContent } from '../context/AboutContentContext';
import Icons from '../components/Icons';
import { ABOUT_TOPICS } from './about/aboutNavigation';
import { aboutCopy } from './about/aboutTranslations';
import './About.css';
import './about/AboutNavigation.css';

const components = {
  overview: lazy(() => import('./about/AboutOverviewContent')),
  'vision-mission': lazy(() => import('./about/AboutVisionMissionContent')),
  history: lazy(() => import('./about/AboutHistoryContent')),
  leadership: lazy(() => import('./about/AboutLeadershipContent')),
  'quick-facts': lazy(() => import('./about/AboutQuickFactsContent')),
  indigenous: lazy(() => import('./about/AboutIndigenousContent')),
  alangan: lazy(() => import('./about/AboutAlangangContent')),
  culture: lazy(() => import('./about/AboutCultureContent')),
  economy: lazy(() => import('./about/AboutEconomyContent')),
  tourism: lazy(() => import('./about/AboutTourismContent')),
  governance: lazy(() => import('./about/AboutGovernanceContent')),
  accomplishments: lazy(() => import('./about/AboutAccomplishmentsContent'))
};

function AboutPage() {
  const { user } = useAuth();
  const { t, getCurrentLanguage } = useLanguage();
  const { error, loading, refresh } = useAboutContent();
  const copy = (key, fallback) => aboutCopy(getCurrentLanguage?.()?.code || 'en', key, fallback);
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false), [search, setSearch] = useState('');
  const heading = useRef(null), menuButton = useRef(null), firstPath = useRef(true);
  const current = location.pathname.split('/').filter(Boolean)[1] || 'overview';
  const readAll = new URLSearchParams(location.search).get('view') === 'all' && current === 'overview';
  const topics = ABOUT_TOPICS.map(([id, key, fallback, group, icon, description]) => ({ id, title: key ? t(key) : fallback, group, icon, description }));
  const index = topics.findIndex(topic => topic.id === current);
  const Component = components[current];
  useEffect(() => {
    setMenuOpen(false); setSearch('');
    if (!firstPath.current) heading.current?.focus({ preventScroll: true });
    firstPath.current = false;
  }, [location.pathname, location.search]);
  useEffect(() => {
    if (!menuOpen) return;
    const close = event => { if (event.key === 'Escape') { setMenuOpen(false); menuButton.current?.focus(); } };
    window.addEventListener('keydown', close); return () => window.removeEventListener('keydown', close);
  }, [menuOpen]);
  return <div className="about-page">
    <header className="about-masthead"><div className="about-masthead-inner"><div className="about-masthead-copy">
      <p className="about-kicker">{copy('fieldGuide', 'A field guide to place')}</p>
      <h1 id="about-page-title" ref={heading} tabIndex={-1}>{copy('mastheadTitle', 'Meet Naujan')}<span>.</span></h1>
      <p className="about-masthead-lede">{copy('mastheadLede', 'A living municipality shaped by water, soil, memory, and the people who call Oriental Mindoro home.')}</p>
      <div className="about-page-actions"><Link to="/about">Start here</Link><Link to="/about?view=all">Read all topics</Link>{user?.role === 'admin' && <Link to="/admin/about">Manage About Us ↗</Link>}</div>
    </div><div className="about-masthead-mark" aria-hidden="true"><Icons.Mountain size={76} /><span>Oriental<br />Mindoro</span></div></div></header>
    <button ref={menuButton} className="about-topic-toggle" type="button" aria-expanded={menuOpen} aria-controls="about-navigation" onClick={() => setMenuOpen(value => !value)}><Icons.Document size={20} /> {menuOpen ? 'Close topics' : 'Browse topics'}</button>
    <div className="about-main-wrapper single-section-mode">
      <aside className={`about-nav-sidebar about-topic-sidebar${menuOpen ? ' mobile-open' : ''}`}>
        <div className="about-nav-header"><Icons.Document size={20} /><h2>Explore Naujan</h2></div>
        <label className="about-topic-search">Find a topic<input type="search" value={search} onChange={event => setSearch(event.target.value)} /></label>
        <nav className="about-nav" id="about-navigation" aria-label="About topics">
          {topics.filter(topic => topic.title.toLowerCase().includes(search.trim().toLowerCase())).map((topic, position, list) => {
            const Icon = Icons[topic.icon];
            return <React.Fragment key={topic.id}>{(position === 0 || list[position - 1].group !== topic.group) && <p className="about-topic-group">{topic.group}</p>}
              <Link className={`about-nav-link${current === topic.id && !readAll ? ' active' : ''}`} to={`/about/${topic.id}`} aria-current={current === topic.id && !readAll ? 'page' : undefined}><span className="about-nav-left">{Icon && <Icon size={18} />}<span className="about-nav-text">{topic.title}</span></span></Link>
            </React.Fragment>;
          })}
          {search && !topics.some(topic => topic.title.toLowerCase().includes(search.trim().toLowerCase())) && <p className="about-topic-empty">No matching topics.</p>}
        </nav>
      </aside>
      <div className="about-sections-container">
        {loading && <p className="about-data-status" role="status">Loading municipal content…</p>}
        {error && <p className="about-data-status" role="alert">{error} <button type="button" onClick={refresh}>Retry content</button></p>}
        <Suspense fallback={<p className="about-data-status" role="status">Loading topic…</p>}>
          {readAll ? topics.map(topic => { const Section = components[topic.id]; return <Section key={topic.id} />; }) : Component ? <Component /> : <section className="about-section"><h2>Topic not found</h2><Link to="/about">Back to About</Link></section>}
        </Suspense>
        {current === 'overview' && !readAll && <section className="about-topic-directory" aria-label="Topic directory"><h2>Choose your next chapter</h2><div>{topics.filter(topic => topic.id !== 'overview').map(topic => <Link key={topic.id} to={`/about/${topic.id}`}><span>{topic.group}</span><h3>{topic.title}</h3><p>{topic.description}</p><strong>Explore topic →</strong></Link>)}</div></section>}
        {index >= 0 && !readAll && <nav className="about-chapter-navigation" aria-label="Previous and next topics">{index > 0 ? <Link to={`/about/${topics[index - 1].id}`}>← {topics[index - 1].title}</Link> : <span />}<span>{index + 1} / {topics.length}</span>{index < topics.length - 1 ? <Link to={`/about/${topics[index + 1].id}`}>{topics[index + 1].title} →</Link> : <Link to="/about">Back to introduction ↑</Link>}</nav>}
        <a className="about-return-top" href="#about-page-title">Back to top ↑</a>
      </div>
    </div>
    {menuOpen && <button type="button" className="about-mobile-overlay visible" aria-label="Close topic navigation" onClick={() => { setMenuOpen(false); menuButton.current?.focus(); }} />}
  </div>;
}

export default function About() { return <AboutContentProvider><AboutPage /></AboutContentProvider>; }

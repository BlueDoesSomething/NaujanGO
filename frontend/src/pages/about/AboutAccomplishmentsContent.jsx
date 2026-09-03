import React from 'react';
import Breadcrumb from '../../components/Breadcrumb';
import Icons from '../../components/Icons';
import { useLanguage } from '../../context/LanguageContext';
import { getApiBaseUrl } from '../../api';
import { aboutCopy } from './aboutTranslations';

const AboutAccomplishmentsContent = () => {
  const { t, getCurrentLanguage } = useLanguage();
  const copy = (key, fallback) => aboutCopy(getCurrentLanguage()?.code || 'en', key, fallback);
  const defaultMilestones = [
    {
      id: 'accomplishment-1', date: 'February 5, 2025', category: 'COMMUNITY SERVICE', title: 'Solar lights provided through DSWD', description: 'Solar lights were provided to improve access and safety in Naujan communities.'
    },
    {
      id: 'accomplishment-2', date: 'February 6, 2025', category: 'COMMUNITY SERVICE', title: 'Donation of tents, chairs, life jackets, and tables', description: 'Equipment was provided to support local community activities and safety.'
    },
    {
      id: 'accomplishment-3', date: 'February 9, 2025', category: 'LIVELIHOOD', title: 'Support for the Melgar B Duluhan floating balsa project', description: 'Materials and support helped move a community tourism project forward.'
    },
    {
      id: 'accomplishment-4', date: 'March 8, 2025', category: 'INFRASTRUCTURE', title: 'Opening of Rio del Sierra at Metolza', description: 'A new community destination opened in Metolza.'
    },
    {
      id: 'accomplishment-5', date: 'March 10, 2025', category: 'COMMUNITY', title: 'Opening of Corner Hub: Kitchen and Treats', description: 'A local enterprise opened in Barangay Bancenaga, Naujan.'
    },
    {
      id: 'accomplishment-6', date: 'April 4, 2025', category: 'TOURISM', title: 'New floating balsa at Melgar B Duluhan Cottages', description: 'A new floating balsa added another way to experience Naujan waters.'
    },
    {
      id: 'accomplishment-7', date: 'April 16, 2025', category: 'TOURISM', title: 'Arambayaw Falls opened to the public', description: 'A nature destination in Barangay Masagana welcomed visitors.'
    },
    {
      id: 'accomplishment-8', date: 'July 7, 2025', category: 'CULTURE', title: 'Cinoong Naujan 2025', description: 'Naujan celebrated local identity, talent, and community participation.'
    },
    {
      id: 'accomplishment-9', date: 'August 31, 2025', category: 'ENVIRONMENT', title: 'Candiatacs conducted tree planting activity', description: 'Community members took part in environmental care and restoration.'
    },
    {
      id: 'accomplishment-10', date: 'September 5, 2025', category: 'CULTURE', title: 'Zumba Dabalistihit 2025', description: 'A community wellness activity brought energy to the festival season.'
    },
    {
      id: 'accomplishment-11', date: 'September 10, 2025', category: 'FESTIVAL', title: 'Dabalistihit Festival', description: 'A major cultural celebration brought together food, music, dance, and local pride.'
    },
    {
      id: 'accomplishment-12', date: 'November 28, 2025', category: 'RECOGNITION', title: 'Naujan Vloggers Grand Ball and Awards Night', description: 'Local storytellers and creators were recognized for sharing Naujan with wider audiences.'
    }
  ];
  const [milestones, setMilestones] = React.useState(defaultMilestones);
  const [activeCategory, setActiveCategory] = React.useState('ALL');
  const categories = ['ALL', ...new Set(milestones.map((milestone) => milestone.category || 'COMMUNITY'))];

  React.useEffect(() => {
    fetch(`${getApiBaseUrl()}/api/about-accomplishments`)
      .then((response) => response.ok ? response.json() : [])
      .then((entries) => {
        if (Array.isArray(entries) && entries.length) setMilestones(entries);
      })
      .catch(() => {});
  }, []);

  const visibleMilestones = activeCategory === 'ALL'
    ? milestones
    : milestones.filter((milestone) => (milestone.category || 'COMMUNITY') === activeCategory);

  const impact = [
    { value: '475', label: 'tourism attractions', icon: 'MapPin' },
    { value: '105', label: 'accommodation establishments', icon: 'Building' },
    { value: '5', label: 'indigenous people barangays', icon: 'Users' },
    { value: '70', label: 'barangays moving forward together', icon: 'Layers' }
  ];

  return (
    <section className="about-section about-section-accomplishments section-visible">
      <div className="about-container">
        <Breadcrumb items={[
          { label: t('home'), href: '/' },
          { label: t('about'), href: '/about' },
          { label: 'Accomplishments & Milestones', active: true }
        ]} />
        <div className="accomplishments-heading">
          <div>
            <p className="about-story-label">{copy('accomplishmentLabel', 'The work behind the welcome')}</p>
            <h2 className="about-section-title">{copy('accomplishmentTitle', 'Accomplishments & Milestones')}</h2>
          </div>
          <p className="accomplishments-heading-note">Progress is not only measured in numbers. It is felt in the people, places, and possibilities that move forward together.</p>
        </div>

        <div className="accomplishments-impact-grid">
          {impact.map((item) => {
            const IconComponent = Icons[item.icon];
            return (
              <div key={item.label} className="accomplishment-impact-item">
                {IconComponent && <IconComponent size={22} />}
                <strong>{item.value}</strong>
                <span>{item.label}</span>
              </div>
            );
          })}
        </div>

        <div className="accomplishments-intro">
          <span className="accomplishments-line" />
          <p>Every milestone is a shared story: a visitor welcomed, a livelihood strengthened, a tradition protected, or a new path opened for the next generation.</p>
        </div>

        <div className="accomplishment-filter-bar" aria-label="Filter accomplishments">
          <span>Explore the record</span>
          <div>
            {categories.map((category) => (
              <button key={category} type="button" className={activeCategory === category ? 'active' : ''} onClick={() => setActiveCategory(category)}>{category}</button>
            ))}
          </div>
        </div>

        <div className="accomplishments-milestones">
          {visibleMilestones.map((milestone) => {
            const IconComponent = Icons[milestone.icon];
            return (
              <article key={milestone.id || milestone.date || milestone.year} className="accomplishment-milestone-card">
                <div className="accomplishment-milestone-top">
                  <span>{milestone.date || milestone.year}</span>
                  {IconComponent && <IconComponent size={24} />}
                </div>
                {milestone.imageUrl && <img className="accomplishment-image" src={milestone.imageUrl} alt="" />}
                <p className="about-story-label">{milestone.category || milestone.label}</p>
                {milestone.value && <div className="accomplishment-milestone-value">{milestone.value}</div>}
                <h3>{milestone.title}</h3>
                <p>{milestone.description}</p>
              </article>
            );
          })}
        </div>

        <div className="accomplishments-closing">
          <div>
            <p className="about-story-label">What comes next</p>
            <h3>The next milestone starts with an invitation.</h3>
          </div>
          <div className="accomplishments-closing-actions">
            <a href="/itinerary">Build an itinerary <span aria-hidden="true">↗</span></a>
            <a href="/map">Explore the map <span aria-hidden="true">↗</span></a>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AboutAccomplishmentsContent;

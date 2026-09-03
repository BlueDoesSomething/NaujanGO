import React from 'react';
import Icons from '../../components/Icons';
import Breadcrumb from '../../components/Breadcrumb';
import { useLanguage } from '../../context/LanguageContext';

const AboutVisionMissionContent = () => {
  const { t } = useLanguage();
  const defaultContent = {
    title: 'Vision & Mission',
    vision: {
      title: 'Vision 2030',
      icon: 'Sparkles',
      content: 'By 2030, Naujan envisions to be the leading agricultural municipality in MIMAROPA, with a liveable and ecologically balanced environment demonstrating a vibrant economy inspired by God-loving, healthy educated and empowered citizenry under a dynamic and committed leadership.'
    },
    mission: {
      title: 'Our Mission',
      icon: 'Heart',
      content: 'The Local Government Unit of Naujan is dedicated to serving the people, fostering a pro-active governance and ensuring the general welfare of the community through:'
    },
    missionPoints: [
      'Recognition and promotion of indigenous cultural communities to develop more opportunities while assuring respect for their cultural integrity.',
      'Conservation and protection of natural resources for safer, adaptive and resilient barangays.',
      'Accountability and competency of people-centered government, creating more partnerships and uplifting morale of its citizens through various programs, projects and activities toward sustainable development.',
      'Promotion of eco-tourism and sustainable agricultural production for self sufficient economy.',
      'Availability and accessibility of adequate social services through improved public infrastructures and facilities, transforming the people into empowered and self-reliant citizens.'
    ]
  };

  return (
    <section className="about-section about-section-vision section-visible">
      <div className="about-container">
        <Breadcrumb items={[
          { label: t('home'), href: '/' },
          { label: t('about'), href: '/about' },
          { label: defaultContent.title, active: true }
        ]} />
        <h2 className="about-section-title">{defaultContent.title}</h2>
        
        <div className="about-split-cards">
          <div className="about-card about-vision-card">
            <div className="about-card-icon"><Icons.Sparkles size={40} /></div>
            <h3>{defaultContent.vision.title}</h3>
            <p>{defaultContent.vision.content}</p>
          </div>
          <div className="about-card about-mission-card">
            <div className="about-card-icon"><Icons.Heart size={40} filled /></div>
            <h3>{defaultContent.mission.title}</h3>
            <p>{defaultContent.mission.content}</p>
            <ul className="about-mission-list">
              {defaultContent.missionPoints.map((point, idx) => (
                <li key={idx}><span className="bullet">•</span> {point}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AboutVisionMissionContent;

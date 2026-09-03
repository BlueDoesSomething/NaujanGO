// Sections Data for About Pages
export const ABOUT_SECTIONS_DATA = {
  overview: {
    id: 'overview',
    title: 'Welcome to Naujan',
    type: 'text-image',
    layout: 'image-right',
    image: '/images/naujan-overview.jpg',
    content: 'Naujan is a 1st class municipality in Oriental Mindoro with 70 barangays. It is known for its agricultural economy, cultural heritage, and tourism development. It is the second most populous municipality in the province after Calapan City.',
    highlights: [
      { label: 'Barangays', value: '70' },
      { label: 'Classification', value: '1st Class' },
      { label: 'Population', value: '109,122' }
    ]
  },
  visionMission: {
    id: 'vision-mission',
    title: 'Vision & Mission',
    type: 'split-cards',
    vision: {
      title: 'Vision 2030',
      icon: 'Sparkles',
      content: 'By 2030, Naujan envisions to be the leading agricultural municipality in MIMAROPA, with a livable and ecologically balanced environment demonstrating a vibrant economy inspired by God-loving, healthy, educated, and empowered citizenry under a dynamic and committed leadership.'
    },
    mission: {
      title: 'Our Mission',
      icon: 'Heart',
      content: 'The Local Government Unit of Naujan is dedicated to the recognition and promotion of indigenous cultural communities while ensuring respect for cultural integrity. It focuses on conservation and protection of natural resources for safe, adaptive, and resilient barangays. It ensures accountability and competency of people-centered governance through partnerships and development programs. It promotes eco-tourism and sustainable agricultural production and ensures availability and accessibility of adequate social services and improved infrastructure.'
    }
  },
  history: {
    id: 'history',
    title: 'History of Naujan',
    type: 'timeline',
    timeline: [
      {
        year: '1639',
        title: 'Royal Decree Establishment',
        description: 'Naujan was established under a royal decree by King Philip of Spain. Evidence of earlier civilization includes Chinese artifacts from the Sung, Yuan, and Ming dynasties found in Dao and San Jose.',
        image: '/images/history-colonial.jpg'
      },
      {
        year: '1824',
        title: 'Moro Invasion',
        description: 'Moro invaders destroyed the settlement. A stone church (Simbahang Bato) in Bancuro served as a church, fort, and refuge during this era.',
        image: '/images/simbahang-bato.jpg'
      },
      {
        year: '1898',
        title: 'Settlement Relocation',
        description: 'The settlement was moved to Lumangbayan. Resistance against Spanish rule was led by Francisco Manalaysay.',
        image: '/images/history-movement.jpg'
      },
      {
        year: '1905',
        title: 'Municipal Recognition',
        description: 'Naujan was recognized as a full municipality.',
        image: '/images/history-municipal.jpg'
      },
      {
        year: '1919',
        title: 'Official Boundaries',
        description: 'Boundaries were officially established.',
        image: '/images/history-map.jpg'
      }
    ]
  },
  leadership: {
    id: 'leadership',
    title: 'Leadership & Governance',
    type: 'leadership',
    current: {
      mayor: 'Henry Joel C. Teves',
      mayorTerm: '2022–Present',
      viceMayor: 'Candido J. Melgar Jr.',
      viceMayorTerm: '2025–Present'
    },
    formerMayors: [
      { name: 'Mark N. Marcos', term: '2013–2022' },
      { name: 'Maria Angeles Casubuan', term: '2010–2013' },
      { name: 'Wilson A. Viray', term: '2010' },
      { name: 'Romar G. Marcos', term: '2007–2010' },
      { name: 'Norberto M. Mendoza', term: '1997–2007' },
      { name: 'Nelson Melgar', term: '1988–1997' },
      { name: 'Audel Arago', term: '1987–1988' },
      { name: 'Arnulfo Bautista', term: '1987' },
      { name: 'Dr. Rolando R. Mendoza', term: '1986–1987' },
      { name: 'Manuel Marcos', term: '1975–1986' },
      { name: 'Armando Melgar Sr.', term: '1968–1975' },
      { name: 'Manuel R. Marcos', term: '1962–1967' },
      { name: 'Amando G. Melgar', term: '1952–1959' },
      { name: 'Marciano Roldan', term: '1946, 1948–1951' },
      { name: 'Ambrocio L. Salva', term: '1946' },
      { name: 'Cirilo S. Gaba', term: '1941–1942, 1947' },
      { name: 'Agustin Garong Sr.', term: 'Japanese Occupation' },
      { name: 'Felicisimo Garing', term: 'Japanese Occupation' },
      { name: 'Porfirio Comia', term: '1935–1940, 1950–1962' },
      { name: 'Santiago Garong', term: '1928–1934' },
      { name: 'Jose L. Basa', term: '1922–1927' },
      { name: 'Agustin Garong', term: '1916–1922' },
      { name: 'Leon Garong', term: '1903–1916' },
      { name: 'Bonifacio Evora', term: '1903' }
    ],
    formerViceMayors: [
      { name: 'Great Mangubat Delos Reyes', term: '2022–2025' },
      { name: 'Sheryl Bacay Morales', term: '2016–2019, 2019–2022' },
      { name: 'Henry Joel C. Teves', term: '2013–2016' }
    ]
  },
  quickFacts: {
    id: 'quick-facts',
    title: 'Quick Facts',
    type: 'stats-grid',
    stats: [
      { label: 'Population (2024)', value: '109,122', icon: 'Users' },
      { label: 'Land Area', value: '503.10 km²', icon: 'Map' },
      { label: 'Population Density', value: '216–218/km²', icon: 'Grid' },
      { label: 'Barangays', value: '70', icon: 'Layers' },
      { label: 'Rank', value: '2nd in Prov.', icon: 'Trophy' },
      { label: 'Class', value: '1st Class', icon: 'Star' }
    ]
  },
  indigenous: {
    id: 'indigenous',
    title: 'Indigenous Communities',
    type: 'text-image',
    layout: 'image-left',
    image: '/images/mangyan-community.jpg',
    content: 'The indigenous people of Naujan include the Mangyan-Alangan and Mangyan-Tadyawan groups, representing centuries of cultural heritage. Other Mangyan groups are also present, each with unique traditions and connections to the land.',
    barangays: [
      {
        name: 'Paitan',
        description: 'Upland barangay with Mangyan communities, rivers, forests, and views of Mt. Halcon. The people practice upland farming.',
        image: '/images/barangay-paitan.jpg'
      },
      {
        name: 'Caburo',
        description: 'Inhabited mostly by Mangyan-Alangan communities in traditional bamboo houses, relying on subsistence farming.',
        image: '/images/barangay-caburo.jpg'
      },
      {
        name: 'Balite',
        description: 'A farming community supported by government programs.',
        image: '/images/barangay-balite.jpg'
      },
      {
        name: 'Magtibay',
        description: 'High Mangyan population that preserves traditional leadership systems.',
        image: '/images/barangay-magtibay.jpg'
      },
      {
        name: 'Banuton',
        description: 'Mountainous barangay where people practice traditional farming.',
        image: '/images/barangay-banuton.jpg'
      }
    ]
  },
  alangan: {
    id: 'alangan',
    title: 'Alangan Mangyan Culture',
    type: 'featured-image',
    backgroundImage: '/images/alangan-featured.jpg',
    overlay: true,
    content: 'The Alangan Mangyans are located near Mt. Halcon with around 2,150 speakers. They maintain distinctive traditions including betel nut chewing and traditional clothing made of woven fibers. The Balaylakoy, a shared communal house with a central fire, serves as the heart of their community gatherings and rituals.'
  },
  culture: {
    id: 'culture',
    title: 'Culture & Arts',
    type: 'card-grid',
    cards: [
      {
        title: 'Dabalistihit Festival',
        description: 'A vibrant celebration featuring freshwater fish species through street dancing, cultural costumes, and awareness campaigns on September 10.',
        image: '/images/festival-dabalistihit.jpg',
        icon: 'Sparkles'
      },
      {
        title: 'Mangyan Weaving',
        description: 'Ancient textile art using natural fibers and traditional patterns passed down through generations.',
        image: '/images/mangyan-weaving.jpg',
        icon: 'Palette'
      },
      {
        title: 'Saranggola Festival',
        description: 'Kite-making competitions that celebrate creativity and community spirit.',
        image: '/images/festival-saranggola.jpg',
        icon: 'Wind'
      },
      {
        title: 'Traditional Music & Dance',
        description: 'Rich cultural expressions reflecting the heritage of Naujan and its diverse communities.',
        image: '/images/culture-dance.jpg',
        icon: 'Music'
      }
    ]
  },
  economy: {
    id: 'economy',
    title: 'Economy & Livelihood',
    type: 'feature-cards',
    features: [
      {
        title: 'Agriculture',
        description: 'Rice, coconut, fruits (banana, mango, rambutan, lanzones), and root crops (cassava, camote, gabi).',
        icon: 'Leaf',
        image: '/images/economy-agriculture.jpg'
      },
      {
        title: 'Fishing',
        description: 'Naujan Lake provides tilapia, bangus, dalag, and hito, supporting local communities.',
        icon: 'Fish',
        image: '/images/naujan-lake.jpg'
      },
      {
        title: 'Local Products',
        description: 'Water lily handicrafts, baskets, woven items, beaded accessories, and Mangyan textiles.',
        icon: 'Gift',
        image: '/images/local-products.jpg'
      }
    ]
  },
  tourism: {
    id: 'tourism',
    title: 'Tourism Growth',
    type: 'stats-timeline',
    growth: [
      { year: '2022', arrivals: '15,605' },
      { year: '2023', arrivals: '42,561' },
      { year: '2024', arrivals: '62,788' },
      { year: '2025', arrivals: '36,074' }
    ],
    employment: [
      { label: 'Total Employment', value: '580' },
      { label: 'Attractions', value: '475' },
      { label: 'Accommodation', value: '105' },
      { label: 'Female Employed', value: '338' },
      { label: 'Male Employed', value: '242' }
    ]
  }
};

import axios from 'axios';

// Dangerous species categories
const DANGEROUS_SPECIES = {
  snakes: ['snake', 'cobra', 'viper', 'python', 'boa'],
  insects: ['wasp', 'hornet', 'bee', 'scorpion', 'spider'],
  mammals: ['boar', 'monkey', 'bear', 'wild dog', 'bat'],
  marine: ['jellyfish', 'stingray', 'sea urchin', 'cone snail', 'shark']
};

export const detectWildlife = async (req, res) => {
  try {
    const { lat, lng, radius = 10 } = req.query;

    if (!lat || !lng) {
      return res.status(400).json({ error: 'Latitude and longitude required' });
    }

    console.log(`Fetching wildlife for lat: ${lat}, lng: ${lng}, radius: ${radius}km`);

    // Query iNaturalist API for recent observations
    const response = await axios.get('https://api.inaturalist.org/v1/observations', {
      params: {
        lat,
        lng,
        radius,
        per_page: 100,
        order: 'desc',
        order_by: 'observed_on',
        iconic_taxa: 'Animalia'
      },
      timeout: 10000
    });

    const observations = response.data.results || [];
    console.log(`Found ${observations.length} total observations`);

    const dangerousAnimals = [];
    const allAnimals = [];
    const seenSpecies = new Set();

    // Filter for dangerous species
    observations.forEach(obs => {
      const name = obs.taxon?.name?.toLowerCase() || '';
      const commonName = obs.taxon?.preferred_common_name?.toLowerCase() || '';

      // Store all animals for display
      if (obs.taxon && !seenSpecies.has(name)) {
        allAnimals.push({
          scientificName: obs.taxon?.name,
          commonName: obs.taxon?.preferred_common_name,
          observedDate: obs.observed_on,
          imageUrl: obs.taxon?.default_photo?.medium_url || obs.photos?.[0]?.url,
          isDangerous: false
        });
      }

      Object.entries(DANGEROUS_SPECIES).forEach(([category, keywords]) => {
        keywords.forEach(keyword => {
          if ((name.includes(keyword) || commonName.includes(keyword)) && !seenSpecies.has(name)) {
            seenSpecies.add(name);
            dangerousAnimals.push({
              category,
              scientificName: obs.taxon?.name,
              commonName: obs.taxon?.preferred_common_name,
              observedDate: obs.observed_on,
              distance: obs.distance || 'nearby',
              imageUrl: obs.taxon?.default_photo?.medium_url || obs.photos?.[0]?.url,
              description: obs.description || `${obs.taxon?.preferred_common_name || obs.taxon?.name} observed in this area`,
              isDangerous: true
            });
            // Mark as dangerous in allAnimals
            const lastAnimal = allAnimals[allAnimals.length - 1];
            if (lastAnimal) lastAnimal.isDangerous = true;
          }
        });
      });
    });

    console.log(`Found ${dangerousAnimals.length} dangerous animals`);

    // Generate warning message
    let warningMessage = '';
    if (dangerousAnimals.length > 0) {
      const categories = [...new Set(dangerousAnimals.map(a => a.category))];
      const species = dangerousAnimals.map(a => a.commonName || a.scientificName).join(', ');

      warningMessage = `Wildlife Alert: ${species} have been observed in this area. `;

      if (categories.includes('snakes')) {
        warningMessage += 'Watch for snakes in grassy areas and stay on marked paths. ';
      }
      if (categories.includes('mammals')) {
        warningMessage += 'Keep food secured and maintain distance from wild animals. ';
      }
      if (categories.includes('marine')) {
        warningMessage += 'Be cautious when swimming and check with local authorities. ';
      }
      if (categories.includes('insects')) {
        warningMessage += 'Be aware of stinging insects, especially near flowers and water. ';
      }
    }

    res.json({
      location: { lat, lng, radius },
      dangerousAnimals,
      allAnimals: allAnimals.slice(0, 20),
      warningMessage,
      totalObservations: observations.length,
      lastUpdated: new Date().toISOString()
    });
  } catch (error) {
    console.error('Wildlife detection error:', error.message);
    res.status(500).json({
      error: 'Failed to detect wildlife',
      dangerousAnimals: [],
      allAnimals: [],
      totalObservations: 0,
      warningMessage: 'Unable to fetch wildlife data at this time. Please exercise general caution.'
    });
  }
};
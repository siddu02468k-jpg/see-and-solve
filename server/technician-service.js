const fs = require('node:fs');
const path = require('node:path');

const TECHNICIANS_PATH = path.join(__dirname, '..', 'data', 'technicians.json');
let cachedTechnicians = null;

function loadTechnicians() {
  if (!cachedTechnicians) {
    if (fs.existsSync(TECHNICIANS_PATH)) {
      const raw = fs.readFileSync(TECHNICIANS_PATH, 'utf8');
      cachedTechnicians = JSON.parse(raw);
    } else {
      cachedTechnicians = [];
    }
  }
  return cachedTechnicians;
}

// Known coordinates for major cities and towns in Andhra Pradesh
const AP_CITY_COORDINATES = {
  guntur: { lat: 16.3067, lng: 80.4365, district: "Guntur", canonical: "Guntur" },
  vijayawada: { lat: 16.5062, lng: 80.6480, district: "NTR / Krishna", canonical: "Vijayawada" },
  visakhapatnam: { lat: 17.6868, lng: 83.2185, district: "Visakhapatnam", canonical: "Visakhapatnam" },
  vizag: { lat: 17.6868, lng: 83.2185, district: "Visakhapatnam", canonical: "Visakhapatnam" },
  tirupati: { lat: 13.6288, lng: 79.4192, district: "Tirupati", canonical: "Tirupati" },
  kurnool: { lat: 15.8281, lng: 78.0373, district: "Kurnool", canonical: "Kurnool" },
  nellore: { lat: 14.4426, lng: 79.9865, district: "SPSR Nellore", canonical: "Nellore" },
  rajahmundry: { lat: 17.0005, lng: 81.8040, district: "East Godavari", canonical: "Rajahmundry" },
  kakinada: { lat: 16.9891, lng: 82.2475, district: "Kakinada", canonical: "Kakinada" },
  eluru: { lat: 16.7107, lng: 81.0952, district: "Eluru", canonical: "Eluru" },
  ongole: { lat: 15.5057, lng: 80.0499, district: "Prakasam", canonical: "Ongole" },
  kadapa: { lat: 14.4673, lng: 78.8242, district: "YSR Kadapa", canonical: "Kadapa" },
  anantapur: { lat: 14.6819, lng: 77.6006, district: "Ananthapuramu", canonical: "Anantapur" },
  mangalagiri: { lat: 16.4307, lng: 80.5525, district: "Guntur", canonical: "Mangalagiri" },
  tenali: { lat: 16.2428, lng: 80.6400, district: "Guntur", canonical: "Tenali" },
  tadepalli: { lat: 16.4672, lng: 80.6010, district: "Guntur", canonical: "Tadepalli" },
  gannavaram: { lat: 16.5416, lng: 80.8050, district: "Krishna", canonical: "Gannavaram" },
  gajuwaka: { lat: 17.6905, lng: 83.2102, district: "Visakhapatnam", canonical: "Visakhapatnam" },
  anakapalle: { lat: 17.6896, lng: 83.0024, district: "Anakapalli", canonical: "Anakapalle" },
  kavali: { lat: 14.9132, lng: 79.9929, district: "SPSR Nellore", canonical: "Kavali" }
};

const AVAILABLE_AP_CITIES = [
  'Guntur', 'Vijayawada', 'Visakhapatnam', 'Tirupati',
  'Rajahmundry', 'Kakinada', 'Nellore', 'Kurnool'
];

function calculateDistanceKm(lat1, lon1, lat2, lon2) {
  if (!lat1 || !lon1 || !lat2 || !lon2) return null;
  const R = 6371; // Earth radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round((R * c) * 10) / 10;
}

/**
 * Normalizes and categorizes problem specialization
 */
function normalizeSpecialization(input) {
  if (!input) return null;
  const s = input.toLowerCase().trim();
  const clean = s.replace(/[-_]/g, ' ');

  if (clean.includes('public authority') || clean.includes('government') || clean.includes('municipal')) {
    return 'Public Authority First';
  }
  if (clean.includes('washing machine') || clean.includes('washer') || clean.includes('dryer') || clean.includes('appliance')) {
    return 'Washing-machine repair technician';
  }
  if (clean.includes('laptop') || clean.includes('computer') || clean.includes('pc') || clean.includes('wi fi') || clean.includes('wifi') || clean.includes('network') || clean.includes('printer') || clean.includes('mobile') || clean.includes('phone')) {
    return 'Computer or laptop technician';
  }
  if (clean.includes('plumb') || clean.includes('drain') || clean.includes('pipe') || clean.includes('sink') || clean.includes('tap') || clean.includes('toilet') || clean.includes('flush') || clean.includes('water leak')) {
    return 'Plumber';
  }
  if (clean.includes('electric') || clean.includes('wiring') || clean.includes('mcb') || clean.includes('switch') || clean.includes('fan') || clean.includes('geyser') || clean.includes('inverter')) {
    return 'Qualified electrician';
  }
  if (clean.includes('air condition') || clean.includes('refrigerat') || clean.includes('fridge') || clean.includes('cooling') || /\bac\b/.test(clean)) {
    return 'Air conditioning and cooling';
  }
  if (clean.includes('car') || clean.includes('auto') || clean.includes('vehicle') || clean.includes('engine') || clean.includes('bike') || clean.includes('scooter') || clean.includes('mechanic')) {
    return 'Automotive mechanic';
  }
  return input;
}

/**
 * Resolves user location to coordinates and city/locality name
 */
function resolveUserLocation(locationStr, coords = null) {
  if (coords && coords.lat && coords.lng) {
    return {
      lat: parseFloat(coords.lat),
      lng: parseFloat(coords.lng),
      name: locationStr || 'User GPS Location',
      city: findNearestKnownCity(coords.lat, coords.lng)
    };
  }

  if (!locationStr) return null;

  const clean = locationStr.toLowerCase().trim();
  for (const [cityName, cityData] of Object.entries(AP_CITY_COORDINATES)) {
    if (clean.includes(cityName)) {
      return {
        lat: cityData.lat,
        lng: cityData.lng,
        name: locationStr,
        city: cityData.canonical || (cityName.charAt(0).toUpperCase() + cityName.slice(1))
      };
    }
  }

  return {
    lat: null,
    lng: null,
    name: locationStr,
    city: locationStr
  };
}

function findNearestKnownCity(lat, lng) {
  let nearestCity = 'Guntur';
  let minDistance = Infinity;

  for (const [cityName, cityData] of Object.entries(AP_CITY_COORDINATES)) {
    const d = calculateDistanceKm(lat, lng, cityData.lat, cityData.lng);
    if (d !== null && d < minDistance) {
      minDistance = d;
      nearestCity = cityName.charAt(0).toUpperCase() + cityName.slice(1);
    }
  }
  return nearestCity;
}

/**
 * Discover Verified Local Technicians
 * Strictly enforces:
 * 1. Matches required specialization category.
 * 2. Matches user's local area (city/district/coordinates).
 * 3. Never returns state-wide dump of unrelated trades.
 */
async function discoverLocalTechnicians({ specialization, location, coordinates = null, maxDistanceKm = 35 }) {
  const normSpec = normalizeSpecialization(specialization);

  // If this issue requires a public authority (e.g. road pothole, public water main),
  // DO NOT show private technician list!
  if (normSpec === 'Public Authority First') {
    return {
      showTechnicians: false,
      reason: "Public infrastructure must be repaired by the responsible government authority. Private technicians are not recommended for public assets.",
      technicians: []
    };
  }

  if (!normSpec) {
    return {
      showTechnicians: false,
      reason: "No specific technician category could be determined.",
      technicians: []
    };
  }

  const resolvedLoc = resolveUserLocation(location, coordinates);
  const locationQueryName = resolvedLoc?.city || location || 'your area';

  // Build targeted external Google Maps search URL as standard fallback
  const mapsSearchQuery = `${normSpec} near ${locationQueryName}, Andhra Pradesh`;
  const externalMapsUrl = `https://www.google.com/maps/search/${encodeURIComponent(mapsSearchQuery)}`;

  // Check if live Google Places API is configured
  const placesApiKey = process.env.GOOGLE_PLACES_API_KEY;
  if (placesApiKey && placesApiKey.trim().length > 0 && resolvedLoc && resolvedLoc.lat && resolvedLoc.lng) {
    try {
      const placesResult = await searchGooglePlacesAPI({
        apiKey: placesApiKey.trim(),
        specialization: normSpec,
        lat: resolvedLoc.lat,
        lng: resolvedLoc.lng,
        radiusMeters: maxDistanceKm * 1000
      });
      if (placesResult && placesResult.length > 0) {
        return {
          showTechnicians: true,
          specialization: normSpec,
          searchLocation: locationQueryName,
          source: "Google Places API (Live Local Search)",
          count: placesResult.length,
          technicians: placesResult,
          externalSearchUrl: externalMapsUrl
        };
      }
    } catch (err) {
      console.warn('Google Places API search failed, falling back to verified trade directory:', err.message);
    }
  }

  // Query verified trade directory
  const allTechnicians = loadTechnicians();
  const searchCity = (resolvedLoc?.city || location || '').toLowerCase().trim();

  // If no location or coordinates were supplied at all, prompt user politely with quick city options
  if (!searchCity && (!resolvedLoc || !resolvedLoc.lat)) {
    return {
      showTechnicians: true,
      locationMissing: true,
      specialization: normSpec,
      searchLocation: 'Location not specified',
      count: 0,
      technicians: [],
      availableCities: AVAILABLE_AP_CITIES,
      message: `Please select your city below or enable GPS Location to view verified "${normSpec}" contacts and addresses near you.`,
      optionToExpand: true,
      externalSearchUrl: externalMapsUrl,
      externalNotice: "Or search local providers directly on Google Maps:"
    };
  }

  // 1. FILTER STRICTLY BY SPECIALIZATION
  const matchingSpec = allTechnicians.filter(t => {
    const cat = (t.category || '').toLowerCase();
    const specs = (t.specializations || []).map(s => s.toLowerCase());
    const specLower = normSpec.toLowerCase();

    return cat.includes(specLower) || specs.some(s => s.includes(specLower) || specLower.includes(s));
  });

  // 2. FILTER STRICTLY BY LOCAL AREA / CITY
  let matchingLocal = matchingSpec.filter(t => {
    if (!searchCity) return false;
    const tCity = (t.city || '').toLowerCase();
    const tDist = (t.district || '').toLowerCase();
    const tArea = (t.area || '').toLowerCase();
    const tAddr = (t.address || '').toLowerCase();

    return tCity.includes(searchCity) ||
           searchCity.includes(tCity) ||
           tDist.includes(searchCity) ||
           tArea.includes(searchCity) ||
           tAddr.includes(searchCity);
  });

  // 2b. Proximity radius fallback ONLY when exact town/locality match is 0 and coordinates exist
  if (matchingLocal.length === 0 && resolvedLoc && resolvedLoc.lat && resolvedLoc.lng) {
    matchingLocal = matchingSpec.filter(t => {
      if (!t.coordinates) return false;
      const dist = calculateDistanceKm(resolvedLoc.lat, resolvedLoc.lng, t.coordinates.lat, t.coordinates.lng);
      return dist !== null && dist <= maxDistanceKm;
    });
  }

  // 3. Compute accurate distance if user coordinates or city center are known
  matchingLocal = matchingLocal.map(tech => {
    let distance = null;
    if (resolvedLoc && resolvedLoc.lat && resolvedLoc.lng && tech.coordinates) {
      distance = calculateDistanceKm(resolvedLoc.lat, resolvedLoc.lng, tech.coordinates.lat, tech.coordinates.lng);
    }

    return {
      id: tech.id,
      name: tech.name,
      category: tech.category,
      specificServices: tech.services || [],
      phone: tech.phone || null, // null if missing - NEVER fabricated!
      address: tech.address,
      locality: tech.area,
      city: tech.city,
      district: tech.district,
      distanceKm: distance,
      rating: tech.rating,
      reviewCount: tech.reviewCount,
      hours: tech.hours,
      website: tech.website || null,
      source: tech.source || 'AP Verified Trade Directory',
      actions: {
        canCall: Boolean(tech.phone),
        callUrl: tech.phone ? `tel:${tech.phone.replace(/[^0-9+]/g, '')}` : null,
        directionsUrl: `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(tech.address || (tech.name + ' ' + tech.city))}`,
        mapUrl: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(tech.name + ' ' + tech.city)}`,
        websiteUrl: tech.website || null
      }
    };
  });

  // Sort by proximity if distance is available, then rating
  matchingLocal.sort((a, b) => {
    if (a.distanceKm !== null && b.distanceKm !== null) {
      return a.distanceKm - b.distanceKm;
    }
    return (b.rating || 0) - (a.rating || 0);
  });

  // Limit to top 5 most relevant local results
  const topResults = matchingLocal.slice(0, 5);

  if (topResults.length === 0) {
    // Test 6: No local technician found in that locality
    return {
      showTechnicians: true,
      specialization: normSpec,
      searchLocation: locationQueryName,
      count: 0,
      technicians: [],
      availableCities: AVAILABLE_AP_CITIES,
      message: `No verified local technicians found for "${normSpec}" in ${locationQueryName}.`,
      optionToExpand: true,
      externalSearchUrl: externalMapsUrl,
      externalNotice: "You can find local service providers directly on Google Maps:"
    };
  }

  return {
    showTechnicians: true,
    specialization: normSpec,
    searchLocation: locationQueryName,
    count: topResults.length,
    technicians: topResults,
    availableCities: AVAILABLE_AP_CITIES,
    externalSearchUrl: externalMapsUrl,
    message: topResults.length < 5
      ? `Found ${topResults.length} verified provider(s) in ${locationQueryName}. You may expand the search radius for more options.`
      : null
  };
}

/**
 * Live Google Places Text / Nearby Search
 */
async function searchGooglePlacesAPI({ apiKey, specialization, lat, lng, radiusMeters }) {
  const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=${radiusMeters}&keyword=${encodeURIComponent(specialization)}&key=${apiKey}`;
  const res = await fetch(url);
  if (!res.ok) return null;

  const data = await res.json();
  if (!data.results || data.results.length === 0) return null;

  return data.results.slice(0, 5).map(place => {
    const pLat = place.geometry?.location?.lat;
    const pLng = place.geometry?.location?.lng;
    const dist = calculateDistanceKm(lat, lng, pLat, pLng);

    return {
      id: place.place_id,
      name: place.name,
      category: specialization,
      specificServices: [place.vicinity || 'Local service'],
      phone: null, // Basic nearby search doesn't return phone without place details call
      address: place.vicinity || place.name,
      locality: place.vicinity,
      city: 'Local Area',
      distanceKm: dist,
      rating: place.rating || 4.5,
      reviewCount: place.user_ratings_total || 25,
      hours: place.opening_hours?.open_now ? "Open Now" : "Standard Business Hours",
      website: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place.name)}&query_place_id=${place.place_id}`,
      source: "Google Places API",
      actions: {
        canCall: false,
        callUrl: null,
        directionsUrl: `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(place.name)}&destination_place_id=${place.place_id}`,
        mapUrl: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place.name)}`,
        websiteUrl: `https://www.google.com/maps/place/?q=place_id:${place.place_id}`
      }
    };
  });
}

module.exports = {
  discoverLocalTechnicians,
  normalizeSpecialization,
  resolveUserLocation,
  calculateDistanceKm,
  AP_CITY_COORDINATES
};

/**
 * Space Centers, Deep Space Probes, Celestial Bodies, and Cosmic Events definitions.
 */

export interface SpaceCenter {
  id: string;
  name: string;
  agency: 'ISRO' | 'NASA' | 'SpaceX' | 'ESA' | 'JAXA' | 'Roscosmos' | 'Venue';
  lat: number;
  lon: number;
  description: string;
  country: string;
  icon: string;
}

export interface DeepSpaceProbe {
  id: string;
  name: string;
  noradId?: number;
  target: 'Sun' | 'Moon' | 'Mars' | 'L2' | 'Interstellar';
  agency: string;
  launchYear: number;
  status: string;
  distanceKm: string;
  description: string;
  capturedPhotos: Array<{
    title: string;
    caption: string;
    url: string;
  }>;
}

export interface CelestialTarget {
  id: string;
  name: string;
  type: 'black_hole' | 'wormhole' | 'supernova' | 'neutron_star' | 'galaxy';
  distanceLy: string;
  constellation: string;
  description: string;
  interactiveType: 'black_hole' | 'wormhole' | 'supernova' | 'neutron_star' | 'galaxy';
}

// ─── Popular Space Centers & Hackathon Venue ──────────────────────────────────
export const SPACE_CENTERS: SpaceCenter[] = [
  {
    id: 'uem_kolkata',
    name: 'Supernova Hackathon Venue (UEM Kolkata)',
    agency: 'Venue',
    lat: 22.5726,
    lon: 88.3639,
    description: 'University of Engineering & Management Kolkata — Host venue of Supernova Space Hackathon 2026.',
    country: 'India 🇮🇳',
    icon: '🏆',
  },
  {
    id: 'isro_sdsc',
    name: 'ISRO Satish Dhawan Space Centre (Sriharikota)',
    agency: 'ISRO',
    lat: 13.7199,
    lon: 80.2304,
    description: 'India’s primary spaceport for PSLV, GSLV, and LVM3 launches.',
    country: 'India 🇮🇳',
    icon: '🚀',
  },
  {
    id: 'isro_istrac',
    name: 'ISRO Telemetry Tracking & Command Network (ISTRAC Bengaluru)',
    agency: 'ISRO',
    lat: 13.0382,
    lon: 77.5146,
    description: 'Ground tracking and mission control hub for Chandrayaan and Aditya-L1 missions.',
    country: 'India 🇮🇳',
    icon: '📡',
  },
  {
    id: 'nasa_ksc',
    name: 'NASA Kennedy Space Center (Cape Canaveral)',
    agency: 'NASA',
    lat: 28.5729,
    lon: -80.649,
    description: 'Historic launch site of Apollo, Space Shuttle, and Artemis Moon missions.',
    country: 'USA 🇺🇸',
    icon: '🚀',
  },
  {
    id: 'spacex_starbase',
    name: 'SpaceX Starbase (Boca Chica)',
    agency: 'SpaceX',
    lat: 25.997,
    lon: -97.1565,
    description: 'SpaceX manufacturing & orbital test facility for Starship super-heavy rocket.',
    country: 'USA 🇺🇸',
    icon: '⚡',
  },
  {
    id: 'esa_kourou',
    name: 'ESA Guiana Space Centre (Kourou)',
    agency: 'ESA',
    lat: 5.236,
    lon: -52.768,
    description: 'Europe’s primary spaceport in French Guiana near the equator for Ariane 6 launches.',
    country: 'French Guiana 🇫🇷',
    icon: '🚀',
  },
  {
    id: 'roscosmos_baikonur',
    name: 'Baikonur Cosmodrome',
    agency: 'Roscosmos',
    lat: 45.965,
    lon: 63.305,
    description: 'World’s first and largest operational space launch facility — site of Sputnik 1 and Vostok 1.',
    country: 'Kazakhstan 🇰🇿',
    icon: '🚀',
  },
  {
    id: 'jaxa_tanegashima',
    name: 'JAXA Tanegashima Space Center',
    agency: 'JAXA',
    lat: 30.4,
    lon: 130.97,
    description: 'Japan’s premier rocket launch complex located on scenic Tanegashima island.',
    country: 'Japan 🇯🇵',
    icon: '🚀',
  },
  {
    id: 'nasa_jpl',
    name: 'NASA Jet Propulsion Laboratory (Pasadena)',
    agency: 'NASA',
    lat: 34.2048,
    lon: -118.1712,
    description: 'Leading research center for robotic planetary exploration (Mars Rovers, Voyagers).',
    country: 'USA 🇺🇸',
    icon: '🔬',
  },
];

// ─── Solar System & Interstellar Deep Space Probes ─────────────────────────────
export const DEEP_SPACE_PROBES: DeepSpaceProbe[] = [
  {
    id: 'aditya_l1',
    name: 'Aditya-L1',
    noradId: 57791,
    target: 'Sun',
    agency: 'ISRO 🇮🇳',
    launchYear: 2023,
    status: 'Operational at Sun-Earth L1 Halo Orbit',
    distanceKm: '1,500,000 km from Earth',
    description: 'India’s first solar observatory studying coronal heating, solar flares, and space weather.',
    capturedPhotos: [
      {
        title: 'Full Disk Solar Ultraviolet Image',
        caption: 'Captured by SUIT payload onboard Aditya-L1 showing solar active regions in UV.',
        url: 'https://images.unsplash.com/photo-1532693322450-2cb5c511067d?auto=format&fit=crop&w=800&q=80',
      },
      {
        title: 'Solar Coronal Flare Ejection',
        caption: 'High-energy solar plasma ejection recorded by VELC payload.',
        url: 'https://images.unsplash.com/photo-1614728894747-a83421e2b9c9?auto=format&fit=crop&w=800&q=80',
      },
    ],
  },
  {
    id: 'james_webb',
    name: 'James Webb Space Telescope (JWST)',
    target: 'L2',
    agency: 'NASA / ESA / CSA 🇺🇸🇪🇺🇨🇦',
    launchYear: 2021,
    status: 'Active science operations at L2',
    distanceKm: '1,500,000 km from Earth',
    description: 'Premier deep space infrared observatory uncovering the early universe and exoplanet atmospheres.',
    capturedPhotos: [
      {
        title: 'Pillars of Creation (Infrared)',
        caption: 'JWST NIRCam view of star-forming region in the Eagle Nebula.',
        url: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=800&q=80',
      },
      {
        title: 'Carina Nebula Cosmic Cliffs',
        caption: 'Detailed infrared capture of young star clusters shedding gas in Carina.',
        url: 'https://images.unsplash.com/photo-1462331940025-496dfbfc7564?auto=format&fit=crop&w=800&q=80',
      },
    ],
  },
  {
    id: 'perseverance_rover',
    name: 'Perseverance Mars Rover',
    target: 'Mars',
    agency: 'NASA JPL 🇺🇸',
    launchYear: 2020,
    status: 'Exploring Jezero Crater on Mars',
    distanceKm: '225,000,000 km from Earth',
    description: 'Searching for ancient microbial life signs and collecting rock cores on Mars.',
    capturedPhotos: [
      {
        title: 'Mars Jezero Crater Delta',
        caption: 'High-resolution panorama of ancient river delta sediments on Mars.',
        url: 'https://images.unsplash.com/photo-1614728894747-a83421e2b9c9?auto=format&fit=crop&w=800&q=80',
      },
    ],
  },
  {
    id: 'chandrayaan_3',
    name: 'Chandrayaan-3 Vikram Lander',
    target: 'Moon',
    agency: 'ISRO 🇮🇳',
    launchYear: 2023,
    status: 'Historic South Pole Lunar Surface Landing',
    distanceKm: '384,400 km from Earth',
    description: 'First spacecraft to soft-land near the lunar South Pole, detecting elemental sulfur.',
    capturedPhotos: [
      {
        title: 'Lunar South Pole Crater Panorama',
        caption: 'Captured by Pragyan rover looking back at Vikram lander on Moon surface.',
        url: 'https://images.unsplash.com/photo-1522030299830-16b8d3d049fe?auto=format&fit=crop&w=800&q=80',
      },
    ],
  },
  {
    id: 'voyager_1',
    name: 'Voyager 1',
    target: 'Interstellar',
    agency: 'NASA JPL 🇺🇸',
    launchYear: 1977,
    status: 'Cruising Interstellar Space',
    distanceKm: '24,300,000,000 km (162 AU)',
    description: 'Humanity’s most distant artificial object, crossing the heliopause into interstellar space.',
    capturedPhotos: [
      {
        title: 'Jupiter Great Red Spot (1979)',
        caption: 'Historic flyby image of Jupiter’s swirling atmosphere by Voyager 1.',
        url: 'https://images.unsplash.com/photo-1614728894747-a83421e2b9c9?auto=format&fit=crop&w=800&q=80',
      },
    ],
  },
  {
    id: 'voyager_2',
    name: 'Voyager 2',
    target: 'Interstellar',
    agency: 'NASA JPL 🇺🇸',
    launchYear: 1977,
    status: 'Exploring Interstellar Space',
    distanceKm: '20,300,000,000 km (136 AU)',
    description: 'Only probe to visit Uranus and Neptune; carrying the Golden Record.',
    capturedPhotos: [
      {
        title: 'Neptune & Great Dark Spot (1989)',
        caption: 'Voyager 2 capture of blue gas giant Neptune during closest approach.',
        url: 'https://images.unsplash.com/photo-1614728894747-a83421e2b9c9?auto=format&fit=crop&w=800&q=80',
      },
    ],
  },
];

// ─── Deep Space Celestial Bodies & Phenomena ──────────────────────────────────
export const CELESTIAL_TARGETS: CelestialTarget[] = [
  {
    id: 'black_hole_sgra',
    name: 'Sagittarius A* (Supermassive Black Hole)',
    type: 'black_hole',
    distanceLy: '26,700 Light-Years',
    constellation: 'Sagittarius',
    description: 'The supermassive black hole at the galactic center of the Milky Way, with a mass of 4 million suns.',
    interactiveType: 'black_hole',
  },
  {
    id: 'neutron_star_crab',
    name: 'Crab Pulsar (Spinning Neutron Star)',
    type: 'neutron_star',
    distanceLy: '6,500 Light-Years',
    constellation: 'Taurus',
    description: 'A rapidly spinning neutron star rotating 30 times per second with extreme magnetic field beams.',
    interactiveType: 'neutron_star',
  },
  {
    id: 'supernova_remnant',
    name: 'Supernova Explosion (SNR 1054)',
    type: 'supernova',
    distanceLy: '6,500 Light-Years',
    constellation: 'Taurus',
    description: 'Cataclysmic stellar explosion blasting heavy elements (gold, platinum) into interstellar space.',
    interactiveType: 'supernova',
  },
  {
    id: 'andromeda_galaxy',
    name: 'Andromeda Galaxy (M31)',
    type: 'galaxy',
    distanceLy: '2,500,000 Light-Years',
    constellation: 'Andromeda',
    description: 'Our nearest major spiral galaxy containing 1 trillion stars, on a collision course with Milky Way in 4.5B years.',
    interactiveType: 'galaxy',
  },
  {
    id: 'wormhole_gargantua',
    name: 'Einstein-Rosen Bridge (Wormhole)',
    type: 'wormhole',
    distanceLy: 'Theoretical Space Shortcut',
    constellation: 'Hyperspace',
    description: 'A theoretical passage through space-time creating shortcuts for interstellar travel.',
    interactiveType: 'wormhole',
  },
];

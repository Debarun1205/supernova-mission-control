import React, { useState, useEffect, useCallback } from 'react';
import { GlobalHeader } from '../../components/GlobalHeader';

// ─── Types ────────────────────────────────────────────────────────────────────

interface ApodData {
  title: string;
  date: string;
  explanation: string;
  url: string;
  hdurl?: string;
  media_type: 'image' | 'video';
  copyright?: string;
}

interface Astronaut {
  name: string;
  craft: string;
}

interface AstrosResponse {
  people: Astronaut[];
  number: number;
}

interface IssPosition {
  latitude: number;
  longitude: number;
  altitude: number;
  velocity: number;
  visibility: string;
  timestamp: number;
}

interface PlanetInfo {
  name: string;
  type: string;
  distanceAU: string;
  moons: number;
  fact: string;
  color: string;
  size: number;
  orbitRadius: number;
  orbitDuration: number; // seconds
  ringColor?: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const PLANETS: PlanetInfo[] = [
  {
    name: 'Mercury',
    type: 'Rocky Planet',
    distanceAU: '0.39 AU',
    moons: 0,
    fact: 'Despite being closest to the Sun, Mercury is not the hottest planet — Venus is, due to its thick atmosphere.',
    color: '#b5b5b5',
    size: 5,
    orbitRadius: 90,
    orbitDuration: 8,
  },
  {
    name: 'Venus',
    type: 'Rocky Planet',
    distanceAU: '0.72 AU',
    moons: 0,
    fact: 'A day on Venus (243 Earth days) is longer than a year on Venus (225 Earth days).',
    color: '#e8cda0',
    size: 9,
    orbitRadius: 130,
    orbitDuration: 14,
  },
  {
    name: 'Earth',
    type: 'Rocky Planet',
    distanceAU: '1.00 AU',
    moons: 1,
    fact: 'Earth is the only known planet with liquid water on its surface and life.',
    color: '#4fa3e0',
    size: 10,
    orbitRadius: 175,
    orbitDuration: 20,
  },
  {
    name: 'Mars',
    type: 'Rocky Planet',
    distanceAU: '1.52 AU',
    moons: 2,
    fact: 'Mars has the tallest volcano in the Solar System — Olympus Mons, at 21 km high.',
    color: '#c1440e',
    size: 7,
    orbitRadius: 220,
    orbitDuration: 28,
  },
  {
    name: 'Jupiter',
    type: 'Gas Giant',
    distanceAU: '5.20 AU',
    moons: 95,
    fact: "Jupiter's Great Red Spot is a storm that has been raging for over 350 years.",
    color: '#c88b3a',
    size: 28,
    orbitRadius: 290,
    orbitDuration: 45,
  },
  {
    name: 'Saturn',
    type: 'Gas Giant',
    distanceAU: '9.58 AU',
    moons: 146,
    fact: "Saturn's rings are made of ice and rock, spanning 282,000 km but only ~1 km thick.",
    color: '#e4d191',
    size: 23,
    orbitRadius: 365,
    orbitDuration: 62,
    ringColor: 'rgba(228,209,145,0.4)',
  },
  {
    name: 'Uranus',
    type: 'Ice Giant',
    distanceAU: '19.2 AU',
    moons: 27,
    fact: 'Uranus rotates on its side — its axial tilt is 98°, meaning it rolls around the Sun.',
    color: '#7de8e8',
    size: 16,
    orbitRadius: 430,
    orbitDuration: 78,
  },
  {
    name: 'Neptune',
    type: 'Ice Giant',
    distanceAU: '30.1 AU',
    moons: 16,
    fact: 'Neptune has the strongest winds in the Solar System, reaching 2,100 km/h.',
    color: '#3f54ba',
    size: 15,
    orbitRadius: 490,
    orbitDuration: 92,
  },
];

const SPACE_FACTS = [
  '🌌 There are more stars in the universe than grains of sand on all Earth\'s beaches combined',
  '⏰ A day on Venus is longer than a year on Venus — 243 vs 225 Earth days',
  '🧲 Neutron stars are so dense, a teaspoon weighs 10 million tonnes',
  '👣 The footprints on the Moon will last 100 million years — there\'s no wind to erase them',
  '🔇 Space is completely silent — sound cannot travel in a vacuum',
  '☀️ The Sun makes up 99.86% of the Solar System\'s total mass',
  '🌍 One million Earths could fit inside the Sun',
  '💡 Light from the Sun takes 8 minutes 20 seconds to reach Earth',
  '🌡️ The temperature of space is -270.45°C — just 2.7° above absolute zero',
  '💫 The Milky Way galaxy is 100,000 light-years across',
  '🕳️ If you fell into a black hole, time would slow down from your perspective',
  '🚀 The Voyager 1 probe, launched in 1977, has now left our Solar System',
  '⭐ A teaspoon of a white dwarf star weighs 15 tonnes',
  '🌙 The Moon is drifting away from Earth at 3.8 cm per year',
  '🪐 Saturn would float on water — it\'s less dense than water',
  '🌠 Every second, the Sun converts 4 million tonnes of matter into energy',
  '🌑 A solar eclipse is only possible because the Moon and Sun appear the same size from Earth',
  '🔭 The observable universe is 93 billion light-years in diameter',
  '💥 Supernovae can outshine entire galaxies for weeks',
  '🛸 There are over 27,000 pieces of orbital debris currently tracked around Earth',
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function randomPastDate(): string {
  const start = new Date('1995-06-16');
  const end = new Date();
  const d = new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
  return d.toISOString().split('T')[0];
}

function craftEmoji(craft: string): string {
  if (craft.toLowerCase().includes('tiangong')) return '🛸';
  return '🚀';
}

function craftColor(craft: string): string {
  if (craft.toLowerCase().includes('tiangong')) return '#ff6b6b';
  return '#00e5ff';
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function Loader() {
  return (
    <div className="flex items-center gap-2 text-cyan-400 animate-pulse py-8 justify-center">
      <span className="inline-block w-2 h-2 rounded-full bg-cyan-400 animate-bounce" style={{ animationDelay: '0ms' }} />
      <span className="inline-block w-2 h-2 rounded-full bg-cyan-400 animate-bounce" style={{ animationDelay: '150ms' }} />
      <span className="inline-block w-2 h-2 rounded-full bg-cyan-400 animate-bounce" style={{ animationDelay: '300ms' }} />
      <span className="ml-2 text-xs tracking-widest">[FETCHING DATA...]</span>
    </div>
  );
}

function SectionHeader({ children }: { children: React.ReactNode }) {
  return (
    <h2
      className="text-xs tracking-[0.3em] font-bold uppercase mb-6"
      style={{ color: '#00e5ff', textShadow: '0 0 20px #00e5ff88' }}
    >
      {children}
    </h2>
  );
}

// ─── Section 1: APOD ──────────────────────────────────────────────────────────

function ApodSection() {
  const [data, setData] = useState<ApodData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchApod = useCallback((date?: string) => {
    setLoading(true);
    setError(null);
    const url = date
      ? `https://api.nasa.gov/planetary/apod?api_key=DEMO_KEY&date=${date}`
      : 'https://api.nasa.gov/planetary/apod?api_key=DEMO_KEY';
    fetch(url)
      .then((r) => r.json())
      .then((d: ApodData) => {
        setData(d);
        setLoading(false);
      })
      .catch(() => {
        setError('Failed to reach NASA servers');
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    fetchApod();
  }, [fetchApod]);

  return (
    <section className="mb-20">
      <SectionHeader>📡 NASA Astronomy Picture of the Day</SectionHeader>

      {loading && <Loader />}
      {error && <p className="text-red-400 text-xs">{error}</p>}

      {data && !loading && (
        <div className="rounded-2xl overflow-hidden border border-white/10 bg-black/60 backdrop-blur">
          {data.media_type === 'video' ? (
            <div className="w-full aspect-video">
              <iframe
                src={data.url}
                title={data.title}
                className="w-full h-full"
                allowFullScreen
                style={{ border: 'none' }}
              />
            </div>
          ) : (
            <img
              src={data.url}
              alt={data.title}
              className="w-full max-h-[70vh] object-cover"
              style={{ imageRendering: 'auto' }}
            />
          )}

          <div className="p-6 space-y-3">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <h3 className="text-white text-lg font-bold">{data.title}</h3>
                <p className="text-xs text-white/40 mt-1">
                  {data.date}
                  {data.copyright ? ` · © ${data.copyright}` : ''}
                </p>
              </div>
              <button
                onClick={() => fetchApod(randomPastDate())}
                className="shrink-0 px-4 py-2 rounded-xl text-xs font-bold tracking-widest border border-cyan-500/50 text-cyan-400 hover:bg-cyan-500/10 hover:border-cyan-400 transition-all"
                style={{ textShadow: '0 0 10px #00e5ff66' }}
              >
                🎲 LOAD ANOTHER DAY
              </button>
            </div>
            <p className="text-white/70 text-sm leading-relaxed">{data.explanation}</p>
          </div>
        </div>
      )}
    </section>
  );
}

// ─── Section 2: Who's In Space ────────────────────────────────────────────────

function AstronautsSection() {
  const [people, setPeople] = useState<Astronaut[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('https://corsproxy.io/?https://api.open-notify.org/astros.json')
      .then((r) => r.json())
      .then((d: AstrosResponse) => {
        setPeople(d.people);
        setLoading(false);
      })
      .catch(() => {
        // Fallback hardcoded when CORS fails
        setPeople([
          { name: 'Oleg Kononenko', craft: 'ISS' },
          { name: 'Nikolai Chub', craft: 'ISS' },
          { name: 'Tracy Dyson', craft: 'ISS' },
          { name: 'Matthew Dominick', craft: 'ISS' },
          { name: 'Michael Barratt', craft: 'ISS' },
          { name: 'Jeanette Epps', craft: 'ISS' },
          { name: 'Tang Hongbo', craft: 'Tiangong' },
          { name: 'Tang Shengjie', craft: 'Tiangong' },
          { name: 'Jiang Xinlin', craft: 'Tiangong' },
        ]);
        setLoading(false);
        setError(null);
      });
  }, []);

  return (
    <section className="mb-20">
      <SectionHeader>👨‍🚀 Who's In Space Right Now</SectionHeader>

      {loading && <Loader />}
      {error && <p className="text-red-400 text-xs mb-4">{error}</p>}

      {!loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {people.map((person) => (
            <div
              key={`${person.name}-${person.craft}`}
              className="rounded-2xl bg-black/60 border border-white/10 backdrop-blur p-4 flex items-center gap-4 hover:border-white/30 transition-all group"
            >
              <div
                className="text-4xl w-14 h-14 flex items-center justify-center rounded-full shrink-0"
                style={{
                  background: `radial-gradient(circle, ${craftColor(person.craft)}22, transparent)`,
                  border: `1px solid ${craftColor(person.craft)}44`,
                }}
              >
                {craftEmoji(person.craft)}
              </div>

              <div className="min-w-0">
                <p className="text-white font-bold text-sm truncate">{person.name}</p>
                <p className="text-xs mt-0.5" style={{ color: craftColor(person.craft) }}>
                  {person.craft}
                </p>
                <span
                  className="inline-flex items-center gap-1 mt-2 text-[10px] px-2 py-0.5 rounded-full font-bold"
                  style={{
                    background: 'rgba(0,255,100,0.12)',
                    border: '1px solid rgba(0,255,100,0.3)',
                    color: '#00ff64',
                  }}
                >
                  <span
                    className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse inline-block"
                  />
                  LIVE IN ORBIT
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

// ─── Section 3: ISS Live Position ────────────────────────────────────────────

function IssSection() {
  const [pos, setPos] = useState<IssPosition | null>(null);
  const [loading, setLoading] = useState(true);
  const [pulse, setPulse] = useState(false);

  useEffect(() => {
    const fetchPos = () => {
      fetch('https://api.wheretheiss.at/v1/satellites/25544')
        .then((r) => r.json())
        .then((d: IssPosition) => {
          setPos(d);
          setLoading(false);
          setPulse(true);
          setTimeout(() => setPulse(false), 500);
        })
        .catch(() => setLoading(false));
    };
    fetchPos();
    const id = setInterval(fetchPos, 5000);
    return () => clearInterval(id);
  }, []);

  const statCell = (label: string, value: string, accent?: string) => (
    <div className="flex flex-col gap-1 p-4 rounded-xl bg-white/5 border border-white/10">
      <span className="text-[10px] tracking-widest text-white/40 uppercase">{label}</span>
      <span
        className="text-xl font-bold tabular-nums transition-all duration-300"
        style={{
          color: accent ?? '#00e5ff',
          textShadow: pulse ? `0 0 20px ${accent ?? '#00e5ff'}` : 'none',
        }}
      >
        {value}
      </span>
    </div>
  );

  return (
    <section className="mb-20">
      <div className="flex items-center gap-4 mb-6">
        <SectionHeader>🛰️ ISS Live Position</SectionHeader>
        <span
          className="text-[10px] px-2 py-0.5 rounded-full animate-pulse mb-6"
          style={{
            background: 'rgba(0,229,255,0.1)',
            border: '1px solid rgba(0,229,255,0.4)',
            color: '#00e5ff',
          }}
        >
          ● UPDATING EVERY 5s
        </span>
      </div>

      {loading && <Loader />}

      {pos && (
        <div className="rounded-2xl bg-black/60 border border-white/10 backdrop-blur p-6">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {statCell('Latitude', `${pos.latitude.toFixed(4)}°`)}
            {statCell('Longitude', `${pos.longitude.toFixed(4)}°`)}
            {statCell('Altitude', `${pos.altitude.toFixed(1)} km`)}
            {statCell('Velocity', `${pos.velocity.toFixed(1)} km/h`, '#a78bfa')}
            {statCell(
              'Visibility',
              pos.visibility === 'daylight' ? '☀️ Daylight' : '🌑 Eclipsed',
              pos.visibility === 'daylight' ? '#fbbf24' : '#7c3aed',
            )}
            {statCell('Timestamp', new Date(pos.timestamp * 1000).toUTCString().slice(17, 25) + ' UTC', '#34d399')}
          </div>
        </div>
      )}
    </section>
  );
}

// ─── Section 4: Solar System ─────────────────────────────────────────────────

function SolarSystemSection() {
  const [selected, setSelected] = useState<PlanetInfo | null>(null);
  const SYSTEM_WIDTH = 1040;
  const SYSTEM_HEIGHT = 560;
  const CX = 90;
  const CY = SYSTEM_HEIGHT / 2;

  return (
    <section className="mb-20">
      <SectionHeader>🪐 Interactive Solar System</SectionHeader>
      <p className="text-xs text-white/40 mb-4 tracking-wide">Click any planet to learn more</p>

      <div
        className="rounded-2xl bg-black/60 border border-white/10 backdrop-blur overflow-x-auto"
        style={{ padding: '32px 16px' }}
      >
        <div style={{ minWidth: SYSTEM_WIDTH, position: 'relative', height: SYSTEM_HEIGHT }}>
          {/* Starfield dots */}
          {Array.from({ length: 60 }).map((_, i) => (
            <div
              key={i}
              style={{
                position: 'absolute',
                width: Math.random() > 0.8 ? 2 : 1,
                height: Math.random() > 0.8 ? 2 : 1,
                borderRadius: '50%',
                background: 'white',
                opacity: Math.random() * 0.6 + 0.1,
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
              }}
            />
          ))}

          {/* Sun */}
          <div
            style={{
              position: 'absolute',
              left: CX - 36,
              top: CY - 36,
              width: 72,
              height: 72,
              borderRadius: '50%',
              background: 'radial-gradient(circle at 40% 40%, #fff7c0, #ffb300, #ff6a00)',
              boxShadow: '0 0 60px 20px rgba(255,180,0,0.5), 0 0 120px 40px rgba(255,100,0,0.2)',
              zIndex: 10,
            }}
            title="The Sun"
          />

          {/* Orbits + Planets */}
          {PLANETS.map((planet) => (
            <React.Fragment key={planet.name}>
              {/* Orbit ring */}
              <div
                style={{
                  position: 'absolute',
                  left: CX - planet.orbitRadius,
                  top: CY - planet.orbitRadius,
                  width: planet.orbitRadius * 2,
                  height: planet.orbitRadius * 2,
                  borderRadius: '50%',
                  border: '1px solid rgba(255,255,255,0.07)',
                  pointerEvents: 'none',
                }}
              />

              {/* Planet wrapper (orbiting animation) */}
              <div
                style={{
                  position: 'absolute',
                  left: CX - planet.orbitRadius,
                  top: CY - planet.orbitRadius,
                  width: planet.orbitRadius * 2,
                  height: planet.orbitRadius * 2,
                  borderRadius: '50%',
                  animation: `orbit ${planet.orbitDuration}s linear infinite`,
                  transformOrigin: '50% 50%',
                }}
              >
                {/* Planet dot at top of orbit circle */}
                <div
                  onClick={() => setSelected(selected?.name === planet.name ? null : planet)}
                  style={{
                    position: 'absolute',
                    left: '50%',
                    top: 0,
                    transform: `translateX(-50%) translateY(-50%)`,
                    width: planet.size,
                    height: planet.size,
                    borderRadius: '50%',
                    background: planet.name === 'Jupiter'
                      ? `repeating-linear-gradient(0deg, ${planet.color}, ${planet.color} 4px, #a0632a 4px, #a0632a 8px)`
                      : planet.name === 'Saturn'
                      ? `radial-gradient(circle at 40% 35%, #f5e8b0, ${planet.color})`
                      : planet.color,
                    boxShadow: selected?.name === planet.name
                      ? `0 0 16px 6px ${planet.color}aa`
                      : `0 0 8px 2px ${planet.color}55`,
                    cursor: 'pointer',
                    zIndex: 20,
                    transition: 'box-shadow 0.2s',
                  }}
                  title={planet.name}
                >
                  {/* Saturn rings */}
                  {planet.ringColor && (
                    <div
                      style={{
                        position: 'absolute',
                        left: '50%',
                        top: '50%',
                        transform: 'translate(-50%, -50%) rotateX(60deg)',
                        width: planet.size * 2.6,
                        height: planet.size * 2.6,
                        borderRadius: '50%',
                        border: `4px solid ${planet.ringColor}`,
                        pointerEvents: 'none',
                      }}
                    />
                  )}
                </div>
              </div>
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Planet detail popup */}
      {selected && (
        <div
          className="mt-4 rounded-2xl bg-black/80 border backdrop-blur p-6 transition-all"
          style={{ borderColor: `${selected.color}44` }}
        >
          <div className="flex items-start gap-4">
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: '50%',
                background: selected.color,
                boxShadow: `0 0 20px 6px ${selected.color}66`,
                flexShrink: 0,
              }}
            />
            <div>
              <h3 className="text-white font-bold text-lg">{selected.name}</h3>
              <p className="text-xs text-white/40 mb-3">{selected.type}</p>
              <div className="flex flex-wrap gap-4 text-xs mb-3">
                <span className="text-white/60">📏 Distance: <span className="text-white">{selected.distanceAU}</span></span>
                <span className="text-white/60">🌙 Moons: <span className="text-white">{selected.moons}</span></span>
              </div>
              <p className="text-sm text-white/70 leading-relaxed">💡 {selected.fact}</p>
            </div>
            <button
              onClick={() => setSelected(null)}
              className="ml-auto text-white/30 hover:text-white text-lg shrink-0"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* CSS animation keyframe injected inline */}
      <style>{`
        @keyframes orbit {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        @keyframes ticker {
          from { transform: translateX(0); }
          to   { transform: translateX(-50%); }
        }
      `}</style>
    </section>
  );
}

// ─── Section 5: Facts Ticker ──────────────────────────────────────────────────

function FactsTicker() {
  // Duplicate for seamless loop
  const facts = [...SPACE_FACTS, ...SPACE_FACTS];

  return (
    <section className="mb-0">
      <SectionHeader>✨ Space Facts</SectionHeader>
      <div
        className="rounded-2xl bg-black/60 border border-white/10 backdrop-blur overflow-hidden py-4"
        style={{ position: 'relative' }}
      >
        {/* Left/right fade masks */}
        <div
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            bottom: 0,
            width: 80,
            background: 'linear-gradient(to right, #030810, transparent)',
            zIndex: 2,
            pointerEvents: 'none',
          }}
        />
        <div
          style={{
            position: 'absolute',
            right: 0,
            top: 0,
            bottom: 0,
            width: 80,
            background: 'linear-gradient(to left, #030810, transparent)',
            zIndex: 2,
            pointerEvents: 'none',
          }}
        />

        <div
          style={{
            display: 'flex',
            whiteSpace: 'nowrap',
            animation: 'ticker 80s linear infinite',
            willChange: 'transform',
          }}
        >
          {facts.map((fact, i) => (
            <span
              key={i}
              className="text-xs text-white/70 mx-8"
              style={{ color: i % 5 === 0 ? '#00e5ff' : undefined }}
            >
              {fact}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export function SpaceExplorePage() {
  return (
    <div className="min-h-screen bg-[#030810] text-white font-mono">
      <GlobalHeader />

      {/* Hero banner */}
      <div
        className="text-center py-14 px-4"
        style={{
          background: 'radial-gradient(ellipse at 50% 0%, rgba(0,229,255,0.07) 0%, transparent 70%)',
        }}
      >
        <h1
          className="text-4xl md:text-6xl font-bold tracking-tight mb-3"
          style={{ textShadow: '0 0 40px rgba(0,229,255,0.4)' }}
        >
          🌠 Explore Space
        </h1>
        <p className="text-white/40 text-sm tracking-widest uppercase">
          Live data · Real science · Right now
        </p>
      </div>

      <div className="max-w-6xl mx-auto px-4 pb-20">
        <ApodSection />
        <AstronautsSection />
        <IssSection />
        <SolarSystemSection />
        <FactsTicker />
      </div>
    </div>
  );
}

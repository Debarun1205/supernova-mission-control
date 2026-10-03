import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Globe } from '../globe/Globe';

const API = 'http://localhost:3000/api';

// ── Moon phase ────────────────────────────────────────────────────────────────
function getMoonPhase(): string {
  const date = new Date();
  const synodic = 29.53058867;
  const known = new Date('2000-01-06'); // known new moon
  const diff = (date.getTime() - known.getTime()) / (1000 * 60 * 60 * 24);
  const phase = ((diff % synodic) + synodic) % synodic;
  if (phase < 1.85) return '🌑';
  if (phase < 5.54) return '🌒';
  if (phase < 9.22) return '🌓';
  if (phase < 12.91) return '🌔';
  if (phase < 16.61) return '🌕';
  if (phase < 20.30) return '🌖';
  if (phase < 23.99) return '🌗';
  if (phase < 27.68) return '🌘';
  return '🌑';
}

const MOON_LABELS: Record<string, string> = {
  '🌑': 'New Moon',
  '🌒': 'Waxing Crescent',
  '🌓': 'First Quarter',
  '🌔': 'Waxing Gibbous',
  '🌕': 'Full Moon',
  '🌖': 'Waning Gibbous',
  '🌗': 'Last Quarter',
  '🌘': 'Waning Crescent',
};

// ── Space facts ───────────────────────────────────────────────────────────────
const SPACE_FACTS = [
  '🌍 Earth Circumference: 40,075 km',
  '☀️ Light from Sun reaches Earth in 8 min 20 sec',
  "🪐 Saturn's rings are 1 km thin but 282,000 km wide",
  '🌙 Moon is moving 3.8 cm away from Earth per year',
  '🚀 Voyager 1 is 23+ billion km from Earth',
  '⭐ Milky Way has 100–400 billion stars',
];

// ── Boot messages ─────────────────────────────────────────────────────────────
const BOOT_LINES = [
  '[INIT] Establishing quantum-encrypted uplink... OK',
  '[INIT] Loading SGP4 orbital propagator... OK',
  '[INIT] Connecting to Deep Space Network... OK',
  '[INIT] Calibrating telemetry sensors... OK',
  '[BOOT] SUPERNOVA MISSION CONTROL ONLINE ✓',
];

export function LandingPage() {
  const navigate = useNavigate();

  // ── Boot sequence ──────────────────────────────────────────────────────────
  const [bootStep, setBootStep] = useState(0);

  // ── Satellite stats ────────────────────────────────────────────────────────
  const [stats, setStats] = useState({ total: 3, nominal: 3, warning: 0, critical: 0 });

  // ── ISS altitude ──────────────────────────────────────────────────────────
  const [issAlt, setIssAlt] = useState<number | null>(null);

  // ── People in space ────────────────────────────────────────────────────────
  const [peopleInSpace, setPeopleInSpace] = useState<number | null>(null);

  // ── UTC clock ─────────────────────────────────────────────────────────────
  const [utcTime, setUtcTime] = useState('');

  // ── Space facts cycling ────────────────────────────────────────────────────
  const [factIdx, setFactIdx] = useState(0);
  const [factVisible, setFactVisible] = useState(true);

  // ── ISS countdown (simulated) ─────────────────────────────────────────────
  const issPassMinutesRef = useRef(Math.floor(Math.random() * 90) + 10);
  const [issCountdown, setIssCountdown] = useState(issPassMinutesRef.current * 60); // seconds

  // ── Moon phase (static, computed once) ────────────────────────────────────
  const moonEmoji = getMoonPhase();
  const moonLabel = MOON_LABELS[moonEmoji] ?? 'Unknown';

  // ── Effects ────────────────────────────────────────────────────────────────
  useEffect(() => {
    // Satellite stats
    axios.get(`${API}/satellites`).then((res) => {
      const sats = res.data;
      const nominal = sats.filter((s: any) => s.health === 'nominal').length;
      const warning = sats.filter((s: any) => s.health === 'warning').length;
      const critical = sats.filter((s: any) => s.health === 'critical').length;
      setStats({ total: sats.length, nominal, warning, critical });
    }).catch(() => {});

    // ISS altitude
    fetch('https://api.wheretheiss.at/v1/satellites/25544')
      .then(r => r.json())
      .then((d: any) => setIssAlt(Math.round(d.altitude)))
      .catch(() => {});

    // People in space
    fetch('http://api.open-notify.org/astros.json')
      .then(r => r.json())
      .then((d: any) => setPeopleInSpace(d.number))
      .catch(() => {});

    // Boot sequence — 5 steps, 400 ms apart; hide after step 5 + 600 ms
    const timers: ReturnType<typeof setTimeout>[] = [];
    for (let i = 1; i <= 5; i++) {
      timers.push(setTimeout(() => setBootStep(i), i * 400));
    }
    timers.push(setTimeout(() => setBootStep(6), 5 * 400 + 600)); // 6 = hidden

    return () => timers.forEach(clearTimeout);
  }, []);

  // UTC clock — tick every second
  useEffect(() => {
    const tick = () => {
      const now = new Date();
      setUtcTime(
        now.toUTCString().replace(/.*(\d{2}:\d{2}:\d{2}).*/, '$1') + ' UTC'
      );
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  // Space facts — cycle every 4 s with fade
  useEffect(() => {
    const id = setInterval(() => {
      setFactVisible(false);
      setTimeout(() => {
        setFactIdx(i => (i + 1) % SPACE_FACTS.length);
        setFactVisible(true);
      }, 400);
    }, 4000);
    return () => clearInterval(id);
  }, []);

  // ISS pass countdown — tick every second
  useEffect(() => {
    const id = setInterval(() => {
      setIssCountdown(s => (s <= 0 ? issPassMinutesRef.current * 60 : s - 1));
    }, 1000);
    return () => clearInterval(id);
  }, []);

  const fmtCountdown = (secs: number) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    return h > 0
      ? `${h}h ${m.toString().padStart(2, '0')}m`
      : `${m}m ${s.toString().padStart(2, '0')}s`;
  };

  // ── Quick-explore pills ────────────────────────────────────────────────────
  const PILLS = [
    { label: '🛰️ Satellites',   path: '/satellites' },
    { label: '🪐 Solar System', path: '/solar-system' },
    { label: '🌌 Universe',     path: '/universe' },
    { label: '🌠 Explore',      path: '/explore' },
    { label: '🤖 Ask AI',       path: '/ai' },
  ];

  return (
    <div className="w-full h-screen relative overflow-hidden bg-abyss text-starlight font-sans select-none">
      {/* Background 3D Globe */}
      <Globe />

      {/* Boot sequence overlay */}
      {bootStep < 6 && (
        <div className="absolute inset-0 bg-black z-50 flex items-center justify-center p-6 font-mono text-xs text-cyan-400">
          <div className="space-y-2 max-w-md w-full">
            <div className="text-white/40 uppercase tracking-widest text-[10px] mb-4">
              SUPERNOVA MISSION CONTROL BOOT SEQUENCE v2.0
            </div>
            {BOOT_LINES.slice(0, bootStep).map((line, i) => (
              <div key={i} className={i === bootStep - 1 ? 'text-cyan-300' : 'text-cyan-600'}>
                {line}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Hero content overlay */}
      <div className="absolute inset-0 z-10 flex flex-col justify-between p-8 pointer-events-none">

        {/* ── Top header ──────────────────────────────────────────────────── */}
        <div className="flex justify-between items-start pointer-events-auto">
          <div>
            <h1 className="text-3xl font-display font-bold text-ion tracking-widest uppercase">
              Supernova Mission Control
            </h1>
            <p className="text-xs font-mono text-dust mt-1">
              Physics-consistent satellite telemetry, space weather &amp; AI operations platform
            </p>

            {/* Quick-explore pills */}
            <div className="flex gap-2 mt-3 flex-wrap">
              {PILLS.map(({ label, path }) => (
                <button
                  key={path}
                  onClick={() => navigate(path)}
                  className="px-3 py-1 rounded-full border border-white/20 bg-black/40 hover:bg-white/10 text-[11px] font-mono text-white/70 hover:text-white transition-colors cursor-pointer"
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={() => navigate('/console')}
            className="px-5 py-2.5 bg-cyan-500/20 hover:bg-cyan-500/40 border border-cyan-500/50 text-cyan-300 font-mono text-xs font-bold rounded-xl shadow-lg shadow-cyan-500/10 transition-colors"
          >
            Enter Mission Control →
          </button>
        </div>

        {/* ── Floating space-fact card (top-right area) ────────────────────── */}
        <div
          style={{
            position: 'absolute',
            top: '120px',
            right: '32px',
            maxWidth: '220px',
            transition: 'opacity 0.4s ease',
            opacity: factVisible ? 1 : 0,
            pointerEvents: 'none',
          }}
          className="bg-black/60 backdrop-blur-md border border-white/10 rounded-xl p-3 font-mono text-[11px] text-white/80"
        >
          <div className="text-[9px] text-cyan-400/70 uppercase tracking-widest mb-1">Space Fact</div>
          {SPACE_FACTS[factIdx]}
        </div>

        {/* ── Floating moon-phase card (left side, middle) ─────────────────── */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '32px',
            transform: 'translateY(-50%)',
            pointerEvents: 'none',
          }}
          className="bg-black/60 backdrop-blur-md border border-white/10 rounded-xl p-3 font-mono text-center min-w-[110px]"
        >
          <div className="text-[9px] text-cyan-400/70 uppercase tracking-widest mb-1">Moon Phase</div>
          <div style={{ fontSize: '2rem', lineHeight: 1 }}>{moonEmoji}</div>
          <div className="text-[10px] text-white/60 mt-1">{moonLabel}</div>
        </div>

        {/* ── Floating ISS pass countdown card (bottom-right) ──────────────── */}
        <div
          style={{
            position: 'absolute',
            bottom: '140px',
            right: '32px',
            minWidth: '160px',
            pointerEvents: 'none',
          }}
          className="bg-black/60 backdrop-blur-md border border-white/10 rounded-xl p-3 font-mono text-center"
        >
          <div className="text-[9px] text-cyan-400/70 uppercase tracking-widest mb-1">Next ISS Pass</div>
          <div className="text-lg font-bold text-cyan-300">{fmtCountdown(issCountdown)}</div>
          <div className="text-[9px] text-white/40 mt-0.5">estimated overhead</div>
        </div>

        {/* ── Bottom live info panel ───────────────────────────────────────── */}
        <div className="grid grid-cols-5 gap-3 max-w-4xl bg-black/70 backdrop-blur-xl border border-white/10 p-4 rounded-2xl pointer-events-auto font-mono text-xs">
          {/* Tracked Satellites */}
          <div>
            <div className="text-[10px] text-white/40 uppercase tracking-widest">Satellites</div>
            <div className="text-xl font-bold text-white mt-0.5">{stats.total}</div>
          </div>
          {/* Fleet Nominal */}
          <div>
            <div className="text-[10px] text-green-400 uppercase tracking-widest">Nominal</div>
            <div className="text-xl font-bold text-green-400 mt-0.5">{stats.nominal}</div>
          </div>
          {/* ISS Altitude */}
          <div>
            <div className="text-[10px] text-cyan-400 uppercase tracking-widest">ISS Altitude</div>
            <div className="text-xl font-bold text-cyan-300 mt-0.5">
              {issAlt !== null ? `${issAlt} km` : '—'}
            </div>
          </div>
          {/* People in space */}
          <div>
            <div className="text-[10px] text-purple-400 uppercase tracking-widest">In Space Now</div>
            <div className="text-xl font-bold text-purple-300 mt-0.5">
              {peopleInSpace !== null ? `${peopleInSpace} 👩‍🚀` : '—'}
            </div>
          </div>
          {/* UTC clock + Explore button */}
          <div className="flex flex-col justify-between">
            <div>
              <div className="text-[10px] text-white/40 uppercase tracking-widest">UTC</div>
              <div className="text-sm font-bold text-white mt-0.5 tabular-nums">{utcTime}</div>
            </div>
            <button
              onClick={() => navigate('/explore')}
              className="mt-2 px-3 py-1 bg-cyan-500/20 hover:bg-cyan-500/40 border border-cyan-500/40 text-cyan-300 rounded-lg text-[11px] font-bold transition-colors"
            >
              🌠 Explore Space
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}

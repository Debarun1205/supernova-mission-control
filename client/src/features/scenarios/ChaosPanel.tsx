import React, { useState } from 'react';
import axios from 'axios';

const API = 'http://localhost:3000/api';

interface Scenario {
  id: string;
  fault: string;
  label: string;
  description: string;
  icon: string;
  defaultDurationSecs: number;
}

const SCENARIOS: Scenario[] = [
  {
    id: 'solar_flare',
    fault: 'solar_flare',
    label: 'Solar Flare',
    icon: '☀️',
    description: 'Simulates an X-class solar flare causing severe radiation storm, elevated SEU rate, and comms noise.',
    defaultDurationSecs: 120,
  },
  {
    id: 'battery_cell',
    fault: 'battery_cell',
    label: 'Battery Cell Degradation',
    icon: '🔋',
    description: 'Reduces solar panel efficiency by 50%, causing accelerated battery drain into warning territory.',
    defaultDurationSecs: 90,
  },
  {
    id: 'wheel_saturation',
    fault: 'wheel_saturation',
    label: 'Reaction Wheel Saturation',
    icon: '🌀',
    description: 'Drives reaction wheels to saturation, triggering pointing error degradation and ADCS alerts.',
    defaultDurationSecs: 60,
  },
  {
    id: 'star_tracker_loss',
    fault: 'star_tracker_loss',
    label: 'Star-Tracker Loss',
    icon: '⭐',
    description: 'Star tracker goes offline. Pointing error climbs rapidly from fine to coarse attitude.',
    defaultDurationSecs: 90,
  },
  {
    id: 'thermal_runaway',
    fault: 'thermal_runaway',
    label: 'Thermal Runaway',
    icon: '🌡️',
    description: 'Battery temperature target set to 65°C, simulating a heater fault or thermal strap failure.',
    defaultDurationSecs: 120,
  },
  {
    id: 'comms_dropout',
    fault: 'comms_dropout',
    label: 'Comms Dropout',
    icon: '📡',
    description: 'Drops telemetry link while satellite is in contact — an unexpected LOS anomaly (not a scheduled one).',
    defaultDurationSecs: 60,
  },
  {
    id: 'safe_mode',
    fault: 'safe_mode',
    label: 'Safe Mode Entry',
    icon: '🛡️',
    description: 'Forces satellite into safe mode, reducing power load and suspending payload operations.',
    defaultDurationSecs: 180,
  },
];

const FLEET_IDS = [25544, 20580, 25994]; // ISS, HST, Terra

export function ChaosPanel() {
  const [activeInjections, setActiveInjections] = useState<Record<string, { noradId: number; timeoutId: ReturnType<typeof setTimeout> }>>({});
  const [selectedSat, setSelectedSat] = useState<number>(FLEET_IDS[0]);
  const [feedback, setFeedback] = useState<string>('');

  const isActive = (scenarioId: string) => scenarioId in activeInjections;

  const injectScenario = async (scenario: Scenario) => {
    const key = `${selectedSat}:${scenario.fault}`;
    if (isActive(scenario.id)) return;

    try {
      await axios.post(`${API}/scenarios/inject`, { noradId: selectedSat, fault: scenario.fault });
      setFeedback(`[INJECTED] ${scenario.label} on NORAD ${selectedSat}`);

      // Auto-clear after duration
      const timeoutId = setTimeout(async () => {
        await axios.post(`${API}/scenarios/clear`, { noradId: selectedSat, fault: scenario.fault });
        setActiveInjections((prev) => {
          const next = { ...prev };
          delete next[scenario.id];
          return next;
        });
        setFeedback(`[CLEARED] ${scenario.label} on NORAD ${selectedSat}`);
      }, scenario.defaultDurationSecs * 1000);

      setActiveInjections((prev) => ({ ...prev, [scenario.id]: { noradId: selectedSat, timeoutId } }));
    } catch (e) {
      setFeedback('Injection failed — is the server running?');
    }
  };

  const clearScenario = async (scenario: Scenario) => {
    const injection = activeInjections[scenario.id];
    if (!injection) return;
    clearTimeout(injection.timeoutId);
    await axios.post(`${API}/scenarios/clear`, { noradId: injection.noradId, fault: scenario.fault });
    setActiveInjections((prev) => {
      const next = { ...prev };
      delete next[scenario.id];
      return next;
    });
    setFeedback(`[CLEARED] ${scenario.label} on NORAD ${injection.noradId}`);
  };

  return (
    <div className="min-h-screen bg-abyss text-starlight font-sans p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-display font-bold text-nova tracking-wide uppercase">
              ⚡ Chaos Panel
            </h1>
            <p className="text-xs text-dust font-mono mt-1">
              Fault injection for live demo. All scenarios are clearly labelled as simulated.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <a href="/alerts" className="text-xs font-mono text-white/40 hover:text-cyan-400 transition-colors">Alert Center</a>
            <a href="/" className="text-xs font-mono text-white/40 hover:text-white transition-colors">← Globe</a>
          </div>
        </div>

        {/* Satellite selector */}
        <div className="flex items-center gap-3 bg-black/40 border border-white/10 rounded-xl p-4">
          <span className="text-xs font-mono text-white/50">Target Satellite:</span>
          {FLEET_IDS.map((id) => (
            <button
              key={id}
              onClick={() => setSelectedSat(id)}
              className={
                selectedSat === id
                  ? 'px-3 py-1 rounded-lg text-xs font-mono bg-nova/20 text-nova border border-nova/40'
                  : 'px-3 py-1 rounded-lg text-xs font-mono text-white/40 border border-white/10 hover:border-white/30 hover:text-white transition-colors'
              }
            >
              NORAD {id}
            </button>
          ))}
        </div>

        {/* Feedback bar */}
        {feedback && (
          <div className="bg-black/60 border border-white/10 rounded-lg px-4 py-2 text-xs font-mono text-white/70 flex items-center gap-2">
            <span className="text-nova animate-pulse">●</span>
            {feedback}
          </div>
        )}

        {/* Disclaimer */}
        <div className="bg-yellow-900/20 border border-yellow-500/30 rounded-lg px-4 py-2 text-xs font-mono text-yellow-300/70">
          ⚠ All injected scenarios are clearly marked as <strong>[INJECTED]</strong> and flow through the real simulator → anomaly detector → alert pipeline. Nothing is pre-canned.
        </div>

        {/* Scenario cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {SCENARIOS.map((scenario) => {
            const active = isActive(scenario.id);
            return (
              <div
                key={scenario.id}
                className={`relative bg-black/60 backdrop-blur border rounded-xl p-4 space-y-3 transition-all ${
                  active
                    ? 'border-nova/50 shadow-lg shadow-nova/10'
                    : 'border-white/10 hover:border-white/20'
                }`}
              >
                {/* Injected badge */}
                {active && (
                  <div className="absolute top-3 right-3 text-[10px] font-mono px-2 py-0.5 rounded-full bg-nova/20 text-nova border border-nova/40 animate-pulse">
                    INJECTED
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <span className="text-2xl">{scenario.icon}</span>
                  <div>
                    <div className="text-sm font-bold text-white">{scenario.label}</div>
                    <div className="text-[10px] font-mono text-white/30">{scenario.defaultDurationSecs}s auto-clear</div>
                  </div>
                </div>

                <p className="text-xs text-white/50">{scenario.description}</p>

                <div className="flex gap-2">
                  {!active ? (
                    <button
                      onClick={() => injectScenario(scenario)}
                      className="flex-1 py-1.5 rounded-lg text-xs font-mono font-bold border border-nova/40 text-nova hover:bg-nova/10 transition-colors"
                    >
                      Inject
                    </button>
                  ) : (
                    <button
                      onClick={() => clearScenario(scenario)}
                      className="flex-1 py-1.5 rounded-lg text-xs font-mono font-bold border border-white/20 text-white/60 hover:border-green-500/40 hover:text-green-400 transition-colors"
                    >
                      Undo (Clear Now)
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

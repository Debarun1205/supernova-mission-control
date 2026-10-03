import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useMissionStore } from '../store/useMissionStore';
import { CommandPalette } from './CommandPalette';
import { KeyboardShortcutsModal } from './KeyboardShortcutsModal';
import { MissionAiDrawer } from '../features/ai/MissionAiDrawer';
import { DemoTourOverlay } from '../features/demo/DemoTourOverlay';

export function GlobalHeader() {
  const { isLive, simulationTime } = useMissionStore();
  const [cmdOpen, setCmdOpen] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const [aiOpen, setAiOpen] = useState(false);
  const [demoActive, setDemoActive] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [reduceMotion, setReduceMotion] = useState(false);
  const navigate = useNavigate();

  // Listen for ? key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '?' && !['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) {
        e.preventDefault();
        setShortcutsOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <>
      <header className="h-10 bg-black/90 backdrop-blur border-b border-white/10 px-4 flex items-center justify-between font-mono text-xs z-30 select-none">
        {/* Left: Branding & Status */}
        <div className="flex items-center gap-4">
          <Link to="/" className="font-display font-bold text-ion tracking-wider uppercase text-sm hover:text-white transition-colors">
            Supernova Control
          </Link>

          <div className="h-3 w-px bg-white/20" />

          <div className="flex items-center gap-2 text-[11px] text-dust">
            <span>{new Date(simulationTime).toUTCString().slice(17, 25)} UTC</span>
            {isLive ? (
              <span className="text-nova border border-nova/60 px-1 rounded text-[9px] animate-pulse">
                LIVE
              </span>
            ) : (
              <span className="text-yellow-400 border border-yellow-500/60 px-1 rounded text-[9px]">
                SIM
              </span>
            )}
          </div>
        </div>

        {/* Center: Navigation Links */}
        <nav className="flex items-center gap-4 text-[11px]">
          <Link to="/console" className="text-white/60 hover:text-cyan-300 transition-colors">Console</Link>
          <Link to="/satellites" className="text-white/60 hover:text-cyan-300 transition-colors">Explorer</Link>
          <Link to="/universe" className="text-cyan-300 font-bold hover:text-white transition-colors">🌌 Universe</Link>
          <Link to="/alerts" className="text-white/60 hover:text-cyan-300 transition-colors">Alerts</Link>
          <Link to="/sky" className="text-white/60 hover:text-cyan-300 transition-colors">Sky</Link>
          <Link to="/scenarios" className="text-white/60 hover:text-nova transition-colors">⚡ Chaos</Link>
          <Link to="/reports" className="text-white/60 hover:text-cyan-300 transition-colors">Reports</Link>
          <Link to="/settings" className="text-white/60 hover:text-cyan-300 transition-colors">Settings</Link>
        </nav>

        {/* Right: Actions & Tools */}
        <div className="flex items-center gap-2 text-[11px]">
          <button
            onClick={() => setDemoActive(true)}
            className="px-2.5 py-0.5 rounded bg-gradient-to-r from-cyan-500/20 to-nova/20 hover:from-cyan-500/40 hover:to-nova/40 border border-cyan-500/40 text-cyan-300 font-bold transition-colors animate-pulse"
          >
            ▶ Demo Mode
          </button>

          <button
            onClick={() => setCmdOpen(true)}
            className="px-2 py-0.5 rounded bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 hover:text-white transition-colors flex items-center gap-1"
          >
            🔍 <span className="text-[10px] text-white/40">Ctrl+K</span>
          </button>

          <button
            onClick={() => setAiOpen(true)}
            className="px-2 py-0.5 rounded bg-cyan-950/60 border border-cyan-500/40 text-cyan-300 hover:text-cyan-100 transition-colors"
          >
            🛰️ AI (A)
          </button>

          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`p-1 rounded transition-colors ${
              soundEnabled ? 'text-white/70' : 'text-white/20'
            }`}
            title="Toggle Alert Sounds"
          >
            {soundEnabled ? '🔔' : '🔕'}
          </button>

          <button
            onClick={() => setShortcutsOpen(true)}
            className="px-1.5 py-0.5 rounded border border-white/10 text-white/40 hover:text-white text-[10px]"
            title="Keyboard Shortcuts (?)"
          >
            ?
          </button>
        </div>
      </header>

      {/* Modals & Drawers */}
      <CommandPalette isOpen={cmdOpen} onClose={() => setCmdOpen(false)} />
      <KeyboardShortcutsModal isOpen={shortcutsOpen} onClose={() => setShortcutsOpen(false)} />
      <MissionAiDrawer isOpen={aiOpen} onClose={() => setAiOpen(false)} />
      <DemoTourOverlay isActive={demoActive} onCancel={() => setDemoActive(false)} />
    </>
  );
}

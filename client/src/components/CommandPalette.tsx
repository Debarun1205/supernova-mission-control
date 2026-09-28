import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const API = 'http://localhost:3000/api';

export function CommandPalette({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [query, setQuery] = useState('');
  const [satellites, setSatellites] = useState<Array<{ noradId: number; name: string }>>([]);
  const navigate = useNavigate();

  useEffect(() => {
    if (isOpen) {
      axios.get(`${API}/satellites`).then((res) => setSatellites(res.data)).catch(() => {});
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
        else openPalette();
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const openPalette = () => {
    // handled by parent
  };

  if (!isOpen) return null;

  const pages = [
    { label: 'Console (Dashboard)', path: '/console' },
    { label: 'Satellite Explorer', path: '/satellites' },
    { label: 'Alert Center', path: '/alerts' },
    { label: 'Sky View', path: '/sky' },
    { label: 'Chaos Panel', path: '/scenarios' },
    { label: 'Mission AI Console', path: '/ai' },
    { label: 'Shift Handover Report', path: '/reports' },
    { label: 'Settings', path: '/settings' },
  ];

  const filteredPages = pages.filter((p) =>
    p.label.toLowerCase().includes(query.toLowerCase())
  );

  const filteredSats = satellites.filter(
    (s) =>
      s.name.toLowerCase().includes(query.toLowerCase()) ||
      String(s.noradId).includes(query)
  );

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-start justify-center pt-20 p-4 font-mono">
      <div className="bg-black/90 border border-cyan-500/40 rounded-2xl w-full max-w-xl overflow-hidden shadow-2xl space-y-2 p-4">
        <div className="flex items-center gap-2 border-b border-white/10 pb-3">
          <span className="text-cyan-400">🔍</span>
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type a command, page name, or satellite name... (Esc to close)"
            className="w-full bg-transparent text-sm text-white placeholder-white/30 focus:outline-none"
          />
        </div>

        <div className="max-h-80 overflow-y-auto space-y-3 pt-2 text-xs">
          {/* Navigation Pages */}
          {filteredPages.length > 0 && (
            <div>
              <div className="text-[10px] text-cyan-400 uppercase tracking-widest font-bold mb-1 px-2">
                Pages
              </div>
              {filteredPages.map((p) => (
                <button
                  key={p.path}
                  onClick={() => {
                    navigate(p.path);
                    onClose();
                  }}
                  className="w-full text-left px-3 py-2 rounded-lg hover:bg-cyan-950/40 hover:text-cyan-300 text-white/80 flex justify-between transition-colors"
                >
                  <span>{p.label}</span>
                  <span className="text-white/30 text-[10px]">{p.path}</span>
                </button>
              ))}
            </div>
          )}

          {/* Satellites */}
          {filteredSats.length > 0 && (
            <div>
              <div className="text-[10px] text-cyan-400 uppercase tracking-widest font-bold mb-1 px-2">
                Satellites
              </div>
              {filteredSats.slice(0, 5).map((s) => (
                <button
                  key={s.noradId}
                  onClick={() => {
                    navigate(`/satellites/${s.noradId}`);
                    onClose();
                  }}
                  className="w-full text-left px-3 py-2 rounded-lg hover:bg-cyan-950/40 hover:text-cyan-300 text-white/80 flex justify-between transition-colors"
                >
                  <span>{s.name}</span>
                  <span className="text-white/30 text-[10px]">NORAD {s.noradId}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

import React from 'react';
import { MissionAiDrawer } from './MissionAiDrawer';

export function MissionAiPage() {
  return (
    <div className="min-h-screen bg-abyss text-starlight font-sans flex flex-col items-center justify-center relative overflow-hidden">
      <div className="text-center space-y-4 max-w-md p-6 border border-cyan-500/20 bg-black/40 rounded-2xl backdrop-blur-xl">
        <div className="text-5xl">🛰️</div>
        <h1 className="text-2xl font-bold font-display text-cyan-300 uppercase tracking-widest">
          Mission AI Operations Console
        </h1>
        <p className="text-xs font-mono text-white/50">
          Full screen Mission AI environment. Use the persistent side panel or ask questions directly about ground tracks, telemetry trends, and operational runbooks.
        </p>
        <div className="pt-2">
          <a
            href="/"
            className="inline-block px-4 py-2 bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 rounded font-mono text-xs hover:bg-cyan-500/30 transition-colors"
          >
            ← Return to 3D Mission Globe
          </a>
        </div>
      </div>

      {/* Render drawer forced open for /ai route */}
      <MissionAiDrawer isOpen={true} onClose={() => (window.location.href = '/')} />
    </div>
  );
}

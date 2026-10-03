import React, { useCallback, useEffect, useRef, useState } from 'react';

/**
 * SpaceSoundPlayer — Ambient procedural space soundscape using Web Audio API.
 *
 * Generates entirely in-browser (no external audio files):
 *   1. Deep drone oscillator at 40 Hz (sine, gain ~0.02)
 *   2. Slow LFO modulating drone frequency ±5 Hz over ~8 s
 *   3. Pink-ish noise via overlapping detuned oscillators at harmonics
 *   4. High-frequency shimmer at 8000 Hz with slow AM envelope
 */

interface AudioNodes {
  ctx: AudioContext;
  masterGain: GainNode;
  droneOsc: OscillatorNode;
  lfoOsc: OscillatorNode;
  lfoGain: GainNode;
  harmonicOscs: OscillatorNode[];
  shimmerOsc: OscillatorNode;
  shimmerLfo: OscillatorNode;
  shimmerLfoGain: GainNode;
  shimmerGain: GainNode;
}

function buildAudioGraph(): AudioNodes {
  const ctx = new AudioContext();
  const masterGain = ctx.createGain();
  masterGain.gain.value = 1;
  masterGain.connect(ctx.destination);

  // ── 1. Deep drone at 40 Hz ─────────────────────────────────────────────
  const droneOsc = ctx.createOscillator();
  droneOsc.type = 'sine';
  droneOsc.frequency.value = 40;

  const droneGain = ctx.createGain();
  droneGain.gain.value = 0.02;

  droneOsc.connect(droneGain);
  droneGain.connect(masterGain);

  // ── 2. LFO modulating drone frequency ±5 Hz, period ~8 s ───────────────
  const lfoOsc = ctx.createOscillator();
  lfoOsc.type = 'sine';
  lfoOsc.frequency.value = 1 / 8; // 0.125 Hz → 8 s period

  const lfoGain = ctx.createGain();
  lfoGain.gain.value = 5; // ±5 Hz depth

  lfoOsc.connect(lfoGain);
  lfoGain.connect(droneOsc.frequency);

  // ── 3. Pink-ish noise via layered detuned oscillators ──────────────────
  const harmonicFreqs = [80, 120, 200, 340, 560, 920, 1480];
  const harmonicOscs: OscillatorNode[] = harmonicFreqs.map((freq, i) => {
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = freq + (i % 3 === 0 ? -2 : 1.5); // slight detune

    const g = ctx.createGain();
    // Gain falls off with frequency — approximates 1/f pink characteristic
    g.gain.value = 0.008 / (1 + i * 0.35);

    osc.connect(g);
    g.connect(masterGain);
    return osc;
  });

  // ── 4. High-frequency shimmer at 8000 Hz with slow AM ─────────────────
  const shimmerOsc = ctx.createOscillator();
  shimmerOsc.type = 'sine';
  shimmerOsc.frequency.value = 8000;

  const shimmerGain = ctx.createGain();
  shimmerGain.gain.value = 0; // controlled by AM LFO

  const shimmerLfo = ctx.createOscillator();
  shimmerLfo.type = 'sine';
  shimmerLfo.frequency.value = 0.07; // very slow AM ~14 s period

  const shimmerLfoGain = ctx.createGain();
  shimmerLfoGain.gain.value = 0.0025; // max shimmer gain 0.005, centred at 0

  shimmerLfo.connect(shimmerLfoGain);
  shimmerLfoGain.connect(shimmerGain.gain);

  // DC offset so gain stays positive (0 → 0.005)
  const dcOffset = ctx.createConstantSource();
  dcOffset.offset.value = 0.0025;
  dcOffset.connect(shimmerGain.gain);
  dcOffset.start();

  shimmerOsc.connect(shimmerGain);
  shimmerGain.connect(masterGain);

  return {
    ctx,
    masterGain,
    droneOsc,
    lfoOsc,
    lfoGain,
    harmonicOscs,
    shimmerOsc,
    shimmerLfo,
    shimmerLfoGain,
    shimmerGain,
  };
}

export function SpaceSoundPlayer() {
  const [playing, setPlaying] = useState(false);
  const [tooltip, setTooltip] = useState(false);
  const nodesRef = useRef<AudioNodes | null>(null);

  const startAudio = useCallback(() => {
    const nodes = buildAudioGraph();

    nodes.droneOsc.start();
    nodes.lfoOsc.start();
    nodes.harmonicOscs.forEach((o) => o.start());
    nodes.shimmerOsc.start();
    nodes.shimmerLfo.start();

    nodesRef.current = nodes;
  }, []);

  const stopAudio = useCallback(() => {
    const nodes = nodesRef.current;
    if (!nodes) return;

    // Fade out master gain to avoid click
    const { ctx, masterGain } = nodes;
    masterGain.gain.setTargetAtTime(0, ctx.currentTime, 0.3);

    setTimeout(() => {
      try {
        nodes.droneOsc.stop();
        nodes.lfoOsc.stop();
        nodes.harmonicOscs.forEach((o) => o.stop());
        nodes.shimmerOsc.stop();
        nodes.shimmerLfo.stop();
        ctx.close();
      } catch {
        // already stopped
      }
      nodesRef.current = null;
    }, 1200);
  }, []);

  const toggle = useCallback(() => {
    if (playing) {
      stopAudio();
      setPlaying(false);
    } else {
      startAudio();
      setPlaying(true);
    }
  }, [playing, startAudio, stopAudio]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (nodesRef.current) {
        try {
          nodesRef.current.ctx.close();
        } catch {
          // ignore
        }
        nodesRef.current = null;
      }
    };
  }, []);

  return (
    <div
      className="fixed bottom-4 left-4 z-50"
      style={{ position: 'fixed', bottom: '1rem', left: '1rem', zIndex: 50 }}
    >
      {/* Tooltip */}
      {tooltip && (
        <div
          className="absolute bottom-12 left-0 font-mono text-[10px] text-cyan-300 bg-black/90 border border-cyan-500/30 rounded px-2 py-1 whitespace-nowrap pointer-events-none"
          style={{ bottom: '2.75rem' }}
        >
          Space Ambience (NASA-inspired)
        </div>
      )}

      {/* Button */}
      <button
        onClick={toggle}
        onMouseEnter={() => setTooltip(true)}
        onMouseLeave={() => setTooltip(false)}
        title="Space Ambience (NASA-inspired)"
        className="bg-black/80 border border-cyan-500/30 rounded-full w-10 h-10 flex items-center justify-center text-lg cursor-pointer hover:border-cyan-400/60 transition-all font-mono"
        style={
          playing
            ? {
                boxShadow: '0 0 15px rgba(0,200,255,0.5)',
                animation: 'spaceSoundGlow 2s ease-in-out infinite alternate',
              }
            : undefined
        }
        aria-label={playing ? 'Stop space ambience' : 'Play space ambience'}
      >
        {playing ? '🔊' : '🎵'}
      </button>

      {/* Keyframe injection */}
      <style>{`
        @keyframes spaceSoundGlow {
          from { box-shadow: 0 0 8px rgba(0,200,255,0.35); }
          to   { box-shadow: 0 0 20px rgba(0,200,255,0.75); }
        }
      `}</style>
    </div>
  );
}

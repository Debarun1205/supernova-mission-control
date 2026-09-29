import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { DEMO_SCRIPT, type TourStep } from '../../demo/script';
import { useMissionStore } from '../../store/useMissionStore';

const API = 'http://localhost:3000/api';

export function DemoTourOverlay({
  isActive,
  onCancel,
}: {
  isActive: boolean;
  onCancel: () => void;
}) {
  const [currentStepIdx, setCurrentStepIdx] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [showNotes, setShowNotes] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const navigate = useNavigate();
  const setSelectedSatellite = useMissionStore((s: any) => s.setSelectedSatellite);

  const currentStep: TourStep = DEMO_SCRIPT[currentStepIdx] || DEMO_SCRIPT[0];

  // Timer loop
  useEffect(() => {
    if (!isActive || isPaused) return;

    const interval = setInterval(() => {
      setElapsed((prev) => {
        const next = prev + 1;
        // Check if next step should trigger
        const nextStepIdx = DEMO_SCRIPT.findIndex(
          (s: TourStep, idx: number) => idx > currentStepIdx && s.atSecond <= next
        );
        if (nextStepIdx !== -1 && nextStepIdx !== currentStepIdx) {
          executeStepAction(DEMO_SCRIPT[nextStepIdx]);
          setCurrentStepIdx(nextStepIdx);
        }
        return next;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isActive, isPaused, currentStepIdx]);

  const executeStepAction = async (step: TourStep) => {
    switch (step.actionType) {
      case 'navigate':
        navigate(step.actionPayload);
        break;
      case 'focus_sat':
        navigate('/console');
        setSelectedSatellite(step.actionPayload.id);
        break;
      case 'inject_fault':
        axios.post(`${API}/scenarios/inject`, step.actionPayload).catch(() => {});
        break;
      case 'clear_fault':
        axios.post(`${API}/scenarios/clear`, step.actionPayload).catch(() => {});
        break;
      case 'open_reports':
        navigate('/reports');
        break;
      default:
        break;
    }
  };

  if (!isActive) return null;

  const totalDuration = 90;
  const progressPct = Math.min((elapsed / totalDuration) * 100, 100);

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 pointer-events-auto font-mono select-none">
      {/* Top progress bar */}
      <div className="h-1 bg-white/10 w-full">
        <div
          className="h-full bg-gradient-to-r from-cyan-400 via-nova to-green-400 transition-all duration-1000"
          style={{ width: `${progressPct}%` }}
        />
      </div>

      {/* Presenter Notes drawer (expandable) */}
      {showNotes && (
        <div className="bg-yellow-950/90 border-t border-yellow-500/40 p-4 text-xs text-yellow-200 backdrop-blur-xl">
          <div className="max-w-4xl mx-auto flex items-start justify-between gap-4">
            <div>
              <span className="font-bold uppercase tracking-wider text-[10px] text-yellow-400 block mb-1">
                🗣️ Presenter Talking Point (Step {currentStep.step}/8)
              </span>
              <p className="leading-relaxed">{currentStep.presenterNote}</p>
            </div>
            <button
              onClick={() => setShowNotes(false)}
              className="text-yellow-400 hover:text-white text-xs font-bold"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Main Lower-Third Banner */}
      <div className="bg-black/90 backdrop-blur-2xl border-t border-cyan-500/40 px-6 py-4">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Captions */}
          <div className="space-y-1 flex-1">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 uppercase">
                Demo Mode Tour · {elapsed}s / 90s
              </span>
              <h4 className="text-sm font-bold text-white tracking-wide">
                {currentStep.title}
              </h4>
            </div>
            <p className="text-xs text-white/80 leading-relaxed">
              {currentStep.caption}
            </p>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-2 flex-shrink-0 text-xs">
            <button
              onClick={() => setShowNotes(!showNotes)}
              className="px-3 py-1.5 rounded bg-yellow-500/20 hover:bg-yellow-500/30 border border-yellow-500/40 text-yellow-300 font-bold transition-colors"
            >
              {showNotes ? 'Hide Speaker Notes' : '🎙️ Speaker Notes'}
            </button>

            <button
              onClick={() => setIsPaused(!isPaused)}
              className="px-3 py-1.5 rounded bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold transition-colors"
            >
              {isPaused ? '▶ Resume' : '⏸ Pause'}
            </button>

            <button
              onClick={onCancel}
              className="px-3 py-1.5 rounded bg-red-900/40 hover:bg-red-900/60 border border-red-500/40 text-red-300 font-bold transition-colors"
            >
              Exit Tour
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

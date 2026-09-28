import React, { useEffect } from 'react';

export function KeyboardShortcutsModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '?' && !['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) {
        e.preventDefault();
        if (isOpen) onClose();
      }
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  if (!isOpen) return null;

  const shortcuts = [
    { key: 'Ctrl + K', desc: 'Open Command Palette' },
    { key: 'A or Ctrl + J', desc: 'Toggle Mission AI Drawer' },
    { key: '?', desc: 'Show / Hide Keyboard Shortcuts' },
    { key: 'Esc', desc: 'Close open modal or drawer' },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 font-mono">
      <div className="bg-black/90 border border-white/20 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl">
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <h2 className="text-sm font-bold text-white uppercase tracking-widest">
            ⌨️ Keyboard Shortcuts
          </h2>
          <button onClick={onClose} className="text-white/40 hover:text-white font-bold">
            ✕
          </button>
        </div>

        <div className="space-y-2 text-xs">
          {shortcuts.map((s, idx) => (
            <div key={idx} className="flex justify-between items-center bg-white/5 p-2 rounded">
              <span className="text-cyan-300 font-bold bg-cyan-950/60 border border-cyan-500/30 px-2 py-0.5 rounded">
                {s.key}
              </span>
              <span className="text-white/70">{s.desc}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

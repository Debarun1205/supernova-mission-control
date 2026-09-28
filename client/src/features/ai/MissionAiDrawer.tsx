import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useMissionStore } from '../../store/useMissionStore';

const API = 'http://localhost:3000/api';

export interface MessageItem {
  id: string;
  role: 'user' | 'model';
  content: string;
  chips?: string[];
  pendingConfirm?: { alertId: string };
  isStreaming?: boolean;
}

const SUGGESTED_PROMPTS = [
  "What's the most concerning satellite right now and why?",
  "Which satellites pass over Kolkata tonight?",
  "What space weather anomalies are currently active?",
  "Give me a quick status check on the ISS.",
];

export function MissionAiDrawer({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [confirmModal, setConfirmModal] = useState<{ alertId: string } | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [ttsEnabled, setTtsEnabled] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const setSelectedSatellite = useMissionStore((s) => s.setSelectedSatellite);

  // Auto-scroll messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Keyboard shortcut listener (A or Ctrl+J to toggle)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.key === 'a' || e.key === 'A') && !['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) {
        e.preventDefault();
        if (isOpen) onClose();
        else openDrawer();
      }
      if (e.ctrlKey && e.key === 'j') {
        e.preventDefault();
        if (isOpen) onClose();
        else openDrawer();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const openDrawer = () => {
    // Parent handles state or we dispatch
  };

  // Web Speech API: Speech Recognition (voice input)
  const toggleSpeechRecognition = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Speech recognition is not supported in this browser.');
      return;
    }

    if (isListening) {
      setIsListening(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onstart = () => setIsListening(true);
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setInput(transcript);
      setIsListening(false);
    };
    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);

    recognition.start();
  };

  // Text-To-Speech (TTS)
  const speakText = (text: string) => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text.replace(/[*_#`]/g, ''));
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    window.speechSynthesis.speak(utterance);
  };

  const sendMessage = async (textToSend?: string) => {
    const query = textToSend || input;
    if (!query.trim() || isLoading) return;

    const userMsgId = Date.now().toString();
    const botMsgId = (Date.now() + 1).toString();

    const newHistory: MessageItem[] = [
      ...messages,
      { id: userMsgId, role: 'user', content: query },
      { id: botMsgId, role: 'model', content: '', chips: [], isStreaming: true },
    ];

    setMessages(newHistory);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch(`${API}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: query,
          history: messages.map((m) => ({ role: m.role, content: m.content })),
        }),
      });

      if (!response.body) throw new Error('No response body');

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let done = false;
      let streamedContent = '';
      const chips: string[] = [];

      while (!done) {
        const { value, done: readerDone } = await reader.read();
        done = readerDone;
        if (value) {
          const chunk = decoder.decode(value);
          const lines = chunk.split('\n\n');
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const event = JSON.parse(line.slice(6));
                if (event.type === 'token') {
                  streamedContent += event.text;
                  setMessages((prev) =>
                    prev.map((m) =>
                      m.id === botMsgId ? { ...m, content: streamedContent } : m
                    )
                  );
                } else if (event.type === 'tool') {
                  if (event.chip) chips.push(event.chip);
                  if (event.uiCommand) {
                    handleUiCommand(event.uiCommand);
                  }
                  if (event.requiresConfirm && event.uiCommand?.payload?.alertId) {
                    setConfirmModal({ alertId: event.uiCommand.payload.alertId });
                  }
                  setMessages((prev) =>
                    prev.map((m) => (m.id === botMsgId ? { ...m, chips: [...chips] } : m))
                  );
                } else if (event.type === 'done') {
                  setMessages((prev) =>
                    prev.map((m) =>
                      m.id === botMsgId ? { ...m, isStreaming: false } : m
                    )
                  );
                  if (ttsEnabled && streamedContent) {
                    speakText(streamedContent);
                  }
                }
              } catch (_) {}
            }
          }
        }
      }
    } catch (err) {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === botMsgId
            ? {
                ...m,
                content: 'Failed to connect to Mission AI server.',
                isStreaming: false,
              }
            : m
        )
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleUiCommand = (uiCmd: any) => {
    if (uiCmd.type === 'focus_satellite' && uiCmd.payload?.id) {
      setSelectedSatellite(uiCmd.payload.id);
    }
  };

  const handleConfirmAcknowledge = async () => {
    if (!confirmModal) return;
    try {
      await axios.patch(`${API}/alerts/${confirmModal.alertId}/acknowledge`);
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          role: 'model',
          content: `✓ Alert \`${confirmModal.alertId}\` has been acknowledged successfully.`,
          chips: ['Acknowledged alert'],
        },
      ]);
    } catch (e) {
      alert('Failed to acknowledge alert');
    } finally {
      setConfirmModal(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed top-0 right-0 h-full w-96 z-50 bg-black/90 backdrop-blur-xl border-l border-cyan-500/30 shadow-2xl flex flex-col font-mono text-xs">
      {/* Header */}
      <div className="p-4 border-b border-white/10 flex items-center justify-between bg-cyan-950/20">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
          <h2 className="font-bold text-sm text-cyan-300 uppercase tracking-widest">
            Mission AI
          </h2>
          <span className="text-[10px] text-white/30 border border-white/10 px-1 rounded">
            Gemini 2.0
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setTtsEnabled(!ttsEnabled)}
            className={`text-sm p-1 rounded transition-colors ${
              ttsEnabled ? 'text-cyan-400 bg-cyan-900/40' : 'text-white/30 hover:text-white/60'
            }`}
            title="Toggle Text-To-Speech Output"
          >
            🔊
          </button>
          <button
            onClick={onClose}
            className="text-white/40 hover:text-white text-lg font-bold px-2"
          >
            ✕
          </button>
        </div>
      </div>

      {/* Confirmation Card Modal */}
      {confirmModal && (
        <div className="p-3 m-3 bg-yellow-900/40 border border-yellow-500/50 rounded-lg space-y-2 text-yellow-200">
          <div className="font-bold text-xs">⚠️ Confirmation Required</div>
          <p className="text-[11px] text-white/80">
            Mission AI requests to acknowledge Alert ID:{' '}
            <code className="text-yellow-300 font-bold">{confirmModal.alertId}</code>. Proceed?
          </p>
          <div className="flex gap-2 pt-1">
            <button
              onClick={handleConfirmAcknowledge}
              className="flex-1 py-1 bg-yellow-500/20 hover:bg-yellow-500/40 border border-yellow-500/50 text-yellow-300 rounded font-bold transition-colors"
            >
              Confirm Acknowledge
            </button>
            <button
              onClick={() => setConfirmModal(null)}
              className="px-3 py-1 bg-white/5 hover:bg-white/10 border border-white/20 text-white/60 rounded transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Message Stream */}
      <div className="flex-1 p-4 overflow-y-auto space-y-4">
        {messages.length === 0 && (
          <div className="space-y-4 text-center py-6">
            <div className="text-4xl">🛰️</div>
            <p className="text-white/40 text-xs">
              Welcome to Mission AI. Ask about satellite status, telemetry trends, pass predictions, or anomalies.
            </p>
            <div className="space-y-1.5 pt-2 text-left">
              <div className="text-[10px] text-cyan-400 uppercase tracking-wider font-bold">
                Suggested Questions
              </div>
              {SUGGESTED_PROMPTS.map((prompt, i) => (
                <button
                  key={i}
                  onClick={() => sendMessage(prompt)}
                  className="w-full text-left p-2 rounded bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 hover:text-white text-[11px] transition-colors"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((m) => (
          <div
            key={m.id}
            className={`flex flex-col ${
              m.role === 'user' ? 'items-end' : 'items-start'
            }`}
          >
            <div
              className={`max-w-[85%] rounded-lg p-3 text-xs leading-relaxed ${
                m.role === 'user'
                  ? 'bg-cyan-950/60 border border-cyan-500/40 text-cyan-100'
                  : 'bg-white/5 border border-white/10 text-white/90'
              }`}
            >
              {/* Tool Chips */}
              {m.chips && m.chips.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-2">
                  {m.chips.map((chip, idx) => (
                    <span
                      key={idx}
                      className="text-[10px] bg-cyan-900/40 text-cyan-300 border border-cyan-500/30 px-1.5 py-0.5 rounded font-mono flex items-center gap-1"
                    >
                      🔍 {chip}
                    </span>
                  ))}
                </div>
              )}

              {/* Message Content */}
              <div className="whitespace-pre-wrap">{m.content}</div>

              {m.isStreaming && (
                <span className="inline-block w-2 h-3 bg-cyan-400 ml-1 animate-pulse" />
              )}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input bar */}
      <div className="p-3 border-t border-white/10 bg-black/60 flex items-center gap-2">
        <button
          onClick={toggleSpeechRecognition}
          className={`p-2 rounded border text-sm transition-colors ${
            isListening
              ? 'bg-red-900/60 border-red-500/50 text-red-400 animate-pulse'
              : 'border-white/10 text-white/40 hover:text-white'
          }`}
          title="Voice Input (Web Speech API)"
        >
          🎙️
        </button>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
          placeholder="Ask Mission AI (or press A / Ctrl+J)..."
          disabled={isLoading}
          className="flex-1 bg-white/5 border border-white/10 rounded px-3 py-2 text-xs text-white placeholder-white/30 focus:outline-none focus:border-cyan-500/50"
        />
        <button
          onClick={() => sendMessage()}
          disabled={isLoading || !input.trim()}
          className="px-3 py-2 bg-cyan-500/20 hover:bg-cyan-500/40 border border-cyan-500/50 text-cyan-300 font-bold rounded text-xs transition-colors disabled:opacity-40"
        >
          Send
        </button>
      </div>
    </div>
  );
}

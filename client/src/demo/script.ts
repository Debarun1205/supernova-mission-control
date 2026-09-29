/**
 * Part 8 — Demo Mode Script
 * Scripted 90-second automated tour for hackathon presentations.
 */

export interface TourStep {
  step: number;
  atSecond: number;
  title: string;
  caption: string;
  presenterNote: string;
  actionType:
    | 'navigate'
    | 'focus_sat'
    | 'inject_fault'
    | 'open_ai'
    | 'clear_fault'
    | 'open_reports'
    | 'show_end';
  actionPayload?: any;
}

export const DEMO_SCRIPT: TourStep[] = [
  {
    step: 1,
    atSecond: 0,
    title: '1. Autonomous Mission Control System',
    caption: 'Welcome to Supernova Mission Control. Real-time SGP4 orbital propagation with 1 Hz physics telemetry.',
    presenterNote: 'Hook: "Space constellations are scaling 10x faster than ground operator teams. We built an autonomous mission control engine powered by physics and AI."',
    actionType: 'navigate',
    actionPayload: '/',
  },
  {
    step: 2,
    atSecond: 10,
    title: '2. Live Constellation Dashboard',
    caption: 'Flying into the 3D Command Console. Telemetry computes power SOC, first-order thermal, and ADCS pointing error in real time.',
    presenterNote: 'Point out: "Every satellite on the globe computes its battery state of charge from solar geometry and eclipse shadow entry."',
    actionType: 'navigate',
    actionPayload: '/console',
  },
  {
    step: 3,
    atSecond: 22,
    title: '3. Ground Station Pass & Comms Link',
    caption: 'ISS passing over Kolkata (UEM). Signal strength computed via Free-Space Path Loss (FSPL). Note: LOS is NOT an anomaly.',
    presenterNote: 'Key credibility point: "Scheduled loss of signal (LOS) between ground stations is nominal orbital physics — not a system anomaly."',
    actionType: 'focus_sat',
    actionPayload: { id: 25544 },
  },
  {
    step: 4,
    atSecond: 35,
    title: '4. Chaos Injection: Solar Particle Event',
    caption: 'Injecting X-class Solar Flare via Chaos Engine. Radiation dose rate spikes, triggering 4-layer anomaly detector.',
    presenterNote: 'Show judge: "We inject a live solar particle storm. The detector evaluates rules, hysteresis, EWMA z-score, and correlation."',
    actionType: 'inject_fault',
    actionPayload: { noradId: 25544, fault: 'solar_flare' },
  },
  {
    step: 5,
    atSecond: 48,
    title: '5. Mission AI Operator Briefing',
    caption: 'Mission AI (Gemini 2.0) analyzes multi-subsystem evidence and infers probable cause with grounded tool chips.',
    presenterNote: 'Highlight AI: "Mission AI doesn\'t hallucinate: it calls real tool functions to query telemetry history and recommend runbooks."',
    actionType: 'open_ai',
    actionPayload: "What is happening to the fleet and what should I check first?",
  },
  {
    step: 6,
    atSecond: 65,
    title: '6. Auto-Resolution & Recovery',
    caption: 'Undoing scenario injection. Condition clears, health score recovers to 100%, and open alerts auto-resolve with hysteresis.',
    presenterNote: 'Demonstrate lifecycle: "As soon as the physical condition clears, the incident auto-resolves without alert storms."',
    actionType: 'clear_fault',
    actionPayload: { noradId: 25544, fault: 'solar_flare' },
  },
  {
    step: 7,
    atSecond: 75,
    title: '7. AI Shift Handover Report',
    caption: 'Generating structured shift handover report with key events, fleet health trends, and printable PDF export.',
    presenterNote: 'Show operators value: "At shift end, Gemini synthesizes 8 hours of telemetry and alerts into a single handover document."',
    actionType: 'open_reports',
    actionPayload: '/reports',
  },
  {
    step: 8,
    atSecond: 85,
    title: '8. Architecture & Team Credits',
    caption: 'Supernova Space Hackathon 2026 · Built with React, Three.js, Node.js, Express, Socket.IO, MongoDB & Gemini 2.0.',
    presenterNote: 'Wrap up: "Thank you! Open source codebase available on GitHub."',
    actionType: 'show_end',
    actionPayload: null,
  },
];

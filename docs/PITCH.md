# Supernova Mission Control — 3-Minute Hackathon Pitch & Architecture

## 1. Executive Summary & Problem Statement

**The Problem:** Commercial and scientific satellite constellations are scaling 10× faster than ground operations teams. Human operators are overwhelmed by raw telemetry streams, alert storms during space weather events, and fragmented tools for pass predictions and anomaly diagnosis.

**The Solution:** **Supernova Mission Control** — an autonomous, physics-consistent satellite operations platform featuring:
1. **1 Hz Physics Engine:** Solar array charging sawtooth, first-order thermal dissipation, Free-Space Path Loss (FSPL) comms link budget, and ADCS pointing error.
2. **4-Layer Anomaly Detector:** Configurable rules with hysteresis and duration debounce, EWMA z-score statistical detection, rolling linear predictive time-to-threshold, and multi-alert incident correlation.
3. **Mission AI (Gemini 2.0):** An intelligent co-pilot that inspects live telemetry, queries pass predictions, generates proactive incident briefs, and drafts shift handover reports — with zero hallucinations via grounded tool calls.

---

## 2. Three-Minute Pitch Script

### Minute 1: The Problem & The Physics Insight
> *"Good morning judges! Today, satellite constellations are expanding exponentially. But traditional mission control software treats ground stations like server monitoring tools. They flag loss of signal (LOS) as a system crash, even when the satellite is simply over the horizon.*
>
> *We built Supernova Mission Control around a core physics insight: **LOS is not an anomaly — it's orbital mechanics.** Our 1 Hz simulation engine propagates real NORAD TLE orbits using SGP4, computes cylindrical Earth eclipse shadow entry, calculates solar panel charging sawtooth curves, and models thermal equilibrium in real time."*

### Minute 2: Live Anomaly Detection & Chaos Engine
> *"Let's show you what happens during a real space emergency. Through our Chaos Panel, we inject an X-class Solar Flare. Watch the NOAA Kp radiation index spike!*
>
> *Our 4-layer anomaly engine doesn't flood the operator with 50 separate alarms. First, hysteresis and duration debounce prevent alert flapping. Second, EWMA z-score statistical detection flags abnormal thermal drift. Third, predictive trend analysis warns that battery SOC will reach critical threshold in 11 minutes. Finally, our correlation engine groups co-occurring alerts into a single Incident with automated probable-cause diagnosis."*

### Minute 3: Mission AI Co-Pilot & Recovery
> *"Now we hand over to **Mission AI**, powered by Gemini 2.0. We ask: 'What is happening to the fleet and what should I check first?' Mission AI executes grounded function-calling tools — fetching live telemetry, reading the runbook, and flying the 3D camera straight to the affected satellite.*
>
> *When we clear the fault, the physical state recovers and the incident auto-resolves. At shift end, Gemini generates a complete handover report with a single click. Supernova Mission Control bridges orbital physics, real-time telemetry, and generative AI into the next generation of space operations."*

---

## 3. System Architecture Diagram

```mermaid
flowchart TD
    subgraph Data & Physics Layer
        TLE["CelesTrak / TLE Cache"] --> SGP4["satellite.js SGP4 Propagator"]
        SGP4 --> Orbit["Orbital Geometry & Eclipse Detection"]
        NOAA["NOAA SWPC API"] --> SpaceWeather["Space Weather Service (Kp, X-Ray)"]
        Orbit --> SimEngine["1 Hz Physics Simulation Engine\n(Power, Thermal, Comms, ADCS, Radiation)"]
        SpaceWeather --> SimEngine
    end

    subgraph Anomaly Detection Engine
        SimEngine --> Layer1["1. Rules Layer (Hysteresis & Debounce)"]
        SimEngine --> Layer2["2. Statistical Layer (EWMA & Z-Score)"]
        SimEngine --> Layer3["3. Predictive Layer (Linear Trend Time-to-Thresh)"]
        Layer1 --> Layer4["4. Correlation Layer (Incident Grouping & Probable Cause)"]
        Layer2 --> Layer4
        Layer3 --> Layer4
    end

    subgraph Persistence & Realtime Transport
        SimEngine --> Mongo["MongoDB Memory Server / Atlas"]
        Layer4 --> Mongo
        SimEngine --> SocketIO["Socket.IO Server (telemetry:batch, alert:new)"]
        Layer4 --> SocketIO
    end

    subgraph Client Application Shell
        SocketIO --> ReactStore["Zustand Store (useMissionStore)"]
        ReactStore --> R3FGlobe["3D React-Three-Fiber Earth Globe"]
        ReactStore --> TelemetryUI["Live Recharts Telemetry Panels"]
        ReactStore --> AlertCenter["Alert & Incident Center"]
    end

    subgraph Mission AI Operator (Gemini 2.0)
        GeminiSDK["@google/genai SDK"] --> FunctionCalling["11 Function-Calling Tools\n(get_telemetry, predict_passes, ui_focus_sat)"]
        FunctionCalling --> Mongo
        GeminiSDK --> SSEStream["SSE Chat Stream (/api/chat)"]
        SSEStream --> MissionAIDrawer["Mission AI Drawer & Voice Controls"]
    end
```

---

## 4. Honest Limitations & Engineering Transparency

We believe in complete engineering transparency with judges:

1. **Simulated Telemetry:** Fleet satellite telemetry (power SOC, temperatures, pointing error) is computed by our physics model based on real TLE positions and NOAA space weather. It represents realistic orbital physics, not real satellite telemetry downlinks.
2. **TLE Accuracy:** Orbit predictions use public two-line element (TLE) sets from CelesTrak. SGP4 propagation accuracy degrades over time and does not replace High-Precision Orbit Propagation (HPOP) used in classified operations.
3. **Screening-Level Conjunctions:** Conjunction close-approach calculations use Euclidean distance screening between TLE-propagated positions. Operational collision avoidance requires covariance matrix propagation and NASA CARA / Space-Track CDM files.
4. **Illustrative Runbooks:** The included response checklists (`runbooks.json`) demonstrate operator workflow integration. They are illustrative procedures designed for hackathon demonstration.

---

## 5. Team & Acknowledgments

- **Team Supernova** — UEM Kolkata Hackathon 2026
- **Repository:** `https://github.com/Debarun1205/supernova-mission-control`

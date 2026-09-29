# 🛰️ Supernova Mission Control

> **AI-Powered, Real-Time Physics-Consistent Satellite Operations Platform**  
> Built for **Supernova 30-Hour Space Hackathon 2026** (UEM Kolkata).

---

## 🌌 System Architecture

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
        SimEngine --> Layer5["5. ML Distance Score Layer"]
        Layer1 --> Layer4["4. Correlation Layer (Incident Grouping & Probable Cause)"]
        Layer2 --> Layer4
        Layer3 --> Layer4
        Layer5 --> Layer4
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

## ⚡ How Telemetry is Simulated (The Physics Thesis)

Unlike traditional dashboards that display random numbers, **Supernova Mission Control** computes simulated telemetry that is strictly consistent with orbital physics:

1. **Power Model:** Battery State of Charge (SOC) follows a realistic **sawtooth charging curve**. $P_{solar} = 150\text{ W} \times \text{sunlit\_fraction}$. In Earth's shadow (eclipse), solar charging drops to zero and the battery drains according to active satellite operational mode power loads.
2. **Thermal Model:** First-order thermal relaxation $T(t+dt) = T(t) + (T_{eq} - T(t)) \times (1 - e^{-dt/\tau})$. Temperatures swing between sunlit equilibrium ($\approx 20^\circ\text{C}$) and eclipse equilibrium ($\approx -5^\circ\text{C}$).
3. **Comms & Path Loss:** Computes Free-Space Path Loss (FSPL) for ground station look-angles:
   $$\text{FSPL (dB)} = 20\log_{10}(d) + 20\log_{10}(f) + 32.45$$
   **Scheduled Loss of Signal (LOS) is not an anomaly.** Alarms trigger only on unexpected telemetry drops while in line of sight.
4. **ADCS & Radiation:** Pointing errors and reaction wheel RPM drift; single-event upset (SEU) radiation counters spike during crossings of the **South Atlantic Anomaly (SAA)** and high NOAA Kp index storms.
5. **5-Layer Anomaly Detector:** Rules with hysteresis & duration debounce, EWMA statistical z-score, linear trend time-to-threshold estimation, ML distance score, and incident correlation grouping.

---

## 🛠️ Quickstart & Local Setup

### Prerequisites
- Node.js v20+
- npm v10+

### Option A: Local Development Mode (Offline with In-Memory DB)

```bash
# Clone repository
git clone https://github.com/Debarun1205/supernova-mission-control.git
cd supernova-mission-control

# Install dependencies
npm install

# Start development servers (Frontend: http://localhost:5173, Backend: http://localhost:3000)
npm run dev
```

### Option B: Docker Compose Deployment

```bash
docker compose up --build
```

---

## ⚙️ Environment Variables

| Variable | Description | Default |
|---|---|---|
| `PORT` | Backend Express port | `3000` |
| `USE_MEMORY_DB` | Run with offline MongoDB Memory Server | `true` |
| `MONGO_URI` | MongoDB connection URI | `mongodb://localhost:27017/mission-control` |
| `AI_API_KEY` | Google Gemini API key | `""` |
| `AI_MODEL` | Gemini model name | `gemini-2.0-flash` |
| `CLIENT_ORIGIN` | CORS allowed origin | `*` |

---

## 🧪 Running Unit Tests

```bash
npm exec vitest run server/src/__tests__
```

---

## 📜 License & Credits

- **CelesTrak:** Orbit TLE data & GP elements
- **NOAA SWPC:** Planetary Kp index & solar flare data
- **Team Supernova:** Built for Supernova Space Hackathon 2026, UEM Kolkata.

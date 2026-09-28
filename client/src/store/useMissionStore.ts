import { create } from 'zustand';

interface SpaceWeather {
  kp: number;
  xrayFlux: number;
  stormScale: number;
}

interface TelemetrySample {
  satelliteId: number;
  ts: string;
  power: { soc: number; solarCurrent: number; busVoltage: number };
  thermal: { batteryTemp: number; busTemp: number; payloadTemp: number };
  comms: { signalStrength: number; connectedStation: string; linkQuality: number; rangeKm: number };
  adcs: { pointingError: number; wheelSpeedRPM: number[]; angularRateDps: number };
  radiation: { seuCount: number; inSaa: boolean; doserate: number };
  mode: string;
  healthScore: number;
}

interface MissionStore {
  // Time
  simulationTime: number;
  timeSpeed: number;
  isLive: boolean;
  setSimulationTime: (t: number) => void;
  setTimeSpeed: (s: number) => void;
  setLive: (live: boolean) => void;

  // Selection
  selectedSatelliteId: number | null;
  setSelectedSatellite: (id: number | null) => void;

  // Live telemetry (keyed by noradId)
  latestTelemetry: Record<number, TelemetrySample>;
  setLatestTelemetry: (noradId: number, sample: TelemetrySample) => void;
  getTelemetry: (noradId: number) => TelemetrySample | undefined;

  // Space weather
  spaceWeather: SpaceWeather | null;
  setSpaceWeather: (w: SpaceWeather) => void;
}

export const useMissionStore = create<MissionStore>((set, get) => ({
  // Time defaults
  simulationTime: Date.now(),
  timeSpeed: 1,
  isLive: true,
  setSimulationTime: (t) => set({ simulationTime: t }),
  setTimeSpeed: (s) => set({ timeSpeed: s }),
  setLive: (live) => set({ isLive: live }),

  // Selection
  selectedSatelliteId: null,
  setSelectedSatellite: (id) => set({ selectedSatelliteId: id }),

  // Telemetry
  latestTelemetry: {},
  setLatestTelemetry: (noradId, sample) =>
    set((state) => ({
      latestTelemetry: { ...state.latestTelemetry, [noradId]: sample },
    })),
  getTelemetry: (noradId) => get().latestTelemetry[noradId],

  // Space weather
  spaceWeather: null,
  setSpaceWeather: (w) => set({ spaceWeather: w }),
}));

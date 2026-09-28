import { create } from 'zustand';

interface MissionState {
  simulationTime: number;
  timeSpeed: number;
  isLive: boolean;
  selectedSatelliteId: number | null;
  focusedLocation: { lat: number, lon: number } | null;
  setSimulationTime: (time: number) => void;
  setTimeSpeed: (speed: number) => void;
  setLive: (live: boolean) => void;
  setSelectedSatellite: (id: number | null) => void;
  setFocusedLocation: (loc: { lat: number, lon: number } | null) => void;
}

export const useMissionStore = create<MissionState>((set) => ({
  simulationTime: Date.now(),
  timeSpeed: 1,
  isLive: true,
  selectedSatelliteId: null,
  focusedLocation: null,
  setSimulationTime: (time) => set({ simulationTime: time }),
  setTimeSpeed: (speed) => set({ timeSpeed: speed }),
  setLive: (live) => set({ isLive: live, timeSpeed: 1 }),
  setSelectedSatellite: (id) => set({ selectedSatelliteId: id }),
  setFocusedLocation: (loc) => set({ focusedLocation: loc })
}));

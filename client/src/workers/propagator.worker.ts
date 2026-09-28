import * as comlink from 'comlink';
import * as satellite from 'satellite.js';

let satellites: any[] = [];
let satrecs: Map<number, satellite.SatRec> = new Map();

export const PropagatorWorker = {
  loadCatalogue(data: any[]) {
    satellites = data;
    satrecs.clear();
    for (const sat of data) {
      if (sat.tle1 && sat.tle2) {
        try {
          const rec = satellite.twoline2satrec(sat.tle1, sat.tle2);
          if (rec) satrecs.set(sat.noradId, rec);
        } catch (e) {
          // ignore parsing errors
        }
      }
    }
    return satrecs.size;
  },

  propagateAll(timeMs: number): Float32Array {
    const positions = new Float32Array(satrecs.size * 3);
    const date = new Date(timeMs);
    let i = 0;
    
    // SGP4 propagation for all objects
    for (const [id, satrec] of satrecs.entries()) {
      try {
        const pv = satellite.propagate(satrec, date);
        if (pv && pv.position && typeof pv.position !== 'boolean') {
          // R3F coordinate system: Y is up, X is right, Z is forward
          // ECI to scene coordinates (roughly scale down Earth radius 6371 to 10 for visuals)
          const earthRadiusScene = 10;
          const earthRadiusKm = 6371;
          const scale = earthRadiusScene / earthRadiusKm;
          
          const pos = pv.position as { x: number; y: number; z: number };
          positions[i * 3] = pos.x * scale;
          positions[i * 3 + 1] = pos.z * scale; // Map Z to Y
          positions[i * 3 + 2] = -pos.y * scale; // Map Y to -Z
        }
      } catch(e) {
         // skip
      }
      i++;
    }
    return positions;
  }
};

comlink.expose(PropagatorWorker);

import { Telemetry, Satellite } from '../models';
import pino from 'pino';
import * as satelliteJs from 'satellite.js'; // need to install satellite.js on server

const logger = pino({ transport: { target: 'pino-pretty' } });

export class Simulator {
  static async tick() {
    try {
      const fleet = await Satellite.find({ tier: 'fleet' });
      const now = new Date();
      
      const bulkOps = [];

      for (const sat of fleet) {
        // Dummy propagation & math for now
        // In full implementation, we use SGP4 + sun position
        
        let soc = 100; // Simulated battery
        let mode = 'nominal';
        let isSunlit = true; // Replace with actual eclipse check

        const t = new Telemetry({
          ts: now,
          satelliteId: sat.noradId,
          power: {
            soc: soc,
            solarCurrent: isSunlit ? 15 : 0,
            busVoltage: 28.1
          },
          thermal: {
            batteryTemp: isSunlit ? 20 : 5,
            busTemp: isSunlit ? 25 : 10,
            payloadTemp: 22
          },
          comms: {
            signalStrength: -90, // dBm
            connectedStation: 'none'
          },
          adcs: {
            pointingError: 0.1,
            wheelSpeedRPM: 3000
          },
          radiation: {
            seuCount: 0
          },
          mode
        });

        bulkOps.push({
          insertOne: {
            document: t
          }
        });
      }

      if (bulkOps.length > 0) {
        await Telemetry.bulkWrite(bulkOps);
      }
    } catch (e) {
      logger.error('Simulator tick failed', e);
    }
  }
}

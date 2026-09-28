import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { Satellite } from '../models/Satellite';
import pino from 'pino';

const logger = pino({ transport: { target: 'pino-pretty' } });

export class CelestrakService {
  static async fetchGroup(group: string) {
    try {
      const res = await axios.get(https://celestrak.org/NORAD/elements/gp.php?GROUP=&FORMAT=json);
      if (res.data && Array.isArray(res.data)) {
        return res.data;
      }
      throw new Error('Invalid format');
    } catch (error) {
      logger.error(Failed to fetch group  from Celestrak:, error);
      return null;
    }
  }

  static async syncGroups(groups: string[]) {
    logger.info('Starting Celestrak sync...');
    const snapshotPath = path.join(__dirname, '../../seed/tle-snapshot.json');
    let snapshotData: any[] = [];
    
    try {
      if (fs.existsSync(snapshotPath)) {
        snapshotData = JSON.parse(fs.readFileSync(snapshotPath, 'utf8'));
      }
    } catch (e) {
      logger.error('Failed to read snapshot fallback', e);
    }

    for (const group of groups) {
      let data = await this.fetchGroup(group);
      
      if (!data) {
        logger.warn(Using fallback data for group );
        data = snapshotData.filter(d => d.GROUP === group);
      } else {
        // Update snapshot with new data (simplified)
        // In a real scenario we'd merge cleanly
      }

      if (data && data.length > 0) {
        for (const item of data) {
          await Satellite.findOneAndUpdate(
            { noradId: item.NORAD_CAT_ID },
            {
              name: item.OBJECT_NAME,
              noradId: item.NORAD_CAT_ID,
              intlDesignator: item.OBJECT_ID,
              group: group,
              epoch: new Date(item.EPOCH),
              inclination: item.INCLINATION,
              period: item.PERIOD,
              apogee: item.APOGEE,
              perigee: item.PERIGEE,
              lastSyncedAt: new Date(),
              // Store full GP object for the worker
              tle1: item.TLE_LINE1, 
              tle2: item.TLE_LINE2
            },
            { upsert: true }
          );
        }
      }
    }
    logger.info('Celestrak sync complete.');
  }
}

"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CelestrakService = void 0;
const axios_1 = __importDefault(require("axios"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const Satellite_1 = require("../models/Satellite");
const pino_1 = __importDefault(require("pino"));
const logger = (0, pino_1.default)({ transport: { target: 'pino-pretty' } });
class CelestrakService {
    static async fetchGroup(group) {
        try {
            const res = await axios_1.default.get(`https://celestrak.org/NORAD/elements/gp.php?GROUP=${group}&FORMAT=json`);
            if (res.data && Array.isArray(res.data)) {
                return res.data;
            }
            throw new Error('Invalid format');
        }
        catch (error) {
            logger.error(`Failed to fetch group ${group} from Celestrak:`, error);
            return null;
        }
    }
    static async syncGroups(groups) {
        logger.info('Starting Celestrak sync...');
        const snapshotPath = path_1.default.join(__dirname, '../../seed/tle-snapshot.json');
        let snapshotData = [];
        try {
            if (fs_1.default.existsSync(snapshotPath)) {
                snapshotData = JSON.parse(fs_1.default.readFileSync(snapshotPath, 'utf8'));
            }
        }
        catch (e) {
            logger.error('Failed to read snapshot fallback', e);
        }
        for (const group of groups) {
            let data = await this.fetchGroup(group);
            if (!data) {
                logger.warn(`Using fallback data for group ${group}`);
                data = snapshotData.filter(d => d.GROUP === group);
            }
            else {
                // Update snapshot with new data (simplified)
                // In a real scenario we'd merge cleanly
            }
            if (data && data.length > 0) {
                for (const item of data) {
                    await Satellite_1.Satellite.findOneAndUpdate({ noradId: item.NORAD_CAT_ID }, {
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
                    }, { upsert: true });
                }
            }
        }
        logger.info('Celestrak sync complete.');
    }
}
exports.CelestrakService = CelestrakService;
//# sourceMappingURL=celestrak.js.map
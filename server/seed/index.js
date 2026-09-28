"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const dotenv_1 = __importDefault(require("dotenv"));
const models_1 = require("../src/models");
const pino_1 = __importDefault(require("pino"));
dotenv_1.default.config({ path: '../.env' });
const logger = (0, pino_1.default)({ transport: { target: 'pino-pretty' } });
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/mission-control';
const STATIONS = [
    { name: 'Kolkata (UEM)', lat: 22.5726, lon: 88.3639, elevationMask: 5 },
    { name: 'Bengaluru (ISTRAC)', lat: 13.0305, lon: 77.5091, elevationMask: 5 },
    { name: 'Svalbard', lat: 78.2232, lon: 15.6267, elevationMask: 5 },
    { name: 'Kourou', lat: 5.1597, lon: -52.6503, elevationMask: 5 },
    { name: 'Goldstone', lat: 35.426, lon: -116.89, elevationMask: 5 },
    { name: 'Canberra', lat: -35.401, lon: 148.981, elevationMask: 5 },
    { name: 'Madrid', lat: 40.429, lon: -4.249, elevationMask: 5 },
    { name: 'Wallops', lat: 37.9386, lon: -75.4573, elevationMask: 5 },
    { name: 'Fairbanks', lat: 64.973, lon: -147.52, elevationMask: 5 },
    { name: 'Santiago', lat: -33.15, lon: -70.66, elevationMask: 5 }
];
const FLEET_IDS = [25544, 20580, 25994, 27424, 39084, 49260, 40697, 42063, 33591, 37849, 41866, 48274];
async function seed() {
    await mongoose_1.default.connect(MONGO_URI);
    logger.info('Connected to Mongo for seeding...');
    await models_1.GroundStation.deleteMany({});
    await models_1.GroundStation.insertMany(STATIONS);
    logger.info('Inserted ground stations.');
    // Mark fleet satellites in DB
    await models_1.Satellite.updateMany({ noradId: { $in: FLEET_IDS } }, { tier: 'fleet' });
    logger.info('Marked fleet satellites.');
    mongoose_1.default.disconnect();
    logger.info('Done seeding.');
}
seed().catch(console.error);
//# sourceMappingURL=index.js.map
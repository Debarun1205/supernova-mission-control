import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Satellite, GroundStation } from '../src/models';
import pino from 'pino';

dotenv.config({ path: '../.env' });
const logger = pino({ transport: { target: 'pino-pretty' } });
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
  await mongoose.connect(MONGO_URI);
  logger.info('Connected to Mongo for seeding...');

  await GroundStation.deleteMany({});
  await GroundStation.insertMany(STATIONS);
  logger.info('Inserted ground stations.');

  // Mark fleet satellites in DB
  await Satellite.updateMany({ noradId: { $in: FLEET_IDS } }, { tier: 'fleet' });
  logger.info('Marked fleet satellites.');

  mongoose.disconnect();
  logger.info('Done seeding.');
}

seed().catch(console.error);

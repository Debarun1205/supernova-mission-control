import express from 'express';
import http from 'http';
import { Server as SocketIO } from 'socket.io';
import mongoose from 'mongoose';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import pino from 'pino';
import cron from 'node-cron';

import { MongoMemoryServer } from 'mongodb-memory-server';
import { GroundStation, Satellite } from './models/index.js';
import apiRoutes from './routes/api.js';

dotenv.config({ path: '../.env' });

const logger = pino({ transport: { target: 'pino-pretty' } });
const app = express();
const server = http.createServer(app);

export const io = new SocketIO(server, {
  cors: { origin: process.env.CLIENT_ORIGIN || '*' },
});

app.use(helmet());
app.use(cors({ origin: process.env.CLIENT_ORIGIN || '*' }));
app.use(express.json());
app.use('/api', apiRoutes);

// ─── Seeding ──────────────────────────────────────────────────────────────────
const ISS_TLE1 = '1 25544U 98067A   24001.50000000  .00007000  00000-0  13000-3 0  9993';
const ISS_TLE2 = '2 25544  51.6400 100.0000 0001234  10.0000 350.0000 15.50000000123456';
const HST_TLE1 = '1 20580U 90037B   24001.50000000  .00002000  00000-0  10000-3 0  9990';
const HST_TLE2 = '2 20580  28.4700 200.0000 0002500  20.0000 340.0000 15.09000000123457';
const TERRA_TLE1 = '1 25994U 99068A   24001.50000000  .00000500  00000-0  80000-4 0  9998';
const TERRA_TLE2 = '2 25994  98.2000 250.0000 0001000   5.0000 355.0000 14.57000000123458';

async function seedIfEmpty() {
  const gsCount = await GroundStation.countDocuments();
  if (gsCount === 0) {
    await GroundStation.insertMany([
      { name: 'Kolkata (UEM)', lat: 22.5726, lon: 88.3639, elevationMask: 5 },
      { name: 'Svalbard', lat: 78.2293, lon: 15.4076, elevationMask: 5 },
      { name: 'McMurdo', lat: -77.851, lon: 166.667, elevationMask: 5 },
    ]);
    logger.info('Ground stations seeded');
  }

  const satCount = await Satellite.countDocuments();
  if (satCount === 0) {
    await Satellite.insertMany([
      { noradId: 25544, name: 'ISS (ZARYA)', tier: 'fleet', health: 'nominal', tle1: ISS_TLE1, tle2: ISS_TLE2 },
      { noradId: 20580, name: 'HST', tier: 'fleet', health: 'nominal', tle1: HST_TLE1, tle2: HST_TLE2 },
      { noradId: 25994, name: 'Terra', tier: 'fleet', health: 'nominal', tle1: TERRA_TLE1, tle2: TERRA_TLE2 },
    ]);
    logger.info('Fleet satellites seeded');
  }
}

// ─── Boot ─────────────────────────────────────────────────────────────────────
async function startServer() {
  let mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/mission-control';
  let memSrv: MongoMemoryServer | null = null;

  if (process.env.USE_MEMORY_DB === 'true') {
    logger.info('Using MongoDB Memory Server...');
    memSrv = await MongoMemoryServer.create();
    mongoUri = memSrv.getUri();
  }

  await mongoose.connect(mongoUri);
  logger.info(`Connected to MongoDB at ${mongoUri}`);

  await seedIfEmpty();

  // Lazy-import to avoid circular dependency before io is set up
  const { initSimulator, simTick } = await import('./simulation/index.js');
  const { pollSpaceWeather } = await import('./services/spaceWeather.js');

  await initSimulator();
  logger.info('Physics simulator initialised');

  // 1 Hz simulation tick
  cron.schedule('* * * * * *', () => simTick());

  // Space weather poll every 5 minutes
  cron.schedule('*/5 * * * *', () => pollSpaceWeather());
  pollSpaceWeather(); // initial fetch

  // Socket room management
  io.on('connection', (socket) => {
    logger.info({ socketId: socket.id }, 'Client connected');
    socket.on('subscribe:satellite', (noradId: number) => {
      socket.join(`sat:${noradId}`);
    });
    socket.on('unsubscribe:satellite', (noradId: number) => {
      socket.leave(`sat:${noradId}`);
    });
    socket.on('disconnect', () => {
      logger.info({ socketId: socket.id }, 'Client disconnected');
    });
  });

  const PORT = process.env.PORT || 3000;
  server.listen(PORT, () => {
    logger.info(`Server running on port ${PORT}`);
  });
}

startServer().catch((err) => {
  logger.error(err, 'Fatal: server failed to start');
  process.exit(1);
});

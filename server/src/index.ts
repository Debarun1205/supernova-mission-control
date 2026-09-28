import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import mongoose from 'mongoose';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import pino from 'pino';
import cron from 'node-cron';
import apiRoutes from './routes/api';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { GroundStation, Satellite, Telemetry } from './models';
import { Simulator } from './simulation';
import { CelestrakService } from './services/celestrak';

dotenv.config({ path: '../.env' });

const logger = pino({ transport: { target: 'pino-pretty' } });
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: process.env.CLIENT_ORIGIN || '*' }
});

app.use(helmet());
app.use(cors({ origin: process.env.CLIENT_ORIGIN || '*' }));
app.use(express.json());

app.use('/api', apiRoutes);

app.get('/api/status', (req, res) => {
  res.json({
    db: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    socketClients: io.engine.clientsCount,
    ai: process.env.AI_API_KEY ? 'available' : 'offline',
  });
});

const PORT = process.env.PORT || 3000;

async function seedIfEmpty() {
  const count = await GroundStation.countDocuments();
  if (count === 0) {
    logger.info('DB is empty, seeding...');
    const STATIONS = [
      { name: 'Kolkata (UEM)', lat: 22.5726, lon: 88.3639, elevationMask: 5 }
    ];
    await GroundStation.insertMany(STATIONS);
    const FLEET_IDS = [25544, 20580];
    await Satellite.insertMany(FLEET_IDS.map(id => ({
      name: `Sat ${id}`,
      noradId: id,
      tier: 'fleet',
      health: 'nominal',
      tle1: "1 25544U 98067A   24001.12345678  .00012345  00000-0  12345-3 0  9992",
      tle2: "2 25544  51.6400  12.3456 0001234  12.3456  12.3456 15.50000000123456"
    })));
  }
}

async function startServer() {
  let mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/mission-control';
  let memoryServer: MongoMemoryServer | null = null;
  
  if (process.env.USE_MEMORY_DB === 'true') {
    logger.info('Using MongoDB Memory Server...');
    memoryServer = await MongoMemoryServer.create();
    mongoUri = memoryServer.getUri();
  }

  mongoose.connect(mongoUri)
    .then(async () => {
      logger.info(`Connected to MongoDB at ${mongoUri}`);
      if (process.env.USE_MEMORY_DB === 'true') {
         try {
           await seedIfEmpty();
         } catch(e) {
           console.error("SEEDING ERROR", e);
         }
      }
      
      // Start simulator
      cron.schedule('* * * * * *', () => {
        Simulator.tick();
      });

      server.listen(PORT, () => {
        logger.info(`Server running on port ${PORT}`);
      });
    })
    .catch(err => {
      console.error('Failed to connect to MongoDB', err);
    });
}

startServer();

import { Router } from 'express';
import { Satellite, Telemetry, Alert, Incident, GroundStation } from '../models';

const router = Router();

router.get('/satellites', async (req, res) => {
  const { tier, group, health, limit = 100 } = req.query;
  const filter: any = {};
  if (tier) filter.tier = tier;
  if (group) filter.group = group;
  if (health) filter.health = health;
  
  const sats = await Satellite.find(filter).limit(Number(limit));
  res.json(sats);
});

router.get('/satellites/:id', async (req, res) => {
  const sat = await Satellite.findOne({ noradId: req.params.id });
  if (!sat) return res.status(404).json({ error: 'Not found' });
  res.json(sat);
});

router.get('/ground-stations', async (req, res) => {
  const stations = await GroundStation.find();
  res.json(stations);
});

export default router;

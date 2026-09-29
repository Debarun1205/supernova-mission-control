import { describe, it, expect } from 'vitest';
import {
  clamp,
  fspl,
  isInSaa,
  MODE_LOAD_W,
} from '../../../shared/physics/index.ts';
import { isInEclipse } from '../services/orbital.js';

describe('Physics Engine & Orbital Math Unit Tests', () => {
  it('clamp function restricts numbers within bounds', () => {
    expect(clamp(150, 0, 100)).toBe(100);
    expect(clamp(-20, 0, 100)).toBe(0);
    expect(clamp(50, 0, 100)).toBe(50);
  });

  it('Free-Space Path Loss (FSPL) computes realistic RF attenuation', () => {
    // 500 km range at 437.5 MHz UHF
    const loss500km = fspl(500, 437.5);
    expect(loss500km).toBeGreaterThan(130);
    expect(loss500km).toBeLessThan(145);

    // Further range = higher loss
    const loss1000km = fspl(1000, 437.5);
    expect(loss1000km).toBeGreaterThan(loss500km);
  });

  it('South Atlantic Anomaly (SAA) ray-casting correctly identifies coordinate bounds', () => {
    // Coordinate inside SAA (-30° Lat, -40° Lon)
    expect(isInSaa(-30, -40)).toBe(true);

    // Coordinate outside SAA (Kolkata: 22.57° N, 88.36° E)
    expect(isInSaa(22.57, 88.36)).toBe(false);
  });

  it('Mode load powers are strictly defined', () => {
    expect(MODE_LOAD_W.nominal).toBe(180);
    expect(MODE_LOAD_W.safe).toBe(80);
    expect(MODE_LOAD_W.contact).toBe(220);
    expect(MODE_LOAD_W.payload_ops).toBe(280);
  });

  it('Cylindrical eclipse shadow detection accurately identifies sunlit vs eclipse', () => {
    // Satellite directly behind Earth along Sun vector
    const sunPos = { x: 149597870, y: 0, z: 0 }; // Sun along +X
    const satInShadow = { x: -7000, y: 0, z: 0 }; // Sat along -X behind Earth (Radius ~6371km)
    const satInSunlight = { x: 7000, y: 0, z: 0 }; // Sat along +X towards Sun

    expect(isInEclipse(satInShadow, sunPos)).toBe(true);
    expect(isInEclipse(satInSunlight, sunPos)).toBe(false);
  });
});

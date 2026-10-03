/**
 * SatelliteZoomOverlay — appears when the user zooms very close to Earth.
 *
 * Uses free Esri World Imagery tiles (no API key required).
 * A 3×3 grid of satellite tiles is rendered inside a circular "porthole"
 * overlay that fades in smoothly as the camera approaches the globe.
 *
 * Architecture:
 *   • SatelliteZoomBridge  — rendered inside the R3F <Canvas>
 *                            reads camera.position.length() every frame
 *                            and lifts state up via onState() callback.
 *   • SatelliteOverlayView — rendered outside the Canvas as a sibling <div>
 *                            displays the tile mosaic + HUD label.
 */

import React from 'react';
import { useThree, useFrame } from '@react-three/fiber';

// Globe radius in R3F units = 10.
// ZOOM_THRESHOLD: distance below which overlay is fully visible.
// FADE_OUT_THRESHOLD: distance above which overlay is completely hidden.
const ZOOM_THRESHOLD = 12.5;
const FADE_OUT_THRESHOLD = 15.0;

// ── Coordinate helpers ────────────────────────────────────────────────────────

/** Convert R3F camera world position to approximate lat/lon on globe surface */
function cameraToLatLon(x: number, y: number, z: number): { lat: number; lon: number } {
  const len = Math.sqrt(x * x + y * y + z * z);
  const dx = x / len;
  const dy = y / len;
  const dz = z / len;
  // In Three.js: Y is up, X is right, -Z is into screen
  const lat = (Math.asin(dy) * 180) / Math.PI;
  const lon = (Math.atan2(-dz, dx) * 180) / Math.PI;
  return { lat, lon };
}

/** Clamp value between min and max */
function clamp(v: number, min: number, max: number): number {
  return Math.min(Math.max(v, min), max);
}

/** Map camera distance to Esri tile zoom level */
function distToTileZoom(dist: number): number {
  if (dist < 10.8) return 15;
  if (dist < 11.5) return 13;
  if (dist < 12.5) return 11;
  if (dist < 13.5) return 9;
  return 7;
}

/** XYZ tile from lat/lon/zoom */
function latLonToTileXY(lat: number, lon: number, zoom: number): { x: number; y: number } {
  const n = Math.pow(2, zoom);
  const x = Math.floor(((lon + 180) / 360) * n);
  const latRad = (lat * Math.PI) / 180;
  const y = Math.floor(((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) * n);
  return { x: clamp(x, 0, n - 1), y: clamp(y, 0, n - 1) };
}

/** Build a 3×3 grid of Esri satellite tile URLs around the centre lat/lon */
function buildTileGrid(lat: number, lon: number, zoom: number) {
  const { x: cx, y: cy } = latLonToTileXY(lat, lon, zoom);
  const max = Math.pow(2, zoom) - 1;
  const tiles: Array<{ url: string; key: string }> = [];
  for (let dy = -1; dy <= 1; dy++) {
    for (let dx = -1; dx <= 1; dx++) {
      const tx = clamp(cx + dx, 0, max);
      const ty = clamp(cy + dy, 0, max);
      tiles.push({
        // Esri World Imagery — free public access, no API key
        url: `https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/${zoom}/${ty}/${tx}`,
        key: `${zoom}-${tx}-${ty}`,
      });
    }
  }
  return tiles;
}

// ── Shared state type ─────────────────────────────────────────────────────────

export interface SatZoomState {
  visible: boolean;
  opacity: number;
  lat: number;
  lon: number;
  zoom: number;
}

// ── Bridge (inside Canvas) ────────────────────────────────────────────────────

/**
 * Must be rendered as a child of <Canvas>.
 * Each frame it reads the camera position and calls onState() with the new state.
 */
export function SatelliteZoomBridge({ onState }: { onState: (s: SatZoomState) => void }) {
  const { camera } = useThree();

  useFrame(() => {
    const dist = camera.position.length();
    const opacity = clamp(
      (FADE_OUT_THRESHOLD - dist) / (FADE_OUT_THRESHOLD - ZOOM_THRESHOLD),
      0,
      1,
    );
    const visible = opacity > 0;
    const { lat, lon } = cameraToLatLon(camera.position.x, camera.position.y, camera.position.z);
    const zoom = distToTileZoom(dist);
    onState({ visible, opacity, lat, lon, zoom });
  });

  return null;
}

// ── View (outside Canvas) ─────────────────────────────────────────────────────

/**
 * Renders the satellite imagery porthole overlay.
 * Must be a sibling of (not inside) the <Canvas>.
 */
export function SatelliteOverlayView({ state }: { state: SatZoomState }) {
  if (state.opacity <= 0) return null;

  const tiles = buildTileGrid(state.lat, state.lon, state.zoom);
  const ns = state.lat >= 0 ? 'N' : 'S';
  const ew = state.lon >= 0 ? 'E' : 'W';

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 20,
        pointerEvents: 'none',
        opacity: state.opacity,
        transition: 'opacity 0.5s ease',
      }}
    >
      {/* Circular satellite porthole */}
      <div
        style={{
          position: 'absolute',
          width: '52vmin',
          height: '52vmin',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gridTemplateRows: 'repeat(3, 1fr)',
          borderRadius: '50%',
          overflow: 'hidden',
          boxShadow:
            '0 0 0 2px rgba(0,200,255,0.4), 0 0 60px rgba(0,200,255,0.15), inset 0 0 20px rgba(0,0,0,0.4)',
        }}
      >
        {tiles.map(({ url, key }) => (
          <img
            key={key}
            src={url}
            alt=""
            draggable={false}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ))}
      </div>

      {/* Crosshair */}
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          width: 24,
          height: 24,
          transform: 'translate(-50%, -50%)',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: 0,
            right: 0,
            height: 1,
            background: 'rgba(0,220,255,0.7)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            left: '50%',
            top: 0,
            bottom: 0,
            width: 1,
            background: 'rgba(0,220,255,0.7)',
          }}
        />
      </div>

      {/* HUD label */}
      <div
        style={{
          position: 'absolute',
          bottom: '11%',
          left: '50%',
          transform: 'translateX(-50%)',
          fontFamily: 'monospace',
          fontSize: 10,
          color: 'rgba(0,220,255,0.9)',
          background: 'rgba(0,0,0,0.65)',
          padding: '3px 12px',
          borderRadius: 4,
          border: '1px solid rgba(0,200,255,0.25)',
          whiteSpace: 'nowrap',
          backdropFilter: 'blur(6px)',
        }}
      >
        🛰️ SATELLITE VIEW · {Math.abs(state.lat).toFixed(4)}°{ns}{' '}
        {Math.abs(state.lon).toFixed(4)}°{ew} · Zoom {state.zoom} ·{' '}
        <span style={{ color: '#4ade80' }}>ESRI WORLD IMAGERY</span>
      </div>
    </div>
  );
}

/**
 * Part 4 — Socket.IO hook for real-time telemetry
 */
import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useMissionStore } from '../store/useMissionStore';

const SOCKET_URL = 'http://localhost:3000';

let socketInstance: Socket | null = null;

function getSocket(): Socket {
  if (!socketInstance) {
    socketInstance = io(SOCKET_URL, { reconnectionDelay: 1000, timeout: 5000 });
  }
  return socketInstance;
}

export function useTelemetrySocket() {
  const setLatestTelemetry = useMissionStore((s) => s.setLatestTelemetry);
  const setSpaceWeather = useMissionStore((s) => s.setSpaceWeather);

  useEffect(() => {
    const socket = getSocket();

    socket.on('telemetry:batch', (samples: any[]) => {
      for (const sample of samples) {
        setLatestTelemetry(sample.satelliteId, sample);
      }
    });

    socket.on('weather:update', (data: any) => {
      setSpaceWeather(data);
    });

    socket.on('connect', () => {
      console.log('[socket] connected');
    });

    socket.on('disconnect', () => {
      console.log('[socket] disconnected');
    });

    return () => {
      socket.off('telemetry:batch');
      socket.off('weather:update');
    };
  }, []);

  return { socket: getSocket() };
}

/** Subscribe to per-satellite high-rate telemetry (call from detail pages) */
export function subscribeToSatellite(noradId: number, cb: (sample: any) => void) {
  const socket = getSocket();
  socket.emit('subscribe:satellite', noradId);
  socket.on('telemetry:detail', cb);
  return () => {
    socket.emit('unsubscribe:satellite', noradId);
    socket.off('telemetry:detail', cb);
  };
}

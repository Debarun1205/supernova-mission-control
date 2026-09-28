import * as satellite from 'satellite.js';

export function propagate(tle1: string, tle2: string, date: Date) {
  const satrec = satellite.twoline2satrec(tle1, tle2);
  const positionAndVelocity = satellite.propagate(satrec, date);
  const gmst = satellite.gstime(date);
  
  if (positionAndVelocity.position && typeof positionAndVelocity.position !== 'boolean') {
    const positionEci = positionAndVelocity.position;
    const positionGd = satellite.eciToGeodetic(positionEci, gmst);
    const velocityEci = positionAndVelocity.velocity as satellite.EciVec3<number>;
    
    return {
      lat: satellite.degreesLat(positionGd.latitude),
      lon: satellite.degreesLong(positionGd.longitude),
      alt: positionGd.height,
      velocity: Math.sqrt(velocityEci.x ** 2 + velocityEci.y ** 2 + velocityEci.z ** 2),
      eci: positionEci
    };
  }
  return null;
}

"use strict";
/**
 * Shared physics constants and types for Part 4.
 * Used by both server simulation and client display.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.MODE_LOAD_W = exports.SAA_POLYGON = exports.EARTH_RADIUS_KM = void 0;
exports.isInSaa = isInSaa;
exports.clamp = clamp;
exports.fspl = fspl;
exports.EARTH_RADIUS_KM = 6371;
/** South Atlantic Anomaly bounding polygon (approximate) */
exports.SAA_POLYGON = [
    [-90, -20], [-90, -60], [-30, -60], [10, -20], [10, 0], [-50, 0], [-90, -20],
];
/** Power loads per mode (W) */
exports.MODE_LOAD_W = {
    nominal: 180,
    safe: 80,
    eclipse: 160,
    contact: 220,
    payload_ops: 280,
};
/** Check if a lat/lon point is inside the SAA polygon (ray-casting) */
function isInSaa(lat, lon) {
    const poly = exports.SAA_POLYGON;
    let inside = false;
    for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
        const [xi, yi] = poly[i];
        const [xj, yj] = poly[j];
        const intersect = yi > lat !== yj > lat && lon < ((xj - xi) * (lat - yi)) / (yj - yi) + xi;
        if (intersect)
            inside = !inside;
    }
    return inside;
}
/** Clamp a value between min and max */
function clamp(v, min, max) {
    return Math.max(min, Math.min(max, v));
}
/** Compute free-space path loss (dB) */
function fspl(rangeKm, freqMHz = 437) {
    return 20 * Math.log10(rangeKm) + 20 * Math.log10(freqMHz) + 32.45;
}
//# sourceMappingURL=index.js.map
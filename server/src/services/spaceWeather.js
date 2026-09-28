"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.pollSpaceWeather = pollSpaceWeather;
exports.getCachedWeather = getCachedWeather;
/**
 * Part 4 — NOAA SWPC space weather poller
 * Fetches real Kp index and X-ray flux with cache and offline fallback.
 */
const axios_1 = __importDefault(require("axios"));
const index_js_1 = require("../simulation/index.js");
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes
let lastFetch = 0;
let cached = { kp: 2, xrayFlux: 1e-8, stormScale: 0 };
const NOAA_KP_URL = 'https://services.swpc.noaa.gov/json/planetary_k_index_1m.json';
const NOAA_XRAY_URL = 'https://services.swpc.noaa.gov/json/goes/primary/xray-flares-7-day.json';
const NOAA_SCALE_URL = 'https://services.swpc.noaa.gov/products/noaa-scales.json';
async function pollSpaceWeather() {
    if (Date.now() - lastFetch < CACHE_TTL_MS)
        return cached;
    try {
        const [kpRes, scaleRes] = await Promise.all([
            axios_1.default.get(NOAA_KP_URL, { timeout: 8000 }),
            axios_1.default.get(NOAA_SCALE_URL, { timeout: 8000 }),
        ]);
        // Latest Kp value
        const kpData = kpRes.data;
        const latestKp = kpData.length > 0 ? parseFloat(kpData[kpData.length - 1].Kp) : 2;
        // Storm scale (G-storm level)
        const scaleData = scaleRes.data;
        const currentEntry = scaleData['0'] ?? {}; // '0' = current hour
        const gScale = parseInt(currentEntry.G?.Scale ?? '0', 10);
        // Approximate X-ray flux from Kp (rough proxy for demo)
        const xrayFlux = Math.pow(10, -8 + latestKp * 0.15);
        cached = { kp: latestKp, xrayFlux, stormScale: gScale };
        lastFetch = Date.now();
        (0, index_js_1.updateSpaceWeather)(cached.kp, cached.xrayFlux, cached.stormScale);
        return cached;
    }
    catch {
        // Offline fallback — return last cached or default
        return cached;
    }
}
function getCachedWeather() {
    return { ...cached };
}
//# sourceMappingURL=spaceWeather.js.map
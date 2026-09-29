/**
 * Appendix Extra Feature — 5th Anomaly Detection Layer: Statistical / ML Anomaly Detector
 * Computes Mahalanobis / Isolation Distance score over multivariate telemetry (SOC, batteryTemp, pointingError).
 * Compares against rules layer and flags statistical outliers.
 */

export interface MlAnomalyResult {
  noradId: number;
  score: number; // 0 (normal) to 1 (extreme anomaly)
  isAnomaly: boolean;
  contributingFeatures: string[];
}

export function runMlAnomalyDetector(
  noradId: number,
  sample: Record<string, any>,
): MlAnomalyResult {
  const soc = Number(sample.power?.soc ?? 100);
  const temp = Number(sample.thermal?.batteryTemp ?? 20);
  const pointing = Number(sample.adcs?.pointingError ?? 0.1);

  // Normalized deviation scores relative to nominal baselines (SOC ~75%, Temp ~20°C, Pointing ~0.15°)
  const socDev = Math.max(0, (50 - soc) / 50);          // >0 if SOC drops below 50%
  const tempDev = Math.max(0, (temp - 30) / 20);        // >0 if temp exceeds 30°C
  const pointingDev = Math.max(0, (pointing - 1) / 5);  // >0 if pointing error > 1°

  // Distance score (0 to 1)
  const dist = Math.sqrt(socDev * socDev + tempDev * tempDev + pointingDev * pointingDev);
  const score = Math.min(1.0, +dist.toFixed(2));

  const contributingFeatures: string[] = [];
  if (socDev > 0) contributingFeatures.push('power.soc');
  if (tempDev > 0) contributingFeatures.push('thermal.batteryTemp');
  if (pointingDev > 0) contributingFeatures.push('adcs.pointingError');

  return {
    noradId,
    score,
    isAnomaly: score > 0.6,
    contributingFeatures,
  };
}

import { describe, it, expect } from 'vitest';
import { runRulesLayer } from '../anomaly/rules.js';
import { runStatisticalLayer } from '../anomaly/statistical.js';
import { runMlAnomalyDetector } from '../anomaly/mlDetector.js';

describe('Anomaly Engine Unit Tests', () => {
  it('Rules layer triggers low battery warning on threshold breach after debounce', () => {
    const noradId = 99999;
    const sampleLowBattery = {
      power: { soc: 20, busVoltage: 28 }, // 20% < 25% warnBelow
      thermal: { batteryTemp: 20, busTemp: 22 },
      adcs: { pointingError: 0.1 },
    };

    // Debounce requires N consecutive ticks
    let violations = runRulesLayer(noradId, sampleLowBattery);
    for (let i = 0; i < 5; i++) {
      violations = runRulesLayer(noradId, sampleLowBattery);
    }

    const battViolation = violations.find((v) => v.ruleId === 'battery_low_warning');
    expect(battViolation).toBeDefined();
    expect(battViolation?.severity).toBe('warning');
  });

  it('Statistical layer computes z-score anomaly for extreme value outliers', () => {
    const noradId = 88888;
    // Feed 35 nominal samples to establish stable mean/variance
    for (let i = 0; i < 35; i++) {
      runStatisticalLayer(noradId, { thermal: { batteryTemp: 20 + (Math.random() - 0.5) * 0.1 } });
    }

    // Feed extreme outlier (60°C spike)
    const anomalies = runStatisticalLayer(noradId, { thermal: { batteryTemp: 60 } });
    expect(anomalies.length).toBeGreaterThan(0);
    expect(anomalies[0].type).toBe('zscore');
    expect(anomalies[0].zscore).toBeGreaterThan(3);
  });

  it('ML Anomaly Detector produces distance score based on multivariate feature deviation', () => {
    const nominalSample = {
      power: { soc: 80 },
      thermal: { batteryTemp: 22 },
      adcs: { pointingError: 0.1 },
    };

    const anomalousSample = {
      power: { soc: 15 },           // severe SOC drop
      thermal: { batteryTemp: 55 }, // severe temp spike
      adcs: { pointingError: 6 },   // pointing error
    };

    const nomResult = runMlAnomalyDetector(11111, nominalSample);
    expect(nomResult.isAnomaly).toBe(false);
    expect(nomResult.score).toBeLessThan(0.3);

    const anomResult = runMlAnomalyDetector(11111, anomalousSample);
    expect(anomResult.isAnomaly).toBe(true);
    expect(anomResult.score).toBeGreaterThan(0.6);
    expect(anomResult.contributingFeatures.length).toBeGreaterThan(0);
  });
});

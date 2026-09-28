/**
 * Part 5 — Predictive Layer
 * Linear trend time-to-threshold estimation.
 * Returns predicted alerts labelled 'predicted'.
 */
export interface PredictedAlert {
    parameter: string;
    label: string;
    currentValue: number;
    thresholdValue: number;
    minutesToThreshold: number;
    severity: 'warning' | 'critical';
    predicted: true;
}
export declare function runPredictiveLayer(noradId: number, sample: Record<string, any>): PredictedAlert[];
//# sourceMappingURL=predictive.d.ts.map
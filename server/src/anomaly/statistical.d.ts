/**
 * Part 5 — Statistical Layer
 * EWMA + z-score + rate-of-change detection for "abnormal but within limits" behaviour.
 */
export interface StatAnomaly {
    parameter: string;
    type: 'zscore' | 'rate_of_change';
    value: number;
    zscore?: number;
    ratePerMin?: number;
    severity: 'warning';
    label: string;
}
export declare function runStatisticalLayer(noradId: number, sample: Record<string, any>): StatAnomaly[];
//# sourceMappingURL=statistical.d.ts.map
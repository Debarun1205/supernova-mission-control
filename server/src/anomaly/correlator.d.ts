import type { RuleViolation } from './rules.js';
export declare function runCorrelationLayer(noradId: number, violations: RuleViolation[], sample: Record<string, any>): Promise<void>;
/** Auto-resolve alerts when condition clears (called from detector) */
export declare function autoResolveAlerts(noradId: number, resolvedRuleIds: string[]): Promise<void>;
/** Health rollup: worst open alert severity for a satellite */
export declare function computeSatelliteHealth(noradId: number): Promise<'nominal' | 'warning' | 'critical'>;
//# sourceMappingURL=correlator.d.ts.map
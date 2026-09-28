export interface RuleViolation {
    ruleId: string;
    label: string;
    severity: 'warning' | 'critical';
    parameter: string;
    value: number;
    threshold: number;
}
export declare function runRulesLayer(noradId: number, sample: Record<string, any>): RuleViolation[];
export declare function getActiveRules(noradId: number): string[];
//# sourceMappingURL=rules.d.ts.map
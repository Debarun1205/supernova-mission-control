/**
 * Part 5 — Rules Layer
 * Threshold-based anomaly detection with hysteresis and duration debounce.
 */
import thresholds from './thresholds.json' assert { type: 'json' };

export interface RuleViolation {
  ruleId: string;
  label: string;
  severity: 'warning' | 'critical';
  parameter: string;
  value: number;
  threshold: number;
}

// Per-satellite debounce state: ruleId -> consecutive violation ticks
const debounceCounters = new Map<string, Map<string, number>>();
// Per-satellite active state: ruleId -> current severity (for hysteresis)
const activeState = new Map<string, Map<string, 'warning' | 'critical' | null>>();

function getDebounce(noradId: number, ruleId: string): number {
  const key = String(noradId);
  if (!debounceCounters.has(key)) debounceCounters.set(key, new Map());
  return debounceCounters.get(key)!.get(ruleId) ?? 0;
}

function setDebounce(noradId: number, ruleId: string, count: number) {
  const key = String(noradId);
  if (!debounceCounters.has(key)) debounceCounters.set(key, new Map());
  debounceCounters.get(key)!.set(ruleId, count);
}

function getActive(noradId: number, ruleId: string): 'warning' | 'critical' | null {
  const key = String(noradId);
  if (!activeState.has(key)) activeState.set(key, new Map());
  return activeState.get(key)!.get(ruleId) ?? null;
}

function setActive(noradId: number, ruleId: string, level: 'warning' | 'critical' | null) {
  const key = String(noradId);
  if (!activeState.has(key)) activeState.set(key, new Map());
  activeState.get(key)!.set(ruleId, level);
}

function getNestedValue(obj: Record<string, any>, path: string): number | null {
  const parts = path.split('.');
  let cur: any = obj;
  for (const p of parts) {
    if (cur == null || typeof cur !== 'object') return null;
    cur = cur[p];
  }
  // Handle arrays (e.g. wheelSpeedRPM) — take max absolute value
  if (Array.isArray(cur)) return Math.max(...cur.map(Math.abs));
  return typeof cur === 'number' ? cur : null;
}

export function runRulesLayer(
  noradId: number,
  sample: Record<string, any>,
): RuleViolation[] {
  const violations: RuleViolation[] = [];

  for (const [ruleId, rule] of Object.entries(thresholds)) {
    const cfg = rule as any;
    const value = getNestedValue(sample, cfg.parameter);
    if (value === null) continue;

    const currentActive = getActive(noradId, ruleId);
    let targetSeverity: 'warning' | 'critical' | null = null;

    // Determine raw violation level with hysteresis applied to clearing
    if ('critBelow' in cfg && value < cfg.critBelow) {
      targetSeverity = 'critical';
    } else if ('warnBelow' in cfg) {
      const clearThresh = currentActive === 'warning' ? cfg.warnBelow + cfg.hysteresis : cfg.warnBelow;
      if (value < clearThresh) targetSeverity = 'warning';
    } else if ('critAbove' in cfg && value > cfg.critAbove) {
      targetSeverity = 'critical';
    } else if ('warnAbove' in cfg) {
      const clearThresh = currentActive === 'warning' ? cfg.warnAbove - cfg.hysteresis : cfg.warnAbove;
      if (value > clearThresh) targetSeverity = 'warning';
    }

    // Debounce: require N consecutive ticks before firing
    const prevCount = getDebounce(noradId, ruleId);
    if (targetSeverity) {
      const newCount = prevCount + 1;
      setDebounce(noradId, ruleId, newCount);
      if (newCount >= cfg.debounceSecs) {
        setActive(noradId, ruleId, targetSeverity);
        const threshVal =
          targetSeverity === 'critical'
            ? (cfg.critBelow ?? cfg.critAbove ?? 0)
            : (cfg.warnBelow ?? cfg.warnAbove ?? 0);
        violations.push({
          ruleId,
          label: cfg.label,
          severity: targetSeverity,
          parameter: cfg.parameter,
          value,
          threshold: threshVal,
        });
      }
    } else {
      // Condition cleared — reset debounce
      setDebounce(noradId, ruleId, 0);
      setActive(noradId, ruleId, null);
    }
  }

  return violations;
}

export function getActiveRules(noradId: number): string[] {
  const key = String(noradId);
  const map = activeState.get(key);
  if (!map) return [];
  return [...map.entries()].filter(([, v]) => v !== null).map(([k]) => k);
}

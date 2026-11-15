import type { AgentResult, Category, PriorityLevel, SeverityFactor, SeverityOutput } from '../types';

/** Priority = 35% Safety Risk + 25% Public Importance + 25% Affected Population + 15% Unresolved Duration. */
export const WEIGHTS = { safety: 0.35, importance: 0.25, population: 0.25, duration: 0.15 } as const;
/** Days of being unresolved at which the duration factor reaches 100. */
export const DURATION_FULL_SCALE_DAYS = 21;

const SAFETY_BASE: Record<Category, number> = { Pothole: 62, Waterlogging: 60, Streetlight: 50, Garbage: 35 };

const SAFETY_SIGNALS: { re: RegExp; label: string }[] = [
  { re: /accident|injur|crash|collision/, label: 'accident / injury mentioned' },
  { re: /\bfell\b|\bfall(s|ing)?\b|skid|lost balance|losing balance/, label: 'risk of falls / skidding' },
  { re: /two-?\s?wheeler|\bbikes?\b|scooter|motorcycle|cyclist/, label: 'two-wheelers exposed' },
  { re: /\bdeep\b|\bwide\b|foot deep|large /, label: 'large / deep hazard' },
  { re: /manhole|live wire|electric shock|exposed wire|short circuit/, label: 'electrical / manhole hazard' },
  { re: /knee-deep|waist-deep|submerg|stalling|stalled|stuck/, label: 'vehicles stalling in water' },
  { re: /night|\bdark\b|unsafe|women/, label: 'night-time / personal-safety risk' },
  { re: /children|\bkids?\b|school|elderly|senior citizen/, label: 'children / elderly nearby' },
  { re: /swerv|oncoming|traffic (jam|backing)|backing up/, label: 'traffic disruption' },
  { re: /stench|stink|rotting|dengue|mosquito|disease|stray dogs?|\brats?\b|sewage/, label: 'public-health risk' },
];

const IMPORTANCE_SIGNALS: { re: RegExp; label: string }[] = [
  { re: /main road|junction|signal|flyover|underpass|bridge|\borr\b|outer ring|highway/, label: 'major road / junction' },
  { re: /metro|bus stop|bus stand|railway|station/, label: 'transit point' },
  { re: /hospital|school|college|tech park|itpl|market|mall/, label: 'high-footfall institution' },
];

export function levelFor(score: number): PriorityLevel {
  if (score >= 75) return 'Critical';
  if (score >= 50) return 'High';
  if (score >= 25) return 'Medium';
  return 'Low';
}

const clamp = (n: number) => Math.max(0, Math.min(100, Math.round(n)));

export interface SeverityInput {
  category: Category;
  /** Combined text of every report in the incident. */
  text: string;
  landmarkName: string;
  landmarkImportance: number;
  localityDensity: number;
  reportCount: number;
  ageDays: number;
}

/** Stage 3 – Severity Assessment Agent (simulated, rule-based, formula is deterministic and explainable). */
export function severityAgent(input: SeverityInput): AgentResult<SeverityOutput> {
  const text = input.text.toLowerCase();

  const signals = SAFETY_SIGNALS.filter((s) => s.re.test(text)).map((s) => s.label);
  const safety = clamp(SAFETY_BASE[input.category] + Math.min(38, signals.length * 8));

  const impSignals = IMPORTANCE_SIGNALS.filter((s) => s.re.test(`${text} ${input.landmarkName.toLowerCase()}`));
  const importance = clamp(input.landmarkImportance + Math.min(10, impSignals.length * 5));

  const population = clamp(input.localityDensity + Math.min(30, (input.reportCount - 1) * 10));
  const duration = clamp((input.ageDays / DURATION_FULL_SCALE_DAYS) * 100);

  const mk = (key: SeverityFactor['key'], label: string, weight: number, value: number, reason: string): SeverityFactor => ({
    key,
    label,
    weight,
    value,
    contribution: Math.round(value * weight * 10) / 10,
    reason,
  });

  const factors: SeverityFactor[] = [
    mk('safety', 'Safety risk', WEIGHTS.safety, safety, signals.length ? signals.join('; ') : `Baseline for ${input.category.toLowerCase()}`),
    mk('importance', 'Public importance', WEIGHTS.importance, importance, input.landmarkName + (impSignals.length ? ` – ${impSignals.map((s) => s.label).join(', ')}` : '')),
    mk('population', 'Affected population', WEIGHTS.population, population, `Locality density ${input.localityDensity}${input.reportCount > 1 ? ` + ${input.reportCount} citizens reporting` : ''}`),
    mk('duration', 'Unresolved duration', WEIGHTS.duration, duration, `${input.ageDays.toFixed(1)} days since first report (full scale at ${DURATION_FULL_SCALE_DAYS} days)`),
  ];

  const score = Math.round(factors.reduce((s, f) => s + f.value * f.weight, 0));
  const level = levelFor(score);
  const top = [...factors].sort((a, b) => b.contribution - a.contribution)[0];

  return {
    agent: 'Severity Assessment Agent',
    stage: 3,
    mode: 'simulated-rule-based',
    output: { score, level, factors, reportCount: input.reportCount, ageDays: Math.round(input.ageDays * 10) / 10, riskSignals: signals },
    explanation: `Priority ${score}/100 → ${level}. Largest driver: ${top.label.toLowerCase()} (${top.value}). Formula: 35% safety + 25% importance + 25% population + 15% duration.`,
  };
}

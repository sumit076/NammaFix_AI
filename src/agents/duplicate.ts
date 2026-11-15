import type { AgentResult, Category, Complaint, DuplicateMatch, DuplicateOutput } from '../types';
import { haversineM } from '../lib/geo';
import { daysBetween } from '../lib/format';

export const DUPLICATE_RADIUS_M = 250;
export const DUPLICATE_WINDOW_DAYS = 30;

const STOP = new Set(['the', 'a', 'an', 'and', 'of', 'on', 'in', 'at', 'to', 'is', 'are', 'for', 'near', 'with', 'from', 'it', 'this', 'that', 'has', 'have', 'been', 'by']);
const tokens = (s: string) => new Set(s.toLowerCase().split(/[^a-z0-9]+/).filter((w) => w.length > 2 && !STOP.has(w)));

/** Jaccard similarity of word sets, 0-100. Supporting evidence only – never the deciding factor. */
export function textSimilarity(a: string, b: string): number {
  const A = tokens(a);
  const B = tokens(b);
  if (!A.size || !B.size) return 0;
  let inter = 0;
  A.forEach((w) => B.has(w) && inter++);
  return Math.round((100 * inter) / (A.size + B.size - inter));
}

export const rootOf = (c: Complaint, all: Complaint[]): Complaint => (c.duplicateOf ? all.find((x) => x.id === c.duplicateOf) ?? c : c);

/**
 * Stage 2 – Duplicate Detection Agent (simulated, rule-based).
 * Duplicate = same category + within DUPLICATE_RADIUS_M + reported within DUPLICATE_WINDOW_DAYS + incident not yet resolved.
 */
export function duplicateAgent(
  input: { category: Category; lat: number; lng: number; description: string; now: Date },
  existing: Complaint[],
): AgentResult<DuplicateOutput> {
  const matches: DuplicateMatch[] = [];
  for (const c of existing) {
    if (c.category !== input.category) continue;
    const root = rootOf(c, existing);
    if (root.status === 'Resolved') continue;
    const ageDays = daysBetween(c.reportedAt, input.now);
    if (ageDays > DUPLICATE_WINDOW_DAYS) continue;
    const distanceM = haversineM(input.lat, input.lng, c.lat, c.lng);
    if (distanceM > DUPLICATE_RADIUS_M) continue;
    matches.push({
      id: c.id,
      rootId: root.id,
      distanceM,
      ageDays: Math.round(ageDays * 10) / 10,
      textSimilarity: textSimilarity(input.description, c.description),
    });
  }
  matches.sort((a, b) => a.distanceM - b.distanceM);

  const rootIds = [...new Set(matches.map((m) => m.rootId))];
  const roots = rootIds
    .map((id) => existing.find((c) => c.id === id)!)
    .sort((a, b) => new Date(a.reportedAt).getTime() - new Date(b.reportedAt).getTime());
  const primary = roots[0]?.id ?? null;

  const explanation = matches.length
    ? `Found ${matches.length} similar open ${input.category.toLowerCase()} report${matches.length > 1 ? 's' : ''} within ${DUPLICATE_RADIUS_M} m (nearest ${matches[0].distanceM} m). ` +
      `Consolidated into incident ${primary}; all original references are kept.`
    : `No open ${input.category.toLowerCase()} report within ${DUPLICATE_RADIUS_M} m in the last ${DUPLICATE_WINDOW_DAYS} days. Treated as a new incident.`;

  return {
    agent: 'Duplicate Detection Agent',
    stage: 2,
    mode: 'simulated-rule-based',
    output: {
      isDuplicate: matches.length > 0,
      radiusM: DUPLICATE_RADIUS_M,
      windowDays: DUPLICATE_WINDOW_DAYS,
      matches,
      mergedRootIds: roots.map((r) => r.id),
      incidentPrimaryId: primary,
    },
    explanation,
  };
}

import type { Category, Complaint, PriorityLevel, Status } from '../types';
import { CATEGORIES, PRIORITY_LEVELS, STATUSES } from '../types';
import { LOCALITIES } from '../data/localities';
import { buildIncidents, type IncidentView } from './engine';
import { daysBetween } from './format';

export interface WardTrend {
  ward: string;
  incidents: number;
  open: number;
  criticalOpen: number;
  /** Reports per week, oldest → newest (6 weeks, includes consolidated duplicates). */
  weekly: number[];
}

export interface Analytics {
  incidents: IncidentView[];
  totalReports: number;
  totalIncidents: number;
  duplicatesConsolidated: number;
  pending: number;
  criticalOpen: number;
  resolved: number;
  inProgress: number;
  resolutionPct: number;
  avgResolutionDays: number | null;
  byCategory: Record<Category, { incidents: number; reports: number; open: number }>;
  byPriority: Record<PriorityLevel, number>;
  byStatus: Record<Status, number>;
  wards: WardTrend[];
  weekLabels: string[];
}

export const WEEKS = 6;

export function computeAnalytics(all: Complaint[], now: Date): Analytics {
  const incidents = buildIncidents(all, now);
  const open = incidents.filter((i) => i.primary.status !== 'Resolved');
  const resolvedList = incidents.filter((i) => i.primary.status === 'Resolved' && i.primary.resolvedAt);

  const byCategory = Object.fromEntries(CATEGORIES.map((c) => [c, { incidents: 0, reports: 0, open: 0 }])) as Analytics['byCategory'];
  const byPriority = Object.fromEntries(PRIORITY_LEVELS.map((p) => [p, 0])) as Analytics['byPriority'];
  const byStatus = Object.fromEntries(STATUSES.map((s) => [s, 0])) as Analytics['byStatus'];
  for (const i of incidents) {
    const cat = byCategory[i.primary.category];
    cat.incidents++;
    cat.reports += i.reports.length;
    if (i.primary.status !== 'Resolved') cat.open++;
    byPriority[i.severity.output.level]++;
    byStatus[i.primary.status]++;
  }

  const avgResolutionDays = resolvedList.length
    ? resolvedList.reduce((s, i) => s + daysBetween(i.firstReportedAt, i.primary.resolvedAt!), 0) / resolvedList.length
    : null;

  const wards: WardTrend[] = LOCALITIES.map((l) => {
    const inc = incidents.filter((i) => i.primary.locality === l.name);
    const weekly = Array<number>(WEEKS).fill(0);
    for (const c of all.filter((x) => x.locality === l.name)) {
      const w = Math.floor(daysBetween(c.reportedAt, now) / 7);
      if (w < WEEKS) weekly[WEEKS - 1 - w]++;
    }
    return {
      ward: l.name,
      incidents: inc.length,
      open: inc.filter((i) => i.primary.status !== 'Resolved').length,
      criticalOpen: inc.filter((i) => i.primary.status !== 'Resolved' && i.severity.output.level === 'Critical').length,
      weekly,
    };
  }).sort((a, b) => b.open - a.open || b.incidents - a.incidents);

  const weekLabels = Array.from({ length: WEEKS }, (_, k) => {
    const back = WEEKS - 1 - k;
    return back === 0 ? 'This wk' : `-${back}w`;
  });

  return {
    incidents,
    totalReports: all.length,
    totalIncidents: incidents.length,
    duplicatesConsolidated: all.length - incidents.length,
    pending: incidents.filter((i) => i.primary.status === 'Reported').length,
    criticalOpen: open.filter((i) => i.severity.output.level === 'Critical').length,
    resolved: resolvedList.length,
    inProgress: byStatus['In Progress'],
    resolutionPct: incidents.length ? Math.round((100 * resolvedList.length) / incidents.length) : 0,
    avgResolutionDays,
    byCategory,
    byPriority,
    byStatus,
    wards,
    weekLabels,
  };
}

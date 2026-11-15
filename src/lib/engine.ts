import type {
  ActionOutput,
  AgentResult,
  Complaint,
  Department,
  DraftComplaint,
  HistoryEvent,
  Officer,
  SeverityOutput,
  Status,
} from '../types';
import { DEPARTMENTS } from '../types';
import { classificationAgent } from '../agents/classification';
import { duplicateAgent, rootOf } from '../agents/duplicate';
import { severityAgent } from '../agents/severity';
import { actionAgent, routingAgent } from '../agents/routing';
import { getLandmark, getLocality } from '../data/localities';
import { daysBetween } from './format';

export class EngineError extends Error {}

/** Demo officer profiles. There is no real authentication in this prototype. */
export const OFFICERS: Officer[] = [
  { id: 'off-1', name: 'Ananya Rao', title: 'Zonal Officer – all departments', departments: [...DEPARTMENTS] },
  { id: 'off-2', name: 'Ravi Gowda', title: 'Assistant Engineer – Roads', departments: ['Road Maintenance Department'] },
  { id: 'off-3', name: 'Meera Shetty', title: 'Health Inspector – Solid Waste', departments: ['Solid Waste Management'] },
];

export interface IncidentView {
  primary: Complaint;
  /** Primary + every consolidated duplicate, oldest first. Original references are never dropped. */
  reports: Complaint[];
  severity: AgentResult<SeverityOutput>;
  action: AgentResult<ActionOutput>;
  firstReportedAt: string;
}

const byDate = (a: Complaint, b: Complaint) => new Date(a.reportedAt).getTime() - new Date(b.reportedAt).getTime();

export function incidentReports(primary: Complaint, all: Complaint[]): Complaint[] {
  const dups = primary.duplicateIds.map((id) => all.find((c) => c.id === id)).filter((c): c is Complaint => !!c);
  return [primary, ...dups].sort(byDate);
}

/** An incident is scored on its most important location, so every screen shows the same priority. */
function topLandmark(reports: { locality: string; landmarkId: string; address: string }[]) {
  let best = { name: reports[0]?.address ?? '', importance: 50 };
  let found = false;
  for (const r of reports) {
    const lm = getLandmark(r.locality, r.landmarkId);
    if (lm && (!found || lm.importance > best.importance)) {
      best = { name: lm.name, importance: lm.importance };
      found = true;
    }
  }
  return best;
}

/** Live re-assessment of an incident (priority changes as reports accumulate and time passes). */
export function assessIncident(primary: Complaint, all: Complaint[], now: Date): IncidentView {
  const reports = incidentReports(primary, all);
  const first = reports[0].reportedAt;
  const ageDays = daysBetween(first, primary.resolvedAt ?? now);
  const lm = topLandmark(reports);
  const loc = getLocality(primary.locality);
  const severity = severityAgent({
    category: primary.category,
    text: reports.map((r) => r.description).join(' '),
    landmarkName: lm.name,
    landmarkImportance: lm.importance,
    localityDensity: loc?.density ?? 50,
    reportCount: reports.length,
    ageDays,
  });
  const action = actionAgent({
    category: primary.category,
    level: severity.output.level,
    score: severity.output.score,
    reportCount: reports.length,
    department: primary.assignedDepartment ?? primary.analysis.routing.output.department,
  });
  return { primary, reports, severity, action, firstReportedAt: first };
}

export const buildIncidents = (all: Complaint[], now: Date): IncidentView[] =>
  all.filter((c) => !c.duplicateOf).map((c) => assessIncident(c, all, now));

export const effectiveStatus = (c: Complaint, all: Complaint[]): Status => rootOf(c, all).status;

const ev = (at: Date, actor: string, text: string): HistoryEvent => ({ at: at.toISOString(), actor, text });

export function nextCitizenId(all: Complaint[], now: Date): string {
  const ymd = now.toISOString().slice(0, 10).replace(/-/g, '');
  let n = 1000 + all.filter((c) => c.source === 'citizen').length + 1;
  while (all.some((c) => c.id === `NF-${ymd}-${n}`)) n++;
  return `NF-${ymd}-${n}`;
}

export interface IngestResult {
  complaints: Complaint[];
  created: Complaint;
  merged: boolean;
}

/** Runs the full agent pipeline on a draft and returns the updated complaint list. */
export function ingestComplaint(
  all: Complaint[],
  draft: DraftComplaint,
  opts: { now: Date; source: 'demo' | 'citizen'; id?: string },
): IngestResult {
  const { now } = opts;
  const description = draft.description.trim();
  if (description.length < 15) throw new EngineError('Please describe the issue in at least 15 characters.');
  const lm = getLandmark(draft.locality, draft.landmarkId);
  const loc = getLocality(draft.locality);
  if (!lm || !loc) throw new EngineError('Select a locality and a nearby landmark.');

  // 1. Classification
  const classification = classificationAgent({ description, citizenCategory: draft.citizenCategory, image: draft.image?.meta });
  const category = classification.output.category;
  if (!category) {
    throw new EngineError('The AI could not identify a civic issue from this description. Choose a category or add more detail.');
  }

  // 2. Duplicate detection
  const duplicate = duplicateAgent({ category, lat: lm.lat, lng: lm.lng, description, now }, all);
  const primaryId = duplicate.output.incidentPrimaryId;
  const roots = duplicate.output.mergedRootIds.map((id) => all.find((c) => c.id === id)!);
  const members = roots.flatMap((r) => incidentReports(r, all));
  const oldest = [...members].sort(byDate)[0]?.reportedAt ?? now.toISOString();

  // 3. Severity (incident-level: includes consolidated reports)
  const top = topLandmark([{ locality: draft.locality, landmarkId: draft.landmarkId, address: lm.name }, ...members]);
  const severity = severityAgent({
    category,
    text: [description, ...members.map((m) => m.description)].join(' '),
    landmarkName: top.name,
    landmarkImportance: top.importance,
    localityDensity: loc.density,
    reportCount: members.length + 1,
    ageDays: daysBetween(oldest, now),
  });

  // 4-5. Routing + action recommendation
  const routing = routingAgent({ category, locality: draft.locality });
  const action = actionAgent({
    category,
    level: severity.output.level,
    score: severity.output.score,
    reportCount: members.length + 1,
    department: routing.output.department,
  });

  const id = opts.id ?? nextCitizenId(all, now);
  const created: Complaint = {
    id,
    source: opts.source,
    reporterName: draft.reporterName.trim() || 'Anonymous citizen',
    category,
    citizenCategory: draft.citizenCategory,
    description,
    locality: draft.locality,
    landmarkId: draft.landmarkId,
    address: draft.address.trim() || lm.name,
    lat: lm.lat,
    lng: lm.lng,
    image: draft.image,
    reportedAt: now.toISOString(),
    status: 'Reported',
    duplicateOf: primaryId ?? undefined,
    duplicateIds: [],
    analysis: { classification, duplicate, severity, routing, action },
    history: [
      ev(now, 'Citizen', 'Complaint submitted'),
      ev(now, 'AI (simulated)', `Classified as ${category}; priority ${severity.output.score}/100 (${severity.output.level}); recommended ${routing.output.department}.`),
    ],
  };

  if (!primaryId) return { complaints: [...all, created], created, merged: false };

  // Consolidate: every matched incident is folded into the oldest one.
  const absorbed = new Set<string>(roots.filter((r) => r.id !== primaryId).flatMap((r) => [r.id, ...r.duplicateIds]));
  const updated = all.map((c) => {
    if (c.id === primaryId) {
      const extra = [...absorbed, created.id];
      return {
        ...c,
        duplicateIds: [...new Set([...c.duplicateIds, ...extra])],
        history: [...c.history, ev(now, 'AI (simulated)', `${created.id} consolidated into this incident as a duplicate${absorbed.size ? ` along with ${absorbed.size} other report(s)` : ''}. Incident now has ${members.length + 1} reports.`)],
      };
    }
    if (absorbed.has(c.id)) {
      const wasRoot = roots.some((r) => r.id === c.id);
      return {
        ...c,
        duplicateOf: primaryId,
        duplicateIds: [],
        history: wasRoot ? [...c.history, ev(now, 'AI (simulated)', `Consolidated into incident ${primaryId} after new report ${created.id}.`)] : c.history,
      };
    }
    return c;
  });
  created.history.push(ev(now, 'AI (simulated)', `Consolidated into incident ${primaryId}.`));
  return { complaints: [...updated, created], created, merged: true };
}

function authorise(officer: Officer | null, department: Department) {
  if (!officer) throw new EngineError('Sign in as a civic officer to perform this action.');
  if (!officer.departments.includes(department)) {
    throw new EngineError(`${officer.name} is not authorised for ${department}.`);
  }
}

/** Human-approval gate: assigns a department to an incident. */
export function approveAssignment(all: Complaint[], id: string, department: Department, officer: Officer | null, now: Date): Complaint[] {
  const target = all.find((c) => c.id === id);
  if (!target) throw new EngineError('Complaint not found.');
  if (target.duplicateOf) throw new EngineError(`${id} is consolidated into ${target.duplicateOf}; approve the primary report instead.`);
  if (target.status === 'Resolved') throw new EngineError('This incident is already resolved.');
  authorise(officer, department);
  return all.map((c) =>
    c.id !== id
      ? c
      : {
          ...c,
          assignedDepartment: department,
          approvedBy: officer!.name,
          approvedAt: now.toISOString(),
          status: c.status === 'Reported' ? 'Assigned' : c.status,
          history: [
            ...c.history,
            ev(
              now,
              officer!.name,
              department === c.analysis.routing.output.department
                ? `Approved AI recommendation – assigned to ${department}.`
                : `Overrode AI recommendation (${c.analysis.routing.output.department}) – assigned to ${department}.`,
            ),
          ],
        },
  );
}

export function setIncidentStatus(all: Complaint[], id: string, status: Status, officer: Officer | null, now: Date): Complaint[] {
  const target = all.find((c) => c.id === id);
  if (!target) throw new EngineError('Complaint not found.');
  if (target.duplicateOf) throw new EngineError(`${id} is consolidated into ${target.duplicateOf}; update the primary report instead.`);
  if (!target.assignedDepartment) throw new EngineError('Approve a department assignment before changing the status.');
  if (status === 'Reported') throw new EngineError('An approved incident cannot return to Reported.');
  authorise(officer, target.assignedDepartment);
  if (target.status === status) return all;
  return all.map((c) =>
    c.id !== id
      ? c
      : {
          ...c,
          status,
          resolvedAt: status === 'Resolved' ? now.toISOString() : undefined,
          history: [...c.history, ev(now, officer!.name, `Status changed: ${c.status} → ${status}`)],
        },
  );
}

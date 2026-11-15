import { describe, expect, it } from 'vitest';
import { buildSeedComplaints } from '../data/seed';
import { approveAssignment, assessIncident, EngineError, ingestComplaint, OFFICERS, setIncidentStatus } from '../lib/engine';
import { computeAnalytics } from '../lib/analytics';
import { classificationAgent } from './classification';
import { levelFor, severityAgent } from './severity';

const NOW = new Date('2026-11-14T10:00:00Z');

describe('severity formula', () => {
  it('maps scores to the specified levels', () => {
    expect(levelFor(100)).toBe('Critical');
    expect(levelFor(75)).toBe('Critical');
    expect(levelFor(74)).toBe('High');
    expect(levelFor(50)).toBe('High');
    expect(levelFor(49)).toBe('Medium');
    expect(levelFor(25)).toBe('Medium');
    expect(levelFor(24)).toBe('Low');
    expect(levelFor(0)).toBe('Low');
  });

  it('applies 35/25/25/15 weights', () => {
    const r = severityAgent({
      category: 'Garbage',
      text: 'plain',
      landmarkName: 'x',
      landmarkImportance: 40,
      localityDensity: 40,
      reportCount: 1,
      ageDays: 0,
    });
    const f = Object.fromEntries(r.output.factors.map((x) => [x.key, x]));
    expect(f.safety.weight).toBe(0.35);
    expect(f.importance.weight).toBe(0.25);
    expect(f.population.weight).toBe(0.25);
    expect(f.duration.weight).toBe(0.15);
    // 35*0.35 + 40*0.25 + 40*0.25 + 0*0.15 = 32.25
    expect(r.output.score).toBe(32);
    expect(r.output.level).toBe('Medium');
  });
});

describe('classification agent', () => {
  it('detects category from description and flags disagreement with the citizen', () => {
    const r = classificationAgent({ description: 'Water logging and flooded road after rain', citizenCategory: 'Pothole' });
    expect(r.output.category).toBe('Waterlogging');
    expect(r.output.agreesWithCitizen).toBe(false);
    expect(r.output.needsReview).toBe(true);
  });
  it('returns null when nothing is recognisable', () => {
    expect(classificationAgent({ description: 'something is wrong here', citizenCategory: '' }).output.category).toBeNull();
  });
});

describe('seed data', () => {
  const seed = buildSeedComplaints(NOW);
  it('has at least 10 complaints, all marked demo, with grouped duplicates', () => {
    expect(seed.length).toBeGreaterThanOrEqual(10);
    expect(seed.every((c) => c.source === 'demo')).toBe(true);
    expect(seed.filter((c) => c.duplicateOf).length).toBeGreaterThanOrEqual(3);
    const groups = new Set(seed.map((c) => c.locality));
    for (const l of ['Koramangala', 'Indiranagar', 'Whitefield', 'Electronic City', 'Jayanagar', 'Marathahalli', 'HSR Layout']) expect(groups.has(l)).toBe(true);
  });
  it('keeps the two Koramangala potholes as separate incidents before the demo', () => {
    const k = seed.filter((c) => c.locality === 'Koramangala' && c.category === 'Pothole');
    expect(k).toHaveLength(2);
    expect(k.every((c) => !c.duplicateOf)).toBe(true);
  });
});

describe('end-to-end demo scenario', () => {
  const seed = buildSeedComplaints(NOW);
  const draft = {
    reporterName: 'Test Citizen',
    citizenCategory: 'Pothole' as const,
    description: 'Deep pothole on KHB Colony main road near the 5th Block junction. Two-wheelers are skidding and an elderly person fell last night.',
    locality: 'Koramangala',
    landmarkId: 'kor-khb',
    address: '',
  };

  it('consolidates two sample reports, scores Critical, routes to Road Maintenance and suggests urgent inspection', () => {
    const { complaints, created, merged } = ingestComplaint(seed, draft, { now: NOW, source: 'citizen' });
    expect(merged).toBe(true);
    expect(created.category).toBe('Pothole');
    expect(created.analysis.duplicate.output.matches).toHaveLength(2);
    expect(created.analysis.severity.output.level).toBe('Critical');
    expect(created.analysis.routing.output.department).toBe('Road Maintenance Department');
    expect(created.analysis.action.output.urgency).toBe('Urgent inspection');

    const primary = complaints.find((c) => c.id === created.duplicateOf)!;
    // primary = oldest sample report; it now carries the other sample report + the new citizen report
    expect(primary.duplicateIds).toHaveLength(2);
  });

  it('scores the incident identically on the citizen confirmation and the officer view', () => {
    const { complaints, created } = ingestComplaint(seed, draft, { now: NOW, source: 'citizen' });
    const primary = complaints.find((c) => c.id === created.duplicateOf)!;
    const live = assessIncident(primary, complaints, NOW).severity.output;
    expect(live.score).toBe(created.analysis.severity.output.score);
    expect(live.level).toBe(created.analysis.severity.output.level);
  });

  it('keeps every original reference and yields one incident of three reports', () => {
    const { complaints, created } = ingestComplaint(seed, draft, { now: NOW, source: 'citizen' });
    const primary = complaints.find((c) => c.id === created.duplicateOf)!;
    const refs = [primary.id, ...primary.duplicateIds].sort();
    const koramangalaPotholes = complaints.filter((c) => c.locality === 'Koramangala' && c.category === 'Pothole').map((c) => c.id).sort();
    expect(refs).toEqual(koramangalaPotholes);
    expect(refs).toHaveLength(3);
    expect(complaints.filter((c) => c.locality === 'Koramangala' && c.category === 'Pothole' && !c.duplicateOf)).toHaveLength(1);
  });

  it('requires approval before status change, then reflects in analytics', () => {
    const { complaints, created } = ingestComplaint(seed, draft, { now: NOW, source: 'citizen' });
    const pid = created.duplicateOf!;
    const officer = OFFICERS[0];
    expect(() => setIncidentStatus(complaints, pid, 'In Progress', officer, NOW)).toThrow(EngineError);

    const before = computeAnalytics(complaints, NOW);
    const approved = approveAssignment(complaints, pid, 'Road Maintenance Department', officer, NOW);
    expect(approved.find((c) => c.id === pid)!.status).toBe('Assigned');
    const inProg = setIncidentStatus(approved, pid, 'In Progress', officer, NOW);
    const after = computeAnalytics(inProg, NOW);
    expect(after.inProgress).toBe(before.inProgress + 1);
    expect(after.pending).toBe(before.pending - 1);
    expect(after.totalReports).toBe(seed.length + 1);
    expect(after.duplicatesConsolidated).toBe(before.duplicatesConsolidated);
    expect(assessIncident(inProg.find((c) => c.id === pid)!, inProg, NOW).severity.output.level).toBe('Critical');
  });

  it('blocks unauthorised officers', () => {
    const { complaints, created } = ingestComplaint(seed, draft, { now: NOW, source: 'citizen' });
    expect(() => approveAssignment(complaints, created.duplicateOf!, 'Road Maintenance Department', OFFICERS[2], NOW)).toThrow(/not authorised/);
  });

  it('rejects unclassifiable or too-short descriptions', () => {
    expect(() => ingestComplaint(seed, { ...draft, description: 'short' }, { now: NOW, source: 'citizen' })).toThrow(EngineError);
    expect(() => ingestComplaint(seed, { ...draft, citizenCategory: '', description: 'Something is wrong around here, please check.' }, { now: NOW, source: 'citizen' })).toThrow(/could not identify/);
  });
});

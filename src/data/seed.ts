import type { Category, Complaint, Status } from '../types';
import { addDays } from '../lib/format';
import { ingestComplaint, OFFICERS } from '../lib/engine';

/**
 * ALL RECORDS BELOW ARE SYNTHETIC DEMONSTRATION DATA.
 * They are not real complaints, real people or real civic records.
 */
interface SeedRow {
  loc: string;
  lm: string;
  cat: Category;
  daysAgo: number;
  status: Status;
  /** days from report to resolution (Resolved only) */
  fixedInDays?: number;
  text: string;
}

const ROWS: SeedRow[] = [
  { loc: 'Koramangala', lm: 'kor-sony', cat: 'Pothole', daysAgo: 9, status: 'Reported', text: 'Large pothole near Sony World Junction signal, nearly a foot deep. Bikes swerve into the right lane during peak hours.' },
  { loc: 'Koramangala', lm: 'kor-80ft', cat: 'Pothole', daysAgo: 5, status: 'Reported', text: 'Road surface has caved in near the 80 Feet Road bus stop. Autos brake sharply and traffic is backing up.' },
  { loc: 'Koramangala', lm: 'kor-forum', cat: 'Garbage', daysAgo: 2, status: 'Reported', text: 'Overflowing garbage skip near the Forum Mall signal, rotting waste spilling onto the footpath.' },
  { loc: 'Indiranagar', lm: 'ind-metro', cat: 'Garbage', daysAgo: 12, status: 'Assigned', text: 'Garbage overflowing from the dustbin near Indiranagar metro station. Bad stench and stray dogs around.' },
  { loc: 'Indiranagar', lm: 'ind-metro', cat: 'Garbage', daysAgo: 10, status: 'Assigned', text: 'Waste has not been collected for three days at the metro station entrance. Rotting smell all day.' },
  { loc: 'Indiranagar', lm: 'ind-cmh', cat: 'Pothole', daysAgo: 22, status: 'Resolved', fixedInDays: 9, text: 'Cracked asphalt and a pothole at CMH Road junction. Two-wheelers losing balance.' },
  { loc: 'Indiranagar', lm: 'ind-12th', cat: 'Streetlight', daysAgo: 38, status: 'Resolved', fixedInDays: 3, text: 'Street light on 12th Main not working for a week. The whole stretch is dark at night.' },
  { loc: 'Whitefield', lm: 'wf-hopefarm', cat: 'Garbage', daysAgo: 41, status: 'Resolved', fixedInDays: 10, text: 'Illegal dumping of construction debris and household waste near Hope Farm junction.' },
  { loc: 'Whitefield', lm: 'wf-itpl', cat: 'Waterlogging', daysAgo: 3, status: 'In Progress', text: 'Water stagnating on ITPL Main Road after overnight rain, knee-deep at the tech park gate. Vehicles stalling.' },
  { loc: 'Whitefield', lm: 'wf-itpl', cat: 'Waterlogging', daysAgo: 2, status: 'In Progress', text: 'Flooded stretch near ITPL gate, two-wheelers stuck and office commuters wading through water.' },
  { loc: 'Whitefield', lm: 'wf-itpl', cat: 'Waterlogging', daysAgo: 1, status: 'In Progress', text: 'Rainwater not draining at the ITPL tech park entrance, traffic jam building up.' },
  { loc: 'Electronic City', lm: 'ec-flyover', cat: 'Streetlight', daysAgo: 14, status: 'In Progress', text: 'Street lights not working on the flyover service road for over a week. Very dark at night and women commuters feel unsafe.' },
  { loc: 'Electronic City', lm: 'ec-infosys', cat: 'Pothole', daysAgo: 20, status: 'Resolved', fixedInDays: 6, text: 'Deep pothole on Hosur Road near the Infosys gate, trucks and bikes slowing down sharply.' },
  { loc: 'Electronic City', lm: 'ec-neeladri', cat: 'Waterlogging', daysAgo: 6, status: 'Reported', text: 'Rainwater not draining near the Neeladri Road underpass. Stagnant water is breeding mosquitoes.' },
  { loc: 'Jayanagar', lm: 'jay-4th', cat: 'Garbage', daysAgo: 7, status: 'Reported', text: 'Garbage pile beside the 4th Block shopping complex market. Bins overflowing and not cleared since the weekend.' },
  { loc: 'Jayanagar', lm: 'jay-southend', cat: 'Streetlight', daysAgo: 18, status: 'Resolved', fixedInDays: 4, text: 'Street light pole at South End Circle flickering and the bulb keeps going off after dark.' },
  { loc: 'Jayanagar', lm: 'jay-9th', cat: 'Waterlogging', daysAgo: 30, status: 'Resolved', fixedInDays: 5, text: 'Stagnant water on 36th Cross after rain, drain choked with silt.' },
  { loc: 'Jayanagar', lm: 'jay-4th', cat: 'Pothole', daysAgo: 1, status: 'Reported', text: 'Potholes at the 4th Block complex entrance. Two-wheelers losing balance near the pedestrian crossing.' },
  { loc: 'Marathahalli', lm: 'mar-bridge', cat: 'Pothole', daysAgo: 16, status: 'Assigned', text: 'Multiple potholes on the Marathahalli bridge approach. Heavy truck traffic, deep near the expansion joint, bikers at risk of falling.' },
  { loc: 'Marathahalli', lm: 'mar-bridge', cat: 'Pothole', daysAgo: 13, status: 'Assigned', text: 'Broken road surface on the bridge ramp. Two accidents involving scooters this week.' },
  { loc: 'Marathahalli', lm: 'mar-bridge', cat: 'Pothole', daysAgo: 6, status: 'Assigned', text: 'Potholes on Marathahalli bridge getting bigger after the rain. Traffic backing up every evening.' },
  { loc: 'Marathahalli', lm: 'mar-munekolala', cat: 'Garbage', daysAgo: 25, status: 'Resolved', fixedInDays: 3, text: 'Garbage dumped on the roadside of Munekolala Main Road, not collected for days.' },
  { loc: 'Marathahalli', lm: 'mar-orr', cat: 'Waterlogging', daysAgo: 4, status: 'Reported', text: 'Drain overflowing onto the Outer Ring Road service lane. Sewage water on the road near Kundalahalli gate.' },
  { loc: 'HSR Layout', lm: 'hsr-bda', cat: 'Streetlight', daysAgo: 11, status: 'Reported', text: 'Three consecutive street lights are dead near the BDA complex. The park side is dark at night.' },
  { loc: 'HSR Layout', lm: 'hsr-27th', cat: 'Pothole', daysAgo: 8, status: 'In Progress', text: 'Potholes on 27th Main near the school. Children crossing the road have to dodge swerving vehicles.' },
  { loc: 'HSR Layout', lm: 'hsr-agara', cat: 'Garbage', daysAgo: 35, status: 'Resolved', fixedInDays: 7, text: 'Garbage dumped near Agara Lake junction, strong stench for the whole week.' },
];

export function buildSeedComplaints(now: Date): Complaint[] {
  const ordered = ROWS.map((r, i) => ({ r, i })).sort((a, b) => b.r.daysAgo - a.r.daysAgo || a.i - b.i);
  let all: Complaint[] = [];
  const idByRow = new Map<number, string>();

  for (const { r, i } of ordered) {
    const reportedAt = new Date(now.getTime() - r.daysAgo * 86_400_000 + ((i * 7) % 12) * 3_600_000);
    const id = `NF-DEMO-${String(i + 1).padStart(4, '0')}`;
    idByRow.set(i, id);
    const res = ingestComplaint(
      all,
      {
        reporterName: 'Resident (demo)',
        citizenCategory: r.cat,
        description: r.text,
        locality: r.loc,
        landmarkId: r.lm,
        address: '',
      },
      { now: reportedAt, source: 'demo', id },
    );
    all = res.complaints;
  }

  // Post-pass: apply the officer workflow state to each synthetic incident's primary report.
  const officer = OFFICERS[0];
  return all.map((c) => {
    const rowIdx = [...idByRow.entries()].find(([, v]) => v === c.id)![0];
    const r = ROWS[rowIdx];
    // duplicates inherit the status of their incident; only primaries carry workflow fields
    const primaryRow = c.duplicateOf ? ROWS[[...idByRow.entries()].find(([, v]) => v === c.duplicateOf)![0]] : r;
    if (c.duplicateOf || primaryRow.status === 'Reported') return c;
    const approvedAt = addDays(c.reportedAt, 0.6);
    const history = [...c.history, { at: approvedAt, actor: `${officer.name} (demo)`, text: `Approved AI recommendation – assigned to ${c.analysis.routing.output.department}.` }];
    let resolvedAt: string | undefined;
    if (primaryRow.status === 'In Progress' || primaryRow.status === 'Resolved') {
      history.push({ at: addDays(c.reportedAt, 1.2), actor: `${officer.name} (demo)`, text: 'Status changed: Assigned → In Progress' });
    }
    if (primaryRow.status === 'Resolved') {
      resolvedAt = addDays(c.reportedAt, primaryRow.fixedInDays ?? 5);
      history.push({ at: resolvedAt, actor: `${officer.name} (demo)`, text: 'Status changed: In Progress → Resolved' });
    }
    return {
      ...c,
      status: primaryRow.status,
      assignedDepartment: c.analysis.routing.output.department,
      approvedBy: `${officer.name} (demo)`,
      approvedAt,
      resolvedAt,
      history,
    };
  });
}

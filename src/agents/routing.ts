import type { ActionOutput, AgentResult, Category, Department, PriorityLevel, RoutingOutput } from '../types';
import { getLocality } from '../data/localities';

export const DEPARTMENT_FOR: Record<Category, Department> = {
  Pothole: 'Road Maintenance Department',
  Garbage: 'Solid Waste Management',
  Streetlight: 'Street Lighting (BESCOM)',
  Waterlogging: 'Storm Water Drain Department',
};

/** Stage 4 – Department Routing Agent (simulated; category → department, locality → zone office). */
export function routingAgent(input: { category: Category; locality: string }): AgentResult<RoutingOutput> {
  const department = DEPARTMENT_FOR[input.category];
  const zone = getLocality(input.locality)?.zone ?? 'City Zone';
  return {
    agent: 'Department Routing Agent',
    stage: 4,
    mode: 'simulated-rule-based',
    output: { department, zone, office: `${department} – ${zone}` },
    explanation: `${input.category} issues are handled by ${department}; ${input.locality} falls under ${zone} (illustrative mapping).`,
  };
}

const SLA: Record<PriorityLevel, number> = { Critical: 24, High: 72, Medium: 168, Low: 336 };
const URGENCY: Record<PriorityLevel, string> = {
  Critical: 'Urgent inspection',
  High: 'Priority inspection',
  Medium: 'Scheduled inspection',
  Low: 'Routine handling',
};

const STEPS: Record<Category, string[]> = {
  Pothole: ['Barricade / cone off the hazard', 'Patch with cold-mix asphalt within the SLA', 'Inspect 50 m of adjacent road for surface failure'],
  Garbage: ['Dispatch a compactor for clearance', 'Check whether the spot is a repeat dumping blackspot', 'Alert the ward health inspector'],
  Streetlight: ['Dispatch an electrical crew', 'Check pole and cable for live-wire risk', 'Restore lighting and log the pole ID'],
  Waterlogging: ['Deploy a pump / jetting crew', 'Clear drain inlets at the location', 'Trace the upstream blockage'],
};

/** Stage 5 – Action Recommendation Agent (simulated; advisory only – an officer must approve). */
export function actionAgent(input: {
  category: Category;
  level: PriorityLevel;
  score: number;
  reportCount: number;
  department: Department;
}): AgentResult<ActionOutput> {
  const urgency = URGENCY[input.level];
  const slaHours = SLA[input.level];
  const reports = input.reportCount > 1 ? `${input.reportCount} consolidated reports` : '1 report';
  const headline = `${urgency} by ${input.department} within ${slaHours} h (${input.level}, ${input.score}/100, ${reports}).`;
  return {
    agent: 'Action Recommendation Agent',
    stage: 5,
    mode: 'simulated-rule-based',
    output: { urgency, slaHours, headline, steps: STEPS[input.category] },
    explanation: `${headline} Recommendation only – requires officer approval before any assignment.`,
  };
}

import type { Category, PriorityLevel, Status } from '../types';
import { CATEGORY_ICON, Icon } from './Icons';

const PRIORITY: Record<PriorityLevel, { cls: string; dot: string }> = {
  Critical: { cls: 'bg-red-50 text-red-800 ring-red-200', dot: 'bg-red-600' },
  High: { cls: 'bg-orange-50 text-orange-800 ring-orange-200', dot: 'bg-orange-500' },
  Medium: { cls: 'bg-amber-50 text-amber-800 ring-amber-200', dot: 'bg-amber-500' },
  Low: { cls: 'bg-green-50 text-green-800 ring-green-200', dot: 'bg-green-600' },
};
export const PRIORITY_COLOR: Record<PriorityLevel, string> = { Critical: '#d92d20', High: '#f97316', Medium: '#eab308', Low: '#16a34a' };
export const CATEGORY_COLOR: Record<Category, string> = { Pothole: '#13315c', Garbage: '#2f6fdd', Streetlight: '#6b93d6', Waterlogging: '#0e9aa7' };
export const STATUS_COLOR: Record<Status, string> = { Reported: '#98a2b3', Assigned: '#6b93d6', 'In Progress': '#2f6fdd', Resolved: '#16a34a' };

export function PriorityBadge({ level, score }: { level: PriorityLevel; score?: number }) {
  const p = PRIORITY[level];
  return (
    <span className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${p.cls}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${p.dot}`} aria-hidden="true" />
      {level}
      {score !== undefined && <span className="font-normal opacity-80">· {score}</span>}
    </span>
  );
}

const STATUS_CLS: Record<Status, string> = {
  Reported: 'bg-slate-100 text-slate-700 ring-slate-200',
  Assigned: 'bg-brand-50 text-brand-700 ring-brand-200',
  'In Progress': 'bg-blue-100 text-navy-800 ring-blue-300',
  Resolved: 'bg-green-50 text-green-800 ring-green-200',
};

export function StatusBadge({ status }: { status: Status }) {
  return <span className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${STATUS_CLS[status]}`}>{status}</span>;
}

export function CategoryChip({ category }: { category: Category }) {
  return (
    <span className="inline-flex items-center gap-1.5 whitespace-nowrap text-sm font-medium text-ink-900">
      <span className="flex h-6 w-6 items-center justify-center rounded-md bg-brand-50 text-brand-700">
        <Icon name={CATEGORY_ICON[category]} className="h-4 w-4" />
      </span>
      {category}
    </span>
  );
}

export function DemoTag() {
  return (
    <span title="Synthetic demonstration data" className="rounded border border-line bg-canvas px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-ink-500">
      Demo
    </span>
  );
}

export function SimTag() {
  return (
    <span
      title="Rule-based simulation. No external LLM or vision model is connected."
      className="rounded border border-amber-300 bg-amber-50 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-800"
    >
      Simulated AI
    </span>
  );
}

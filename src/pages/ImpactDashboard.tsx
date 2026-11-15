import { useMemo } from 'react';
import { CATEGORIES, PRIORITY_LEVELS, STATUSES } from '../types';
import { useStore } from '../state/store';
import { computeAnalytics } from '../lib/analytics';
import { formatDays } from '../lib/format';
import { CATEGORY_COLOR, PRIORITY_COLOR, STATUS_COLOR } from '../components/Badges';
import { Donut, HBars, Sparkline } from '../components/Charts';
import { CATEGORY_ICON, Icon } from '../components/Icons';

function Stat({ label, value, sub }: { label: string; value: string | number; sub: string }) {
  return (
    <div className="card p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-ink-500">{label}</p>
      <p className="mt-1 text-3xl font-bold text-navy-900">{value}</p>
      <p className="mt-0.5 text-xs text-ink-500">{sub}</p>
    </div>
  );
}

export function ImpactDashboard() {
  const { complaints, now } = useStore();
  const a = useMemo(() => computeAnalytics(complaints, now), [complaints, now]);
  const demoCount = complaints.filter((c) => c.source === 'demo').length;
  const liveCount = complaints.length - demoCount;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-navy-900">City Impact Dashboard</h1>
        <p className="text-sm text-ink-500">
          Computed live from application state: {demoCount} synthetic demonstration complaints + {liveCount} submitted in this browser.
        </p>
      </div>

      <section aria-label="Headline metrics" className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat label="Resolution rate" value={`${a.resolutionPct}%`} sub={`${a.resolved} of ${a.totalIncidents} incidents resolved`} />
        <Stat label="Avg. resolution time" value={a.avgResolutionDays === null ? '—' : formatDays(a.avgResolutionDays)} sub="First report → resolved" />
        <Stat label="Duplicates consolidated" value={a.duplicatesConsolidated} sub={`${a.totalReports} reports → ${a.totalIncidents} incidents`} />
        <Stat label="Open critical" value={a.criticalOpen} sub={`${a.inProgress} incidents in progress`} />
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="card p-5" aria-labelledby="cat-title">
          <h2 id="cat-title" className="section-title mb-4">
            Complaints by category
          </h2>
          <HBars
            rows={CATEGORIES.map((c) => ({
              label: c,
              value: a.byCategory[c].incidents,
              color: CATEGORY_COLOR[c],
              sub: `incidents · ${a.byCategory[c].reports} reports · ${a.byCategory[c].open} open`,
            }))}
          />
        </section>

        <section className="card p-5" aria-labelledby="prio-title">
          <h2 id="prio-title" className="section-title mb-4">
            Priority distribution
          </h2>
          <Donut
            centerLabel="incidents"
            centerValue={a.totalIncidents}
            slices={PRIORITY_LEVELS.map((p) => ({ label: p, value: a.byPriority[p], color: PRIORITY_COLOR[p] }))}
          />
        </section>

        <section className="card p-5" aria-labelledby="status-title">
          <h2 id="status-title" className="section-title mb-4">
            Workflow status
          </h2>
          <HBars rows={STATUSES.map((s) => ({ label: s, value: a.byStatus[s], color: STATUS_COLOR[s] }))} max={Math.max(1, a.totalIncidents)} />
        </section>

        <section className="card p-5" aria-labelledby="dup-title">
          <h2 id="dup-title" className="section-title mb-1">
            Duplicate consolidation
          </h2>
          <p className="mb-4 text-xs text-ink-500">Reports vs unique incidents per category – the gap is effort saved for field teams.</p>
          <ul className="space-y-2.5">
            {CATEGORIES.map((c) => {
              const x = a.byCategory[c];
              return (
                <li key={c} className="flex items-center justify-between gap-3 text-sm">
                  <span className="flex items-center gap-2 font-medium text-ink-900">
                    <Icon name={CATEGORY_ICON[c]} className="h-4 w-4 text-brand-600" /> {c}
                  </span>
                  <span className="text-ink-700">
                    {x.reports} reports → <span className="font-semibold text-ink-900">{x.incidents}</span> incidents
                    {x.reports > x.incidents && <span className="ml-2 rounded-full bg-brand-50 px-2 py-0.5 text-xs font-semibold text-brand-700">−{x.reports - x.incidents}</span>}
                  </span>
                </li>
              );
            })}
          </ul>
        </section>
      </div>

      <section className="card overflow-hidden" aria-labelledby="ward-title">
        <div className="border-b border-line p-5">
          <h2 id="ward-title" className="section-title">
            Ward-wise issue trends
          </h2>
          <p className="text-xs text-ink-500">Reports per week over the last {a.weekLabels.length} weeks ({a.weekLabels[0]} → now). Darker bar = current week.</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[36rem] text-left">
            <caption className="sr-only">Issues by ward with six-week trend</caption>
            <thead className="bg-canvas">
              <tr>
                <th scope="col" className="th">Ward / locality</th>
                <th scope="col" className="th">Incidents</th>
                <th scope="col" className="th">Open</th>
                <th scope="col" className="th">Critical open</th>
                <th scope="col" className="th">6-week trend</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {a.wards.map((w) => (
                <tr key={w.ward}>
                  <th scope="row" className="td font-medium text-ink-900">
                    {w.ward}
                  </th>
                  <td className="td">{w.incidents}</td>
                  <td className="td">{w.open}</td>
                  <td className="td">{w.criticalOpen > 0 ? <span className="font-semibold text-red-700">{w.criticalOpen}</span> : <span className="text-ink-500">0</span>}</td>
                  <td className="td">
                    <Sparkline values={w.weekly} label={`${w.ward} weekly reports: ${w.weekly.join(', ')}`} />
                    <span className="text-xs text-ink-500">{w.weekly.join(' · ')}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

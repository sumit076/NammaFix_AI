import { Fragment, useMemo, useState } from 'react';
import type { AgentResult, Analysis, Category, Department, DuplicateOutput, PriorityLevel, Status } from '../types';
import { CATEGORIES, DEPARTMENTS, PRIORITY_LEVELS, STATUSES } from '../types';
import { useStore } from '../state/store';
import { computeAnalytics } from '../lib/analytics';
import { OFFICERS, type IncidentView } from '../lib/engine';
import { haversineM } from '../lib/geo';
import { formatDate, formatDateTime, timeAgo } from '../lib/format';
import { textSimilarity } from '../agents/duplicate';
import { AgentPanel } from '../components/AgentPanel';
import { CategoryChip, DemoTag, PriorityBadge, StatusBadge } from '../components/Badges';
import { Icon } from '../components/Icons';

export function OfficerCentre() {
  const { officer } = useStore();
  return officer ? <Centre /> : <SignIn />;
}

function SignIn() {
  const { signIn } = useStore();
  return (
    <div className="mx-auto max-w-2xl">
      <section className="card p-6" aria-labelledby="signin-title">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-navy-900 text-white">
            <Icon name="shield" />
          </span>
          <div>
            <h1 id="signin-title" className="text-xl font-bold text-navy-900">
              Civic Officer Command Centre
            </h1>
            <p className="text-sm text-ink-500">Assignments and status changes require an authorised officer.</p>
          </div>
        </div>
        <p className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
          Demo sign-in: choose a sample officer profile. There is no password or real authentication in this prototype; a production system would use the corporation's SSO.
        </p>
        <ul className="mt-4 space-y-3">
          {OFFICERS.map((o) => (
            <li key={o.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-line p-4">
              <div>
                <p className="font-semibold text-ink-900">{o.name}</p>
                <p className="text-sm text-ink-500">{o.title}</p>
                <p className="mt-1 text-xs text-ink-500">Can approve: {o.departments.length === DEPARTMENTS.length ? 'all departments' : o.departments.join(', ')}</p>
              </div>
              <button className="btn-primary" onClick={() => signIn(o.id)}>
                Sign in as {o.name.split(' ')[0]}
              </button>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

function Kpi({ label, value, sub, tone }: { label: string; value: number | string; sub: string; tone: string }) {
  return (
    <div className="card p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-ink-500">{label}</p>
      <p className={`mt-1 text-3xl font-bold ${tone}`}>{value}</p>
      <p className="mt-0.5 text-xs text-ink-500">{sub}</p>
    </div>
  );
}

const LEVEL_RANK: Record<PriorityLevel, number> = { Critical: 0, High: 1, Medium: 2, Low: 3 };

function Centre() {
  const { complaints, now, resetDemo } = useStore();
  const a = useMemo(() => computeAnalytics(complaints, now), [complaints, now]);

  const [q, setQ] = useState('');
  const [cat, setCat] = useState<Category | ''>('');
  const [status, setStatus] = useState<Status | ''>('');
  const [prio, setPrio] = useState<PriorityLevel | ''>('');
  const [showDups, setShowDups] = useState(false);
  const [selected, setSelected] = useState<string | null>(() => {
    const latest = [...complaints].reverse().find((c) => c.source === 'citizen');
    return latest ? latest.duplicateOf ?? latest.id : null;
  });

  const rows = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return a.incidents
      .filter((i) => {
        if (cat && i.primary.category !== cat) return false;
        if (status && i.primary.status !== status) return false;
        if (prio && i.severity.output.level !== prio) return false;
        if (!needle) return true;
        return i.reports.some((r) => `${r.id} ${r.locality} ${r.address} ${r.description} ${r.category}`.toLowerCase().includes(needle));
      })
      .sort((x, y) => {
        const rx = x.primary.status === 'Resolved' ? 1 : 0;
        const ry = y.primary.status === 'Resolved' ? 1 : 0;
        return rx - ry || LEVEL_RANK[x.severity.output.level] - LEVEL_RANK[y.severity.output.level] || y.severity.output.score - x.severity.output.score;
      });
  }, [a.incidents, q, cat, status, prio]);

  const selectedView = a.incidents.find((i) => i.primary.id === selected) ?? null;
  const filtered = !!(q || cat || status || prio);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-navy-900">Civic Officer Command Centre</h1>
          <p className="text-sm text-ink-500">Review AI recommendations, approve department assignments and track resolution.</p>
        </div>
        <button
          className="btn-secondary px-3 py-1.5 text-xs"
          onClick={() => {
            if (window.confirm('Reset to the original synthetic demo data? Citizen submissions and officer changes will be removed.')) resetDemo();
          }}
        >
          <Icon name="refresh" className="h-4 w-4" /> Reset demo data
        </button>
      </div>

      <section aria-label="Key figures" className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Kpi label="Total issues" value={a.totalIncidents} sub={`${a.totalReports} reports · ${a.duplicatesConsolidated} consolidated`} tone="text-navy-900" />
        <Kpi label="Pending approval" value={a.pending} sub="Reported, awaiting an officer" tone="text-brand-600" />
        <Kpi label="Critical (open)" value={a.criticalOpen} sub="Priority score 75–100" tone="text-red-700" />
        <Kpi label="Resolved" value={a.resolved} sub={`${a.resolutionPct}% of all issues`} tone="text-green-700" />
      </section>

      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_26rem]">
        <section className="card overflow-hidden" aria-labelledby="table-title">
          <div className="space-y-3 border-b border-line p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 id="table-title" className="section-title">
                Complaint management{' '}
                <span className="font-normal text-ink-500">
                  ({rows.length} of {a.totalIncidents} incidents)
                </span>
              </h2>
              <label className="flex items-center gap-2 text-xs text-ink-700">
                <input type="checkbox" checked={showDups} onChange={(e) => setShowDups(e.target.checked)} className="h-4 w-4 accent-brand-600" />
                Show consolidated duplicate reports
              </label>
            </div>
            <div className="grid gap-3 sm:grid-cols-4">
              <div className="relative sm:col-span-2">
                <label htmlFor="q" className="sr-only">
                  Search complaints
                </label>
                <Icon name="search" className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-ink-300" />
                <input id="q" className="input pl-9" placeholder="Search ID, locality, description…" value={q} onChange={(e) => setQ(e.target.value)} />
              </div>
              <div>
                <label htmlFor="fc" className="sr-only">
                  Filter by category
                </label>
                <select id="fc" className="input" value={cat} onChange={(e) => setCat(e.target.value as Category | '')}>
                  <option value="">All categories</option>
                  {CATEGORIES.map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label htmlFor="fs" className="sr-only">
                    Filter by status
                  </label>
                  <select id="fs" className="input px-2" value={status} onChange={(e) => setStatus(e.target.value as Status | '')}>
                    <option value="">Any status</option>
                    {STATUSES.map((s) => (
                      <option key={s}>{s}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="fp" className="sr-only">
                    Filter by priority
                  </label>
                  <select id="fp" className="input px-2" value={prio} onChange={(e) => setPrio(e.target.value as PriorityLevel | '')}>
                    <option value="">Any priority</option>
                    {PRIORITY_LEVELS.map((p) => (
                      <option key={p}>{p}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[46rem] text-left">
              <caption className="sr-only">Civic complaints, sorted by priority. Select a row to see the AI recommendation.</caption>
              <thead className="bg-canvas">
                <tr>
                  <th scope="col" className="th">Incident</th>
                  <th scope="col" className="th">Issue &amp; location</th>
                  <th scope="col" className="th">Priority</th>
                  <th scope="col" className="th">Status</th>
                  <th scope="col" className="th">Department</th>
                  <th scope="col" className="th">Reports</th>
                  <th scope="col" className="th">First reported</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {rows.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-4 py-10 text-center text-sm text-ink-500">
                      {filtered ? 'No complaints match these filters.' : 'No complaints yet.'}
                    </td>
                  </tr>
                )}
                {rows.map((i) => (
                  <Fragment key={i.primary.id}>
                    <IncidentRow view={i} selected={selected === i.primary.id} onSelect={() => setSelected(i.primary.id)} now={now} />
                    {showDups &&
                      i.reports
                        .filter((r) => r.id !== i.primary.id)
                        .map((r) => (
                          <tr key={r.id} className="bg-canvas/60 text-ink-500">
                            <td className="td font-mono text-xs">
                              <span className="mr-1 text-ink-300">↳</span>
                              {r.id}
                            </td>
                            <td className="td text-xs" colSpan={3}>
                              Duplicate of <button className="font-mono font-semibold text-brand-700 hover:underline" onClick={() => setSelected(i.primary.id)}>{i.primary.id}</button> · {r.address} · “{r.description.slice(0, 70)}…”
                            </td>
                            <td className="td text-xs" colSpan={2}>{r.source === 'demo' ? <DemoTag /> : 'Citizen report'}</td>
                            <td className="td text-xs">{formatDate(r.reportedAt)}</td>
                          </tr>
                        ))}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <IncidentDetail view={selectedView} key={selectedView?.primary.id ?? 'none'} />
      </div>
    </div>
  );
}

function IncidentRow({ view, selected, onSelect, now }: { view: IncidentView; selected: boolean; onSelect: () => void; now: Date }) {
  const p = view.primary;
  const dups = view.reports.length - 1;
  return (
    <tr className={`cursor-pointer transition-colors hover:bg-brand-50/60 ${selected ? 'bg-brand-50' : ''}`} onClick={onSelect} aria-selected={selected}>
      <td className="td">
        <button
          className="font-mono text-xs font-semibold text-navy-800 underline-offset-2 hover:underline"
          onClick={(e) => {
            e.stopPropagation();
            onSelect();
          }}
          aria-label={`Open incident ${p.id}`}
        >
          {p.id}
        </button>
        <div className="mt-1 flex gap-1">{p.source === 'demo' ? <DemoTag /> : <span className="rounded bg-green-50 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-green-800">Live</span>}</div>
      </td>
      <td className="td">
        <CategoryChip category={p.category} />
        <p className="mt-1 text-xs text-ink-500">
          {p.locality} · {p.address}
        </p>
      </td>
      <td className="td">
        <PriorityBadge level={view.severity.output.level} score={view.severity.output.score} />
      </td>
      <td className="td">
        <StatusBadge status={p.status} />
      </td>
      <td className="td text-xs">{p.assignedDepartment ?? <span className="text-ink-500">Awaiting approval</span>}</td>
      <td className="td">
        {dups > 0 ? (
          <span className="inline-flex items-center gap-1 whitespace-nowrap rounded-full bg-brand-50 px-2 py-0.5 text-xs font-semibold text-brand-700 ring-1 ring-inset ring-brand-200" title={`${dups} duplicate report(s) consolidated`}>
            <Icon name="layers" className="h-3.5 w-3.5" /> {view.reports.length} reports
          </span>
        ) : (
          <span className="text-xs text-ink-500">1 report</span>
        )}
      </td>
      <td className="td whitespace-nowrap text-xs">
        {formatDate(view.firstReportedAt)}
        <span className="block text-ink-500">{timeAgo(view.firstReportedAt, now)}</span>
      </td>
    </tr>
  );
}

function IncidentDetail({ view }: { view: IncidentView | null }) {
  const { officer, approve, setStatus, now } = useStore();
  const [dept, setDept] = useState<Department>(view?.primary.assignedDepartment ?? view?.primary.analysis.routing.output.department ?? DEPARTMENTS[0]);

  if (!view) {
    return (
      <aside className="card p-8 text-center text-sm text-ink-500 xl:sticky xl:top-4">
        <Icon name="list" className="mx-auto mb-2 h-8 w-8 text-ink-300" />
        Select a complaint to see the AI recommendation, consolidated reports and approval controls.
      </aside>
    );
  }

  const p = view.primary;
  const approved = !!p.assignedDepartment;
  const recommended = p.analysis.routing.output.department;
  const resolved = p.status === 'Resolved';
  const authorised = !!officer && officer.departments.includes(dept);
  const image = view.reports.find((r) => r.image)?.image;

  // Incident-level duplicate stage: built from the consolidated reports so no reference is lost.
  const others = view.reports.filter((r) => r.id !== p.id);
  const dupResult: AgentResult<DuplicateOutput> =
    others.length > 0
      ? {
          ...p.analysis.duplicate,
          output: {
            ...p.analysis.duplicate.output,
            isDuplicate: true,
            incidentPrimaryId: p.id,
            mergedRootIds: [p.id],
            matches: others.map((r) => ({
              id: r.id,
              rootId: p.id,
              distanceM: haversineM(p.lat, p.lng, r.lat, r.lng),
              ageDays: Math.round(((now.getTime() - new Date(r.reportedAt).getTime()) / 86_400_000) * 10) / 10,
              textSimilarity: textSimilarity(p.description, r.description),
            })),
          },
          explanation: `${view.reports.length} reports of the same ${p.category.toLowerCase()} issue were consolidated into incident ${p.id}. All original complaint IDs are retained.`,
        }
      : {
          ...p.analysis.duplicate,
          explanation: `No similar open ${p.category.toLowerCase()} reports within ${p.analysis.duplicate.output.radiusM} m. Single-report incident.`,
        };
  const analysis: Analysis = { ...p.analysis, duplicate: dupResult, severity: view.severity, action: view.action };

  return (
    <aside className="card xl:sticky xl:top-4 xl:max-h-[calc(100vh-2rem)] xl:overflow-y-auto" aria-label={`Incident ${p.id} details`}>
      <div className="space-y-2 border-b border-line p-4">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="font-mono text-base font-bold text-navy-900">{p.id}</h2>
          {p.source === 'demo' ? <DemoTag /> : <span className="rounded bg-green-50 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-green-800">Live</span>}
          <PriorityBadge level={view.severity.output.level} score={view.severity.output.score} />
          <StatusBadge status={p.status} />
        </div>
        <CategoryChip category={p.category} />
        <p className="text-sm text-ink-700">
          {p.locality} · {p.address}
        </p>
      </div>

      <div className="space-y-6 p-4">
        {image && <img src={image.dataUrl} alt={`Citizen photo for ${p.id}`} className="h-40 w-full rounded-lg object-cover" />}

        <section aria-labelledby="reports-title">
          <h3 id="reports-title" className="mb-2 text-sm font-semibold text-navy-900">
            {view.reports.length > 1 ? `Consolidated reports (${view.reports.length})` : 'Original report'}
          </h3>
          <ul className="space-y-2">
            {view.reports.map((r) => (
              <li key={r.id} className="rounded-lg border border-line p-3 text-sm">
                <div className="flex flex-wrap items-center justify-between gap-1 text-xs text-ink-500">
                  <span className="font-mono font-semibold text-navy-800">
                    {r.id}
                    {r.id === p.id && <span className="ml-1 font-sans font-normal text-ink-500">(primary)</span>}
                  </span>
                  <span>
                    {r.reporterName} · {formatDateTime(r.reportedAt)}
                  </span>
                </div>
                <p className="mt-1 text-ink-700">{r.description}</p>
              </li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="ai-title">
          <h3 id="ai-title" className="mb-3 text-sm font-semibold text-navy-900">
            AI recommendation
          </h3>
          <AgentPanel analysis={analysis} />
        </section>

        <section aria-labelledby="approve-title" className="rounded-lg border border-navy-800/20 bg-canvas p-4">
          <h3 id="approve-title" className="text-sm font-semibold text-navy-900">
            Human approval · department assignment
          </h3>
          {approved ? (
            <div className="mt-2 text-sm text-ink-700">
              <p>
                Assigned to <span className="font-semibold text-ink-900">{p.assignedDepartment}</span>
              </p>
              <p className="text-xs text-ink-500">
                Approved by {p.approvedBy} · {p.approvedAt && formatDateTime(p.approvedAt)}
              </p>
            </div>
          ) : (
            <div className="mt-2 space-y-3">
              <div>
                <label htmlFor="dept" className="label">
                  Department
                </label>
                <select id="dept" className="input" value={dept} onChange={(e) => setDept(e.target.value as Department)}>
                  {DEPARTMENTS.map((d) => (
                    <option key={d} value={d}>
                      {d}
                      {d === recommended ? ' (AI recommended)' : ''}
                    </option>
                  ))}
                </select>
                {dept !== recommended && <p className="mt-1 text-xs text-amber-800">You are overriding the AI recommendation ({recommended}).</p>}
                {officer && !authorised && <p className="mt-1 text-xs text-red-700">{officer.name} is not authorised for this department; approval will be rejected.</p>}
              </div>
              <button className="btn-primary w-full" disabled={resolved} onClick={() => approve(p.id, dept)}>
                <Icon name="check" className="h-4 w-4" /> Approve recommendation &amp; assign
              </button>
            </div>
          )}
        </section>

        <section aria-labelledby="status-title">
          <h3 id="status-title" className="mb-2 text-sm font-semibold text-navy-900">
            Status management
          </h3>
          <div role="group" aria-label="Set status" className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {STATUSES.map((s) => {
              const current = p.status === s;
              const disabled = s === 'Reported' || !approved;
              return (
                <button
                  key={s}
                  aria-pressed={current}
                  disabled={disabled && !current}
                  onClick={() => !current && setStatus(p.id, s)}
                  className={`rounded-lg border px-2 py-2 text-xs font-semibold transition-colors disabled:cursor-not-allowed ${
                    current ? 'border-navy-900 bg-navy-900 text-white' : 'border-line bg-white text-ink-700 hover:bg-canvas disabled:opacity-40'
                  }`}
                >
                  {s}
                </button>
              );
            })}
          </div>
          {!approved && <p className="mt-2 text-xs text-ink-500">Approve a department assignment to unlock status changes.</p>}
        </section>

        <section aria-labelledby="hist-title">
          <h3 id="hist-title" className="mb-2 text-sm font-semibold text-navy-900">
            Audit trail
          </h3>
          <ol className="space-y-2 border-l-2 border-line pl-3">
            {[...p.history].reverse().map((h, i) => (
              <li key={i} className="text-xs text-ink-700">
                <span className="text-ink-500">
                  {formatDateTime(h.at)} · {h.actor}
                </span>
                <br />
                {h.text}
              </li>
            ))}
          </ol>
        </section>
      </div>
    </aside>
  );
}

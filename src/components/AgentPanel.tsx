import type { Analysis } from '../types';
import { PriorityBadge, SimTag } from './Badges';

function Stage({ n, title, explanation, children, delay }: { n: number; title: string; explanation: string; children?: React.ReactNode; delay: number }) {
  return (
    <li className="rise flex gap-3" style={{ animationDelay: `${delay}ms` }}>
      <div className="flex flex-col items-center">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-navy-900 text-xs font-bold text-white">{n}</span>
        <span className="mt-1 w-px flex-1 bg-line" aria-hidden="true" />
      </div>
      <div className="min-w-0 flex-1 pb-4">
        <div className="flex flex-wrap items-center gap-2">
          <h4 className="text-sm font-semibold text-navy-900">{title}</h4>
          <SimTag />
        </div>
        <p className="mt-1 text-sm text-ink-700">{explanation}</p>
        {children && <div className="mt-2">{children}</div>}
      </div>
    </li>
  );
}

/** Renders every agent's structured output + explanation, in pipeline order. */
export function AgentPanel({ analysis, animate = false }: { analysis: Analysis; animate?: boolean }) {
  const { classification: c, duplicate: d, severity: s, routing: r, action: a } = analysis;
  const step = (i: number) => (animate ? i * 220 : 0);
  return (
    <ol className="list-none">
      <Stage n={1} title={c.agent} explanation={c.explanation} delay={step(0)}>
        <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-ink-700 sm:grid-cols-3">
          <div><dt className="text-ink-500">Category</dt><dd className="font-semibold text-ink-900">{c.output.category ?? 'Unclassified'}</dd></div>
          <div><dt className="text-ink-500">Heuristic match score</dt><dd className="font-semibold text-ink-900">{c.output.confidence}%</dd></div>
          <div><dt className="text-ink-500">Citizen selected</dt><dd className="font-semibold text-ink-900">{c.output.citizenCategory || '—'}</dd></div>
        </dl>
        <p className="mt-1 text-xs text-ink-500">{c.output.imageSignal}</p>
      </Stage>

      <Stage n={2} title={d.agent} explanation={d.explanation} delay={step(1)}>
        {d.output.matches.length > 0 && (
          <ul className="divide-y divide-line rounded-lg border border-line text-xs">
            {d.output.matches.map((m) => (
              <li key={m.id} className="flex flex-wrap items-center justify-between gap-2 px-3 py-1.5">
                <span className="font-mono font-semibold text-navy-800">{m.id}</span>
                <span className="text-ink-500">
                  {m.distanceM} m away · {m.ageDays} d old · text similarity {m.textSimilarity}%
                </span>
              </li>
            ))}
          </ul>
        )}
      </Stage>

      <Stage n={3} title={s.agent} explanation={s.explanation} delay={step(2)}>
        <div className="mb-2 flex items-center gap-2">
          <PriorityBadge level={s.output.level} score={s.output.score} />
          <span className="text-xs text-ink-500">of 100 · {s.output.reportCount} report{s.output.reportCount > 1 ? 's' : ''}</span>
        </div>
        <ul className="space-y-1.5">
          {s.output.factors.map((f) => (
            <li key={f.key} className="text-xs">
              <div className="flex justify-between text-ink-700">
                <span>
                  {f.label} <span className="text-ink-500">({Math.round(f.weight * 100)}%)</span>
                </span>
                <span className="font-semibold text-ink-900">
                  {f.value} → +{f.contribution}
                </span>
              </div>
              <div className="mt-0.5 h-1.5 overflow-hidden rounded-full bg-line" role="img" aria-label={`${f.label}: ${f.value} out of 100`}>
                <div className="h-full rounded-full bg-brand-600" style={{ width: `${f.value}%` }} />
              </div>
              <p className="mt-0.5 text-ink-500">{f.reason}</p>
            </li>
          ))}
        </ul>
      </Stage>

      <Stage n={4} title={r.agent} explanation={r.explanation} delay={step(3)}>
        <p className="text-xs text-ink-700">
          Recommended: <span className="font-semibold text-ink-900">{r.output.office}</span>
        </p>
      </Stage>

      <li className="rise flex gap-3" style={{ animationDelay: `${step(4)}ms` }}>
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-navy-900 text-xs font-bold text-white">5</span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h4 className="text-sm font-semibold text-navy-900">{a.agent}</h4>
            <SimTag />
          </div>
          <div className="mt-1 rounded-lg border border-brand-200 bg-brand-50 p-3">
            <p className="text-sm font-semibold text-navy-900">{a.output.headline}</p>
            <ul className="mt-1.5 list-inside list-disc space-y-0.5 text-xs text-ink-700">
              {a.output.steps.map((x) => (
                <li key={x}>{x}</li>
              ))}
            </ul>
            <p className="mt-2 text-xs font-medium text-navy-800">Human approval required: an authorised officer must approve before assignment.</p>
          </div>
        </div>
      </li>
    </ol>
  );
}

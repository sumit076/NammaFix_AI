/** Dependency-free SVG/CSS charts. */

export function HBars({ rows, max }: { rows: { label: string; value: number; color: string; sub?: string }[]; max?: number }) {
  const m = max ?? Math.max(1, ...rows.map((r) => r.value));
  return (
    <ul className="space-y-3">
      {rows.map((r) => (
        <li key={r.label}>
          <div className="mb-1 flex justify-between text-sm">
            <span className="font-medium text-ink-900">{r.label}</span>
            <span className="text-ink-700">
              <span className="font-semibold text-ink-900">{r.value}</span>
              {r.sub && <span className="ml-1 text-xs text-ink-500">{r.sub}</span>}
            </span>
          </div>
          <div className="h-2.5 overflow-hidden rounded-full bg-canvas" role="img" aria-label={`${r.label}: ${r.value}`}>
            <div className="h-full rounded-full transition-all duration-500" style={{ width: `${(r.value / m) * 100}%`, background: r.color }} />
          </div>
        </li>
      ))}
    </ul>
  );
}

export function Donut({ slices, centerLabel, centerValue }: { slices: { label: string; value: number; color: string }[]; centerLabel: string; centerValue: string | number }) {
  const total = slices.reduce((s, x) => s + x.value, 0);
  const r = 52;
  const c = 2 * Math.PI * r;
  let offset = 0;
  return (
    <div className="flex flex-wrap items-center gap-6">
      <svg viewBox="0 0 140 140" className="h-36 w-36 shrink-0" role="img" aria-label={`${centerLabel}: ${slices.map((s) => `${s.label} ${s.value}`).join(', ')}`}>
        <circle cx="70" cy="70" r={r} fill="none" stroke="#eef1f5" strokeWidth="18" />
        {total > 0 &&
          slices.map((s) => {
            const len = (s.value / total) * c;
            const el = (
              <circle
                key={s.label}
                cx="70"
                cy="70"
                r={r}
                fill="none"
                stroke={s.color}
                strokeWidth="18"
                strokeDasharray={`${len} ${c - len}`}
                strokeDashoffset={-offset}
                transform="rotate(-90 70 70)"
              />
            );
            offset += len;
            return el;
          })}
        <text x="70" y="68" textAnchor="middle" className="fill-navy-900 text-[22px] font-bold">
          {centerValue}
        </text>
        <text x="70" y="86" textAnchor="middle" className="fill-ink-500 text-[9px]">
          {centerLabel}
        </text>
      </svg>
      <ul className="space-y-1.5 text-sm">
        {slices.map((s) => (
          <li key={s.label} className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-sm" style={{ background: s.color }} aria-hidden="true" />
            <span className="text-ink-700">{s.label}</span>
            <span className="font-semibold text-ink-900">{s.value}</span>
            <span className="text-xs text-ink-500">({total ? Math.round((s.value / total) * 100) : 0}%)</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function Sparkline({ values, label }: { values: number[]; label: string }) {
  const w = 96;
  const h = 28;
  const max = Math.max(1, ...values);
  const bw = w / values.length;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="h-7 w-24" role="img" aria-label={label}>
      {values.map((v, i) => {
        const bh = Math.max(v > 0 ? 3 : 1, (v / max) * (h - 2));
        const last = i === values.length - 1;
        return <rect key={i} x={i * bw + 1.5} y={h - bh} width={bw - 3} height={bh} rx="1.5" fill={last ? '#1f5ccc' : v > 0 ? '#9db8e6' : '#e4e7ec'} />;
      })}
    </svg>
  );
}

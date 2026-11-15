const DAY = 86_400_000;

export const daysBetween = (fromIso: string, to: Date | string): number =>
  Math.max(0, (new Date(to).getTime() - new Date(fromIso).getTime()) / DAY);

export const addDays = (iso: string, days: number): string => new Date(new Date(iso).getTime() + days * DAY).toISOString();

export const formatDate = (iso: string): string =>
  new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

export const formatDateTime = (iso: string): string =>
  new Date(iso).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });

export function timeAgo(iso: string, now: Date = new Date()): string {
  const d = daysBetween(iso, now);
  if (d < 1 / 24) return 'just now';
  if (d < 1) return `${Math.floor(d * 24)} h ago`;
  const days = Math.floor(d);
  return days === 1 ? '1 day ago' : `${days} days ago`;
}

export const formatDays = (d: number): string => (d < 1 ? `${Math.round(d * 24)} h` : `${d.toFixed(1)} days`);

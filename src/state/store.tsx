import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { Complaint, Department, DraftComplaint, Officer, Status } from '../types';
import { buildSeedComplaints } from '../data/seed';
import { approveAssignment, EngineError, ingestComplaint, OFFICERS, setIncidentStatus } from '../lib/engine';
import { useToast } from './toast';

const KEY = 'nammafix-ai:v1';

interface Persisted {
  complaints: Complaint[];
  officerId: string | null;
}

function load(): Persisted {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const p = JSON.parse(raw) as Persisted;
      if (Array.isArray(p.complaints) && p.complaints.length) return p;
    }
  } catch {
    /* corrupt storage → fall through to fresh demo data */
  }
  return { complaints: buildSeedComplaints(new Date()), officerId: null };
}

export type SubmitResult =
  | { ok: true; created: Complaint; merged: boolean }
  | { ok: false; error: string };

interface Store {
  complaints: Complaint[];
  officer: Officer | null;
  now: Date;
  submit: (draft: DraftComplaint) => SubmitResult;
  approve: (id: string, department: Department) => boolean;
  setStatus: (id: string, status: Status) => boolean;
  signIn: (officerId: string) => void;
  signOut: () => void;
  resetDemo: () => void;
}

const Ctx = createContext<Store | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const { notify } = useToast();
  const [state, setState] = useState<Persisted>(load);
  const [now, setNow] = useState(() => new Date());

  // Persist on every change (images are down-scaled before they get here).
  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(state));
    } catch {
      notify('error', 'Could not save to browser storage', 'Your changes work for this session but may not survive a refresh.');
    }
  }, [state, notify]);

  // Keep "unresolved duration" fresh while the app stays open.
  useEffect(() => {
    const t = window.setInterval(() => setNow(new Date()), 60_000);
    return () => window.clearInterval(t);
  }, []);

  const officer = useMemo(() => OFFICERS.find((o) => o.id === state.officerId) ?? null, [state.officerId]);

  const fail = useCallback(
    (e: unknown, title: string) => {
      notify('error', title, e instanceof EngineError ? e.message : 'Unexpected error. Please try again.');
      return false as const;
    },
    [notify],
  );

  const submit = useCallback(
    (draft: DraftComplaint): SubmitResult => {
      try {
        const at = new Date();
        const res = ingestComplaint(state.complaints, draft, { now: at, source: 'citizen' });
        setState((s) => ({ ...s, complaints: res.complaints }));
        setNow(at);
        notify(
          'success',
          `Complaint ${res.created.id} submitted`,
          res.merged ? 'AI found similar open reports and consolidated them into one incident.' : 'AI analysis complete. Officers can now review it.',
        );
        return { ok: true, created: res.created, merged: res.merged };
      } catch (e) {
        fail(e, 'Could not submit complaint');
        return { ok: false, error: e instanceof EngineError ? e.message : 'Unexpected error.' };
      }
    },
    [state.complaints, notify, fail],
  );

  const approve = useCallback(
    (id: string, department: Department) => {
      try {
        const next = approveAssignment(state.complaints, id, department, officer, new Date());
        setState((s) => ({ ...s, complaints: next }));
        notify('success', 'Assignment approved', `${id} assigned to ${department}.`);
        return true;
      } catch (e) {
        return fail(e, 'Approval failed');
      }
    },
    [state.complaints, officer, notify, fail],
  );

  const setStatus = useCallback(
    (id: string, status: Status) => {
      try {
        const next = setIncidentStatus(state.complaints, id, status, officer, new Date());
        setState((s) => ({ ...s, complaints: next }));
        setNow(new Date());
        notify('success', 'Status updated', `${id} is now ${status}.`);
        return true;
      } catch (e) {
        return fail(e, 'Status update failed');
      }
    },
    [state.complaints, officer, notify, fail],
  );

  const signIn = useCallback(
    (officerId: string) => {
      setState((s) => ({ ...s, officerId }));
      const o = OFFICERS.find((x) => x.id === officerId);
      if (o) notify('info', `Signed in as ${o.name}`, o.title);
    },
    [notify],
  );
  const signOut = useCallback(() => setState((s) => ({ ...s, officerId: null })), []);

  const resetDemo = useCallback(() => {
    setState((s) => ({ complaints: buildSeedComplaints(new Date()), officerId: s.officerId }));
    setNow(new Date());
    notify('info', 'Demo data reset', 'Synthetic sample complaints restored; citizen submissions removed.');
  }, [notify]);

  const value = useMemo<Store>(
    () => ({ complaints: state.complaints, officer, now, submit, approve, setStatus, signIn, signOut, resetDemo }),
    [state.complaints, officer, now, submit, approve, setStatus, signIn, signOut, resetDemo],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useStore(): Store {
  const c = useContext(Ctx);
  if (!c) throw new Error('useStore must be used inside StoreProvider');
  return c;
}

import { useMemo, useRef, useState, type FormEvent } from 'react';
import type { Category, Complaint, DraftComplaint, StoredImage } from '../types';
import { CATEGORIES } from '../types';
import { LOCALITIES, getLandmark, getLocality } from '../data/localities';
import { useStore } from '../state/store';
import { useToast } from '../state/toast';
import { readImage } from '../lib/image';
import { effectiveStatus } from '../lib/engine';
import { rootOf } from '../agents/duplicate';
import { formatDateTime } from '../lib/format';
import { AgentPanel } from '../components/AgentPanel';
import { CategoryChip, PriorityBadge, StatusBadge } from '../components/Badges';
import { Icon } from '../components/Icons';

const DEMO_TEXT =
  'Deep pothole on KHB Colony main road near the 5th Block junction. Two-wheelers are skidding and an elderly person fell here last night. Vehicles swerve into oncoming traffic to avoid it.';

interface Errors {
  description?: string;
  locality?: string;
  image?: string;
}

export function CitizenPortal() {
  const { submit, complaints } = useStore();
  const { notify } = useToast();
  const [name, setName] = useState('');
  const [category, setCategory] = useState<Category | ''>('');
  const [locality, setLocality] = useState('');
  const [landmarkId, setLandmarkId] = useState('');
  const [address, setAddress] = useState('');
  const [description, setDescription] = useState('');
  const [image, setImage] = useState<StoredImage | undefined>();
  const [errors, setErrors] = useState<Errors>({});
  const [result, setResult] = useState<{ created: Complaint; merged: boolean } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const loc = getLocality(locality);
  const lm = getLandmark(locality, landmarkId);

  const onLocality = (v: string) => {
    setLocality(v);
    setLandmarkId(getLocality(v)?.landmarks[0]?.id ?? '');
  };

  const onFile = async (file?: File) => {
    if (!file) return;
    try {
      setImage(await readImage(file));
      setErrors((e) => ({ ...e, image: undefined }));
    } catch (err) {
      setImage(undefined);
      if (fileRef.current) fileRef.current.value = '';
      const msg = err instanceof Error ? err.message : 'Could not read image.';
      setErrors((e) => ({ ...e, image: msg }));
      notify('error', 'Image rejected', msg);
    }
  };

  const clearImage = () => {
    setImage(undefined);
    if (fileRef.current) fileRef.current.value = '';
  };

  const fillDemo = () => {
    setName('Priya (demo)');
    setCategory('Pothole');
    onLocality('Koramangala');
    setLandmarkId('kor-khb');
    setAddress('KHB Colony Main Road, near 5th Block junction');
    setDescription(DEMO_TEXT);
    setErrors({});
    notify('info', 'Sample pothole report loaded', 'Review the details and press Submit to run the AI agents.');
  };

  const reset = () => {
    setName('');
    setCategory('');
    setLocality('');
    setLandmarkId('');
    setAddress('');
    setDescription('');
    clearImage();
    setErrors({});
  };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    const next: Errors = {};
    if (!locality || !landmarkId) next.locality = 'Select the locality and the nearest landmark.';
    if (description.trim().length < 15) next.description = 'Please describe the issue in at least 15 characters.';
    setErrors(next);
    if (Object.keys(next).length) {
      notify('error', 'Please fix the highlighted fields');
      return;
    }
    const draft: DraftComplaint = { reporterName: name, citizenCategory: category, description, locality, landmarkId, address, image };
    const res = submit(draft);
    if (res.ok) {
      setResult({ created: res.created, merged: res.merged });
      reset();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      setErrors({ description: res.error });
    }
  };

  return (
    <div className="space-y-6">
      <section className="rounded-xl bg-gradient-to-r from-navy-900 to-navy-700 px-6 py-6 text-white">
        <p className="text-xs font-semibold uppercase tracking-widest text-blue-200">Citizen Reporting Portal</p>
        <h1 className="mt-1 text-2xl font-bold sm:text-3xl">Report Less. Resolve Smarter. Build a Better Bengaluru.</h1>
        <p className="mt-2 max-w-3xl text-sm text-blue-100">
          Report a pothole, garbage, broken streetlight or waterlogging. Agents classify your report, check for duplicates, score its urgency and recommend a department; a civic officer
          then approves the assignment.
        </p>
      </section>

      {result && <ResultCard result={result} onClose={() => setResult(null)} />}

      <div className="grid gap-6 lg:grid-cols-5">
        <form onSubmit={onSubmit} noValidate className="card space-y-5 p-5 lg:col-span-3" aria-labelledby="form-title">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 id="form-title" className="section-title">
              Report a civic issue
            </h2>
            <button type="button" onClick={fillDemo} className="btn-secondary px-3 py-1.5 text-xs">
              Load sample pothole report
            </button>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="name" className="label">
                Your name <span className="font-normal text-ink-500">(optional)</span>
              </label>
              <input id="name" className="input" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" />
            </div>
            <div>
              <label htmlFor="category" className="label">
                Issue category
              </label>
              <select id="category" className="input" value={category} onChange={(e) => setCategory(e.target.value as Category | '')}>
                <option value="">Not sure – let the AI decide</option>
                {CATEGORIES.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="locality" className="label">
                Locality
              </label>
              <select
                id="locality"
                className="input"
                value={locality}
                onChange={(e) => onLocality(e.target.value)}
                aria-invalid={!!errors.locality}
                aria-describedby={errors.locality ? 'loc-err' : undefined}
              >
                <option value="">Select locality…</option>
                {LOCALITIES.map((l) => (
                  <option key={l.name}>{l.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="landmark" className="label">
                Nearest landmark
              </label>
              <select id="landmark" className="input" value={landmarkId} onChange={(e) => setLandmarkId(e.target.value)} disabled={!loc} aria-invalid={!!errors.locality}>
                {!loc && <option value="">Select a locality first</option>}
                {loc?.landmarks.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          {errors.locality && (
            <p id="loc-err" className="-mt-3 text-sm text-red-700">
              {errors.locality}
            </p>
          )}
          {lm && (
            <p className="-mt-2 flex items-center gap-1.5 text-xs text-ink-500">
              <Icon name="pin" className="h-3.5 w-3.5" />
              Approx. coordinates {lm.lat.toFixed(4)}, {lm.lng.toFixed(4)} – used for duplicate detection (landmark lookup; no live GPS or geocoding).
            </p>
          )}

          <div>
            <label htmlFor="address" className="label">
              Street / exact spot <span className="font-normal text-ink-500">(optional)</span>
            </label>
            <input id="address" className="input" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="e.g. In front of the bus stop" />
          </div>

          <div>
            <label htmlFor="desc" className="label">
              Describe the issue
            </label>
            <textarea
              id="desc"
              rows={4}
              className="input"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What is wrong, how bad is it, and who is at risk?"
              aria-invalid={!!errors.description}
              aria-describedby={errors.description ? 'desc-err' : 'desc-help'}
            />
            {errors.description ? (
              <p id="desc-err" role="alert" className="mt-1 text-sm text-red-700">
                {errors.description}
              </p>
            ) : (
              <p id="desc-help" className="mt-1 text-xs text-ink-500">
                Mention hazards (e.g. “two-wheelers”, “night”, “school nearby”) – they raise the safety-risk score.
              </p>
            )}
          </div>

          <div>
            <span className="label">
              Photo <span className="font-normal text-ink-500">(optional)</span>
            </span>
            {image ? (
              <div className="flex items-start gap-4 rounded-lg border border-line p-3">
                <img src={image.dataUrl} alt="Preview of the uploaded issue" className="h-24 w-32 rounded-md object-cover" />
                <div className="min-w-0 flex-1 text-sm">
                  <p className="truncate font-medium text-ink-900">{image.meta.name}</p>
                  <p className="text-xs text-ink-500">
                    {image.meta.width}×{image.meta.height} · {image.meta.sizeKB} KB
                  </p>
                  <p className="mt-1 text-xs text-ink-500">The simulated classifier only reads file metadata – it does not analyse image pixels.</p>
                  <button type="button" onClick={clearImage} className="mt-2 text-xs font-semibold text-red-700 hover:underline">
                    Remove photo
                  </button>
                </div>
              </div>
            ) : (
              <label
                htmlFor="photo"
                className="flex cursor-pointer flex-col items-center gap-1 rounded-lg border-2 border-dashed border-[#cfd4dc] px-4 py-6 text-center text-sm text-ink-700 hover:border-brand-600 hover:bg-brand-50"
              >
                <Icon name="upload" className="h-6 w-6 text-brand-600" />
                <span className="font-medium">Click to upload a photo</span>
                <span className="text-xs text-ink-500">JPG, PNG or WebP · up to 10 MB</span>
              </label>
            )}
            <input id="photo" ref={fileRef} type="file" accept="image/*" className="sr-only" onChange={(e) => onFile(e.target.files?.[0])} />
            {errors.image && (
              <p role="alert" className="mt-1 text-sm text-red-700">
                {errors.image}
              </p>
            )}
          </div>

          <div className="flex flex-wrap justify-end gap-3 border-t border-line pt-4">
            <button type="button" onClick={reset} className="btn-secondary">
              Clear form
            </button>
            <button type="submit" className="btn-primary">
              <Icon name="check" className="h-4 w-4" /> Submit &amp; run AI analysis
            </button>
          </div>
        </form>

        <aside className="space-y-6 lg:col-span-2">
          <HowItWorks />
          <TrackComplaint complaints={complaints} />
        </aside>
      </div>
    </div>
  );
}

function ResultCard({ result, onClose }: { result: { created: Complaint; merged: boolean }; onClose: () => void }) {
  const { created, merged } = result;
  const a = created.analysis;
  return (
    <section className="card rise overflow-hidden border-green-300" aria-live="polite" aria-label="Submission confirmation">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-green-200 bg-green-50 px-5 py-4">
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-green-600 text-white">
            <Icon name="check" className="h-5 w-5" />
          </span>
          <div>
            <p className="text-sm font-semibold text-green-900">Complaint submitted successfully</p>
            <p className="text-sm text-green-900">
              Your complaint ID: <span className="font-mono text-base font-bold">{created.id}</span>
            </p>
          </div>
        </div>
        <button onClick={onClose} className="btn-secondary px-3 py-1.5 text-xs">
          Dismiss
        </button>
      </div>
      <div className="grid gap-6 p-5 lg:grid-cols-5">
        <div className="space-y-4 lg:col-span-2">
          <dl className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <dt className="text-xs text-ink-500">AI classification</dt>
              <dd className="mt-0.5">
                <CategoryChip category={created.category} />
              </dd>
            </div>
            <div>
              <dt className="text-xs text-ink-500">Priority</dt>
              <dd className="mt-0.5">
                <PriorityBadge level={a.severity.output.level} score={a.severity.output.score} />
              </dd>
            </div>
            <div>
              <dt className="text-xs text-ink-500">Location</dt>
              <dd className="mt-0.5 font-medium text-ink-900">
                {created.locality}
                <span className="block text-xs font-normal text-ink-500">{created.address}</span>
              </dd>
            </div>
            <div>
              <dt className="text-xs text-ink-500">Status</dt>
              <dd className="mt-0.5">
                <StatusBadge status="Reported" />
              </dd>
            </div>
          </dl>
          {merged ? (
            <div className="rounded-lg border border-brand-200 bg-brand-50 p-3 text-sm text-navy-900">
              <p className="flex items-center gap-2 font-semibold">
                <Icon name="layers" className="h-4 w-4" /> Duplicate reports consolidated
              </p>
              <p className="mt-1 text-xs text-ink-700">
                {a.duplicate.output.matches.length} similar open report{a.duplicate.output.matches.length > 1 ? 's were' : ' was'} found nearby and grouped into incident{' '}
                <span className="font-mono font-semibold">{created.duplicateOf}</span>. Your original reference <span className="font-mono font-semibold">{created.id}</span> is kept.
              </p>
            </div>
          ) : (
            <p className="rounded-lg border border-line bg-canvas p-3 text-xs text-ink-700">No similar open report nearby – this is registered as a new incident.</p>
          )}
          <a href="#/officer" className="btn-brand w-full">
            View in Officer Command Centre <Icon name="chevron" className="h-4 w-4" />
          </a>
        </div>
        <div className="lg:col-span-3">
          <h3 className="mb-3 text-sm font-semibold text-navy-900">AI analysis pipeline</h3>
          <AgentPanel analysis={a} animate />
        </div>
      </div>
    </section>
  );
}

function HowItWorks() {
  const steps = ['You report the issue', 'Agents classify it and look for duplicates', 'Severity is scored and a department recommended', 'An officer approves the assignment', 'Work is tracked until resolved'];
  return (
    <section className="card p-5" aria-labelledby="how-title">
      <h2 id="how-title" className="section-title">
        How it works
      </h2>
      <ol className="mt-3 space-y-2.5">
        {steps.map((s, i) => (
          <li key={s} className="flex items-start gap-3 text-sm text-ink-700">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-50 text-xs font-bold text-brand-700">{i + 1}</span>
            {s}
          </li>
        ))}
      </ol>
    </section>
  );
}

function TrackComplaint({ complaints }: { complaints: Complaint[] }) {
  const [q, setQ] = useState('');
  const [submitted, setSubmitted] = useState('');
  const found = useMemo(() => (submitted ? complaints.find((c) => c.id.toLowerCase() === submitted.toLowerCase()) : undefined), [submitted, complaints]);
  const root = found ? rootOf(found, complaints) : undefined;

  return (
    <section className="card p-5" aria-labelledby="track-title">
      <h2 id="track-title" className="section-title">
        Track a complaint
      </h2>
      <form
        className="mt-3 flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          setSubmitted(q.trim());
        }}
      >
        <label htmlFor="track" className="sr-only">
          Complaint ID
        </label>
        <input id="track" className="input font-mono" placeholder="e.g. NF-DEMO-0001" value={q} onChange={(e) => setQ(e.target.value)} />
        <button className="btn-primary" type="submit">
          Track
        </button>
      </form>
      {submitted && !found && (
        <p role="alert" className="mt-3 text-sm text-red-700">
          No complaint found with ID “{submitted}”.
        </p>
      )}
      {found && root && (
        <div className="mt-4 space-y-3 text-sm">
          <div className="flex flex-wrap items-center gap-2">
            <CategoryChip category={found.category} />
            <StatusBadge status={effectiveStatus(found, complaints)} />
          </div>
          <p className="text-xs text-ink-500">
            {found.locality} · {found.address}
            {found.duplicateOf && (
              <>
                {' '}
                · consolidated into <span className="font-mono">{found.duplicateOf}</span>
              </>
            )}
          </p>
          <p className="text-ink-700">
            Department: <span className="font-medium text-ink-900">{root.assignedDepartment ?? 'Awaiting officer approval'}</span>
          </p>
          <ul className="space-y-1.5 border-l-2 border-line pl-3">
            {found.history.map((h, i) => (
              <li key={i} className="text-xs text-ink-700">
                <span className="text-ink-500">{formatDateTime(h.at)}</span> – {h.text}
              </li>
            ))}
            {found.duplicateOf &&
              root.history
                .filter((h) => h.actor !== 'Citizen' && !h.actor.startsWith('AI'))
                .map((h, i) => (
                  <li key={`r${i}`} className="text-xs text-ink-700">
                    <span className="text-ink-500">{formatDateTime(h.at)}</span> – {h.text}
                  </li>
                ))}
          </ul>
        </div>
      )}
    </section>
  );
}

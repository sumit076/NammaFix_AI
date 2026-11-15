# NammaFix AI – Bengaluru Civic Intelligence Platform

**Report Less. Resolve Smarter. Build a Better Bengaluru.**

An agentic civic-issue management prototype that connects citizens and civic officers:

> Citizen reports an issue → AI analyses it → duplicates are detected → severity is calculated → department is recommended → officer approves → issue is resolved → impact dashboard updates.

> **Prototype notice.** All sample complaints are **synthetic demonstration data**. The "AI" is a **transparent, rule-based simulation** – no LLM, vision model or external API is connected, and none is claimed. Localities, landmark coordinates, zone mapping and scoring baselines are approximate and illustrative.

## Run it

```bash
npm install
npm run dev          # http://127.0.0.1:5173
npm test             # unit + scenario tests (vitest)
npm run build        # typecheck + production build
```

Requires Node 18+. No backend, database, cloud account or API key is needed. State is stored in the browser's `localStorage` (key `nammafix-ai:v1`); use **Reset demo data** in the Officer Command Centre to restore the original sample data.

## Screens

| Route | Screen | What it does |
| --- | --- | --- |
| `#/report` | Citizen Portal | Submission form (category, locality + landmark, description, photo with preview), validation, unique complaint ID, AI result, complaint tracking by ID |
| `#/officer` | Officer Command Centre | Demo officer sign-in, KPI cards, search + category/status/priority filters, duplicate grouping, AI recommendation panel, department approval, status management, audit trail |
| `#/impact` | City Impact Dashboard | Category and priority charts, workflow status, duplicate consolidation, resolution %, average resolution time, ward-wise 6-week trends – all computed from live state |

## Agentic workflow (`src/agents`)

Every agent is a pure function returning `{ agent, stage, mode, output, explanation }`.

1. **Classification Agent** – keyword rules over the description (+ image *metadata* such as file name). Flags disagreement with the citizen's category for officer review.
2. **Duplicate Detection Agent** – same category, within 250 m, reported in the last 30 days, incident not resolved. Matching incidents are merged into the oldest one; every original complaint ID is kept (`duplicateOf` / `duplicateIds`).
3. **Severity Assessment Agent** – `Priority = 35% Safety Risk + 25% Public Importance + 25% Affected Population + 15% Unresolved Duration` → Critical ≥ 75, High 50–74, Medium 25–49, Low < 25. Priority is re-assessed live as reports accumulate and time passes.
4. **Department Routing Agent** – category → department, locality → zone office.
5. **Action Recommendation Agent** – explainable recommendation with SLA and checklist.
6. **Human approval** – an authorised officer must approve the assignment (`approveAssignment`) before any status change (`setIncidentStatus`). Officers are only authorised for their own departments.

Core logic lives in `src/lib/engine.ts` (framework-free and unit-tested); React only renders it.

## Demo scenario

1. Open **Citizen Portal** → *Load sample pothole report* (Koramangala) → *Submit & run AI analysis*.
2. The AI classifies a Pothole, finds **2 similar sample reports**, consolidates them into **one incident of 3 reports**, scores it **Critical**, recommends **Road Maintenance Department** and **urgent inspection**.
3. Go to **Officer Command Centre** → sign in (demo, no password) → the incident is pre-selected → *Approve recommendation & assign* → set status **In Progress**.
4. Open **City Impact** – counts, priority mix and ward trends have updated.

`node scripts/e2e.mjs` replays this scenario in a real browser (needs `npm i --no-save puppeteer-core`, the dev server running, and Google Chrome).

## What is real vs simulated

| Real | Simulated |
| --- | --- |
| Full workflow, state, persistence, validation, notifications | All AI stages (rule-based; image pixels are **not** analysed) |
| Duplicate geometry (haversine distance) and the priority formula | Geocoding (landmark lookup, no GPS) |
| Approval gate and per-department officer authorisation | Officer authentication (demo profiles, no password) |
| Analytics computed from application state | Departments/zones mapping, population and importance baselines, all sample complaints |

## Project layout

```
src/agents/      classification, duplicate, severity, routing (+ action), tests
src/lib/         engine (ingest / approve / status), analytics, geo, format, image
src/data/        localities & landmarks, synthetic seed complaints
src/state/       store (localStorage persistence) and toast notifications
src/pages/       CitizenPortal, OfficerCentre, ImpactDashboard
src/components/  badges, charts (SVG, no chart library), agent panel, icons
scripts/e2e.mjs  browser end-to-end check of the demo scenario
```

## Citizen AI Chatbot (`src/components/ChatBot.tsx`)

A floating AI assistant (bottom-right on all pages) that answers questions about Bengaluru civic services, explains the AI pipeline, provides BBMP helpline numbers, covers all 8 BBMP administrative zones, and can look up any complaint by ID to return its live status and history.

- 20 FAQ topics — keyword intent scoring (same simulated-rule-based pattern as the agents)
- Complaint ID lookup: type `NF-DEMO-0001` and get live status, priority, department, audit trail
- Quick-reply chips and deep-link action buttons to portal sections

## Hackathon Submission

| Deliverable | File / Location |
| --- | --- |
| **Problem Statement & Solution Description** | [`submission/PROBLEM_SOLUTION.md`](submission/PROBLEM_SOLUTION.md) |
| **Presentation Deck** | [`submission/presentation/NammaFix_AI_Deck.html`](submission/presentation/NammaFix_AI_Deck.html) — open in any browser |
| **Video Demo Script** | [`submission/VIDEO_DEMO_SCRIPT.md`](submission/VIDEO_DEMO_SCRIPT.md) |
| **Source Code Repository** | `[REPOSITORY_LINK_TO_BE_ADDED]` |
| **Working Prototype** | `npm run dev` → http://localhost:5173 |

## Built with IBM Bob

This prototype was designed and implemented in an IBM Bob agent session: workspace inspection and stack selection, scaffolding, the agent pipeline, UI, unit tests, headless-browser verification, iteration on the synthetic data calibration, the citizen AI chatbot, and all hackathon submission materials.

# NammaFix AI — Problem Statement & Detailed Solution Description

> **Hackathon Submission Document**
> Platform: NammaFix AI — Bengaluru Civic Intelligence Platform
> Built with: IBM Bob (AI-assisted development)

---

## 1. Problem Statement

### 1.1 Context

Bengaluru, India's Silicon Valley and home to 13+ million residents, faces a persistent and growing civic infrastructure crisis. Despite being among India's most economically productive cities, its roads, drainage systems, public lighting and waste management infrastructure suffer from severe maintenance gaps — directly affecting the quality of life of its citizens.

### 1.2 The Core Problem

**Citizens cannot report civic issues effectively, and the city cannot resolve them efficiently.**

The current civic complaint ecosystem in Bengaluru suffers from four compounding failures:

| Failure | Description |
|---|---|
| **Duplication overload** | Hundreds of citizens report the same pothole or flooded road independently. Each becomes a separate ticket, dispatching multiple field teams to the same location — wasting public resources. |
| **No intelligent triage** | All complaints are treated with equal urgency. A cracked pavement near a school at night and a minor pothole on a low-traffic lane get the same queue position. |
| **Wrong department routing** | Complaints are frequently mis-routed — BBMP roads complaints sent to BESCOM, drainage issues sent to SWM — causing delays of days or weeks before the right team is engaged. |
| **Zero citizen feedback loop** | After submitting a complaint, citizens receive no structured status updates, no resolution timeline and no visibility into which department is working on it. |

### 1.3 Scale of Impact

- BBMP receives **10,000–20,000 civic complaints per month** across categories
- Duplicate reports account for an estimated **30–45% of all submissions**
- Average resolution time for a pothole in Bengaluru: **14–21 days** (source: BBMP data, public reports)
- Monsoon season waterlogging affects **200+ wards** simultaneously, overwhelming manual triage
- Incorrect department routing costs an average of **3–5 extra days** per complaint

### 1.4 Problem Statement (Single Sentence)

> *Bengaluru's civic complaint system lacks intelligent intake, automated deduplication, risk-based prioritisation and transparent routing — leading to wasted public resources, delayed resolutions and frustrated citizens.*

---

## 2. Solution Overview

**NammaFix AI** is an end-to-end civic intelligence platform that uses a pipeline of AI agents to transform raw citizen complaints into actionable, deduplicated, prioritised and correctly routed work orders — with a human officer as the final approval gate.

### 2.1 Solution Tagline

> *Report Less. Resolve Smarter. Build a Better Bengaluru.*

### 2.2 Three-Portal Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        NammaFix AI Portal                       │
├──────────────────┬─────────────────────┬────────────────────────┤
│  Citizen Portal  │  Officer Command    │  City Impact           │
│  (#/report)      │  Centre (#/officer) │  Dashboard (#/impact)  │
│                  │                     │                        │
│  • Report issue  │  • Review AI output │  • Resolution rates    │
│  • Photo upload  │  • Approve / route  │  • Category breakdown  │
│  • Track by ID   │  • Status updates   │  • Ward trends (6-wk)  │
│  • AI Chatbot    │  • Audit trail      │  • Duplicate savings   │
└──────────────────┴─────────────────────┴────────────────────────┘
```

---

## 3. AI Agent Pipeline (Detailed)

Every complaint submitted by a citizen passes through a deterministic, explainable, five-stage agent pipeline before it reaches a human officer.

### Stage 1 — Classification Agent

**Input:** Citizen description text + optional image metadata + citizen's category selection  
**Output:** Identified category, confidence score (0–100), matched keywords, review flag

**How it works:**
- 20+ weighted regex rules across four civic categories (Pothole, Garbage, Streetlight, Waterlogging)
- Image file name is scanned for category hints (no visual model — metadata only, fully transparent)
- Citizen's category selection is used as a weak prior (weight 1 vs keyword weight 1–2)
- Flags disagreement for officer review when AI and citizen differ

**Example:**
```
Description: "Deep pothole near KHB Colony junction, two-wheelers skidding"
Matched: "pothole" (w:2), "road surface" (w:1) → Pothole, confidence 87%
```

### Stage 2 — Duplicate Detection Agent

**Input:** Category, GPS coordinates (landmark-based), description, all existing open complaints  
**Output:** Match list, merged incident ID, is-duplicate flag

**How it works:**
- Scans all open, unresolved complaints of the same category
- Spatial filter: within **250 metres** (Haversine formula — real geometry)
- Temporal filter: reported in the last **30 days**
- Text similarity: Jaccard token-overlap score (supporting evidence, not the deciding factor)
- Merges all matched complaints into the **oldest incident** as the primary
- Every original Complaint ID is preserved (`duplicateOf` / `duplicateIds`)

**Impact:** One field team dispatch instead of N — directly reduces wasted public expenditure.

### Stage 3 — Severity Assessment Agent

**Input:** Category, combined incident text, landmark importance, locality density, report count, age  
**Output:** Score (0–100), priority level, factor breakdown

**Formula (fully deterministic):**
```
Priority Score = 35% × Safety Risk
              + 25% × Public Importance
              + 25% × Affected Population
              + 15% × Unresolved Duration
```

**Safety Risk signals (10 categories):** accidents, falls/skidding, two-wheelers, deep/wide hazard, electrical/manhole, stalling vehicles, night-time risk, children/elderly, traffic disruption, public health (dengue, stray animals)

**Priority levels:**
- **Critical** ≥ 75 → SLA: 24 hours
- **High** 50–74 → SLA: 72 hours
- **Medium** 25–49 → SLA: 168 hours (1 week)
- **Low** < 25 → SLA: 336 hours (2 weeks)

Priority is **live-recomputed** as more reports come in and time passes — a "Medium" issue that is ignored for 3 weeks escalates automatically.

### Stage 4 — Department Routing Agent

**Input:** Category, locality  
**Output:** Assigned department, administrative zone, zone office

| Category | Department |
|---|---|
| Pothole | Road Maintenance Department (BBMP) |
| Garbage | Solid Waste Management (BBMP) |
| Streetlight | Street Lighting (BESCOM) |
| Waterlogging | Storm Water Drain Department (BBMP) |

Locality-to-zone mapping covers all 8 BBMP administrative zones.

### Stage 5 — Action Recommendation Agent

**Input:** Category, priority level, score, report count, department  
**Output:** Urgency headline, SLA in hours, 3-step action checklist

Generates an explainable recommendation that the officer reviews — the system **never auto-dispatches**. An authorised human officer must approve.

---

## 4. Human-in-the-Loop: Officer Command Centre

The platform enforces a mandatory human approval gate:

1. **Role-based authorisation** — each officer is authorised only for specific departments (e.g., Roads, SWM, BESCOM). They cannot approve assignments outside their mandate.
2. **Override capability** — officers can override the AI's department recommendation and select a different department, with the override recorded in the audit trail.
3. **Status management** — officers progress incidents through Assigned → In Progress → Resolved.
4. **Full audit trail** — every AI action, officer decision and status change is timestamped and actor-attributed.

---

## 5. Citizen AI Chatbot

A floating AI assistant chatbot embedded in the portal allows citizens to:

- Ask questions about Bengaluru civic services (BBMP, BESCOM, helplines)
- Understand all four issue categories and which department handles each
- Get step-by-step guidance on how to report and track complaints
- Look up any complaint by ID and see live status, department and history
- Navigate directly to the relevant portal section via deep-link action buttons

**Knowledge base:** 20 FAQ topics covering reporting, tracking, complaint statuses, duplicate detection, AI pipeline, BBMP zones, all 8 BBMP administrative zones, helpline numbers (1533, 1912, 112), and all 7 supported localities.

**Engine:** Rule-based keyword intent matching — consistent with the same simulated-rule-based pattern used throughout the platform.

---

## 6. City Impact Dashboard

Provides real-time analytics computed live from application state:

- **Resolution rate** (% of incidents resolved)
- **Average resolution time** (days from first report to resolution)
- **Duplicate consolidation savings** (reports vs unique incidents per category)
- **Open critical incidents** count
- **Category, priority and status breakdowns** (bar charts, donut chart)
- **Ward-wise 6-week trend table** with inline sparklines

---

## 7. Technical Architecture

### Stack

| Layer | Technology | Rationale |
|---|---|---|
| UI Framework | React 18 + TypeScript | Type safety, component reuse |
| Styling | Tailwind CSS + custom design system | Consistent navy/brand/ink palette |
| Build | Vite 5 | Fast HMR, production bundling |
| Testing | Vitest | 12 unit tests covering all 5 agents |
| State | React Context + localStorage | Zero backend, fully offline capable |
| Routing | Hash-based (`#/route`) | No server-side routing needed |

### Key Design Principles

1. **No external dependencies** — zero cloud services, zero API keys, zero backend. Runs entirely in the browser.
2. **Transparent AI** — every agent explains its reasoning in plain language. Officers can inspect every decision.
3. **Human-in-the-loop** — no complaint is dispatched without officer approval.
4. **Explainable scoring** — the severity formula is published, deterministic and reproducible.
5. **Persistent state** — `localStorage` persistence means data survives page refreshes.

### Project Layout

```
src/
  agents/         Classification, Duplicate, Severity, Routing, Action + tests
  lib/            Engine (ingest/approve/status), Analytics, Geo, Format, Image
  data/           Localities & landmarks, Synthetic seed complaints, Chatbot FAQ
  state/          Store (localStorage persistence), Toast notifications
  pages/          CitizenPortal, OfficerCentre, ImpactDashboard
  components/     Badges, Charts (pure SVG), AgentPanel, Icons, ChatBot
  types.ts        All shared TypeScript interfaces and const arrays
scripts/
  e2e.mjs         Headless browser end-to-end scenario verification
submission/
  PROBLEM_SOLUTION.md        (this document)
  VIDEO_DEMO_SCRIPT.md       Step-by-step video recording guide
  presentation/
    NammaFix_AI_Deck.html    Standalone presentation deck
```

---

## 8. Demo Scenario (Reproducible)

1. Open **Citizen Portal** → click **"Load sample pothole report"**
2. Click **"Submit & run AI analysis"**
   - Agent 1 classifies as Pothole (87% confidence)
   - Agent 2 finds 2 similar open reports within 250 m → consolidates into 1 incident of 3 reports
   - Agent 3 scores Critical (80+/100) due to two-wheelers + night-time risk + 3 reports
   - Agent 4 routes to Road Maintenance Department, South Zone
   - Agent 5 recommends urgent inspection within 24 h
3. Navigate to **Officer Command Centre** → sign in as Ananya Rao
4. Find the incident → click **"Approve & assign to Road Maintenance Department"**
5. Set status to **"In Progress"**
6. Open **City Impact Dashboard** → observe updated metrics, resolution rate and ward trend
7. Click the **chat bubble** (bottom-right) → ask **"what is the BBMP helpline?"**

---

## 9. What is Real vs Simulated

| ✅ Real (genuine implementation) | ⚠️ Simulated (prototype approximation) |
|---|---|
| Full end-to-end citizen → officer → resolution workflow | AI stages (rule-based; no LLM or vision model) |
| Haversine geometry for duplicate spatial detection | GPS location (landmark lookup; no live GPS) |
| Deterministic, auditable severity formula | Officer authentication (demo profiles, no password) |
| Human approval gate + per-department authorisation | Population/importance baselines (synthetic) |
| Analytics computed live from application state | All seed complaint data (synthetic) |
| Complaint ID system + full audit trail | BBMP zone/department mapping (illustrative) |
| localStorage persistence across page refreshes | — |
| 12 passing unit tests (Vitest) | — |

---

## 10. Built With IBM Bob

This prototype was entirely designed and implemented in an **IBM Bob** agent session:

- Workspace inspection and technology stack selection
- Full TypeScript + React scaffolding and architecture design
- All five AI agent implementations (classification, duplicate, severity, routing, action)
- Citizen Portal, Officer Command Centre, and Impact Dashboard UI
- Synthetic seed data calibration and unit test suite (12 tests)
- Headless browser end-to-end verification script
- AI Chatbot feature — knowledge base (20 FAQs), intent engine, full floating widget UI
- Submission documentation (this document, presentation deck, video script)

---

## 11. Source Code Repository

> **GitHub Repository:** `[REPOSITORY_LINK_TO_BE_ADDED]`

```bash
# Clone and run locally
git clone [REPOSITORY_LINK_TO_BE_ADDED]
cd nammafix-ai
npm install
npm run dev        # → http://localhost:5173
npm test           # → 12 passing tests
npm run build      # → production build
```

**Requirements:** Node.js 18+. No environment variables, API keys or cloud accounts required.

---

*Document prepared for hackathon submission. All data is synthetic and for demonstration purposes only.*

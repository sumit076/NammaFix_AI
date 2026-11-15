# NammaFix AI — Video Demonstration Script

> **Document Type:** Video Recording Guide & Narration Script
> **Target Duration:** 3–5 minutes
> **Recommended Tool:** Loom, OBS Studio, or screen recording built into macOS (⌘ + Shift + 5)
> **URL:** http://localhost:5173 (run `npm run dev` first)

---

## Pre-Recording Checklist

- [ ] Dev server running: `npm run dev` → http://localhost:5173
- [ ] Browser window at full screen or 1280×720 minimum
- [ ] Close unrelated tabs/notifications
- [ ] Reset demo data: Officer Centre → "Reset demo data" button (ensures clean state)
- [ ] Browser zoom at 100%
- [ ] Microphone tested (optional — narration or captions)

---

## Scene 1 — Introduction (0:00–0:30)

**Screen:** NammaFix AI landing page (Citizen Portal, `#/report`)

**Narration / Caption:**
> "This is NammaFix AI — a civic intelligence platform for Bengaluru, India.
> Every day, thousands of citizens report potholes, garbage, broken streetlights and waterlogging.
> But reports are duplicated, mis-routed and ignored.
> NammaFix AI solves this with a 5-stage AI agent pipeline and a mandatory human approval gate."

**Action:** Slowly scroll the Citizen Portal hero banner into view. Point to the "How it works" panel on the right.

---

## Scene 2 — Reporting a Civic Issue (0:30–1:15)

**Screen:** Citizen Portal form

**Narration / Caption:**
> "Let's submit a civic issue. I'll click 'Load sample pothole report' to populate the form with a realistic Koramangala pothole description."

**Actions:**
1. Click **"Load sample pothole report"** — form fills automatically
2. Scroll to show: locality (Koramangala), landmark (KHB Colony Main Road), description text
3. Point out the description: *"Deep pothole... two-wheelers are skidding... elderly person fell"*
4. Click **"Submit & run AI analysis"**
5. Wait 1–2 seconds for the result card to animate in

**Narration / Caption:**
> "The AI pipeline has run. Let's see what happened."

---

## Scene 3 — AI Analysis Result (1:15–2:00)

**Screen:** Result card with the green confirmation header visible

**Narration / Caption:**
> "Five agents ran in under a second. Let's walk through each one."

**Actions:**
1. Point to the **Category badge** — "Pothole, 87% confidence"
2. Point to the **Priority badge** — "Critical, 80+/100"
3. Point to the **duplicate consolidation notice** — "2 similar open reports found nearby — consolidated into 1 incident"
4. Scroll to the **AI analysis pipeline panel** (AgentPanel with 5 stages)
5. Click to expand **Classification Agent** — show matched keywords ("pothole", "road surface")
6. Click to expand **Severity Agent** — show the 4-factor breakdown (Safety 35%, Importance 25%, Population 25%, Duration 15%)
7. Click to expand **Routing Agent** — "Road Maintenance Department, South Zone"

**Narration / Caption:**
> "The safety score is high because the description mentions two-wheelers skidding and an elderly person falling. That pushes this to Critical — a 24-hour SLA."

---

## Scene 4 — Officer Command Centre (2:00–2:50)

**Screen:** Click the "View in Officer Command Centre" button, then sign in

**Narration / Caption:**
> "Now let's switch to the officer's view. I'll sign in as Ananya Rao — a Zonal Officer with access to all departments."

**Actions:**
1. Click **"View in Officer Command Centre"** link (or navigate to `#/officer`)
2. Click the sign-in dropdown — select **Ananya Rao**
3. Show the KPI cards at the top (total incidents, open critical, in-progress count)
4. Find the pothole incident in the list — it shows **Critical** badge and **3 reports consolidated**
5. Click to expand the incident panel
6. Show the **AI recommendation** — "Approve & assign to Road Maintenance Department, 24h SLA"
7. Click **"Approve recommendation & assign"**
8. Set status to **"In Progress"**
9. Scroll down to show the **audit trail** — every step timestamped and actor-attributed

**Narration / Caption:**
> "The officer can override the AI recommendation and choose a different department — that override is recorded in the audit trail. No complaint is dispatched without this human approval gate."

---

## Scene 5 — City Impact Dashboard (2:50–3:20)

**Screen:** Navigate to `#/impact`

**Narration / Caption:**
> "Every action is reflected immediately in the City Impact Dashboard."

**Actions:**
1. Navigate to **City Impact** tab
2. Point to **Resolution rate** stat — updated with the new In Progress count
3. Scroll to the **Priority distribution donut chart** — show Critical count
4. Scroll to the **Ward-wise trend table** — point to Koramangala row, 6-week sparkline
5. Point to **Duplicate consolidation** section — "3 reports → 1 incident = 2 saved dispatches"

**Narration / Caption:**
> "Duplicate consolidation alone saves the city from sending multiple field teams to the same location. Over a month, that's hundreds of hours of saved field work."

---

## Scene 6 — AI Chatbot (3:20–4:00)

**Screen:** Any page (chatbot is global)

**Narration / Caption:**
> "Finally, citizens can ask questions at any time using the AI assistant embedded in the bottom-right corner."

**Actions:**
1. Click the **chat bubble** (bottom-right corner of the screen)
2. Show the panel opening with the greeting and starter chips
3. Click the chip: **"What is BBMP?"**
4. Show the bot's answer with the BBMP explanation and zone list
5. Type **"NF-DEMO-0001"** in the input box and press Enter
6. Show the bot returning: complaint status, priority, department, and last history entry
7. Click the **"Track in Citizen Portal"** action link in the bot reply

**Narration / Caption:**
> "The chatbot can look up any complaint ID in real time and show its current status, priority and history. It also knows BBMP helpline numbers, all 8 administrative zones, which department handles which issue, and how the AI pipeline works."

---

## Scene 7 — Closing (4:00–4:20)

**Screen:** Return to Citizen Portal hero section

**Narration / Caption:**
> "NammaFix AI was designed and implemented entirely using IBM Bob — from architecture design, to all five AI agents, to the portal UI, unit tests, chatbot and submission documents.
>
> The platform runs entirely in the browser — no backend, no API keys, no cloud account required.
>
> Source code: [REPOSITORY_LINK_TO_BE_ADDED]
>
> Report Less. Resolve Smarter. Build a Better Bengaluru."

**Action:** Hold on the hero banner for 3 seconds, then end recording.

---

## Optional B-Roll / Additional Clips

| Clip | What to show | Duration |
|---|---|---|
| Anonymous reporting | Leave name blank, submit with just description | 20s |
| Category auto-detection | Select "Not sure — let the AI decide", submit | 20s |
| Officer override | Officer changes recommended department, observe audit trail entry | 30s |
| Track complaint | Enter a complaint ID in the Citizen Portal track widget | 20s |
| Chatbot FAQs | Ask "what are the BBMP helpline numbers?" | 20s |
| Reset demo | Show Reset button in Officer Centre restores 10 seed complaints | 15s |

---

## Caption / Subtitle Timestamps (for silent viewing)

```
0:00  NammaFix AI — Bengaluru Civic Intelligence Platform
0:08  10,000–20,000 civic complaints per month in Bengaluru
0:16  5-stage AI agent pipeline + human officer approval gate
0:30  Citizen Portal — reporting a pothole in Koramangala
0:48  "Load sample pothole report" — fills the form
1:05  Submit & run AI analysis
1:15  AI result: Pothole · Critical 80+/100 · 3 reports consolidated
1:28  Duplicate Detection: 2 similar reports found within 250 m
1:40  Severity: two-wheelers + elderly → Safety score pushed to Critical
1:55  Routing: Road Maintenance Department, South Zone
2:00  Officer Command Centre — sign in as Ananya Rao
2:15  KPI cards: total incidents, open critical, in-progress
2:28  Approve AI recommendation → assign to Road Maintenance
2:40  Set status: In Progress
2:48  Audit trail: every action timestamped and actor-attributed
2:50  City Impact Dashboard — live analytics
3:05  Duplicate consolidation: 3 reports → 1 incident = 2 saved dispatches
3:20  AI Chatbot — floating assistant, bottom-right corner
3:35  Ask "What is BBMP?" — zones, departments, helplines
3:45  Type complaint ID NF-DEMO-0001 — bot returns live status
4:00  Built entirely with IBM Bob
4:10  Source code: [REPOSITORY_LINK_TO_BE_ADDED]
4:15  Report Less. Resolve Smarter. Build a Better Bengaluru.
```

---

## Screen Resolution & Export Settings

| Setting | Recommended value |
|---|---|
| Recording resolution | 1920×1080 (1080p) |
| Frame rate | 30 fps |
| Export format | MP4 (H.264) |
| File size target | Under 500 MB |
| Zoom during recording | 100% (browser) |
| Cursor highlighting | On (if available in recorder) |

---

*This script is for guidance only. Narration can be adapted to the presenter's natural style.*

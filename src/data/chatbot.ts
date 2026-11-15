/**
 * Chatbot knowledge base for the NammaFix AI Bengaluru Civic Assistant.
 * Each FAQ entry has keywords for intent matching, a text answer, optional
 * action links, and suggested follow-up chips.
 */

export interface ChatAction {
  label: string;
  /** Hash route, e.g. '#/report' */
  href: string;
}

export interface FaqEntry {
  id: string;
  /** Keywords scored against the user's input for intent matching. */
  keywords: string[];
  question: string;
  answer: string;
  actions?: ChatAction[];
  followUps?: string[];
}

export const FAQ_ENTRIES: FaqEntry[] = [
  // ── Reporting ──────────────────────────────────────────────────────────────
  {
    id: 'how-to-report',
    keywords: ['report', 'submit', 'complaint', 'raise', 'file', 'register', 'issue', 'problem'],
    question: 'How do I report a civic issue?',
    answer:
      'Go to the Citizen Portal, fill in your name (optional), select the issue category, choose your locality and nearest landmark, describe the problem, and optionally attach a photo. Click "Submit & run AI analysis" — the AI agents will classify your report, detect duplicates, score its urgency and recommend a department automatically.',
    actions: [{ label: 'Go to Citizen Portal', href: '#/report' }],
    followUps: ['What categories can I report?', 'How does the AI classify my report?', 'How do I track my complaint?'],
  },
  {
    id: 'categories',
    keywords: ['category', 'categories', 'type', 'kind', 'pothole', 'garbage', 'streetlight', 'waterlogging', 'flood', 'road', 'waste', 'light'],
    question: 'What categories of issues can I report?',
    answer:
      'NammaFix AI supports four civic issue categories:\n• **Pothole** – damaged roads, pits, craters\n• **Garbage** – overflowing bins, illegal dumping, uncollected waste\n• **Streetlight** – broken, flickering or missing streetlights\n• **Waterlogging** – flooded roads, clogged storm drains\n\nNot sure which category fits? Select "Not sure – let the AI decide" and the classification agent will infer it from your description.',
    actions: [{ label: 'Report an issue', href: '#/report' }],
    followUps: ['Which department handles potholes?', 'Which department handles streetlights?', 'How do I report a pothole?'],
  },
  {
    id: 'photo-upload',
    keywords: ['photo', 'image', 'picture', 'upload', 'attach', 'camera'],
    question: 'Do I need to upload a photo?',
    answer:
      'No, a photo is optional. However, uploading one helps the AI classification agent provide stronger evidence when the description alone is ambiguous. Accepted formats are JPG, PNG and WebP up to 10 MB.',
    followUps: ['How do I report a civic issue?', 'How does the AI classify my report?'],
  },
  {
    id: 'anonymous',
    keywords: ['anonymous', 'name', 'identity', 'personal', 'privacy', 'private'],
    question: 'Do I have to provide my name?',
    answer:
      'No. Your name is completely optional. If you leave it blank, your complaint is registered as "Anonymous citizen". All complaint data is stored only in your browser\'s localStorage — no data is sent to any external server.',
    followUps: ['How do I report a civic issue?', 'Is my data safe?'],
  },
  {
    id: 'data-privacy',
    keywords: ['data', 'privacy', 'safe', 'store', 'storage', 'server', 'cloud', 'send'],
    question: 'Is my data safe? Where is it stored?',
    answer:
      'All data — complaints, images and state — is stored exclusively in your browser\'s localStorage. Nothing is transmitted to any external server or cloud service. This is a fully client-side prototype.',
    followUps: ['Do I have to provide my name?', 'What is NammaFix AI?'],
  },

  // ── Tracking ───────────────────────────────────────────────────────────────
  {
    id: 'track-complaint',
    keywords: ['track', 'status', 'check', 'follow', 'update', 'complaint id', 'id', 'progress', 'where'],
    question: 'How do I track my complaint?',
    answer:
      'On the Citizen Portal, scroll down to the "Track a complaint" card. Enter your Complaint ID (e.g. NF-20261115-1001) and click Track. You\'ll see the current status, assigned department, and full history timeline.',
    actions: [{ label: 'Go to Citizen Portal', href: '#/report' }],
    followUps: ['What do the complaint statuses mean?', 'What is a Complaint ID?'],
  },
  {
    id: 'complaint-id',
    keywords: ['complaint id', 'nf-', 'reference', 'number', 'ticket'],
    question: 'What is a Complaint ID?',
    answer:
      'Every submitted complaint gets a unique Complaint ID in the format NF-YYYYMMDD-NNNN (e.g. NF-20261115-1001). It is shown immediately after you submit your report. Demo complaints use the format NF-DEMO-0001. Keep this ID to track your complaint later.',
    followUps: ['How do I track my complaint?', 'What do the complaint statuses mean?'],
  },
  {
    id: 'statuses',
    keywords: ['status', 'reported', 'assigned', 'in progress', 'resolved', 'meaning', 'mean', 'stage', 'workflow'],
    question: 'What do the complaint statuses mean?',
    answer:
      '• **Reported** – Complaint received; AI analysis complete; awaiting officer review.\n• **Assigned** – A civic officer has approved and assigned it to a department.\n• **In Progress** – The department is actively working on the fix.\n• **Resolved** – The issue has been fixed and the complaint is closed.',
    followUps: ['How do I track my complaint?', 'Which department handles my issue?'],
  },

  // ── Duplicates ─────────────────────────────────────────────────────────────
  {
    id: 'duplicate',
    keywords: ['duplicate', 'consolidated', 'merged', 'similar', 'same issue', 'already reported'],
    question: 'Why was my complaint consolidated into another?',
    answer:
      'The AI duplicate-detection agent scans all open complaints within a 300 m radius and a 90-day window. If it finds a matching issue of the same category with similar keywords, your complaint is consolidated into the existing incident. Your original Complaint ID is preserved and linked. This prevents multiple field teams being dispatched for the same problem.',
    followUps: ['How does the AI classify my report?', 'What do the complaint statuses mean?'],
  },

  // ── AI & Agents ────────────────────────────────────────────────────────────
  {
    id: 'ai-classification',
    keywords: ['ai', 'classify', 'classification', 'agent', 'how', 'detect', 'automatic', 'intelligence', 'machine', 'model'],
    question: 'How does the AI classify my report?',
    answer:
      'NammaFix AI uses a pipeline of five rule-based agents:\n1. **Classification** – matches keywords + image metadata to identify the category.\n2. **Duplicate Detection** – checks for similar open reports within 300 m / 90 days.\n3. **Severity Scoring** – scores urgency (0–100) based on safety signals, location importance, population density, number of reports and age.\n4. **Routing** – recommends the correct BBMP department.\n5. **Action Plan** – generates a resolution timeline and step-by-step action for the field team.\n\n*Note: This is a prototype. All agents are rule-based simulations — no live LLM or vision model is connected.*',
    followUps: ['What is NammaFix AI?', 'Which department handles my issue?', 'How do I report a civic issue?'],
  },
  {
    id: 'severity',
    keywords: ['severity', 'priority', 'score', 'urgent', 'critical', 'high', 'medium', 'low', 'important'],
    question: 'How is the priority / severity score calculated?',
    answer:
      'The severity agent scores each incident from 0–100 using four weighted factors:\n• **Safety risk** (40%) – keywords like "elderly", "school", "skidding", "accident"\n• **Location importance** (25%) – how busy the road/junction is\n• **Population density** (20%) – how densely populated the locality is\n• **Age & report count** (15%) – how long the issue has been open and how many reports it has\n\nScores map to: **Critical** (≥80), **High** (60–79), **Medium** (40–59), **Low** (<40).',
    followUps: ['What do the complaint statuses mean?', 'How does the AI classify my report?'],
  },

  // ── Departments ────────────────────────────────────────────────────────────
  {
    id: 'dept-pothole',
    keywords: ['department', 'pothole', 'road', 'road maintenance', 'bbmp road'],
    question: 'Which department handles potholes?',
    answer: 'Potholes and road damage are handled by the **Road Maintenance Department** (BBMP). Once an officer approves the assignment, the team is dispatched for inspection and repair.',
    followUps: ['Which department handles streetlights?', 'Which department handles garbage?', 'How does the AI classify my report?'],
  },
  {
    id: 'dept-garbage',
    keywords: ['department', 'garbage', 'waste', 'solid waste', 'swm', 'trash', 'dump'],
    question: 'Which department handles garbage?',
    answer: 'Garbage and solid waste issues are handled by **Solid Waste Management (SWM)** under BBMP. This covers overflowing bins, illegal dumping and missed collection routes.',
    followUps: ['Which department handles potholes?', 'Which department handles waterlogging?'],
  },
  {
    id: 'dept-streetlight',
    keywords: ['department', 'streetlight', 'street light', 'bescom', 'light', 'lamp', 'electricity'],
    question: 'Which department handles streetlights?',
    answer: 'Street lighting is managed by **BESCOM (Bangalore Electricity Supply Company)**. BESCOM is responsible for installing, maintaining and repairing all public streetlights in Bengaluru.',
    followUps: ['Which department handles potholes?', 'What is BBMP?'],
  },
  {
    id: 'dept-waterlogging',
    keywords: ['department', 'waterlogging', 'flood', 'drain', 'storm', 'stormwater', 'swm drain'],
    question: 'Which department handles waterlogging?',
    answer: 'Waterlogging and storm drain issues are handled by the **Storm Water Drain Department (SWDD)** under BBMP. This covers flooded roads, blocked culverts and clogged storm drains.',
    followUps: ['Which department handles potholes?', 'What is BBMP?'],
  },

  // ── BBMP & Governance ──────────────────────────────────────────────────────
  {
    id: 'what-is-bbmp',
    keywords: ['bbmp', 'bruhat bengaluru', 'municipal', 'corporation', 'palike', 'civic body', 'authority'],
    question: 'What is BBMP?',
    answer:
      'BBMP stands for **Bruhat Bengaluru Mahanagara Palike** — the civic body that governs Greater Bengaluru. It is responsible for roads, sanitation, streetlights, parks, storm water drains and property tax. BBMP is divided into eight administrative zones: East, West, South, Dasarahalli, Bommanahalli, Mahadevapura, Yelahanka and RR Nagar.',
    followUps: ['What are the BBMP zones in Bengaluru?', 'What is the BBMP helpline?'],
  },
  {
    id: 'bbmp-zones',
    keywords: ['zone', 'zones', 'area', 'region', 'east', 'west', 'south', 'north', 'mahadevapura', 'bommanahalli', 'yelahanka', 'dasarahalli'],
    question: 'What are the BBMP zones in Bengaluru?',
    answer:
      'BBMP is divided into **8 administrative zones**:\n1. East Zone – Indiranagar, Banaswadi, Ramamurthy Nagar\n2. West Zone – Rajajinagar, Vijaynagar, Yeshwantpur\n3. South Zone – Jayanagar, Basavanagudi, JP Nagar, Koramangala\n4. Dasarahalli Zone – Peenya, Nagasandra\n5. Bommanahalli Zone – HSR Layout, Electronic City, BTM Layout\n6. Mahadevapura Zone – Whitefield, Marathahalli, KR Puram\n7. Yelahanka Zone – Hebbal, Yelahanka, Jakkur\n8. RR Nagar Zone – Rajarajeshwari Nagar, Kengeri',
    followUps: ['What is BBMP?', 'What is the BBMP helpline?'],
  },
  {
    id: 'bbmp-helpline',
    keywords: ['helpline', 'phone', 'call', 'number', 'contact', 'reach', 'bbmp number', 'toll free'],
    question: 'What is the BBMP helpline number?',
    answer:
      '• **BBMP Control Room:** 080-22221188\n• **BBMP Citizen Services:** 1533 (toll-free)\n• **BBMP Solid Waste:** 080-22975718\n• **BESCOM (Streetlight faults):** 1912\n• **Emergency (Police / Fire / Ambulance):** 112',
    followUps: ['What is BBMP?', 'Which department handles my issue?'],
  },
  {
    id: 'bengaluru-localities',
    keywords: ['locality', 'area', 'neighbourhood', 'koramangala', 'indiranagar', 'whitefield', 'electronic city', 'jayanagar', 'marathahalli', 'hsr'],
    question: 'Which localities does NammaFix AI cover?',
    answer:
      'The current prototype covers **7 localities** with landmark-level coordinates:\n• Koramangala (South Zone)\n• Indiranagar (East Zone)\n• Whitefield (Mahadevapura Zone)\n• Electronic City (Bommanahalli Zone)\n• Jayanagar (South Zone)\n• Marathahalli (Mahadevapura Zone)\n• HSR Layout (Bommanahalli Zone)\n\nMore localities will be added in future releases.',
    actions: [{ label: 'Report an issue', href: '#/report' }],
    followUps: ['What are the BBMP zones in Bengaluru?', 'How do I report a civic issue?'],
  },

  // ── Officer & Approvals ────────────────────────────────────────────────────
  {
    id: 'officer-role',
    keywords: ['officer', 'approve', 'approval', 'assign', 'official', 'sign in', 'login'],
    question: 'What does a civic officer do in NammaFix AI?',
    answer:
      'A civic officer reviews AI-processed complaints, verifies the recommended department and either approves the assignment or overrides it. Officers can also update an incident\'s status (Assigned → In Progress → Resolved). This human-in-the-loop gate ensures no complaint is dispatched purely by automation.',
    actions: [{ label: 'Go to Officer Centre', href: '#/officer' }],
    followUps: ['How does the AI classify my report?', 'What do the complaint statuses mean?'],
  },

  // ── NammaFix AI ────────────────────────────────────────────────────────────
  {
    id: 'what-is-nammafix',
    keywords: ['nammafix', 'namma', 'platform', 'what is', 'about', 'purpose', 'goal', 'hackathon', 'prototype'],
    question: 'What is NammaFix AI?',
    answer:
      'NammaFix AI is a **Bengaluru Civic Intelligence Platform** — a hackathon prototype that demonstrates how AI agents can make civic issue reporting smarter and faster.\n\nCitizens report issues → AI classifies, deduplicates and prioritises them → Officers approve assignments → Field teams resolve them → Outcomes are tracked on the City Impact Dashboard.',
    actions: [{ label: 'View City Impact', href: '#/impact' }],
    followUps: ['How does the AI classify my report?', 'How do I report a civic issue?', 'What is BBMP?'],
  },
  {
    id: 'impact-dashboard',
    keywords: ['dashboard', 'impact', 'analytics', 'statistics', 'stats', 'chart', 'resolution', 'ward', 'trend'],
    question: 'What can I see on the City Impact Dashboard?',
    answer:
      'The City Impact Dashboard shows live analytics computed from all complaints:\n• Resolution rate and average resolution time\n• Complaints by category, priority and workflow status\n• Duplicate consolidation savings per category\n• Ward-wise issue trends over the past 6 weeks',
    actions: [{ label: 'View City Impact Dashboard', href: '#/impact' }],
    followUps: ['What is NammaFix AI?', 'How does the AI classify my report?'],
  },
];

/** Greeting shown when the chat panel first opens. */
export const CHAT_GREETING =
  'Namaskara! 🙏 I\'m the NammaFix AI Assistant. I can help you with reporting civic issues, tracking complaints, and answering questions about BBMP services in Bengaluru. What would you like to know?';

/** Suggested questions shown at the start of a conversation. */
export const STARTER_CHIPS: string[] = [
  'How do I report a civic issue?',
  'How do I track my complaint?',
  'What is BBMP?',
  'Which department handles potholes?',
  'What are the BBMP helpline numbers?',
];

/** Fallback response when no FAQ matches. */
export const FALLBACK_RESPONSE =
  "I'm sorry, I didn't quite catch that. I can help with reporting civic issues, tracking complaints, BBMP departments, helpline numbers and how NammaFix AI works. Try one of the suggestions below, or visit the Citizen Portal to report an issue.";

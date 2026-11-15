/**
 * Rule-based intent matching engine for the NammaFix AI chatbot.
 * Scores each FAQ entry against the user's input, returns the best match
 * or a fallback. Follows the same simulated-rule-based pattern used by
 * the existing classification/severity/routing agents.
 */

import {
  FAQ_ENTRIES,
  FALLBACK_RESPONSE,
  STARTER_CHIPS,
  type FaqEntry,
  type ChatAction,
} from '../data/chatbot';
import type { Complaint } from '../types';

export type MessageRole = 'bot' | 'user';

export interface ChatMessage {
  id: string;
  role: MessageRole;
  text: string;
  actions?: ChatAction[];
  chips?: string[];
  /** ISO timestamp */
  at: string;
}

/** Minimum score (0-100) required to treat a match as intentional. */
const MATCH_THRESHOLD = 20;

/** Complaint ID pattern: NF-DEMO-NNNN or NF-YYYYMMDD-NNNN */
const COMPLAINT_ID_RE = /\bNF-(?:DEMO-\d{4}|\d{8}-\d{4})\b/i;

function tokenise(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, ' ')
    .split(/\s+/)
    .filter(Boolean);
}

/** Score a single FAQ entry against the user's tokens (0-100). */
function scoreEntry(entry: FaqEntry, tokens: string[]): number {
  let hits = 0;
  for (const kw of entry.keywords) {
    const kwTokens = tokenise(kw);
    // A keyword phrase matches if every word in the phrase appears in the input
    const phraseMatches = kwTokens.every((t) => tokens.some((u) => u.includes(t) || t.includes(u)));
    // A single-token keyword also partially matches with substring
    const singleMatch = kwTokens.length === 1 && tokens.some((u) => u.includes(kwTokens[0]) || kwTokens[0].includes(u));
    if (phraseMatches || singleMatch) hits++;
  }
  if (entry.keywords.length === 0) return 0;
  return Math.round((hits / entry.keywords.length) * 100);
}

/** Find the best-matching FAQ entry for the user's input. */
function matchFaq(input: string): FaqEntry | null {
  const tokens = tokenise(input);
  if (tokens.length === 0) return null;

  let best: FaqEntry | null = null;
  let bestScore = 0;

  for (const entry of FAQ_ENTRIES) {
    const s = scoreEntry(entry, tokens);
    if (s > bestScore) {
      bestScore = s;
      best = entry;
    }
  }
  return bestScore >= MATCH_THRESHOLD ? best : null;
}

let _msgCounter = 0;
function nextId(): string {
  return `msg-${Date.now()}-${++_msgCounter}`;
}

function botMessage(text: string, actions?: ChatAction[], chips?: string[]): ChatMessage {
  return { id: nextId(), role: 'bot', text, actions, chips, at: new Date().toISOString() };
}

function userMessage(text: string): ChatMessage {
  return { id: nextId(), role: 'user', text, at: new Date().toISOString() };
}

/** Format complaint details as a readable bot reply. */
function complaintStatusReply(c: Complaint, all: Complaint[]): ChatMessage {
  // Resolve root for duplicate complaints
  const root = all.find((x) => x.id === c.duplicateOf) ?? c;
  const isdup = !!c.duplicateOf;
  const lines: string[] = [
    `Here's the status for **${c.id}**:`,
    `• **Category:** ${c.category}`,
    `• **Locality:** ${c.locality}${c.address ? ` – ${c.address}` : ''}`,
    `• **Status:** ${isdup ? root.status : c.status}`,
    `• **Priority:** ${c.analysis.severity.output.level} (${c.analysis.severity.output.score}/100)`,
  ];
  if (isdup) {
    lines.push(`• **Note:** Consolidated into incident **${c.duplicateOf}**`);
  }
  if (root.assignedDepartment) {
    lines.push(`• **Assigned to:** ${root.assignedDepartment}`);
  } else {
    lines.push('• **Assignment:** Awaiting officer approval');
  }
  if (root.history.length > 0) {
    const last = root.history[root.history.length - 1];
    const when = new Date(last.at).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' });
    lines.push(`• **Last update:** ${last.text} (${when})`);
  }
  return botMessage(lines.join('\n'), [{ label: 'Track in Citizen Portal', href: '#/report' }], [
    'What do the complaint statuses mean?',
    'Which department handles my issue?',
  ]);
}

export interface ChatEngine {
  /** Produce the initial greeting message + starter chips. */
  greeting(): ChatMessage;
  /** Process the user's text input and return a bot reply. */
  respond(input: string, complaints: Complaint[]): { user: ChatMessage; bot: ChatMessage };
}

export function createChatEngine(): ChatEngine {
  return {
    greeting() {
      return botMessage(
        "Namaskara! 🙏 I'm the NammaFix AI Assistant. I can help you with reporting civic issues, tracking complaints, and answering questions about BBMP services in Bengaluru. What would you like to know?",
        undefined,
        STARTER_CHIPS,
      );
    },

    respond(input: string, complaints: Complaint[]) {
      const user = userMessage(input.trim());

      // 1. Complaint ID lookup
      const idMatch = input.match(COMPLAINT_ID_RE);
      if (idMatch) {
        const id = idMatch[0].toUpperCase();
        const found = complaints.find((c) => c.id.toUpperCase() === id);
        if (found) {
          return { user, bot: complaintStatusReply(found, complaints) };
        }
        return {
          user,
          bot: botMessage(
            `I couldn't find a complaint with ID **${id}**. Please double-check the ID — it should look like NF-DEMO-0001 or NF-20261115-1001.`,
            [{ label: 'Track in Citizen Portal', href: '#/report' }],
            ['How do I track my complaint?', 'What is a Complaint ID?'],
          ),
        };
      }

      // 2. FAQ intent matching
      const entry = matchFaq(input);
      if (entry) {
        return {
          user,
          bot: botMessage(entry.answer, entry.actions, entry.followUps),
        };
      }

      // 3. Fallback
      return {
        user,
        bot: botMessage(
          FALLBACK_RESPONSE,
          [{ label: 'Go to Citizen Portal', href: '#/report' }],
          STARTER_CHIPS.slice(0, 4),
        ),
      };
    },
  };
}

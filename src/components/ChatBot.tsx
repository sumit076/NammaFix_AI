import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from 'react';
import { Icon } from './Icons';
import { createChatEngine, type ChatMessage } from '../lib/chatbot';
import { useStore } from '../state/store';

/** Render markdown-like bold (**text**) and newlines in bot messages. */
function RichText({ text }: { text: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  const nodes = parts.map((p, i) => {
    if (p.startsWith('**') && p.endsWith('**')) {
      return <strong key={i}>{p.slice(2, -2)}</strong>;
    }
    // Convert \n to line breaks
    return p.split('\n').map((line, j, arr) => (
      <span key={`${i}-${j}`}>
        {line}
        {j < arr.length - 1 && <br />}
      </span>
    ));
  });
  return <>{nodes}</>;
}

function BotBubble({ msg, onChip }: { msg: ChatMessage; onChip: (text: string) => void }) {
  return (
    <div className="flex items-start gap-2.5">
      {/* Avatar */}
      <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-navy-900 text-white">
        <Icon name="chat" className="h-3.5 w-3.5" />
      </span>
      <div className="max-w-[85%] space-y-2">
        <div className="rounded-2xl rounded-tl-sm bg-white px-3.5 py-2.5 text-sm text-ink-900 shadow-card">
          <RichText text={msg.text} />
        </div>
        {/* Action links */}
        {msg.actions && msg.actions.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {msg.actions.map((a) => (
              <a
                key={a.href}
                href={a.href}
                className="inline-flex items-center gap-1.5 rounded-lg border border-brand-200 bg-brand-50 px-2.5 py-1 text-xs font-semibold text-brand-700 hover:bg-brand-100 transition-colors"
              >
                {a.label}
                <Icon name="chevron" className="h-3 w-3" />
              </a>
            ))}
          </div>
        )}
        {/* Quick reply chips */}
        {msg.chips && msg.chips.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {msg.chips.map((chip) => (
              <button
                key={chip}
                type="button"
                onClick={() => onChip(chip)}
                className="rounded-full border border-line bg-white px-2.5 py-1 text-xs font-medium text-ink-700 hover:border-brand-500 hover:text-brand-700 transition-colors"
              >
                {chip}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function UserBubble({ msg }: { msg: ChatMessage }) {
  return (
    <div className="flex justify-end">
      <div className="max-w-[80%] rounded-2xl rounded-tr-sm bg-navy-900 px-3.5 py-2.5 text-sm text-white">
        {msg.text}
      </div>
    </div>
  );
}

const engine = createChatEngine();

export function ChatBot() {
  const { complaints } = useStore();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>(() => [engine.greeting()]);
  const [input, setInput] = useState('');
  const [hasNew, setHasNew] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Scroll to bottom whenever messages change
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input when panel opens
  useEffect(() => {
    if (open) {
      setHasNew(false);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  const send = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    const { user, bot } = engine.respond(trimmed, complaints);
    setMessages((prev) => [...prev, user, bot]);
    setInput('');
  };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    send(input);
  };

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send(input);
    }
  };

  const onChip = (text: string) => {
    send(text);
  };

  return (
    <>
      {/* ── Floating panel ─────────────────────────────────────────────────── */}
      {open && (
        <div
          role="dialog"
          aria-label="NammaFix AI Assistant"
          aria-modal="true"
          className="fixed bottom-20 right-4 z-50 flex w-[22rem] flex-col rounded-2xl border border-line bg-canvas shadow-[0_8px_32px_rgba(16,24,40,0.18)] rise sm:right-6 sm:w-[26rem]"
          style={{ maxHeight: 'min(560px, calc(100dvh - 6rem))' }}
        >
          {/* Header */}
          <div className="flex items-center gap-3 rounded-t-2xl bg-navy-900 px-4 py-3 text-white">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/15">
              <Icon name="chat" className="h-4 w-4" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold leading-tight">Namma AI Assistant</p>
              <p className="text-xs text-blue-200 leading-tight">Ask me about Bengaluru civic services</p>
            </div>
            <button
              type="button"
              aria-label="Close chat"
              onClick={() => setOpen(false)}
              className="rounded-lg p-1 hover:bg-white/15 transition-colors"
            >
              <Icon name="close" className="h-4 w-4" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto space-y-4 px-3 py-4" aria-live="polite" aria-atomic="false">
            {messages.map((msg) =>
              msg.role === 'bot' ? (
                <BotBubble key={msg.id} msg={msg} onChip={onChip} />
              ) : (
                <UserBubble key={msg.id} msg={msg} />
              ),
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input bar */}
          <form
            onSubmit={onSubmit}
            className="flex items-center gap-2 border-t border-line bg-white px-3 py-2.5 rounded-b-2xl"
          >
            <label htmlFor="chat-input" className="sr-only">
              Ask a question
            </label>
            <input
              id="chat-input"
              ref={inputRef}
              type="text"
              className="input flex-1 rounded-full px-3 py-1.5 text-sm"
              placeholder="Ask a question…"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={onKeyDown}
              autoComplete="off"
            />
            <button
              type="submit"
              aria-label="Send"
              disabled={!input.trim()}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-navy-900 text-white hover:bg-navy-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <Icon name="send" className="h-3.5 w-3.5" />
            </button>
          </form>
        </div>
      )}

      {/* ── Floating Action Button ──────────────────────────────────────────── */}
      <button
        type="button"
        aria-label={open ? 'Close AI Assistant' : 'Open AI Assistant'}
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="fixed bottom-4 right-4 z-50 flex h-13 w-13 items-center justify-center rounded-full bg-navy-900 text-white shadow-[0_4px_16px_rgba(11,37,69,0.45)] hover:bg-navy-700 transition-colors sm:right-6"
        style={{ width: '3.25rem', height: '3.25rem' }}
      >
        {open ? (
          <Icon name="close" className="h-5 w-5" />
        ) : (
          <>
            <Icon name="chat" className="h-5 w-5" />
            {hasNew && (
              <span className="absolute -right-0.5 -top-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white ring-2 ring-white">
                !
              </span>
            )}
          </>
        )}
      </button>
    </>
  );
}

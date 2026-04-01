/**
 * HaikuAssistant — Claude Haiku powered project intelligence
 *
 * Context: all projects + tasks (with dates/assignees) + recent activity
 * Requires: VITE_ANTHROPIC_API_KEY in environment
 *
 * NOTE: For production use, proxy calls through a Supabase Edge Function
 * to avoid exposing the API key in the browser bundle.
 */
import { useState, useRef, useEffect } from 'react';
import { MessageCircle, Send, X, Loader2, Bot } from 'lucide-react';
import type { BaseballCardProject } from '../../lib/baseball-card/types';
import { computeRollup } from '../../lib/baseball-card/types';

interface HaikuAssistantProps {
  projects: BaseballCardProject[];
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

function buildContext(projects: BaseballCardProject[]): string {
  const lines: string[] = ['# MMA Tracker – Portfolio Context\n'];

  for (const p of projects) {
    if (p.status === 'archived') continue;
    const { pct, status } = computeRollup(p.tasks);
    lines.push(`## ${p.name} [${p.mma_status}] | ${pct}% complete | ${status}`);
    if (p.description) lines.push(`Description: ${p.description}`);
    if (p.mma_accountable) lines.push(`Owner: ${p.mma_accountable}`);
    if (p.start_date || p.end_date) lines.push(`Timeline: ${p.start_date ?? '?'} → ${p.end_date ?? '?'}`);
    if (p.target_date) lines.push(`Target: ${p.target_date}`);

    if (p.tasks.length > 0) {
      lines.push('Tasks:');
      for (const t of p.tasks) {
        const due = t.due_date ? ` (due ${t.due_date})` : '';
        const assigned = t.assigned_to ? ` [${t.assigned_to}]` : '';
        const done = t.done ? '[x]' : '[ ]';
        lines.push(`  ${done} ${t.task_name || t.text}${assigned}${due}`);
      }
    }

    if (p.activity && p.activity.length > 0) {
      lines.push('Recent activity:');
      for (const a of p.activity.slice(0, 3)) {
        lines.push(`  - ${a.description} (${new Date(a.created_at).toLocaleDateString()})`);
      }
    }
    lines.push('');
  }

  return lines.join('\n');
}

const SYSTEM_PROMPT = `You are a project management assistant for the MMA Tracker, a project portfolio tool used by Marsh McLennan Agency and Third Horizon Strategies. You have real-time context about all active projects, tasks, owners, dates, and activity.

Be concise and actionable. Focus on:
- Identifying at-risk or overdue items
- Summarizing project health
- Suggesting next steps
- Answering questions about specific projects or tasks

Keep responses short (2-4 paragraphs max) unless the user asks for detail.`;

export function HaikuAssistant({ projects }: HaikuAssistantProps) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY as string | undefined;

  useEffect(() => {
    if (open) bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, open]);

  async function sendMessage() {
    const text = input.trim();
    if (!text || loading) return;
    if (!apiKey) {
      setError('VITE_ANTHROPIC_API_KEY is not configured. Add it to your GitHub Secrets.');
      return;
    }
    setError(null);
    setInput('');

    const context = buildContext(projects);
    const userMessage: Message = { role: 'user', content: text };
    const updated = [...messages, userMessage];
    setMessages(updated);
    setLoading(true);

    try {
      const resp = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true',
        },
        body: JSON.stringify({
          model: 'claude-haiku-4-5',
          max_tokens: 1024,
          system: SYSTEM_PROMPT + '\n\n' + context,
          messages: updated.map(m => ({ role: m.role, content: m.content })),
        }),
      });

      if (!resp.ok) {
        const body = await resp.json().catch(() => ({}));
        throw new Error(body?.error?.message ?? `HTTP ${resp.status}`);
      }

      const data = await resp.json();
      const reply = data.content?.[0]?.text ?? '(empty response)';
      setMessages(prev => [...prev, { role: 'assistant', content: reply }]);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen(v => !v)}
        className="fixed bottom-5 right-5 z-50 flex h-12 w-12 items-center justify-center rounded-full bg-mma-dark-blue text-white shadow-lg hover:bg-mma-blue transition-colors"
        title="AI Project Assistant (Claude Haiku)"
      >
        {open ? <X className="h-5 w-5" /> : <Bot className="h-5 w-5" />}
      </button>

      {/* Chat panel */}
      {open && (
        <div className="fixed bottom-20 right-5 z-50 flex h-[480px] w-[380px] flex-col rounded-2xl border border-gray-200 bg-white shadow-2xl">
          {/* Header */}
          <div className="flex items-center gap-2 rounded-t-2xl bg-mma-dark-blue px-4 py-3 text-white">
            <MessageCircle className="h-4 w-4" />
            <span className="text-sm font-semibold">Haiku AI Assistant</span>
            <span className="ml-auto text-xs text-white/60">Claude Haiku</span>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-3 space-y-3">
            {messages.length === 0 && (
              <div className="mt-8 text-center text-sm text-gray-400">
                <Bot className="mx-auto mb-2 h-8 w-8 text-gray-300" />
                Ask me about project status, overdue tasks, owners, or anything in your portfolio.
              </div>
            )}
            {messages.map((m, i) => (
              <div
                key={i}
                className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-xl px-3 py-2 text-sm leading-relaxed ${
                    m.role === 'user'
                      ? 'bg-mma-dark-blue text-white'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {m.content}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="rounded-xl bg-gray-100 px-3 py-2">
                  <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                </div>
              </div>
            )}
            {error && (
              <div className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">{error}</div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="border-t border-gray-100 p-3 flex gap-2">
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
              placeholder="Ask about your projects…"
              disabled={loading}
              className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-mma-blue focus:outline-none disabled:opacity-50"
            />
            <button
              onClick={sendMessage}
              disabled={loading || !input.trim()}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-mma-dark-blue text-white hover:bg-mma-blue disabled:opacity-40 transition-colors"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </>
  );
}

import { useState, useRef, useEffect } from 'react';
import { supabase } from '../../lib/supabase/client';
import { Send, Loader2 } from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

const SYSTEM_PROMPT = `You are a data analyst for Marsh McLennan Agency (MMA), helping analyze Starset Analytics national price transparency data. You have access to V8 (March 2026) and V9 (June 2026) reporting packages, plus the V7 Methodology document.

Key data available:
- V9 Reporting Overview (Jun 2026): high-level summary of V9 dataset, coverage, and methodology changes
- V9 State Review Comparison (V8.2 vs V9): carrier-level weighted rate deltas, confidence score shifts, MSA presence changes, and review flags by state, MSA, and carrier plan
- V9 National MSA Carrier Rankings (Jun 2026): carrier rate rankings by MSA with spend-per-1k, updated 6/12 refresh
- V9 Version Comparison Dictionary: field-level and structural comparison across V8 and V9
- V9 Data Dictionary Master (MMA, Jun 2026): full schema documentation for the V9 national dataset
- V8 Release Notes (Mar 2026): baseline for V8 to V9 comparison
- V7 Methodology (MMA Starset Analytics Methodology 2025 11v7): core methodology reference document

Key facts about V9 (2026_04v9, released June 2026):
- Core dataset: 7,537,209,061 records (4.88 TB) in BigQuery: starset-mma-national.price_transparency_national_mma_transfer.mma_price_transparency_negotiated_rates_providers_national_prod_handl
- Provider directory: Added 183,855 new Type 2 NPI records via other_npi integration; new fields: other_npi_flag, primary_npi
- Carrier network expansion: 87 new networks (74 unique carrier-plan/network combos). Major additions: BCBS HPN (39 combos), BCBS SELECT (7), PacificSource (8), Cigna (5), UPMC (3), HAP (3), plus Asuris, First Choice, Healthcare Highways, Kaiser, McLaren, Medcost, Midlands Choice, Optum Health, Providence, Sanford, Security, Sentara, and UHC additions
- Hospital MRF: Major expansion spanning 36 states
- Provider reference row growth: V8 = 43.6M rows to V9 = 87.6M rows (~2x)
- New data dictionary fields: rate_source_type_carrier, multi_provname_flag, bcbs_hpn_select
- Post-processing additions: percentage-of-billed-charges rate development, anesthesia rate handling updates, hospital MRF mapping integration, BCBS HPN National blended analysis
- Aetna note: Apr-2026 Aetna data held from V9 post-processing due to high-fanout schema 2.0 issues; V8 Aetna data carried forward into V9; supplemental patch may follow
- BCBS SELECT applies to Regions 1-5 and 7; BCBS Home Plans apply to Regions 2, 3, 5, 7, 8, and 9
- UHC regional MRFs (CA, IL, NY, OR, WA) staged for analysis only, not integrated into V9 production rates
- CMS schema 2.0 MRF format adopted for V9; legacy schema 1.0 handled via separate pipeline branch
- Data quality confidence scores: Green = high confidence, Yellow = moderate, Red = low confidence, Imputed = gap-filled
- Imputed rates table: mma_national_imputed_rates (inpatient IP and gap-filled rates for NPIs meeting completeness thresholds)
- State review comparison fields: total_weighted_rate delta, pct_change, confidence score shifts (pct_greenyellow, pct_red), source mix (carrier MRF %, hospital MRF %, imputed %), BCBS spend ratio, review labels (clean/flag), directional flags for big spend swings, stoplight swings, source swings, label changes, appeared/disappeared plans

Key facts about V8 (for comparison):
- V8 expanded to metropolitan AND micropolitan MSAs
- V8 added Cigna HealthPartners and Cigna Priority Health networks
- V8 added anesthesia benchmarking
- V8 provider reference rows: 43.6M (V9 doubled to 87.6M)

Answer questions clearly and concisely. Use bullet points for comparisons. Be specific about version differences. If asked about something not in the available data (like specific dollar amounts from raw files), explain what the data structure shows and what would need to be queried directly in BigQuery.`;
const SUGGESTED_QUERIES = [
  'Which carriers improved the most from V8 to V9?',
  'What changed in the V9 provider directory?',
  'Which new networks were added in V9?',
  'How did confidence scores shift from V8 to V9?',
  'What is the Aetna data status in V9?',
];
const DATA_AVAILABLE = [
  { version: 'V9 (Jun 2026)', items: ['Reporting Overview', 'State Review Comparison (V8→V9)', 'MSA Carrier Rankings', 'Version Comparison Dictionary', 'Data Dictionary Master'] },
  { version: 'V8 (Mar 2026)', items: ['Release Notes'] },
  { version: 'V7 — Methodology', items: ['MMA Starset Analytics Methodology'] },
];
function renderMarkdown(text: string): React.ReactNode {
  const lines = text.split('\n');
  const elements: React.ReactNode[] = [];
  let key = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Bullet points
    if (line.match(/^[-*ΓÇó]\s+/)) {
      const content = line.replace(/^[-*ΓÇó]\s+/, '');
      elements.push(
        <li key={key++} className="ml-4 mb-1 text-gray-700 text-sm">
          {renderInlineMarkdown(content)}
        </li>
      );
      continue;
    }

    // Headers (##)
    if (line.startsWith('## ')) {
      elements.push(
        <h3 key={key++} className="font-semibold text-gray-900 mt-3 mb-1 text-sm">
          {line.replace(/^## /, '')}
        </h3>
      );
      continue;
    }

    // Headers (#)
    if (line.startsWith('# ')) {
      elements.push(
        <h2 key={key++} className="font-bold text-gray-900 mt-3 mb-1 text-base">
          {line.replace(/^# /, '')}
        </h2>
      );
      continue;
    }

    // Empty lines
    if (line.trim() === '') {
      elements.push(<div key={key++} className="h-2" />);
      continue;
    }

    // Normal paragraph
    elements.push(
      <p key={key++} className="text-sm text-gray-700 mb-1">
        {renderInlineMarkdown(line)}
      </p>
    );
  }

  return <>{elements}</>;
}

function renderInlineMarkdown(text: string): React.ReactNode {
  // Bold: **text**
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return (
    <>
      {parts.map((part, i) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return <strong key={i} className="font-semibold text-gray-900">{part.slice(2, -2)}</strong>;
        }
        return <span key={i}>{part}</span>;
      })}
    </>
  );
}

export function ReportingQueriesView() {

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const sendMessage = async (question: string) => {
    if (!question.trim() || loading) return;

    const userMsg: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: question.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('haiku-chat', {
        body: {
          messages: [{ role: 'user', content: question.trim() }],
          systemPrompt: SYSTEM_PROMPT,
        },
      });

      if (fnError) throw new Error(fnError.message);
      if (data?.error) throw new Error(data.error.message || 'Unknown error from haiku-chat');
      const assistantContent = data.content?.[0]?.text || '(No response)';

      const assistantMsg: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: assistantContent,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, assistantMsg]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-[#F4F6F9]">
      {/* Header */}
      <div className="border-b border-gray-200 bg-white px-6 py-5">
        <h1 className="text-2xl font-bold text-gray-900">Reporting Queries</h1>
        <p className="mt-0.5 text-sm text-gray-500">Ask questions about Starset Analytics V8 &amp; V9 data</p>
      </div>

      {/* Body */}
      <div className="flex flex-1 flex-col gap-4 p-4 sm:p-6 lg:flex-row lg:items-start">

        {/* Left: Chat */}
        <div className="flex flex-1 flex-col gap-3 lg:min-w-0">

          {/* Chat messages */}
          <div className="flex-1 rounded-xl border border-gray-200 bg-white shadow-sm">
            <div className="flex h-[420px] flex-col overflow-y-auto p-4 gap-4" id="chat-scroll">
              {messages.length === 0 && !loading && (
                <div className="flex flex-1 flex-col items-center justify-center text-center py-12">
                  <div className="rounded-full bg-[#009DE0]/10 p-4 mb-3">
                    <Send className="h-6 w-6 text-[#009DE0]" />
                  </div>
                  <p className="text-sm font-medium text-gray-700">Ask a question to get started</p>
                  <p className="text-xs text-gray-400 mt-1">Try one of the suggested queries on the right ΓåÆ</p>
                </div>
              )}

              {messages.map(msg => (
                <div key={msg.id} className={`flex flex-col gap-1 ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                  <span className="text-xs text-gray-400 px-1">
                    {msg.role === 'user' ? 'You' : 'Starset AI'}
                  </span>
                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                      msg.role === 'user'
                        ? 'bg-[#009DE0] text-white'
                        : 'bg-gray-50 border border-gray-200'
                    }`}
                  >
                    {msg.role === 'user' ? (
                      <p className="text-sm">{msg.content}</p>
                    ) : (
                      <div className="prose prose-sm max-w-none">
                        {renderMarkdown(msg.content)}
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {loading && (
                <div className="flex items-start gap-2">
                  <div className="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3">
                    <Loader2 className="h-4 w-4 animate-spin text-[#009DE0]" />
                  </div>
                </div>
              )}

              {error && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  <strong>Error:</strong> {error}
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="border-t border-gray-100 p-3">
              <form onSubmit={handleSubmit} className="flex gap-2 items-end">
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask a question about the reporting data..."
                  rows={2}
                  disabled={loading}
                  className="flex-1 resize-none rounded-xl border border-gray-300 px-3 py-2 text-sm focus:border-[#009DE0] focus:outline-none focus:ring-1 focus:ring-[#009DE0] disabled:opacity-50"
                />
                <button
                  type="submit"
                  disabled={loading || !input.trim()}
                  className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-[#009DE0] text-white transition-colors hover:bg-[#007bb5] disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </button>
              </form>
              <p className="mt-1.5 px-1 text-xs text-gray-400">Press Enter to send ┬╖ Shift+Enter for new line</p>
            </div>
          </div>
        </div>

        {/* Right: Context panel */}
        <div className="flex flex-col gap-4 lg:w-72 lg:flex-shrink-0">

          {/* Data Available */}
          <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
            <div className="border-b border-gray-100 px-4 py-3">
              <h2 className="text-sm font-semibold text-gray-900">Data Available</h2>
            </div>
            <div className="divide-y divide-gray-50 px-4 py-2">
              {DATA_AVAILABLE.map(group => (
                <div key={group.version} className="py-2.5">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-semibold text-gray-600">{group.version}</span>
                    <span className="rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-medium text-green-700">
                      Loaded
                    </span>
                  </div>
                  <ul className="space-y-0.5">
                    {group.items.map(item => (
                      <li key={item} className="flex items-center gap-1.5 text-xs text-gray-500">
                        <span className="h-1.5 w-1.5 rounded-full bg-[#00968F] flex-shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>

          {/* Suggested Queries */}
          <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
            <div className="border-b border-gray-100 px-4 py-3">
              <h2 className="text-sm font-semibold text-gray-900">Suggested Queries</h2>
            </div>
            <div className="flex flex-col gap-2 p-3">
              {SUGGESTED_QUERIES.map(query => (
                <button
                  key={query}
                  onClick={() => sendMessage(query)}
                  disabled={loading}
                  className="rounded-lg border border-[#009DE0]/30 bg-[#009DE0]/5 px-3 py-2 text-left text-xs text-[#009DE0] hover:bg-[#009DE0]/10 hover:border-[#009DE0]/60 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {query}
                </button>
              ))}
            </div>
          </div>

          {/* Version info */}
          <div className="rounded-xl border border-[#FF8C00]/20 bg-[#FF8C00]/5 px-4 py-3">
            <p className="text-xs font-semibold text-[#FF8C00] mb-1">About this tool</p>
            <p className="text-xs text-gray-600">
              AI-powered analysis of Starset Analytics V8 &amp; V9 reporting packages.
              Answers are based on the data structure and known facts — not live queries of raw files.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

import { useState, useRef, useEffect } from 'react';
import { Send, ChevronDown, ChevronUp, Settings, CheckCircle, Loader2 } from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

const SYSTEM_PROMPT = `You are a data analyst for Marsh McLennan Agency (MMA), helping analyze Starset Analytics national price transparency data. You have access to V7 (January 2026) and V8 (March 2026) reporting packages.

Key data available:
- Carrier Rankings (V5/V6/V7): carrier rate rankings by MSA, spend per 1k
- MSA Summary Stats (V7): weighted rates, confidence scores (green/yellow/red), NPI counts by carrier and MSA  
- MSA Carrier Benchmarking (V8): carrier positioning, data quality metrics, V7 vs V8 comparison
- Hospital NPI Coverage (V8): hospital coverage comparison V7 vs V8, utilization context
- Version Summary Changes (V6/V7/V8): side-by-side version comparison by carrier, MSA, taxonomy

Key facts about the data:
- V8 added Cigna HealthPartners and Cigna Priority Health networks (new in V8, no V7 baseline)
- V8 expanded to metropolitan AND micropolitan MSAs (V7 was metro only)
- V8 uses Candor Health provider directory (refreshed Jan 2026)
- V8 added anesthesia benchmarking
- Data quality confidence scores: Green = high confidence, Yellow = moderate, Red = low confidence
- Rate record counts grew significantly V7ΓåÆV8 (example: Aetna Choice POS in Abilene TX went from 2.6M to 4.3M records)

Answer questions clearly and concisely. Use bullet points for comparisons. Be specific about version differences. If asked about something you don't have data for (like specific dollar amounts from the raw files), explain what the data structure shows and what would need to be queried directly.`;

const SUGGESTED_QUERIES = [
  'Which carriers improved the most from V7 to V8?',
  'What MSAs have the highest data quality scores?',
  'Compare Aetna vs BCBS coverage in the Midwest',
  'Show hospital NPI coverage changes V7 to V8',
  'Which carriers have the lowest rate rankings in Chicago?',
];

const DATA_AVAILABLE = [
  { version: 'V7 (Jan 2026)', items: ['Carrier Rankings', 'MSA Summary Stats'] },
  { version: 'V8 (Mar 2026)', items: ['MSA Carrier Benchmarking', 'Hospital NPI Coverage'] },
  { version: 'Cross-Version (V6/V7/V8)', items: ['Version Summary Changes'] },
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
  const defaultKey = import.meta.env.VITE_ANTHROPIC_API_KEY || '';
  const [apiKey, setApiKey] = useState<string>(() => {
    return defaultKey || localStorage.getItem('mma_anthropic_key') || '';
  });
  const [apiKeyInput, setApiKeyInput] = useState(apiKey);
  const [settingsOpen, setSettingsOpen] = useState(!apiKey);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const saveApiKey = () => {
    const trimmed = apiKeyInput.trim();
    setApiKey(trimmed);
    localStorage.setItem('mma_anthropic_key', trimmed);
    setSettingsOpen(false);
  };

  const sendMessage = async (question: string) => {
    if (!question.trim() || loading) return;
    if (!apiKey) {
      setSettingsOpen(true);
      return;
    }

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
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
          'content-type': 'application/json',
          'anthropic-dangerous-direct-browser-access': 'true',
        },
        body: JSON.stringify({
          model: 'claude-haiku-4-5',
          max_tokens: 1024,
          system: SYSTEM_PROMPT,
          messages: [{ role: 'user', content: question.trim() }],
        }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData?.error?.message || `API error ${response.status}`);
      }

      const data = await response.json();
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
        <p className="mt-0.5 text-sm text-gray-500">Ask questions about Starset Analytics V7 &amp; V8 data</p>
      </div>

      {/* Body */}
      <div className="flex flex-1 flex-col gap-4 p-4 sm:p-6 lg:flex-row lg:items-start">

        {/* Left: Chat */}
        <div className="flex flex-1 flex-col gap-3 lg:min-w-0">

          {/* Settings Panel */}
          <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
            <button
              onClick={() => setSettingsOpen(!settingsOpen)}
              className="flex w-full items-center justify-between px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-xl transition-colors"
            >
              <span className="flex items-center gap-2">
                <Settings className="h-4 w-4 text-gray-400" />
                API Settings
                {apiKey && (
                  <span className="ml-1 flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-700">
                    <CheckCircle className="h-3 w-3" />
                    Key set
                  </span>
                )}
              </span>
              {settingsOpen ? <ChevronUp className="h-4 w-4 text-gray-400" /> : <ChevronDown className="h-4 w-4 text-gray-400" />}
            </button>
            {settingsOpen && (
              <div className="border-t border-gray-100 px-4 py-3">
                {!apiKey && (
                  <p className="mb-2 text-xs text-amber-600">
                    Enter your Anthropic API key to enable queries
                  </p>
                )}
                <div className="flex gap-2">
                  <input
                    type="password"
                    value={apiKeyInput}
                    onChange={e => setApiKeyInput(e.target.value)}
                    placeholder="sk-ant-api03-..."
                    className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm font-mono focus:border-[#009DE0] focus:outline-none focus:ring-1 focus:ring-[#009DE0]"
                  />
                  <button
                    onClick={saveApiKey}
                    className="rounded-lg bg-[#009DE0] px-4 py-2 text-sm font-medium text-white hover:bg-[#007bb5] transition-colors"
                  >
                    Save
                  </button>
                </div>
              </div>
            )}
          </div>

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
                  disabled={loading || !apiKey}
                  className="flex-1 resize-none rounded-xl border border-gray-300 px-3 py-2 text-sm focus:border-[#009DE0] focus:outline-none focus:ring-1 focus:ring-[#009DE0] disabled:opacity-50"
                />
                <button
                  type="submit"
                  disabled={loading || !input.trim() || !apiKey}
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
                  disabled={loading || !apiKey}
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
              AI-powered analysis of Starset Analytics V7 &amp; V8 reporting packages. 
              Answers are based on the data structure and known facts ΓÇö not live queries of raw files.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase/client';

interface CallNote {
  id: string;
  meeting_date: string;
  subject: string;
  attendees: { name: string; email: string }[];
  has_peter: boolean;
  is_8am: boolean;
  granola_id: string | null;
  granola_title: string | null;
  granola_web_url: string | null;
  summary_markdown: string | null;
  synced_at: string;
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('en-US', {
    hour: 'numeric', minute: '2-digit', timeZone: 'America/Chicago', timeZoneName: 'short'
  });
}

function NoteCard({ note, expanded, onToggle }: { note: CallNote; expanded: boolean; onToggle: () => void }) {
  const hasSummary = !!note.summary_markdown;

  return (
    <div className={`rounded-xl border bg-white shadow-sm transition-all ${
      note.has_peter ? 'border-[#234D8B]/30' : 'border-gray-200'
    }`}>
      {/* Card header */}
      <button
        onClick={onToggle}
        className="w-full text-left px-5 py-4 flex items-start gap-4 hover:bg-gray-50/50 rounded-xl transition-colors"
      >
        {/* Date column */}
        <div className="flex-shrink-0 w-20 text-center">
          <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
            {new Date(note.meeting_date).toLocaleDateString('en-US', { weekday: 'short', timeZone: 'America/Chicago' })}
          </div>
          <div className="text-2xl font-bold text-[#224057] leading-none mt-0.5">
            {new Date(note.meeting_date).toLocaleDateString('en-US', { day: 'numeric', timeZone: 'America/Chicago' })}
          </div>
          <div className="text-xs text-gray-400 mt-0.5">
            {new Date(note.meeting_date).toLocaleDateString('en-US', { month: 'short', timeZone: 'America/Chicago' })}
          </div>
        </div>

        {/* Divider */}
        <div className="w-px self-stretch bg-gray-100 flex-shrink-0" />

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <span className="font-semibold text-[#224057] text-sm">{note.subject}</span>
            {note.has_peter && (
              <span className="rounded-full bg-[#234D8B]/10 border border-[#234D8B]/20 px-2 py-0.5 text-[10px] font-semibold text-[#234D8B]">
                Peter
              </span>
            )}
            {note.is_8am && (
              <span className="rounded-full bg-amber-50 border border-amber-200 px-2 py-0.5 text-[10px] font-semibold text-amber-700">
                8 AM
              </span>
            )}
            {!hasSummary && (
              <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] text-gray-400">
                No notes
              </span>
            )}
          </div>
          <div className="text-xs text-gray-400">
            {formatTime(note.meeting_date)}
            {note.attendees.length > 0 && (
              <> · {note.attendees.slice(0, 4).map(a => a.name || a.email.split('@')[0]).join(', ')}
              {note.attendees.length > 4 && ` +${note.attendees.length - 4} more`}</>
            )}
          </div>
          {/* Preview line */}
          {!expanded && hasSummary && (
            <p className="text-xs text-gray-500 mt-1.5 line-clamp-2">
              {note.summary_markdown?.replace(/[#*\-`]/g, '').substring(0, 160)}...
            </p>
          )}
        </div>

        {/* Expand icon */}
        {hasSummary && (
          <div className={`flex-shrink-0 text-gray-300 transition-transform mt-1 ${expanded ? 'rotate-180' : ''}`}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        )}
      </button>

      {/* Expanded notes */}
      {expanded && hasSummary && (
        <div className="px-5 pb-5">
          <div className="w-full h-px bg-gray-100 mb-4" />
          <div className="space-y-1">
            {(note.summary_markdown || '').split('\n').map((line, i) => {
              const trimmed = line.trim();
              if (!trimmed) return <div key={i} className="h-2" />;
              if (trimmed.startsWith('### ')) return <h3 key={i} className="text-xs font-bold text-[#224057] mt-3 mb-1">{trimmed.replace(/^### /, '')}</h3>;
              if (trimmed.startsWith('## ')) return <h2 key={i} className="text-sm font-bold text-[#224057] mt-4 mb-1">{trimmed.replace(/^## /, '')}</h2>;
              if (trimmed.startsWith('# ')) return <h1 key={i} className="text-sm font-bold text-[#224057] mt-4 mb-1">{trimmed.replace(/^# /, '')}</h1>;
              if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
                const depth = (line.match(/^(\s+)/) || ['',''])[1].length;
                return <div key={i} className="flex gap-2 text-xs text-gray-600" style={{paddingLeft: depth * 8 + 8}}>
                  <span className="text-gray-400 mt-0.5 flex-shrink-0">•</span>
                  <span>{trimmed.replace(/^[-*] /, '')}</span>
                </div>;
              }
              return <p key={i} className="text-xs text-gray-600">{trimmed}</p>;
            })}
          </div>

        </div>
      )}
    </div>
  );
}

export function CallNotesView() {
  const [notes, setNotes] = useState<CallNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [meetingType, setMeetingType] = useState<'regular' | 'quarterly'>('regular');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [lastSync, setLastSync] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const { data, error } = await supabase
        .from('call_notes')
        .select('*')
        .order('meeting_date', { ascending: false })
        .limit(60);
      if (data && !error) {
        setNotes(data as CallNote[]);
        if (data.length > 0) setLastSync(data[0].synced_at);
      }
      setLoading(false);
    }
    load();
  }, []);

  const byType = notes.filter(n => {
    const s = (n.subject || '').toLowerCase();
    const isQuarterly = s.includes('quarterly') || s.includes('strategy') || s.includes('qbr');
    return meetingType === 'quarterly' ? isQuarterly : !isQuarterly;
  });

  const filtered = byType;

  const withNotes = filtered.filter(n => n.summary_markdown);
  const withoutNotes = filtered.filter(n => !n.summary_markdown);

  return (
    <div className="flex h-screen flex-col bg-[#f5f6f8]">
      {/* Header */}
      <div className="border-b border-gray-200 bg-white px-6 py-4">
        <h1 className="text-lg font-bold text-[#224057]">Meeting Notes</h1>
        <p className="text-xs text-gray-400 mt-0.5">
          Granola-powered · MMA meetings · Last 35 days
          {lastSync && <> · Synced {new Date(lastSync).toLocaleDateString()}</>}
        </p>
      </div>

      {/* Nav bar — sits on gray bg so tint is visible */}
      <div className="border-b border-gray-200 bg-[#f5f6f8] px-6 py-3 flex flex-wrap items-center justify-between gap-3">
        <nav className="flex gap-1 rounded-lg bg-[#224057]/5 p-1">
          {([['regular', 'Regular Meetings'], ['quarterly', 'Quarterly Strategy']] as const).map(([val, label]) => (
            <button key={val} onClick={() => { setMeetingType(val); setExpandedId(null); }}
              className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                meetingType === val ? 'bg-white text-[#224057] shadow-sm' : 'text-[#224057]/60 hover:text-[#224057]'
              }`}>
              {label}
            </button>
          ))}
        </nav>

      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-6 py-6">
        {loading ? (
          <div className="flex items-center justify-center h-40 text-gray-400 text-sm">Loading meeting notes...</div>
        ) : filtered.length === 0 ? (
          <div className="flex items-center justify-center h-40 text-gray-400 text-sm">No meetings found for this filter.</div>
        ) : (
          <div className="space-y-3 max-w-4xl">
            {withNotes.map(note => (
              <NoteCard key={note.id} note={note}
                expanded={expandedId === note.id}
                onToggle={() => setExpandedId(expandedId === note.id ? null : note.id)} />
            ))}
            {withoutNotes.length > 0 && (
              <>
                <div className="pt-4 pb-1">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
                    Meetings without Granola notes ({withoutNotes.length})
                  </p>
                </div>
                {withoutNotes.map(note => (
                  <NoteCard key={note.id} note={note}
                    expanded={false}
                    onToggle={() => {}} />
                ))}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

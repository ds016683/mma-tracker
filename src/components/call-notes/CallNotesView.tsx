import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase/client';

// ─── Types ────────────────────────────────────────────────────────────────────

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

type QuarterlyTab = 'summary' | 'recording' | 'notes' | 'materials';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('en-US', {
    hour: 'numeric', minute: '2-digit', timeZone: 'America/Chicago', timeZoneName: 'short'
  });
}

function MarkdownBody({ md }: { md: string }) {
  return (
    <div className="space-y-1">
      {md.split('\n').map((line, i) => {
        const trimmed = line.trim();
        if (!trimmed) return <div key={i} className="h-2" />;
        if (trimmed.startsWith('### ')) return <h3 key={i} className="text-xs font-bold text-[#224057] mt-3 mb-1">{trimmed.replace(/^### /, '')}</h3>;
        if (trimmed.startsWith('## '))  return <h2 key={i} className="text-sm font-bold text-[#224057] mt-4 mb-1">{trimmed.replace(/^## /, '')}</h2>;
        if (trimmed.startsWith('# '))   return <h1 key={i} className="text-sm font-bold text-[#224057] mt-4 mb-1">{trimmed.replace(/^# /, '')}</h1>;
        if (trimmed.startsWith('- ') || trimmed.startsWith('* ') || trimmed.match(/^-{3,}\s*$/)) {
          if (trimmed.match(/^-{3,}\s*$/)) return <hr key={i} className="border-gray-100 my-3" />;
          const depth = (line.match(/^(\s+)/) || ['', ''])[1].length;
          return (
            <div key={i} className="flex gap-2 text-xs text-gray-600" style={{ paddingLeft: depth * 8 + 8 }}>
              <span className="text-gray-400 mt-0.5 flex-shrink-0">•</span>
              <span>{trimmed.replace(/^[-*] /, '').replace(/\*\*(.*?)\*\*/g, '$1')}</span>
            </div>
          );
        }
        if (trimmed.match(/^\d+\.\s/)) {
          const depth = (line.match(/^(\s+)/) || ['', ''])[1].length;
          return (
            <div key={i} className="flex gap-2 text-xs text-gray-600" style={{ paddingLeft: depth * 8 + 8 }}>
              <span className="text-gray-400 mt-0.5 flex-shrink-0 w-4">{trimmed.match(/^(\d+)\./)?.[1]}.</span>
              <span>{trimmed.replace(/^\d+\.\s+/, '')}</span>
            </div>
          );
        }
        // skip bare Granola transcript links
        if (trimmed.startsWith('Chat with meeting transcript:')) return null;
        return <p key={i} className="text-xs text-gray-600">{trimmed}</p>;
      })}
    </div>
  );
}

// ─── Regular Meeting Card ─────────────────────────────────────────────────────

function NoteCard({ note, expanded, onToggle }: { note: CallNote; expanded: boolean; onToggle: () => void }) {
  const hasSummary = !!note.summary_markdown;

  return (
    <div className="rounded-xl border border-gray-200 bg-white shadow-sm transition-all">
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

        <div className="w-px self-stretch bg-gray-100 flex-shrink-0" />

        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <span className="font-semibold text-[#224057] text-sm">{note.subject}</span>
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
          </div>
          {!expanded && hasSummary && (
            <p className="text-xs text-gray-500 mt-1.5 line-clamp-2">
              {note.summary_markdown?.replace(/[#*\-`]/g, '').substring(0, 160)}...
            </p>
          )}
        </div>

        {hasSummary && (
          <div className={`flex-shrink-0 text-gray-300 transition-transform mt-1 ${expanded ? 'rotate-180' : ''}`}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        )}
      </button>

      {expanded && hasSummary && (
        <div className="px-5 pb-5">
          <div className="w-full h-px bg-gray-100 mb-4" />
          <MarkdownBody md={note.summary_markdown || ''} />
        </div>
      )}
    </div>
  );
}

// ─── Quarterly Meeting Data ───────────────────────────────────────────────────

const JUN15_NOTES = `### Strategic Context: V9 to V10 Shift

- Data production pipeline now largely mature; diminishing returns on further optimization
  - Networks, hospital NERFs, source files essentially stable
- Priority shifts to methodology: imputation and data coverage definition
- Broader ambition: move beyond rate comparisons into analytics and intelligence
  - MMA competitors beginning to enter this space
  - Goal is to leapfrog with more sophisticated data use cases

### V9 State of the State

- Data started flowing last week; overall quality trends positive at high level
- Institutional HCP codes showed quality decline for Cigna and UHC (outpatient, HICC codes)
  - Flagged as likely a data characteristic issue, not a pipeline issue
  - Percent-of-Medicare normalization attempted to detect rate shifts; inconclusive so far
- Kaiser excluded from version-to-version comparison (no prior full-process baseline)

### Tier Shift and Quality Summary Tool

- New tool compares percent of green/yellow records by billing class and building type across versions
- Shows MSA-level distribution via box plots plus count of improved vs. declined MSAs
- Example: institutional MSDRG, 263 MSAs improved, 67 declined (out of 364 total)

### Data Size and Credit for V9 Work

- Current data coverage proxy measure understates actual data gain
  - Binary flag logic: if utilization-weighted coverage clears a threshold, the whole category shows green
- Rough ingestion numbers: ~53% more rate records coming in vs. V8; networks roughly doubled
- Pipeline tracker being built (Chris Kalvig) to show record counts at each processing stage
  - Ingestion, analytic filters, post-processing, and final production output
  - Will enable a clear before/after story from V8 to V9

### Carrier Ranking and Network Coverage Tracker

- Carrier ranking table now in tracker; shows spend-based rank (lowest cost = 1)
  - Rank inflation noted because more networks added; need a re-rank limited to the four core BUCA networks
- Hospital coverage table updated with room-line data, including facility and APC/AIS detail
- Percent-of-charge rates new to V9; separate view comparing quality with and without them

### Imputation: Current State Problems

- Current imputation operates at carrier/plan/MSA/billing-code level, not NPI level
- Methodology was built for a sparse North Carolina dataset; anchored relativity toward 1.0
  - In markets with low transparency data, imputation compresses everything to near-parity
  - Field sees 1% gaps in Network Navigator where external sources show 9% gaps
  - Training wheels are doing all the work; dynamic market differences get flattened

### Imputation: Future State Direction

- Goal: NPI and rate-level imputation, fully integrated into the rate dataset
- Komodo data as the imputation basis where available
- New confidence classification needed to flag imputed rates
- Key unlock: rate-level imputation eliminates the normalization problem as a byproduct
- Handle (front-end) will need schema changes

### Methodology Workplan and Timing

- Three months until V10 delivery to field and MMA clients
- Alignment on methodological changes needed within the next few weeks
- Schema must be delivered to Handle shortly after
- Other method areas flagged:
  - Conversion rate by reimbursement type and geography
  - Modifier handling edge cases
  - Zero-percent inpatient in low-population MSAs

### Next Steps

- Finalize pipeline tracker with all processing stages (Chris Kalvig, target: following day)
- Produce schema outline for rate-level imputation to share with Handle/Brian
- Add population filter to carrier coverage tracker page
- Add rank view limited to four core BUCA networks
- Investigate Cigna and UHC outpatient quality decline
- Summarize conversion rates by reimbursement type and geography (Bobby/Chris)`;

const JUN18_NOTES = `### Year-in-Review: Pipeline Maturity

- Consensus: pipeline has reached yield ceiling; focus shifts to methods, imputation, and tooling
- V9 production run processed ~2.07 trillion data elements; retaining ~200 billion
- Added 49 new carriers and 78 new networks (v9), up from 59 carriers / 108 networks
- Aetna V2 schema remains unresolved
  - First attempt in February nearly broke the system; Google processing costs hit $80K that month vs. ~$30K normal
  - V8 Aetna data still flowing but aging out; actively working a fix

### Strategic Priorities Confirmed

- Three workstreams for next 60–90 days:
  - 1.1: Hotspotting and lineage investigation (Tanner leads)
  - 1.2: Hospital directory, bot automation (Chris Kalvig as exec sponsor)
  - 1.3: Aetna v2 schema pull-through; ingestion redesign targeting July 20th data orders
  - 1.4: Kaiser network (lower priority than Aetna)
- Hospital processor redesign complete and production-ready; carrier processor next

### Imputation Deep Dive

- Current state: MSA/carrier/billing-code level — too coarse
- Future state: NPI-level, rate-embedded imputation with utilization weighting
- Komodo as primary imputation basis; Cigna x Beaumont in Michigan as proof-of-concept
- Handle (IRIS) claims to already do rate-level imputation; schema wiring may be partially in place
- New confidence tier needed beyond green/yellow/red/blue

### Network Navigator v2 Discussion

- v2 targeting early 2027 (per Schedule F)
- Key capability additions discussed:
  - Hotspot mapping — identify cost outlier providers at NPI level
  - Predictive cost modeling for employer clients
  - Direct-to-employer analytics layer

### MMA Field Feedback

- Producers see 1% gaps where other tools show 9% — credibility problem in the field
- Request: simple, memorable stat for field use ("X% more rates, Y% more networks")
- Carrier ranking improvement noted as high visibility with producers`;

const JUN18_SUMMARY = `The June 18th full-day strategy session marked a pivot point in the THS–MMA engagement. After two years of pipeline buildout, both teams aligned that data ingestion has reached a yield ceiling and that the next competitive advantage lies in methodology — specifically NPI-level imputation and data coverage intelligence.

Key outcomes: (1) Three concurrent workstreams confirmed for Q3 through V10 delivery, led by Tanner (hotspotting/lineage), Chris Kalvig (hospital directory automation), and the core data team (Aetna V2 schema fix). (2) The imputation architecture was directionally approved — moving from MSA/plan-level relativities to rate-embedded, utilization-weighted NPI-level imputation using Komodo as the primary data source. (3) Network Navigator v2 scoping was previewed, with a target of early 2027 per Schedule F.

The session also surfaced a field credibility gap: MMA producers are seeing 1% cost differentials in the tool where competitor sources show 9%, a direct consequence of over-smoothed imputation. Closing that gap is the methodological north star heading into V10.`;

const JUN15_SUMMARY = `The June 15th methods and imputation discussion was a working session to align THS and MMA on the technical direction ahead of V10. The conversation confirmed that the data production pipeline is largely mature and that the next layer of value comes from improving imputation precision and expanding data coverage intelligence.

The most significant alignment reached: current imputation methodology — built for a sparse North Carolina dataset — systematically compresses market differences, causing the tool to understate gaps that producers observe in the field. The agreed path forward is NPI-level, rate-embedded imputation using Komodo utilization data as the foundation, replacing the current reference table approach.

Chris Kalvig's pipeline tracker and the carrier ranking refinement were identified as near-term deliverables before the June 18th full-day strategy session.`;

interface QuarterlyMeeting {
  id: string;
  date: string;
  title: string;
  subtitle: string;
  attendees: string;
  summary: string;
  notes: string;
  recordingUrl: string | null;
  timestamps: { time: string; label: string }[];
}

const QUARTERLY_MEETINGS: QuarterlyMeeting[] = [
  {
    id: 'jun15',
    date: '2026-06-15',
    title: 'Methods + Imputation Discussion',
    subtitle: 'MMA & Third Horizon Strategies',
    attendees: 'Peter Schultz, Chris Kalvig, Jeremy Matson, David Smith, Bobby, Andy',
    summary: JUN15_SUMMARY,
    notes: JUN15_NOTES,
    recordingUrl: null,
    timestamps: [],
  },
  {
    id: 'jun18',
    date: '2026-06-18',
    title: 'Full Day Strategy Meeting',
    subtitle: 'MMA & Third Horizon Strategies',
    attendees: 'Peter Schultz, Chris Kalvig, Jeremy Matson, Chris Hart, David Smith, Tanner Johnson',
    summary: JUN18_SUMMARY,
    notes: JUN18_NOTES,
    recordingUrl: 'https://mma-video-proxy.vercel.app/mma-june-18.mp4',
    timestamps: [
      { time: '0:10:31', label: 'Meeting kickoff with Rick' },
      { time: '0:40:43', label: 'AI and machine capabilities discussion' },
      { time: '0:48:54', label: 'Data schemas and carrier updates' },
      { time: '0:52:56', label: 'GitHub repository and database architecture' },
      { time: '0:57:05', label: 'Carrier networks and BCBS demo' },
      { time: '1:11:32', label: 'Back office tooling and UI discussion' },
      { time: '1:36:02', label: 'Strategic narrative and platform evolution' },
      { time: '1:52:27', label: 'RAG architecture whiteboard session' },
      { time: '1:58:35', label: 'LendWork platform demo' },
      { time: '3:07:17', label: 'Data flows and imputation discussion' },
      { time: '3:37:00', label: 'Provider analytics and episode review' },
      { time: '3:53:32', label: 'Future design and benefits strategy' },
      { time: '4:44:01', label: 'IT infrastructure and compute decisions' },
      { time: '5:55:29', label: 'Wrap-up and next steps planning' },
    ],
  },
];

// ─── Main Export ──────────────────────────────────────────────────────────────

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

  // Quarterly view renders its own full layout
  if (meetingType === 'quarterly') {
    return (
      <div className="flex h-screen flex-col bg-[#f5f6f8]">
        {/* Shared nav strip so the pill selector stays visible */}
        <div className="border-b border-gray-200 bg-white px-6 py-4">
          <h1 className="text-lg font-bold text-[#224057]">Meeting Notes</h1>
          <p className="text-xs text-gray-400 mt-0.5">Quarterly Strategy · THS–MMA engagement</p>
        </div>
        <div className="border-b border-gray-200 bg-[#f5f6f8] px-6 py-3">
          <nav className="flex gap-1 rounded-lg bg-[#224057]/5 p-1 w-fit">
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
        {/* Quarterly content */}
        <QuarterlyContent />
      </div>
    );
  }

  const withNotes = notes.filter(n => n.summary_markdown);
  const withoutNotes = notes.filter(n => !n.summary_markdown);

  return (
    <div className="flex h-screen flex-col bg-[#f5f6f8]">
      {/* Header */}
      <div className="border-b border-gray-200 bg-white px-6 py-4">
        <h1 className="text-lg font-bold text-[#224057]">Meeting Notes</h1>
        <p className="text-xs text-gray-400 mt-0.5">
          Granola-powered · MMA meetings
          {lastSync && <> · Synced {new Date(lastSync).toLocaleDateString()}</>}
        </p>
      </div>

      {/* Nav bar */}
      <div className="border-b border-gray-200 bg-[#f5f6f8] px-6 py-3">
        <nav className="flex gap-1 rounded-lg bg-[#224057]/5 p-1 w-fit">
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
        ) : notes.length === 0 ? (
          <div className="flex items-center justify-center h-40 text-gray-400 text-sm">No meetings found.</div>
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
                  <NoteCard key={note.id} note={note} expanded={false} onToggle={() => {}} />
                ))}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Quarterly inner content (meeting picker → detail) ────────────────────────

function QuarterlyContent() {
  const [selected, setSelected] = useState<QuarterlyMeeting | null>(null);
  const [tab, setTab] = useState<QuarterlyTab>('summary');

  if (!selected) {
    return (
      <div className="flex-1 overflow-y-auto px-6 py-6">
        <div className="max-w-4xl space-y-3">
          {QUARTERLY_MEETINGS.map(m => {
            const dateObj = new Date(m.date + 'T12:00:00Z');
            return (
              <button
                key={m.id}
                onClick={() => { setSelected(m); setTab('summary'); }}
                className="w-full text-left rounded-xl border border-gray-200 bg-white shadow-sm hover:shadow-md hover:border-[#224057]/20 transition-all px-5 py-4 flex items-start gap-4"
              >
                <div className="flex-shrink-0 w-20 text-center">
                  <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
                    {dateObj.toLocaleDateString('en-US', { weekday: 'short' })}
                  </div>
                  <div className="text-2xl font-bold text-[#224057] leading-none mt-0.5">
                    {dateObj.toLocaleDateString('en-US', { day: 'numeric' })}
                  </div>
                  <div className="text-xs text-gray-400 mt-0.5">
                    {dateObj.toLocaleDateString('en-US', { month: 'short' })}
                  </div>
                </div>
                <div className="w-px self-stretch bg-gray-100 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <span className="font-semibold text-[#224057] text-sm">{m.title}</span>
                    <span className="rounded-full bg-[#224057]/10 border border-[#224057]/20 px-2 py-0.5 text-[10px] font-semibold text-[#224057]">
                      Quarterly
                    </span>
                  </div>
                  <div className="text-xs text-gray-400 mb-1">{m.subtitle}</div>
                  <p className="text-xs text-gray-500 line-clamp-2">{m.summary.substring(0, 180)}...</p>
                </div>
                <div className="flex-shrink-0 text-gray-300 mt-1">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M6 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  // Detail view
  const tabs: { id: QuarterlyTab; label: string }[] = [
    { id: 'summary',   label: 'Executive Summary' },
    { id: 'recording', label: 'Recording(s)' },
    { id: 'notes',     label: 'Detailed Notes' },
    { id: 'materials', label: 'Companion Materials' },
  ];

  const dateObj = new Date(selected.date + 'T12:00:00Z');
  const dateLabel = dateObj.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });

  return (
    <>
      {/* Detail header — replaces the outer header content */}
      <div className="border-b border-gray-200 bg-[#f5f6f8] px-6 py-3 flex items-center gap-3">
        <button
          onClick={() => setSelected(null)}
          className="flex items-center gap-1.5 text-xs text-[#224057]/60 hover:text-[#224057] transition-colors"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M9 11L5 7l4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          All Quarterly Meetings
        </button>
        <span className="text-gray-300">·</span>
        <span className="text-xs text-[#224057] font-medium">{selected.title}</span>
        <span className="text-xs text-gray-400">· {dateLabel}</span>
      </div>
      {/* Sub-tab nav */}
      <div className="border-b border-gray-200 bg-[#f5f6f8] px-6 py-3">
        <nav className="flex gap-1 rounded-lg bg-[#224057]/5 p-1 w-fit">
          {tabs.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                tab === t.id ? 'bg-white text-[#224057] shadow-sm' : 'text-[#224057]/60 hover:text-[#224057]'
              }`}>
              {t.label}
            </button>
          ))}
        </nav>
      </div>
      {/* Tab content */}
      <div className="flex-1 overflow-y-auto px-6 py-6">
        <div className="max-w-4xl">


          {tab === 'summary' && (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
              <h2 className="text-sm font-bold text-[#224057] mb-4">Executive Summary</h2>
              {selected.summary.split('\n\n').map((para, i) => (
                <p key={i} className="text-sm text-gray-700 leading-relaxed mb-3">{para}</p>
              ))}
            </div>
          )}

          {tab === 'recording' && (
            selected.recordingUrl ? (
              <div className="flex gap-6 items-start">
                <div className="flex-1 bg-black rounded-xl overflow-hidden shadow-sm">
                  <video
                    ref={(el) => { if (el) (window as any)._mmaVideo = el; }}
                    controls
                    className="w-full"
                    src={selected.recordingUrl}
                  />
                </div>
                {selected.timestamps.length > 0 && (
                  <div className="w-64 flex-shrink-0 pt-1">
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Key Moments</p>
                    <div className="space-y-3">
                      {selected.timestamps.map((ts, i) => {
                        const parts = ts.time.split(':').map(Number);
                        const secs = parts.length === 3 ? parts[0]*3600+parts[1]*60+parts[2] : parts[0]*60+parts[1];
                        return (
                          <button
                            key={i}
                            onClick={() => { const v = (window as any)._mmaVideo; if (v) { v.currentTime = secs; v.play(); } }}
                            className="flex gap-3 items-start w-full text-left hover:bg-gray-50 rounded px-1 py-0.5 group transition-colors"
                          >
                            <span className="text-xs font-mono text-[#224057] font-semibold flex-shrink-0 w-14 text-right tabular-nums group-hover:text-blue-600">{ts.time}</span>
                            <span className="text-xs text-gray-600 leading-snug group-hover:text-gray-900">{ts.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-10 text-center">
                <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                    <path d="M6 4l10 6-10 6V4z" fill="#cbd5e1"/>
                  </svg>
                </div>
                <p className="text-sm font-medium text-gray-500">Recording pending</p>
                <p className="text-xs text-gray-400 mt-1">Provide the Zoom recording URL to embed here</p>
              </div>
            )
          )}

          {tab === 'notes' && (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
              <h2 className="text-sm font-bold text-[#224057] mb-4">Detailed Notes</h2>
              <MarkdownBody md={selected.notes} />
            </div>
          )}

          {tab === 'materials' && (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-10 text-center">
              <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <path d="M4 4h8l4 4v8H4V4z" stroke="#cbd5e1" strokeWidth="1.5" strokeLinejoin="round"/>
                  <path d="M12 4v4h4" stroke="#cbd5e1" strokeWidth="1.5" strokeLinejoin="round"/>
                </svg>
              </div>
              <p className="text-sm font-medium text-gray-500">No materials attached</p>
              <p className="text-xs text-gray-400 mt-1">Decks, briefs, and working docs will appear here</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

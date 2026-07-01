// StrategicPlanView — 2H 2026 Strategic Gantt
// Synthesized from: Jun 18 whiteboard, Jun 18 meeting transcript, Jun 22 + Jun 29 + Jul 1 Granola notes

import { useState } from 'react';

// ─── Data ─────────────────────────────────────────────────────────────────────

type Color = 'blue' | 'orange' | 'red' | 'green' | 'purple';
type Category = 'Data Production' | 'Application/Platform' | 'Analytics & Methods' | 'Strategic/Commercial';

interface Bar { label: string; start: string; end: string; color: Color; }
interface Track {
  track: string;
  category: Category;
  owner: string;
  bars: Bar[];
  milestones: string[];
  notes: string;
}

const TRACKS: Track[] = [
  {
    track: "V10 Patches / V11 Launch",
    category: "Data Production",
    owner: "Andy / Data Team",
    bars: [
      { label: "V10 Patches (9.1, 9.2…)", start: "Jul", end: "Oct", color: "blue" },
      { label: "V11 Platform Build", start: "Aug", end: "Nov", color: "orange" },
    ],
    milestones: ["Oct: Decision Gate", "mid-Nov: V11 Launch"],
    notes: "V10 = patches only — no full release. V11 drops mid-Nov with new platform. Jun 22 confirmed.",
  },
  {
    track: "Net Nav 2.0 MVP",
    category: "Application/Platform",
    owner: "Cheryl (Calvin, Courtney support)",
    bars: [
      { label: "Exec Demo / Refinement", start: "Jun", end: "Jul", color: "green" },
      { label: "MVP Development", start: "Jul", end: "Aug", color: "orange" },
      { label: "Super User Testing", start: "Aug", end: "Sep", color: "blue" },
    ],
    milestones: ["mid-Jul: Working Replica", "Aug 15: Super Users (HARD DEADLINE)"],
    notes: "Rick Kelly (MMA actuary): 'most impressive thing I've seen in 20 years.' Hosting path: Databricks Apps on Azure. GitHub as repo. Oct 1 = Handle Health decision gate.",
  },
  {
    track: "NN Clone + Comparison Model",
    category: "Application/Platform",
    owner: "TH Dev",
    bars: [
      { label: "Dev Plan", start: "Jul", end: "Jul", color: "blue" },
      { label: "Alpha Test", start: "Aug", end: "Aug", color: "orange" },
      { label: "User Testing / Deploy", start: "Aug", end: "Sep", color: "green" },
    ],
    milestones: [],
    notes: "Whiteboard track. Supports ST/LT home determination for NN v2. Code from whiteboard referenced as '+ T-Cell code / Comparison Model.'",
  },
  {
    track: "NN v2 ST/LT Home Decision",
    category: "Strategic/Commercial",
    owner: "Peter / MMA",
    bars: [
      { label: "Spec Development", start: "Jul", end: "Jul", color: "blue" },
      { label: "Deliberation", start: "Aug", end: "Sep", color: "orange" },
    ],
    milestones: ["Sep: Hosting Path Decision (open ❓)"],
    notes: "Whiteboard shows red ? after deliberation. Jul 1 confirms Databricks Apps on Azure and GitHub repo as leading path. Final call pending MMA IT approval.",
  },
  {
    track: "Aetna v2 Schema Pull-Through",
    category: "Data Production",
    owner: "TH Data Team",
    bars: [
      { label: "Schema Pull-Through / Ingestion Redesign", start: "Jul", end: "Aug", color: "blue" },
      { label: "LV2 Integration", start: "Aug", end: "Aug", color: "orange" },
    ],
    milestones: ["Jul 20: Data Orders", "Aug 5: LV2 Run"],
    notes: "Jun 29 workstream 1.3. Jul 1 confirms Aetna 2.0 partially ingesting into V9; some V8 still in use. VM → Cloud Run architecture change in parallel.",
  },
  {
    track: "Pipeline Lineage + Hotspotting",
    category: "Data Production",
    owner: "Tanner (Chris build)",
    bars: [
      { label: "BigQuery Wiring", start: "Jul", end: "Jul", color: "orange" },
      { label: "Hotspot Investigation (2-3 regions)", start: "Jul", end: "Sep", color: "blue" },
    ],
    milestones: ["Jul 1: Tanner → Peter region ranking", "Jul 10: Wednesday MMA walkthrough"],
    notes: "Chris built lineage tool; runs on CSV extracts now — needs BigQuery. V8 conversion ~11%; V9 dropped to ~8%. Goal: push toward 15-20%. Jira for ticket tracking.",
  },
  {
    track: "Hospital Directory Bot Automation",
    category: "Data Production",
    owner: "Calvin + Xenon (Calvig sponsor)",
    bars: [
      { label: "Automation Build", start: "Jul", end: "Sep", color: "blue" },
    ],
    milestones: ["Jul 7: Chicago scoping session"],
    notes: "Jun 29 workstream 1.2. Resource gap acknowledged; Calvin + Xenon paired. Calvig weekly check-in for first few weeks.",
  },
  {
    track: "Episode Analytics Module",
    category: "Analytics & Methods",
    owner: "TH Analytics",
    bars: [
      { label: "2–3 Live Production", start: "Jul", end: "Aug", color: "blue" },
      { label: "Design / Build", start: "Sep", end: "Sep", color: "orange" },
      { label: "Super Users", start: "Sep", end: "Oct", color: "green" },
      { label: "Dev → Prod", start: "Oct", end: "Nov", color: "purple" },
    ],
    milestones: ["Oct–Nov: Dev-Prod transition (open ❓)"],
    notes: "Whiteboard track with red ? at end. Covers CDev → Test → Pilot → Prod → Analytics arc. J-Code Analyzer (Cheryl) feeds into this; show Peter Jul 10.",
  },
  {
    track: "Claims Repricing Engine",
    category: "Analytics & Methods",
    owner: "Andy / John (MMA)",
    bars: [
      { label: "Snapshot Repricing", start: "Jul", end: "Aug", color: "blue" },
      { label: "MMA Integration (open ❓)", start: "Aug", end: "Sep", color: "orange" },
    ],
    milestones: ["Jul: Merge key to MMA (done)", "Aug: Fuzzy match logic"],
    notes: "Jul 1 confirms exact-match POC complete across clients. Paused before fuzzy match logic. Andy + Ollie + Alex to pick back up. Data schema for repricing app needs definition.",
  },
  {
    track: "Quality Methods in Pipeline",
    category: "Analytics & Methods",
    owner: "Bobby",
    bars: [
      { label: "Finish Trial Run", start: "Jul", end: "Aug", color: "blue" },
    ],
    milestones: [],
    notes: "Whiteboard track. APR-DRG conversion final decision pending. HCUP NIS dataset acquisition under review (Bobby). Legal review on Data Use Agreement (Cheryl/Greg).",
  },
  {
    track: "Handle Health Contract Decision",
    category: "Strategic/Commercial",
    owner: "MMA / Peter",
    bars: [
      { label: "Midwest Plans Follow-Up", start: "Jul", end: "Sep", color: "orange" },
      { label: "Decision Window", start: "Sep", end: "Oct", color: "red" },
    ],
    milestones: ["Oct 1: 60-Day Notice Deadline", "Dec 31: Contract End"],
    notes: "60-day notice required before Dec 31. MMA leaning toward drop if MVP ready. Jul 1: still pending Midwest plans resolution from Handle.",
  },
  {
    track: "TH Capital Discussion",
    category: "Strategic/Commercial",
    owner: "David / TH",
    bars: [
      { label: "Investment Discussion", start: "Jul", end: "Aug", color: "purple" },
    ],
    milestones: ["mid-Jul: Initial Meeting (open ❓)"],
    notes: "Whiteboard: 'TH + MS + ? Capital' box mid-July. MMA flagged as candidate for material minority investment (Jun 22). Nature and structure TBD.",
  },
];

// ─── Config ───────────────────────────────────────────────────────────────────

const MONTHS = ['Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const MONTH_IDX: Record<string, number> = { Jun: 0, Jul: 1, Aug: 2, Sep: 3, Oct: 4, Nov: 5, Dec: 6 };

const COLORS: Record<Color, { bar: string; label: string }> = {
  blue:   { bar: 'bg-[#009DE0]',   label: 'Planned / In Progress' },
  orange: { bar: 'bg-[#FF8C00]',   label: 'Uncertain / TBD' },
  red:    { bar: 'bg-[#EF4E45]',   label: 'Decision Gate / Blocked' },
  green:  { bar: 'bg-[#00AC41]',   label: 'Complete / Milestone' },
  purple: { bar: 'bg-[#8246AF]',   label: 'Strategic / Commercial' },
};

const CATEGORY_COLORS: Record<Category, string> = {
  'Data Production':        'bg-[#009DE0]/10 text-[#009DE0] border-[#009DE0]/30',
  'Application/Platform':   'bg-[#8246AF]/10 text-[#8246AF] border-[#8246AF]/30',
  'Analytics & Methods':    'bg-[#00968F]/10 text-[#00968F] border-[#00968F]/30',
  'Strategic/Commercial':   'bg-[#F8C762]/20 text-[#b38a00] border-[#F8C762]/50',
};

const CATEGORIES: Category[] = ['Data Production', 'Application/Platform', 'Analytics & Methods', 'Strategic/Commercial'];

// ─── Component ────────────────────────────────────────────────────────────────

export function StrategicPlanView() {
  const [activeCategory, setActiveCategory] = useState<Category | 'All'>('All');
  const [selectedTrack, setSelectedTrack] = useState<Track | null>(null);

  const filtered = activeCategory === 'All' ? TRACKS : TRACKS.filter(t => t.category === activeCategory);

  return (
    <div className="flex flex-col h-full bg-[#f5f6f8]">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-[#224057]">2H 2026 Strategic Plan</h1>
            <p className="text-xs text-gray-400 mt-0.5">
              Synthesized from Jun 18 whiteboard · Jun 18 meeting transcript · Jun 22 / Jun 29 / Jul 1 team notes
            </p>
          </div>
          {/* Legend */}
          <div className="flex items-center gap-3">
            {(Object.entries(COLORS) as [Color, { bar: string; label: string }][]).map(([color, { bar, label }]) => (
              <div key={color} className="flex items-center gap-1.5">
                <div className={`h-2.5 w-5 rounded-sm ${bar}`} />
                <span className="text-[10px] text-gray-400">{label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Category filter */}
        <div className="mt-3">
          <nav className="inline-flex bg-[#224057]/5 rounded-lg p-1 gap-1">
            {(['All', ...CATEGORIES] as (Category | 'All')[]).map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                  activeCategory === cat
                    ? 'bg-white text-[#224057] shadow-sm'
                    : 'text-[#224057]/60 hover:text-[#224057]'
                }`}
              >
                {cat}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Gantt body */}
      <div className="flex-1 overflow-auto px-6 py-6">
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          {/* Month header */}
          <div className="flex border-b border-gray-100 bg-gray-50">
            <div className="w-64 flex-shrink-0 px-4 py-2.5 border-r border-gray-100">
              <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Track</span>
            </div>
            {MONTHS.map(m => (
              <div key={m} className="flex-1 text-center py-2.5 border-r border-gray-100 last:border-r-0">
                <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">{m}</span>
              </div>
            ))}
          </div>

          {/* Rows */}
          {filtered.map((track, i) => (
            <div
              key={track.track}
              onClick={() => setSelectedTrack(selectedTrack?.track === track.track ? null : track)}
              className={`flex border-b border-gray-50 last:border-b-0 cursor-pointer transition-colors ${
                selectedTrack?.track === track.track ? 'bg-[#009DE0]/5' : 'hover:bg-gray-50/70'
              }`}
            >
              {/* Label column */}
              <div className="w-64 flex-shrink-0 px-4 py-3 border-r border-gray-100">
                <div className="flex items-start gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-semibold text-[#224057] leading-snug">{track.track}</div>
                    <div className="text-[10px] text-gray-400 mt-0.5">{track.owner}</div>
                  </div>
                  <span className={`flex-shrink-0 text-[9px] font-semibold px-1.5 py-0.5 rounded-full border ${CATEGORY_COLORS[track.category]}`}>
                    {track.category.split('/')[0]}
                  </span>
                </div>
              </div>

              {/* Bar columns */}
              <div className="flex flex-1 relative">
                {MONTHS.map((m, mi) => (
                  <div key={m} className="flex-1 border-r border-gray-50 last:border-r-0 relative py-3 px-0.5" style={{ minWidth: 0 }}>
                    {track.bars
                      .filter(bar => MONTH_IDX[bar.start] <= mi && MONTH_IDX[bar.end] >= mi)
                      .map((bar, bi) => {
                        const isStart = MONTH_IDX[bar.start] === mi;
                        const isEnd = MONTH_IDX[bar.end] === mi;
                        return (
                          <div
                            key={bi}
                            className={`h-6 ${COLORS[bar.color].bar} opacity-85
                              ${isStart ? 'rounded-l-md ml-1' : 'ml-0'}
                              ${isEnd ? 'rounded-r-md mr-1' : 'mr-0'}
                              flex items-center overflow-hidden`}
                          >
                            {isStart && (
                              <span className="text-[9px] font-semibold text-white whitespace-nowrap px-2 overflow-hidden text-ellipsis">
                                {bar.label}
                              </span>
                            )}
                          </div>
                        );
                      })}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Detail panel */}
        {selectedTrack && (
          <div className="mt-4 bg-white rounded-xl border border-gray-200 shadow-sm p-5">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="text-sm font-bold text-[#224057]">{selectedTrack.track}</h3>
                <p className="text-xs text-gray-400 mt-0.5">Owner: {selectedTrack.owner}</p>
              </div>
              <span className={`text-[9px] font-semibold px-2 py-0.5 rounded-full border ${CATEGORY_COLORS[selectedTrack.category]}`}>
                {selectedTrack.category}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-4">
              {/* Bars */}
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">Timeline Bars</p>
                <div className="space-y-1.5">
                  {selectedTrack.bars.map((bar, _i) => (
                    <div key={_i} className="flex items-center gap-2">
                      <div className={`h-2.5 w-2.5 rounded-sm flex-shrink-0 ${COLORS[bar.color].bar}`} />
                      <span className="text-xs text-gray-600">{bar.label}</span>
                      <span className="text-[10px] text-gray-400 ml-auto">{bar.start}{bar.end !== bar.start ? `–${bar.end}` : ''}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Milestones */}
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">Key Milestones</p>
                {selectedTrack.milestones.length > 0 ? (
                  <div className="space-y-1.5">
                    {selectedTrack.milestones.map((m, i) => (
                      <div key={i} className="flex items-start gap-2">
                        <span className="text-[#009DE0] mt-0.5 flex-shrink-0">◆</span>
                        <span className="text-xs text-gray-600">{m}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-gray-400 italic">No hard milestones recorded</p>
                )}
              </div>

              {/* Notes */}
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">Reconciliation Notes</p>
                <p className="text-xs text-gray-600 leading-relaxed">{selectedTrack.notes}</p>
              </div>
            </div>
          </div>
        )}

        <p className="text-[10px] text-gray-400 mt-4 text-center">
          Click any row to expand detail · Last synthesized: July 1, 2026
        </p>
      </div>
    </div>
  );
}

import { useState } from 'react';
import { ChevronDown, ChevronUp, DollarSign, Users, Calendar, CheckCircle2, Clock, Circle } from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

type WOType = 'EWO' | 'IWO';
type WOStatus = 'complete' | 'in-progress' | 'not-started' | 'at-risk';

interface WorkOrder {
  id: string;
  type: WOType;
  number: number;
  code: string;
  title: string;
  value: number;
  status: WOStatus;
  progress: number; // 0–100
  timeline: string;
  scope: string;
  deliverables: string[];
  hours?: number;
  notes?: string;
}

// ─── Work Order Data ───────────────────────────────────────────────────────────

const WORK_ORDERS: WorkOrder[] = [
  // ── Schedule E: Enhancement Work Orders ──
  {
    id: 'ewo-1',
    type: 'EWO',
    number: 1,
    code: 'PAD 25-03-MMA-APRDRG',
    title: 'APR-DRG/EAPG to MS-DRG Conversion',
    value: 28236,
    status: 'in-progress',
    progress: 35,
    timeline: 'v8 (Phase 1) · v9 (Phase 2)',
    hours: 88,
    scope: `Convert APR-DRG/EAPG data to MS-DRG equivalents for four BCBS health plans (BCBSMN, BCBSND, Wellmark BCBSIA, BCBSSD) to normalize inpatient pricing data across payer submissions.

Phase 1 — APR-DRG/EAPG Field Extraction (v8 + Production Runs): Identify APR-DRG/EAPG fields in payer MRFs for each BCBS plan; pull and persist fields through v8 data transfer and production runs; resolve outstanding data pull issues for BCBSND and BCBSMN (BCBSIA and BCBSSD already pulled and present in v8).

Phase 2 — Conversion Methodology & Test Cases (v9): Apply published APR/EAPG-to-MS crosswalk tables (3M/state-published) with historical distribution weighting; map APR/EAPG-DRG 4-level severity (Minor/Moderate/Major/Extreme) to MS-DRG 3-level (No CC/CC/MCC); execute repricing test cases across DRG families and service lines; analyze case mix and outlier impact.`,
    deliverables: [
      'APR-DRG/EAPG field mapping documentation for each BCBS plan MRF',
      'Resolved data pulls for BCBSND and BCBSMN with validated fields in production pipeline',
      'APR-DRG/EAPG to MS-DRG conversion methodology specification (crosswalk tables, severity mapping rules)',
      'Test case results with comparative analysis (APR/EAPG vs. MS payment outputs, CMI impact, service line variance)',
      'Production-ready conversion logic for v9 integration',
    ],
  },
  {
    id: 'ewo-2',
    type: 'EWO',
    number: 2,
    code: 'PAD 25-03-MMA-REGNET1',
    title: 'Regional Network Additions — Cigna Plans',
    value: 10000,
    status: 'complete',
    progress: 100,
    timeline: 'Targeted 2026_01v8 · Feb 24, 2026',
    hours: undefined,
    scope: `Pull two net new Cigna regional networks into the data platform for inclusion in the v8 production data transfer (2026_01v8). Both networks are sourced from Cigna Starset National Representative Plans.

Networks added:
• Cigna HealthPartners (CIGNA_HEALTHPARTNERS)
• Cigna Priority Health (CIGNA_PRIORITYHEALTH)`,
    deliverables: [
      'Cigna HealthPartners network data pulled and present in v8 (2026_01v8)',
      'Cigna Priority Health network data pulled and present in v8 (2026_01v8)',
      'Both networks ingested and queryable; data validated against source MRF',
    ],
  },
  {
    id: 'ewo-3',
    type: 'EWO',
    number: 3,
    code: 'PAD 25-03-MMA-REGNET2',
    title: 'Regional Carrier Expansion — Batch 2 (18 Networks)',
    value: 90000,
    status: 'in-progress',
    progress: 20,
    timeline: 'Targeted v9 · Apr 28, 2026',
    scope: `Pull 18 net new regional carrier networks into the data platform for inclusion in v9 production data transfer (2026_01v8). Networks span First Choice Health, Health Alliance Plan, Medcost, Midlands Choice, PacificSource, Providence Health Plan, Sanford Health Plan, Security Health Plan, Sentara, UPMC Health Plan, and Asuris.

Full network list:
• First Choice Health TPA (FCH-TPA)
• HAP AHLD PPO, HAP Open HMO, HAP HPOS POS (Health Alliance Plan)
• Medcost Preferred (MED_PREF)
• Midlands Choice with Mayo (MID_2E)
• PacificSource ID/MT/OR Voyager and Navigator (6 files)
• Providence Option Advantage Premium (PHP_OPTIONADV_PREM)
• Sanford Health Plan (SAN_SHP)
• Security Health Plan HMO (SHP_HMO_NETWORK)
• Sentara OHIC PPO + Sentara HMO
• UPMC Total Advantage, UPMC Premium, UPMC Standard
• Asuris Preferred (ASUR_PREF_LZ)`,
    deliverables: [
      'All 18 network additions pulled and present in v9 production data transfer',
      'Each file ingested, post-processed, and queryable in production dataset',
      'Validated against source MRF for each carrier',
    ],
  },
  {
    id: 'ewo-4',
    type: 'EWO',
    number: 4,
    code: 'PAD 25-03-MMA-NETENH',
    title: 'Network File Enhancement — Key Payer Data Integrity (10 Networks)',
    value: 15000,
    status: 'in-progress',
    progress: 20,
    timeline: 'Targeted v9 · Apr 28, 2026',
    scope: `Pull 10 net new network files for Cigna and United Healthcare to strengthen data integrity and expand coverage depth in v9 production data transfer. Cigna and UHC are the highest-volume carriers in MMA's portfolio; pathway, MVP, and POS Plus variants materially affect rate accuracy in specific geographies.

Cigna networks:
• Cigna OAP Pathway (CIGNA_OAP_PATH)
• Cigna LocalPlus Pathway (CIGNA_LP_PATH)
• Cigna MVP Mountain View (CIGNA_MVP_MV)
• Cigna MVP (CIGNA_MVP)
• Cigna SAG (CIGNA_SAG)

United Healthcare networks:
• United Choice POS Plus — New York (UCH_PS1_NY)
• United Choice POS Plus — Illinois (UHC_PS1_IL)
• United Choice POS Plus — California (UHC_PS1_CA)
• United Choice POS Plus — Oregon (UHC_PS1_OR)
• United Choice POS Plus — Washington (UCH_PS1_WA)`,
    deliverables: [
      'All 10 network file additions pulled and present in v9 production data transfer',
      'Each file ingested, post-processed, and queryable in production dataset',
      'Validated against source MRF for each carrier',
    ],
  },

  // ── Schedule F: Innovation Work Orders ──
  {
    id: 'iwo-1',
    type: 'IWO',
    number: 1,
    code: 'PAD-25-04-MMA-HRE',
    title: 'Hospital Client Growth Opportunity',
    value: 100000,
    status: 'complete',
    progress: 100,
    timeline: 'Jan – Feb 2026',
    hours: 117,
    scope: `Underlying development of delivery tools that support wider data distribution to hospitals downstream. Expansion of provider MRF processing capabilities and file volumes that support a downstream hospital offering.

Establishes foundational data infrastructure for a hospital advisory offering and broader market distribution. Includes capability assessment, delivery tool framework development for hospital data distribution, and expanded MRF file volume processing.`,
    deliverables: [
      'Assessment of current provider MRF processing capabilities and gap analysis',
      'Delivery tool framework for hospital data distribution',
      'Expanded MRF file volume processing specifications',
      'Initial hospital client offering documentation',
    ],
  },
  {
    id: 'iwo-2',
    type: 'IWO',
    number: 2,
    code: 'PAD-25-04-MMA-DRU',
    title: 'Pharmacy Data Analytics Discovery & Mapping',
    value: 100000,
    status: 'complete',
    progress: 90,
    timeline: 'Feb – Mar 2026',
    hours: 117,
    scope: `Identification of specialty drugs, J-Code analysis, and initial strategic framing on drug analytics using payer/provider MRFs as currently configured. Develops the initial analytical framework for pharmacy data using existing data; serves as the foundation for broader specialty pharmacy analytics capability enabling MMA consultants to deliver drug pricing insights to employer clients.`,
    deliverables: [
      'Specialty drug identification and J-Code taxonomy mapping',
      'Initial strategic framing document for pharmacy analytics use cases',
      'Payer/provider MRF pharmacy data inventory and quality assessment',
      'Methodology documentation for drug analytics approach',
    ],
  },
  {
    id: 'iwo-3',
    type: 'IWO',
    number: 3,
    code: 'PAD 25-04-MMA-CLMTIC',
    title: 'Claims-TiC Data Linkage & Repricing Model Development',
    value: 51738,
    status: 'in-progress',
    progress: 50,
    timeline: 'Mar – Jun 2026 · MMA independent repricing by Q3 2026',
    hours: 166,
    scope: `Establish the connection foundation between Claims and Transparency in Coverage (TiC) datasets and develop a repricing model enabling MMA to independently execute employer case repricing by Q3 2026.

Work includes: data table walkthrough with MMA team; linking Claims and TiC data to create a connection foundation; developing a claims key to enable reliable matching across datasets; refining logic to determine which TiC records apply to which claims and how rates are applied; executing real-life employer case repricing proof-of-concepts to validate the model and prepare MMA for independent repricing capability.`,
    deliverables: [
      'Data table walkthrough documentation and modeling/training plan for MMA team',
      'Claims-TiC linkage framework and claims key specification',
      'Repricing logic documentation (TiC record selection rules, rate application methodology)',
      'Employer case repricing POC output(s) with validated results',
      'Repricing model and supporting materials sufficient for MMA independent execution',
    ],
  },
  {
    id: 'iwo-4',
    type: 'IWO',
    number: 4,
    code: 'PAD 25-04-MMA-EPI',
    title: 'Episode Intelligence — AI-Augmented Analytics Platform & June Demo',
    value: 125000,
    status: 'in-progress',
    progress: 65,
    timeline: 'Apr – Jun 2026 · June Global Meeting Demo',
    hours: 388,
    scope: `Multi-layer episode intelligence capability integrating TIC data, adjudicated claims, and PACES definitions into a unified episode analytics infrastructure, culminating in a live demo at the June global meeting.

Includes: back-end episode data processors (ingest, normalize, tabulate from TIC, claims, and PACES); Episode Analytics Platform (EAP) v1.0 — browser-based, AI-augmented with interactive dashboards, provider performance scorecards, network-level savings modeling, and embedded AI query interface; Raleigh, NC market live use case for demonstration; and a fully packaged June global meeting demo with executive-ready findings.`,
    deliverables: [
      'Episode data processing pipeline (ingestion scripts, normalization logic, validated episode tables)',
      'Episode Analytics Platform (EAP) v1.0 — dashboard, scorecard, savings modeler, AI query interface',
      'Raleigh, NC market use case (data selection rationale, episode findings, platform walkthrough)',
      'June global meeting demo package (platform build, executive deck, narrative, rehearsal docs)',
      'Technical documentation (data dictionary, methodology notes, deployment guide)',
    ],
    notes: 'Demo target: June global meeting. Raleigh use case must be MMA-approved ≥1 week prior.',
  },
  {
    id: 'iwo-5',
    type: 'IWO',
    number: 5,
    code: 'PAD 25-04-MMA-SPRX',
    title: 'Specialty Rx Data Analytics Discovery & Modeling',
    value: 35749,
    status: 'complete',
    progress: 85,
    timeline: 'Mar – Apr 2026',
    hours: 111,
    scope: `Develop initial analytical models to assess pricing trends and market opportunities using existing Specialty Rx transaction-level (TiC) data, with emphasis on site-of-care variance.

Includes: J-code table subsetting from v8 data with EDA against a selected MMA case; descriptive summary reports of payer/provider drug pricing data findings across 2–5 target MSAs by drug and site of care; high-cost drug analysis for drugs with significant price variation (e.g., Neulasta, Eloxatin) to support market positioning discussions.`,
    deliverables: [
      'Exploratory data analysis summary on J-code subset with MMA case findings',
      'Descriptive summary report(s) of payer/provider drug pricing by MSA, drug, site of care',
      'High-cost drug pricing variation analysis (single-drug deep dives)',
      'Initial pricing trend models and methodology documentation',
    ],
  },
  {
    id: 'iwo-6',
    type: 'IWO',
    number: 6,
    code: 'PAD 25-04-MMA-QUAL',
    title: 'Quality Measure Methods & Data Pipeline Assimilation',
    value: 138775,
    status: 'in-progress',
    progress: 25,
    timeline: 'Apr 2026+',
    scope: `Extend Starset Analytics v10 from cost-only benchmarking to a paired cost-and-quality analytic by assimilating a provider quality measure reliability methodology into existing Komodo Sentinel and BigQuery infrastructure.

Includes: Komodo Sentinel data audit (confirm episode-grouped commercial claims availability in BigQuery; identify gap vs. claims spine required for quality measure computation); episode grouper evaluation (assess PACES Release 5.3 licensing and select grouper for v10 pipeline); build Stage 1–4 pipeline on BigQuery with documented test results; produce cost-quality intersection output (Stage 8): four-state designation matrix per provider per episode.

Strategic context: addresses ERISA fiduciary scrutiny by pairing negotiated rate benchmarks with provider quality scores.`,
    deliverables: [
      'Komodo Sentinel data audit memo with confirmed acquisition/configuration path',
      'v10 Quality Scope Memo (MMA-approved before sprint start)',
      'Working Stage 1–4 pipeline on BigQuery with documented test results',
      'Cost-quality intersection output (Stage 8): four-state designation matrix per provider per episode',
    ],
  },
  {
    id: 'iwo-7',
    type: 'IWO',
    number: 7,
    code: 'PAD 25-04-MMA-PLTF',
    title: 'Next-Generation Analytics Platform — Architecture & Prototyping',
    value: 32350,
    status: 'in-progress',
    progress: 10,
    timeline: 'May 12 – Jul 11, 2026',
    hours: 90,
    scope: `Design the architecture and produce working prototypes for a next-generation employer-facing analytics platform intended to replace the current Iris data delivery mechanism. Scope is limited to design and prototyping only — no production build is included in this IWO.

Six capability modules to be prototyped: (1) Provider rate look-up — searchable negotiated rate explorer with MSA/payer/specialty filters; (2) Provider quality scores — integrated cost-quality designation interface drawing on IWO-6 quality pipeline; (3) High-cost drug analysis — site-of-care and price variation analysis for key specialty drugs; (4) Episode comparison; (5) Claims repricing; (6) LLM query tool for natural language exploration.

Deliverables include a platform architecture document, working prototypes for all six modules, a build recommendation memo (make vs. partner), and a component library specification. Production build authorization requires a separate work order.`,
    deliverables: [
      'Platform architecture document — technical design for unified six-module analytics application with BigQuery integration',
      'Working prototypes for all six capability modules (AI-assisted build)',
      'Build recommendation memo — scope, cost, timeline, and make-vs-partner recommendation',
      'Component library specification — reusable UI components and design tokens for production build phase',
    ],
    notes: 'Scope = design + prototyping only. Production build requires a separate WO. Prototypes must be demonstrated to MMA project sponsor. Signature page unsigned as of Apr 28, 2026.',
  },
];

// ─── Helper functions ─────────────────────────────────────────────────────────

function formatCurrency(n: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);
}

function statusConfig(status: WOStatus) {
  switch (status) {
    case 'complete':    return { label: 'Complete',     color: 'text-emerald-700 bg-emerald-50 border-emerald-200',  dot: 'bg-emerald-500',  Icon: CheckCircle2 };
    case 'in-progress': return { label: 'In Progress',  color: 'text-blue-700 bg-blue-50 border-blue-200',           dot: 'bg-blue-500',     Icon: Clock };
    case 'at-risk':     return { label: 'At Risk',      color: 'text-amber-700 bg-amber-50 border-amber-200',        dot: 'bg-amber-500',    Icon: Clock };
    case 'not-started': return { label: 'Not Started',  color: 'text-gray-600 bg-gray-50 border-gray-200',           dot: 'bg-gray-400',     Icon: Circle };
  }
}

function progressBarColor(status: WOStatus, pct: number) {
  if (status === 'complete') return 'bg-emerald-500';
  if (status === 'at-risk')  return 'bg-amber-500';
  if (pct >= 60)             return 'bg-blue-500';
  if (pct >= 30)             return 'bg-blue-400';
  return 'bg-blue-300';
}

// ─── Single card ──────────────────────────────────────────────────────────────

function WorkOrderCard({ wo }: { wo: WorkOrder }) {
  const [expanded, setExpanded] = useState(false);
  const sc = statusConfig(wo.status);
  const isEWO = wo.type === 'EWO';
  const accentBg  = isEWO ? 'bg-[#8246AF]' : 'bg-[#00968F]';
  const accentText = isEWO ? 'text-[#8246AF]' : 'text-[#00968F]';
  const accentBorder = isEWO ? 'border-[#8246AF]/20' : 'border-[#00968F]/20';
  const accentLight = isEWO ? 'bg-[#8246AF]/5' : 'bg-[#00968F]/5';

  return (
    <div className={`rounded-xl border bg-white shadow-sm transition-shadow hover:shadow-md ${accentBorder}`}>
      {/* Card header — always visible */}
      <button
        onClick={() => setExpanded(v => !v)}
        className="w-full text-left"
        aria-expanded={expanded}
      >
        <div className="flex items-start gap-4 px-5 py-4">
          {/* Left: type badge */}
          <div className={`mt-0.5 flex-shrink-0 rounded-md px-2.5 py-1 text-xs font-bold tracking-wider text-white ${accentBg}`}>
            {wo.type}–{wo.number}
          </div>

          {/* Center: title + meta */}
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-sm font-semibold text-gray-900 leading-snug">{wo.title}</h3>
              <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium ${sc.color}`}>
                <span className={`h-1.5 w-1.5 rounded-full ${sc.dot}`} />
                {sc.label}
              </span>
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-gray-500">
              <span className="flex items-center gap-1">
                <DollarSign className="h-3 w-3" />
                {formatCurrency(wo.value)}
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {wo.timeline}
              </span>
              {wo.hours && (
                <span className="flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  {wo.hours} hrs est.
                </span>
              )}
              <span className={`text-xs font-medium ${accentText}`}>{wo.code}</span>
            </div>

            {/* Progress bar */}
            <div className="mt-2.5 flex items-center gap-2">
              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-gray-100">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${progressBarColor(wo.status, wo.progress)}`}
                  style={{ width: `${wo.progress}%` }}
                />
              </div>
              <span className="w-8 flex-shrink-0 text-right text-xs font-medium text-gray-500">
                {wo.progress}%
              </span>
            </div>
          </div>

          {/* Right: expand icon */}
          <div className="mt-1 flex-shrink-0 text-gray-400">
            {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </div>
        </div>
      </button>

      {/* Expanded detail */}
      {expanded && (
        <div className={`border-t ${accentBorder} px-5 py-4 ${accentLight}`}>
          <div className="grid gap-5 md:grid-cols-2">
            {/* Scope */}
            <div>
              <h4 className={`mb-2 text-xs font-semibold uppercase tracking-wider ${accentText}`}>Scope of Work</h4>
              <p className="whitespace-pre-line text-xs text-gray-700 leading-relaxed">{wo.scope}</p>
            </div>

            {/* Deliverables */}
            <div>
              <h4 className={`mb-2 text-xs font-semibold uppercase tracking-wider ${accentText}`}>Deliverables</h4>
              <ol className="space-y-1.5">
                {wo.deliverables.map((d, i) => (
                  <li key={i} className="flex gap-2 text-xs text-gray-700">
                    <span className={`mt-0.5 flex-shrink-0 font-semibold ${accentText}`}>{i + 1}.</span>
                    <span>{d}</span>
                  </li>
                ))}
              </ol>
              {wo.notes && (
                <div className="mt-3 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                  <span className="font-semibold">Note: </span>{wo.notes}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Section divider ──────────────────────────────────────────────────────────

function SectionHeader({ label, color, count, total }: { label: string; color: string; count: number; total: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className={`h-4 w-1 rounded-full ${color}`} />
      <h2 className="text-sm font-semibold text-gray-700">{label}</h2>
      <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-500">{count} work orders</span>
      <span className="ml-auto text-xs font-medium text-gray-500">{total} total value</span>
    </div>
  );
}

// ─── Main view ────────────────────────────────────────────────────────────────

export function WorkOrdersView() {
  const ewoOrders = WORK_ORDERS.filter(w => w.type === 'EWO');
  const iwoOrders = WORK_ORDERS.filter(w => w.type === 'IWO');

  const ewoTotal = ewoOrders.reduce((s, w) => s + w.value, 0);
  const iwoTotal = iwoOrders.reduce((s, w) => s + w.value, 0);

  return (
    <div className="space-y-8">
      {/* ── Schedule E ── */}
      <div className="space-y-3">
        <SectionHeader
          label="Schedule E — Data Enhancement Work Orders"
          color="bg-[#8246AF]"
          count={ewoOrders.length}
          total={formatCurrency(ewoTotal)}
        />
        {ewoOrders.map(wo => <WorkOrderCard key={wo.id} wo={wo} />)}
      </div>

      {/* ── Schedule F ── */}
      <div className="space-y-3">
        <SectionHeader
          label="Schedule F — Innovation Work Orders"
          color="bg-[#00968F]"
          count={iwoOrders.length}
          total={formatCurrency(iwoTotal)}
        />
        {iwoOrders.map(wo => <WorkOrderCard key={wo.id} wo={wo} />)}
      </div>
    </div>
  );
}

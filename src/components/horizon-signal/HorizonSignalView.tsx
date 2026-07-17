import { useState, useEffect } from 'react';
import { Radio, ExternalLink, CalendarDays, Archive, ChevronDown, ChevronRight, Loader2, AlertCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase/client';

export interface HorizonArticleLink {
  title: string;
  outlet: string;
  url: string;
  date: string;
}

export interface HorizonDigest {
  id: string;
  published_at: string;
  body: string[];
  articles: HorizonArticleLink[];
  is_current: boolean;
}

// ─── Hardcoded fallback (used when Supabase table not yet provisioned) ────────

const FALLBACK_DIGESTS: HorizonDigest[] = [
  {
    id: 'fallback-archive-1',
    published_at: '2026-06-05',
    is_current: false,
    body: [
      'The most significant development this week is the escalating federal antitrust pressure on hospital payer contracts. The DOJ\'s Antitrust Division sued OhioHealth on February 20 and NewYork-Presbyterian on March 26, both accused of using market dominance to lock insurers into contracts that shield them from price competition — preventing payers from offering plans that steer patients toward lower-cost alternatives. A third system, Advocate Health in Charlotte, is reportedly under active DOJ investigation. The FTC has launched a dedicated healthcare task force in parallel, and nearly two dozen states now have their own active investigations into hospital contracting practices.',
      'Health system consolidation is accelerating sharply in 2026, with 48 transactions announced through late April — a 30% increase over the same period last year. Most activity is concentrated in physician group acquisitions (21 deals), particularly in orthopedics, internal medicine, and gastroenterology. The headline system-level merger is Englewood Health combining with RWJBarnabas Health to form one of New Jersey\'s largest systems. Sanford Health and North Memorial Health separately announced plans to combine, extending Sanford\'s regional reach into the Twin Cities market.',
      'On the regulatory front, CMS\'s CY2026 OPPS/ASC Final Rule delivered the most significant hospital price transparency updates since the original rule took effect, with enforcement of the new machine-readable file standards beginning April 1, 2026. Key changes tighten data quality requirements, standardize field formats, and expand the scope of required service-line disclosures. Meanwhile, the ACA marketplace is in flux: enhanced premium tax credits expired at the start of 2026, Aetna has exited major individual markets including Florida, and several other carriers are contracting their geographic footprints.',
    ],
    articles: [
      { title: 'DOJ Hospital Antitrust Crackdown 2026', outlet: 'Healthcare Finance Innovations', url: 'https://www.hfi.consulting/articles/g5e4amtl643x9aojon6bhct1ktptvb', date: '2026-04-01' },
      { title: 'Q1 2026 Health Insurance Payer-Provider Dispute Update', outlet: 'FTI Communications', url: 'https://fticommunications.com/q1-2026-health-insurance-payer-provider-dispute-update/', date: '2026-04-15' },
      { title: 'Health System M&A 2026 Round-Up', outlet: 'Levin Associates', url: 'https://healthcare.levinassociates.com/2026/04/27/health-system-ma-2026-round-up/', date: '2026-04-27' },
      { title: 'Hospital and Health System M&A Activity Ramps Up in Q1 2026', outlet: 'Kaufman Hall', url: 'https://www.kaufmanhall.com/insights/research-report/ma-quarterly-activity-report-q1-2026', date: '2026-04-10' },
    ],
  },
  {
    id: 'fallback-current-1',
    published_at: '2026-06-16',
    is_current: true,
    body: [
      'The DOJ Antitrust Division has now filed two civil lawsuits against major health systems in 2026 — OhioHealth (February 20) and NewYork-Presbyterian (March 26) — and Acting Assistant Attorney General Omeed Assefi has publicly stated the department holds a "zero-tolerance policy" against anticompetitive payer contracting. Both suits target the same structural mechanism: "all-or-nothing" inclusion requirements and most-favored-tier clauses that prevent payers from building narrow or tiered network products. The NYP complaint goes further, alleging the system explicitly prohibited payers from offering lower copays when members chose lower-cost rival hospitals.',
      'The most significant structural development in health system consolidation since our last edition is the announced combination of Allina Health and Sutter Health — a proposed $26 billion nonprofit merger that would create one of the largest health systems in the country by revenue, extending Sutter\'s California footprint into Allina\'s Upper Midwest markets including the Twin Cities. The deal was announced May 21 and is now in regulatory review. Separately, Ascension cleared FTC review on June 8 to acquire AmSurg\'s ambulatory surgery center portfolio, adding significant ASC capacity to its post-acute network.',
      'CMS\'s revised machine-readable file standards have been in mandatory enforcement since April 1, 2026. The most consequential change — requiring hospitals to disclose actual allowed amounts rather than estimated figures — is now 2.5 months into enforcement. Early compliance monitoring indicates significant variability: hospitals in competitive urban markets are updating files with greater fidelity, while rural and critical access hospitals show higher rates of continued estimation or missing data fields.',
    ],
    articles: [
      { title: 'DOJ Continues Scrutiny of Health System Contracting in Second 2026 Antitrust Case', outlet: 'Morgan Lewis', url: 'https://www.morganlewis.com/pubs/2026/03/doj-continues-scrutiny-of-health-system-contracting-in-second-2026-antitrust-case', date: '2026-03-31' },
      { title: 'DOJ Prioritizes Antitrust Enforcement Against Large Health Systems', outlet: 'Arnold & Porter', url: 'https://www.arnoldporter.com/en/perspectives/advisories/2026/04/doj-prioritizes-antitrust-enforcement-against-large-health-systems', date: '2026-04-01' },
      { title: 'Allina Health to Join Sutter Health in $26B Proposed Merger', outlet: 'Fierce Healthcare', url: 'https://www.fiercehealthcare.com/providers/allina-health-join-sutter-health-26b-proposed-merger', date: '2026-05-21' },
      { title: 'Ascension Clears FTC Hurdles to Acquire AmSurg Ambulatory Surgery Centers', outlet: 'Healthcare Finance News', url: 'https://www.healthcarefinancenews.com/topic/mergers-acquisitions', date: '2026-06-08' },
      { title: 'Hospital Price Transparency — CY 2026 Enforcement', outlet: 'CMS.gov', url: 'https://www.cms.gov/priorities/key-initiatives/hospital-price-transparency', date: '2026-04-01' },
    ],
  },
];

// ─── Data fetch ───────────────────────────────────────────────────────────────

async function fetchDigests(): Promise<HorizonDigest[]> {
  const { data, error } = await supabase
    .from('horizon_signal_digests')
    .select('*')
    .order('published_at', { ascending: false });
  if (error) {
    // Table not yet provisioned — return hardcoded fallback
    console.warn('horizon_signal_digests fetch failed, using fallback:', error.message);
    return FALLBACK_DIGESTS;
  }
  return (data ?? []) as HorizonDigest[];
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatDate(iso: string) {
  const d = new Date(iso + 'T12:00:00Z');
  return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

function daysSince(iso: string) {
  return Math.floor((Date.now() - new Date(iso + 'T12:00:00Z').getTime()) / 86400000);
}

// ─── View ─────────────────────────────────────────────────────────────────────

export function HorizonSignalView() {
  const [digests, setDigests] = useState<HorizonDigest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState<string | null>(null);

  useEffect(() => {
    fetchDigests()
      .then(setDigests)
      .catch(e => setError(e.message ?? 'Failed to load digests'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingState />;
  if (error)   return <ErrorState message={error} />;

  const current = digests.find(d => d.is_current) ?? digests[0] ?? null;
  const archive = digests.filter(d => !d.is_current);

  if (!current) return <EmptyState />;

  const age = daysSince(current.published_at);
  const sorted = [...current.articles].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  return (
    <div className="min-h-screen bg-mma-light-bg p-4 sm:p-8">
      {/* Header */}
      <div className="mb-8 border-b border-[#001A41]/10 pb-6">
        <div className="flex items-center gap-3 mb-1">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#001A41]">
            <Radio className="h-5 w-5 text-[#009DE0]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[#001A41] tracking-tight">The Horizon Signal</h1>
            <p className="text-xs text-mma-blue-gray uppercase tracking-widest font-medium">
              US Healthcare Market Intelligence · Region Engagement
            </p>
          </div>
        </div>
        <p className="mt-3 text-sm text-mma-blue-gray max-w-2xl">
          A weekly digest of US healthcare market developments relevant to employer plan design, payer-provider dynamics, network intelligence, and price transparency regulation.
        </p>
      </div>

      {/* Current digest card */}
      <div className="mb-8 rounded-2xl border border-[#001A41]/10 bg-white shadow-sm overflow-hidden max-w-4xl">
        {/* Card header */}
        <div className="flex items-center justify-between border-b border-[#001A41]/8 bg-[#001A41]/[0.03] px-6 py-4">
          <div className="flex items-center gap-2">
            <CalendarDays className="h-4 w-4 text-[#009DE0]" />
            <span className="text-sm font-semibold text-[#001A41]">
              Week of {formatDate(current.published_at)}
            </span>
            <span className={`ml-2 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
              age <= 7  ? 'bg-green-50 text-green-700' :
              age <= 14 ? 'bg-amber-50 text-amber-700' :
                          'bg-gray-100 text-gray-500'
            }`}>
              {age === 0 ? 'Today' : age === 1 ? '1 day ago' : `${age} days ago`}
            </span>
          </div>
          <span className="rounded-full bg-[#009DE0]/10 px-3 py-1 text-xs font-semibold text-[#009DE0]">
            Current Edition
          </span>
        </div>

        {/* Body */}
        <div className="px-6 py-6 space-y-4">
          {current.body.map((para, i) => (
            <p key={i} className={`text-sm leading-relaxed ${
              i === 0 ? 'text-[#001A41] font-medium' : 'text-[#3a4a5c]'
            }`}>
              {para}
            </p>
          ))}
        </div>

        {/* Source articles */}
        <div className="border-t border-[#001A41]/8 px-6 py-5">
          <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-mma-blue-gray">
            Source Articles · {sorted.length}
          </p>
          <div className="space-y-2">
            {sorted.map((art, i) => (
              <a
                key={i}
                href={art.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-start justify-between gap-3 rounded-lg border border-[#001A41]/6 bg-[#001A41]/[0.02] px-4 py-3 hover:border-[#009DE0]/40 hover:bg-white transition-all"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-[#001A41] group-hover:text-[#009DE0] transition-colors leading-snug">
                    {art.title}
                  </p>
                  <p className="mt-0.5 text-xs text-mma-blue-gray">
                    {art.outlet} · {formatDate(art.date)}
                  </p>
                </div>
                <ExternalLink className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-mma-blue-gray/40 group-hover:text-[#009DE0] transition-colors" />
              </a>
            ))}
          </div>
        </div>
      </div>

      {/* Cadence note */}
      <p className="max-w-4xl mb-10 text-xs text-mma-blue-gray/60">
        Published weekly every Monday. Content is AI-researched and auto-published by Mr. MMA on cadence.
      </p>

      {/* Archive */}
      <div className="max-w-4xl mt-4">
        <div className="flex items-center gap-2 mb-5 border-t border-[#001A41]/10 pt-8">
          <Archive className="h-4 w-4 text-mma-blue-gray" />
          <h2 className="text-xs font-bold uppercase tracking-widest text-mma-blue-gray">
            Past Editions · {archive.length} {archive.length === 1 ? 'entry' : 'entries'}
          </h2>
        </div>

        {archive.length === 0 ? (
          <div className="rounded-xl border border-dashed border-[#001A41]/15 bg-white/50 px-6 py-8 text-center">
            <p className="text-sm text-mma-blue-gray/60">Past editions will appear here after each published cycle.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {archive.map(entry => (
              <ArchiveEntry key={entry.id} digest={entry} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Archive entry ────────────────────────────────────────────────────────────

function ArchiveEntry({ digest }: { digest: HorizonDigest }) {
  const [open, setOpen] = useState(false);
  const sorted = [...digest.articles].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  return (
    <div className={`rounded-xl border bg-white shadow-sm overflow-hidden transition-all ${
      open ? 'border-[#009DE0]/30' : 'border-[#001A41]/8'
    }`}>
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between px-5 py-4 text-left hover:bg-[#001A41]/[0.02] transition-colors"
      >
        <div className="flex items-center gap-3">
          {open
            ? <ChevronDown className="h-4 w-4 text-[#009DE0] flex-shrink-0" />
            : <ChevronRight className="h-4 w-4 text-mma-blue-gray/50 flex-shrink-0" />}
          <div>
            <span className="text-sm font-semibold text-[#001A41]">
              Week of {formatDate(digest.published_at)}
            </span>
            <span className="ml-3 text-xs text-mma-blue-gray/60">
              {digest.articles.length} sources
            </span>
          </div>
        </div>
        <span className="text-xs text-mma-blue-gray/50 hidden sm:block">
          {open ? 'Collapse' : 'Expand'}
        </span>
      </button>

      {open && (
        <div className="border-t border-[#001A41]/8 px-5 py-5">
          <div className="space-y-3 mb-6">
            {digest.body.map((para, i) => (
              <p key={i} className={`text-sm leading-relaxed ${
                i === 0 ? 'text-[#001A41] font-medium' : 'text-[#3a4a5c]'
              }`}>
                {para}
              </p>
            ))}
          </div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-mma-blue-gray mb-2">
            Source Articles
          </p>
          <div className="space-y-1.5">
            {sorted.map((art, i) => (
              <a
                key={i}
                href={art.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-start justify-between gap-3 rounded-lg border border-[#001A41]/6 bg-[#001A41]/[0.02] px-4 py-3 hover:border-[#009DE0]/40 hover:bg-white transition-all"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-[#001A41] group-hover:text-[#009DE0] transition-colors leading-snug">
                    {art.title}
                  </p>
                  <p className="mt-0.5 text-xs text-mma-blue-gray">
                    {art.outlet} · {formatDate(art.date)}
                  </p>
                </div>
                <ExternalLink className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-mma-blue-gray/40 group-hover:text-[#009DE0] transition-colors" />
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Loading / error / empty states ──────────────────────────────────────────

function LoadingState() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="flex flex-col items-center gap-3 text-mma-blue-gray">
        <Loader2 className="h-6 w-6 animate-spin text-[#009DE0]" />
        <p className="text-sm">Loading Horizon Signal…</p>
      </div>
    </div>
  );
}

function ErrorState({ message }: { message: string }) {
  return (
    <div className="flex min-h-[60vh] items-center justify-center p-8">
      <div className="max-w-md text-center">
        <div className="mb-3 flex justify-center">
          <AlertCircle className="h-8 w-8 text-red-400" />
        </div>
        <p className="text-sm font-medium text-[#001A41]">Failed to load digest</p>
        <p className="mt-1 text-xs text-mma-blue-gray">{message}</p>
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="text-center">
        <Radio className="mx-auto mb-3 h-8 w-8 text-mma-blue-gray/30" />
        <p className="text-sm text-mma-blue-gray">No digest published yet.</p>
      </div>
    </div>
  );
}

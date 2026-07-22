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
    id: 'fallback-archive-3',
    published_at: '2026-07-17',
    is_current: false,
    body: [
      'The DOJ\'s two landmark hospital antitrust suits are now producing decisive developments. In May, OhioHealth filed a motion to dismiss, arguing its "All Products" contracting clauses were procompetitive — the result of competing for contracts against OSU Wexner Medical Center and Mount Carmel. By June 4, NewYork-Presbyterian filed its own dismissal motion, contending the provisions were originally proposed by insurers and that commercial payors hold monopsony power in the NYC market. More significantly, the DOJ and Ohio reached a proposed settlement with OhioHealth — the first resolved case under this enforcement wave. Simultaneously, the White House Council of Economic Advisers published a report projecting substantial national savings from banning anti-steering and all-products clauses broadly, signaling that legislative and regulatory action may follow the litigation track. Large multihospital systems should treat both dismissal motions as insufficient cover — the policy momentum is structural.',
      'Hospital M&A is accelerating into Q3 2026 with two notable transactions in July alone. Ascension announced it will acquire Williamson Health, a county-owned Tennessee health system, in a deal valued at nearly $1 billion — beating competing bids from HCA Healthcare and Optum. The win extends Ascension\'s Tennessee footprint and adds Williamson Medical Center to its regional network. Separately, UConn Health launched a formal bid on July 8 to acquire Bristol Health and Day Kimball Healthcare in Connecticut, seeking to consolidate two independent community systems into its academic medical center network. Becker\'s tracking shows 21 hospital M&As finalized in 2026 to date — concentrated in markets where smaller systems face operating margin pressure from post-pandemic labor costs and commercial rate compression. Sutter Health\'s hire of a dedicated M&A executive to pursue out-of-state partnerships signals further cross-regional consolidation ahead.',
      'Price transparency enforcement dynamics are shifting as the April 1, 2026 CMS MRF standard matures. The updated rules require hospitals to report actual negotiated allowed amounts — median, 10th and 90th percentile, and claim counts — replacing estimated figures. Three and a half months into enforcement, compliance patterns are bifurcating: well-resourced systems in competitive markets are publishing higher-fidelity data, while critical access and rural hospitals lag. For employer plan sponsors and their advisors, this creates an increasingly actionable benchmarking environment in urban markets where MRF data is reliable — and a persistent opacity signal in rural markets where non-compliance is highest. Alston\'s June advisory confirms that large multihospital systems face compounding risk: antitrust scrutiny of payer contracts and price transparency enforcement are converging on the same class of institutions.',
    ],
    articles: [
      { title: 'DOJ brings antitrust lawsuits challenging hospital contracting practices', outlet: 'HFMA', url: 'https://www.hfma.org/legal-and-regulatory-compliance/doj-antitrust-healthcare-contracting-lawsuits/', date: '2026-06-04' },
      { title: 'Health Care Provider Contracts Face Antitrust Scrutiny from Enforcers and White House', outlet: 'Alston & Bird', url: 'https://www.alston.com/en/insights/publications/2026/06/health-care-provider-contract-antitrust-scrutiny', date: '2026-06-01' },
      { title: 'Ascension to Buy Tennessee Health System for Nearly $1B', outlet: 'MedCity News', url: 'https://medcitynews.com/2026/07/ascension-tennessee-health-system-merger/', date: '2026-07-01' },
      { title: 'UConn Health begins bid to add Bristol, Day Kimball hospitals to network', outlet: 'Healthcare Finance News', url: 'https://www.healthcarefinancenews.com/topic/mergers-acquisitions', date: '2026-07-08' },
    ],
  },
  {
    id: 'fallback-archive-2',
    published_at: '2026-06-16',
    is_current: false,
    body: [
      'The DOJ Antitrust Division has now filed two civil lawsuits against major health systems in 2026 — OhioHealth (February 20) and NewYork-Presbyterian (March 26) — and Acting Assistant Attorney General Omeed Assefi has publicly stated the department holds a "zero-tolerance policy" against anticompetitive payer contracting. Both suits target the same structural mechanism: "all-or-nothing" inclusion requirements and most-favored-tier clauses that prevent payers from building narrow or tiered network products. The NYP complaint goes further, alleging the system explicitly prohibited payers from offering lower copays when members chose lower-cost rival hospitals. Legal analysis from Morgan Lewis and Arnold Porter confirms DOJ\'s enforcement theory applies broadly — concentrated market position is not required to trigger scrutiny.',
      'The most significant structural development in health system consolidation this period is the announced combination of Allina Health and Sutter Health — a proposed $26 billion nonprofit merger that would create one of the largest health systems in the country by revenue. The deal was announced May 21 and is now in regulatory review. Separately, Ascension cleared FTC review on June 8 to acquire AmSurg\'s ambulatory surgery center portfolio, adding significant ASC capacity to its post-acute network. These transactions continue a pattern from Q1 2026: consolidation is accelerating across both system and site-of-care dimensions simultaneously.',
      'CMS\'s revised machine-readable file standards have been in mandatory enforcement since April 1, 2026. The most consequential change — requiring hospitals to disclose actual allowed amounts rather than estimated figures — is now approaching three months of enforcement. Early compliance monitoring indicates significant variability: hospitals in competitive urban markets are updating files with greater fidelity, while rural and critical access hospitals show higher rates of continued estimation or missing data fields.',
    ],
    articles: [
      { title: 'DOJ Continues Scrutiny of Health System Contracting in Second 2026 Antitrust Case', outlet: 'Morgan Lewis', url: 'https://www.morganlewis.com/pubs/2026/03/doj-continues-scrutiny-of-health-system-contracting-in-second-2026-antitrust-case', date: '2026-03-31' },
      { title: 'DOJ Prioritizes Antitrust Enforcement Against Large Health Systems', outlet: 'Arnold & Porter', url: 'https://www.arnoldporter.com/en/perspectives/advisories/2026/04/doj-prioritizes-antitrust-enforcement-against-large-health-systems', date: '2026-04-01' },
      { title: 'Allina Health to Join Sutter Health in $26B Proposed Merger', outlet: 'Fierce Healthcare', url: 'https://www.fiercehealthcare.com/providers/allina-health-join-sutter-health-26b-proposed-merger', date: '2026-05-21' },
      { title: 'Hospital Price Transparency — CY 2026 Enforcement', outlet: 'CMS.gov', url: 'https://www.cms.gov/priorities/key-initiatives/hospital-price-transparency', date: '2026-04-01' },
    ],
  },
  {
    id: 'fallback-current-3',
    published_at: '2026-07-22',
    is_current: true,
    body: [
      'Federal antitrust enforcement against health system contracting practices remains aggressive heading into Q3 2026. The DOJ\'s pending litigation against NewYork-Presbyterian Hospital, filed March 26, challenges anti-steering and anti-tiering provisions that allegedly prevent insurers from offering budget-conscious plans excluding high-cost providers. This follows the DOJ\'s February 2026 settlement with OhioHealth over similar practices. The FTC\'s Healthcare Task Force, launched March 20 under Chairman Andrew Ferguson, is coordinating enforcement across the Bureaus of Competition, Consumer Protection, and Economics — with stated intent to expand collaboration with DOJ and HHS. The Task Force has already secured consent orders with Express Scripts and Caremark over PBM rebate practices. Meanwhile, CMS issued noncompliance letters to 519 hospitals between April and early June 2026 under strengthened hospital price transparency enforcement, with HHS Secretary Kennedy warning that the grace period has ended. Only one civil monetary penalty has been assessed since April 1, indicating hospitals are engaging via corrective action plans rather than facing immediate fines.',
      'Hospital M&A activity has rebounded sharply in 2026 after a 15-year low in 2025, with 40 transactions announced in the first half — nearly matching last year\'s full-year total of 46. Sanford Health and Marshfield Clinic completed their $10 billion merger on July 17, creating a combined system with 13,000 new employees. The proposed Sutter Health–Allina Health combination would form a $26 billion, 39-hospital system spanning California, Minnesota, and Wisconsin, pending regulatory approval expected by year-end. Atrium Health\'s planned merger with WakeMed includes a $2 billion investment commitment in Wake County, while Ascension cleared FTC hurdles in June to acquire AmSurg\'s ambulatory surgery centers for $3.9 billion, adding 250 ASCs to its network. Total transacted revenue in Q2 2026 reached $7.7 billion versus $1.4 billion in Q2 2025. Systems are pursuing deals proactively to build scale before anticipated Medicaid cuts, with particular focus on outpatient and ambulatory assets.',
      'UnitedHealthcare remains embroiled in contract disputes with multiple major health systems affecting employer plan members nationwide. University of Miami Health faces an August 1 deadline that would move all UHealth providers out-of-network for UHC commercial and Medicaid plans if no agreement is reached — significant given UHealth\'s position as South Florida\'s only academic health system. Main Line Health secured an agreement in principle with UHC and extended network access through July 14 while finalizing a multi-year contract, averting disruption for approximately 32,000 patients across Philadelphia\'s western suburbs. Lehigh Valley Health Network went out-of-network for UHC commercial plans on April 26 after LVHN claimed UHC unilaterally reduced reimbursements by nearly 40% since 2021. Meanwhile, ACA marketplace dynamics continue pressuring individual market costs: benchmark silver plan premiums increased 21.7% for 2026 following the expiration of American Rescue Plan enhanced subsidies, compared to 6–7% increases in employer-sponsored coverage — creating arbitrage opportunities for ICHRA adoption among small employer clients.',
    ],
    articles: [
      { title: 'DOJ Prioritizes Antitrust Enforcement Against Large Health Systems for Payor Contracting Practices', outlet: 'Arnold & Porter', url: 'https://www.arnoldporter.com/en/perspectives/advisories/2026/04/doj-prioritizes-antitrust-enforcement-against-large-health-systems', date: '2026-04-24' },
      { title: 'FTC Chairman Andrew N. Ferguson Launches Healthcare Task Force', outlet: 'Federal Trade Commission', url: 'https://www.ftc.gov/news-events/news/press-releases/2026/03/ftc-chairman-andrew-n-ferguson-launches-healthcare-task-force', date: '2026-03-20' },
      { title: 'Price Transparency Enforcement: HHS & CMS Reaffirm Focus', outlet: 'Forvis Mazars', url: 'https://www.forvismazars.us/forsights/2026/06/price-transparency-enforcement-hhs-cms-reaffirm-focus', date: '2026-06-09' },
      { title: 'Midwest hospital systems complete $10B mega-merger', outlet: 'Chief Healthcare Executive', url: 'https://www.chiefhealthcareexecutive.com/view/midwest-hospital-systems-complete-10b-mega-merger', date: '2026-07-17' },
      { title: 'Hospital mergers in 2026: Five takeaways', outlet: 'Chief Healthcare Executive', url: 'https://www.chiefhealthcareexecutive.com/view/hospital-mergers-in-2026-five-takeaways', date: '2026-07-21' },
      { title: 'UHealth and UnitedHealthcare Negotiation', outlet: 'University of Miami Health System', url: 'https://umiamihealth.org/en/uhc/uhealth-and-unitedhealthcare-negotiation', date: '2026-07-15' },
      { title: 'Network Negotiations with Main Line Health', outlet: 'UnitedHealthcare', url: 'https://www.uhc.com/mainline', date: '2026-07-14' },
      { title: 'Antitrust & Competition Healthcare 1H 2026 Update', outlet: 'Mondaq / Goodwin', url: 'https://www.mondaq.com/unitedstates/antitrust-eu-competition/1817852/antitrust-competition-healthcare-1h-2026-update', date: '2026-07-15' },
      { title: 'Understanding the Extraordinary Increase in ACA Premiums in 2026', outlet: 'Urban Institute', url: 'https://www.urban.org/research/publication/understanding-extraordinary-increase-aca-premiums-2026', date: '2025-12-18' },
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

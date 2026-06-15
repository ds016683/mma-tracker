import { useState } from 'react';
import { Radio, ExternalLink, RefreshCw, CalendarDays, Archive, ChevronDown, ChevronRight } from 'lucide-react';

export interface HorizonArticleLink {
  title: string;
  outlet: string;
  url: string;
  date: string; // ISO date string
}

export interface HorizonDigest {
  publishedAt: string; // ISO date string
  body: string[]; // paragraphs
  articles: HorizonArticleLink[];
}

// Archive of past digests — newest first (current digest excluded)
const ARCHIVE: HorizonDigest[] = [
  {
    publishedAt: '2026-06-05',
    body: [
      'The most significant development this week is the escalating federal antitrust pressure on hospital payer contracts. The DOJ\'s Antitrust Division sued OhioHealth on February 20 and NewYork-Presbyterian on March 26, both accused of using market dominance to lock insurers into contracts that shield them from price competition — preventing payers from offering plans that steer patients toward lower-cost alternatives. A third system, Advocate Health in Charlotte, is reportedly under active DOJ investigation. The FTC has launched a dedicated healthcare task force in parallel, and nearly two dozen states now have their own active investigations into hospital contracting practices.',
      'Health system consolidation is accelerating sharply in 2026, with 48 transactions announced through late April — a 30% increase over the same period last year. Most activity is concentrated in physician group acquisitions (21 deals), particularly in orthopedics, internal medicine, and gastroenterology. The headline system-level merger is Englewood Health combining with RWJBarnabas Health to form one of New Jersey\'s largest systems, anchored by Englewood\'s $1.17B in net patient revenue. Sanford Health and North Memorial Health separately announced plans to combine, extending Sanford\'s regional reach into the Twin Cities market. Deal sizes are trending smaller and more strategic — average acquired hospital revenue is down year-over-year ($243.5M vs. $298.1M in 2025).',
      'On the regulatory front, CMS\'s CY2026 OPPS/ASC Final Rule delivered the most significant hospital price transparency updates since the original rule took effect, with enforcement of the new machine-readable file standards beginning April 1, 2026. Key changes tighten data quality requirements, standardize field formats, and expand the scope of required service-line disclosures. Meanwhile, the ACA marketplace is in flux: enhanced premium tax credits expired at the start of 2026, Aetna has exited major individual markets including Florida, and several other carriers are contracting their geographic footprints — creating coverage gaps that will pressure employer plan design in affected regions.',
    ],
    articles: [
      {
        title: 'DOJ Hospital Antitrust Crackdown 2026: What CFOs Must Review in Payer Contracts Now',
        outlet: 'Healthcare Finance Innovations',
        url: 'https://www.hfi.consulting/articles/g5e4amtl643x9aojon6bhct1ktptvb',
        date: '2026-04-01',
      },
      {
        title: 'Q1 2026 Health Insurance Payer-Provider Dispute Update',
        outlet: 'FTI Communications',
        url: 'https://fticommunications.com/q1-2026-health-insurance-payer-provider-dispute-update/',
        date: '2026-04-15',
      },
      {
        title: 'Health System M&A 2026 Round-Up',
        outlet: 'Levin Associates',
        url: 'https://healthcare.levinassociates.com/2026/04/27/health-system-ma-2026-round-up/',
        date: '2026-04-27',
      },
      {
        title: 'Hospital and Health System M&A Activity Ramps Up in Q1 2026',
        outlet: 'Kaufman Hall',
        url: 'https://www.kaufmanhall.com/insights/research-report/ma-quarterly-activity-report-q1-2026',
        date: '2026-04-10',
      },
      {
        title: 'Key Price Transparency Updates Hospitals Must Comply with by April 1, 2026',
        outlet: 'Health Law Center',
        url: 'https://healthlawcenter.com/key-price-transparency-updates-hospitals-must-comply-with-by-april-1-2026/',
        date: '2026-03-15',
      },
      {
        title: 'Hospital-Insurer Contract Disputes Could Intensify as Cost Pressures Persist',
        outlet: 'HFMA',
        url: 'https://www.hfma.org/payment-reimbursement-and-managed-care/hospital-insurer-contract-disputes-cost-pressures/',
        date: '2026-01-12',
      },
      {
        title: 'Payer Contracting Trends Shaping 2026',
        outlet: 'Tribunus Health',
        url: 'https://www.tribunushealth.com/insights/the-payer-contracting-trends-that-will-shape-2026/',
        date: '2026-01-08',
      },
      {
        title: 'Notable Health Insurance Policies Taking Effect in 2026',
        outlet: "Becker's Payer Issues",
        url: 'https://www.beckerspayer.com/policy-updates/notable-health-insurance-policies-taking-effect-in-2026/',
        date: '2026-01-02',
      },
    ],
  },
];

// The digest content — updated by Mr. MMA on Mon/Thu cadence, pending approval
const DIGEST: HorizonDigest = {
  publishedAt: '2026-06-16',
  body: [
    'The DOJ Antitrust Division has now filed two civil lawsuits against major health systems in 2026 — OhioHealth (February 20) and NewYork-Presbyterian (March 26) — and Acting Assistant Attorney General Omeed Assefi has publicly stated the department holds a "zero-tolerance policy" against anticompetitive payer contracting. Both suits target the same structural mechanism: "all-or-nothing" inclusion requirements and most-favored-tier clauses that prevent payers from building narrow or tiered network products that exclude or disadvantage the defendant system — even when competitors offer comparable quality at lower prices. The NYP complaint goes further, alleging the system explicitly prohibited payers from offering lower copays when members chose lower-cost rival hospitals. Legal analysis from Morgan Lewis and Arnold Porter confirms DOJ\'s enforcement theory applies broadly — concentrated market position is not required to trigger scrutiny. Any large system using anti-steering or budget-plan restrictions is now in scope.',
    'The most significant structural development in health system consolidation since our last edition is the announced combination of Allina Health and Sutter Health — a proposed $26 billion nonprofit merger that would create one of the largest health systems in the country by revenue, extending Sutter\'s California footprint into Allina\'s Upper Midwest markets including the Twin Cities. The deal was announced May 21 and is now in regulatory review. Separately, Ascension cleared FTC review on June 8 to acquire AmSurg\'s ambulatory surgery center portfolio, adding significant ASC capacity to its post-acute network. These transactions continue a pattern established in Q1 2026: consolidation is accelerating across both system and site-of-care dimensions simultaneously, compressing the competitive alternatives available to payers and employer plan sponsors in affected markets.',
    'CMS\'s revised machine-readable file standards have been in mandatory enforcement since April 1, 2026. The most consequential change — requiring hospitals to disclose actual allowed amounts (median, 10th percentile, 90th percentile, and claim count) rather than estimated figures — is now 2.5 months into enforcement. This shifts MRF data from directional estimates to actuarially grounded rate benchmarks derived from real claims. Early compliance monitoring indicates significant variability: hospitals in competitive urban markets are updating files with greater fidelity, while rural and critical access hospitals show higher rates of continued estimation or missing data fields. For employer plan sponsors, the practical implication is that MRF-sourced benchmarking data is now more reliable for commercial rate negotiations where hospitals are compliant — and conspicuous non-compliance is itself a signal of where rate opacity is being protected.',
  ],
  articles: [
    {
      title: 'DOJ Continues Scrutiny of Health System Contracting in Second 2026 Antitrust Case',
      outlet: 'Morgan Lewis',
      url: 'https://www.morganlewis.com/pubs/2026/03/doj-continues-scrutiny-of-health-system-contracting-in-second-2026-antitrust-case',
      date: '2026-03-31',
    },
    {
      title: 'DOJ Prioritizes Antitrust Enforcement Against Large Health Systems for Payor Contracting Practices',
      outlet: 'Arnold & Porter',
      url: 'https://www.arnoldporter.com/en/perspectives/advisories/2026/04/doj-prioritizes-antitrust-enforcement-against-large-health-systems',
      date: '2026-04-01',
    },
    {
      title: 'DOJ Increasingly Investigating Health Systems, Claiming Anticompetitive Contracts',
      outlet: 'Healthcare Brew',
      url: 'https://www.healthcare-brew.com/stories/2026/04/16/doj-increasingly-investigating-health-systems-claiming-anticompetitive-contracts',
      date: '2026-04-16',
    },
    {
      title: 'Allina Health to Join Sutter Health in $26B Proposed Merger',
      outlet: 'Fierce Healthcare',
      url: 'https://www.fiercehealthcare.com/providers/allina-health-join-sutter-health-26b-proposed-merger',
      date: '2026-05-21',
    },
    {
      title: 'Ascension Clears FTC Hurdles to Acquire AmSurg Ambulatory Surgery Centers',
      outlet: 'Healthcare Finance News',
      url: 'https://www.healthcarefinancenews.com/topic/mergers-acquisitions',
      date: '2026-06-08',
    },
    {
      title: 'Hospital Price Transparency Changes for 2026',
      outlet: 'Gigasheet',
      url: 'https://www.gigasheet.com/post/hospital-price-transparency-changes-for-2026',
      date: '2026-01-15',
    },
    {
      title: 'Hospital Price Transparency — CY 2026 Enforcement',
      outlet: 'CMS.gov',
      url: 'https://www.cms.gov/priorities/key-initiatives/hospital-price-transparency',
      date: '2026-04-01',
    },
  ],
};

function formatDate(iso: string) {
  const d = new Date(iso + 'T12:00:00Z');
  return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

function daysSince(iso: string) {
  const diff = Date.now() - new Date(iso + 'T12:00:00Z').getTime();
  return Math.floor(diff / 86400000);
}

export function HorizonSignalView() {
  const [digest] = useState<HorizonDigest>(DIGEST);
  const age = daysSince(digest.publishedAt);

  // Sort articles newest-first
  const sorted = [...digest.articles].sort(
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
          A twice-weekly digest of US healthcare market developments relevant to employer plan design, payer-provider dynamics, network intelligence, and price transparency regulation.
        </p>
      </div>

      {/* Digest card */}
      <div className="mb-8 rounded-2xl border border-[#001A41]/10 bg-white shadow-sm overflow-hidden max-w-4xl">
        {/* Card header */}
        <div className="flex items-center justify-between border-b border-[#001A41]/8 bg-[#001A41]/[0.03] px-6 py-4">
          <div className="flex items-center gap-2">
            <CalendarDays className="h-4 w-4 text-[#009DE0]" />
            <span className="text-sm font-semibold text-[#001A41]">
              Week of {formatDate(digest.publishedAt)}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <RefreshCw className="h-3 w-3 text-mma-blue-gray" />
            <span className="text-xs text-mma-blue-gray">
              {age === 0 ? 'Updated today' : age === 1 ? 'Updated yesterday' : `Updated ${age} days ago`}
            </span>
          </div>
        </div>

        {/* Article body */}
        <div className="px-6 py-5 space-y-4">
          {digest.body.map((para, i) => (
            <p key={i} className={`text-sm leading-relaxed ${i === 0 ? 'text-[#001A41] font-medium' : 'text-[#3a4a5c]'}`}>
              {i === 0 && (
                <span className="inline-block mr-2 rounded bg-[#009DE0] px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white align-middle">
                  Latest
                </span>
              )}
              {para}
            </p>
          ))}
        </div>
      </div>

      {/* Source articles */}
      <div className="max-w-4xl">
        <h2 className="mb-4 text-xs font-bold uppercase tracking-widest text-mma-blue-gray">
          Source Articles · {sorted.length} items · Past 30 days
        </h2>
        <div className="space-y-2">
          {sorted.map((art, i) => (
            <a
              key={i}
              href={art.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-start justify-between gap-4 rounded-xl border border-[#001A41]/8 bg-white px-5 py-4 shadow-sm transition-all hover:border-[#009DE0]/40 hover:shadow-md"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-[#001A41] group-hover:text-[#009DE0] transition-colors leading-snug">
                  {art.title}
                </p>
                <div className="mt-1 flex items-center gap-2">
                  <span className="text-xs text-mma-blue-gray font-medium">{art.outlet}</span>
                  <span className="text-xs text-mma-blue-gray/50">·</span>
                  <span className="text-xs text-mma-blue-gray">{formatDate(art.date)}</span>
                </div>
              </div>
              <ExternalLink className="mt-0.5 h-4 w-4 flex-shrink-0 text-mma-blue-gray/40 group-hover:text-[#009DE0] transition-colors" />
            </a>
          ))}
        </div>

        {/* Footer note */}
        <p className="mt-6 text-xs text-mma-blue-gray/60 text-center">
          Published Mon & Thu · 5:30 AM EST · Sources limited to past 30 days · Curated by Mr. MMA
        </p>
      </div>

      {/* Archive */}
      <div className="max-w-4xl mt-12">
        <div className="flex items-center gap-2 mb-5 border-t border-[#001A41]/10 pt-8">
          <Archive className="h-4 w-4 text-mma-blue-gray" />
          <h2 className="text-xs font-bold uppercase tracking-widest text-mma-blue-gray">
            Past Editions · {ARCHIVE.length} {ARCHIVE.length === 1 ? 'entry' : 'entries'}
          </h2>
        </div>

        {ARCHIVE.length === 0 ? (
          <div className="rounded-xl border border-dashed border-[#001A41]/15 bg-white/50 px-6 py-8 text-center">
            <p className="text-sm text-mma-blue-gray/60">Past editions will appear here after each published cycle.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {ARCHIVE.map((entry, i) => (
              <ArchiveEntry key={i} digest={entry} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ArchiveEntry({ digest }: { digest: HorizonDigest }) {
  const [open, setOpen] = useState(false);
  const sorted = [...digest.articles].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  return (
    <div className={`rounded-xl border bg-white shadow-sm overflow-hidden transition-all ${
      open ? 'border-[#009DE0]/30' : 'border-[#001A41]/8'
    }`}>
      {/* Accordion header */}
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
              Week of {formatDate(digest.publishedAt)}
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

      {/* Accordion body */}
      {open && (
        <div className="border-t border-[#001A41]/8 px-5 py-5">
          {/* Body paragraphs */}
          <div className="space-y-3 mb-6">
            {digest.body.map((para, i) => (
              <p key={i} className={`text-sm leading-relaxed ${
                i === 0 ? 'text-[#001A41] font-medium' : 'text-[#3a4a5c]'
              }`}>
                {para}
              </p>
            ))}
          </div>
          {/* Source articles */}
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

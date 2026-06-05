import { useState } from 'react';
import { Radio, ExternalLink, RefreshCw, CalendarDays } from 'lucide-react';

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

// The digest content — updated by Mr. MMA on Mon/Thu cadence, pending approval
const DIGEST: HorizonDigest = {
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
    </div>
  );
}

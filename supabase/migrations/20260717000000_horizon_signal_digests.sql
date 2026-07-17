-- Horizon Signal digest store
-- Each row is one published edition. is_current = true marks the live digest.
-- The GH Actions cron flips is_current on publish.

create table if not exists horizon_signal_digests (
  id            uuid primary key default gen_random_uuid(),
  published_at  date not null,
  body          jsonb not null default '[]'::jsonb,   -- text[]  paragraphs
  articles      jsonb not null default '[]'::jsonb,   -- {title,outlet,url,date}[]
  is_current    boolean not null default false,
  created_at    timestamptz not null default now()
);

-- Only one row should be current at a time
create unique index if not exists horizon_signal_digests_current_idx
  on horizon_signal_digests (is_current)
  where is_current = true;

-- Public read (anon key); no write from client
alter table horizon_signal_digests enable row level security;

create policy "public read digests"
  on horizon_signal_digests for select
  using (true);

-- Seed: archive edition (June 5)
insert into horizon_signal_digests (published_at, body, articles, is_current) values (
  '2026-06-05',
  '[
    "The most significant development this week is the escalating federal antitrust pressure on hospital payer contracts. The DOJ''s Antitrust Division sued OhioHealth on February 20 and NewYork-Presbyterian on March 26, both accused of using market dominance to lock insurers into contracts that shield them from price competition — preventing payers from offering plans that steer patients toward lower-cost alternatives. A third system, Advocate Health in Charlotte, is reportedly under active DOJ investigation. The FTC has launched a dedicated healthcare task force in parallel, and nearly two dozen states now have their own active investigations into hospital contracting practices.",
    "Health system consolidation is accelerating sharply in 2026, with 48 transactions announced through late April — a 30% increase over the same period last year. Most activity is concentrated in physician group acquisitions (21 deals), particularly in orthopedics, internal medicine, and gastroenterology. The headline system-level merger is Englewood Health combining with RWJBarnabas Health to form one of New Jersey''s largest systems, anchored by Englewood''s $1.17B in net patient revenue. Sanford Health and North Memorial Health separately announced plans to combine, extending Sanford''s regional reach into the Twin Cities market. Deal sizes are trending smaller and more strategic — average acquired hospital revenue is down year-over-year ($243.5M vs. $298.1M in 2025).",
    "On the regulatory front, CMS''s CY2026 OPPS/ASC Final Rule delivered the most significant hospital price transparency updates since the original rule took effect, with enforcement of the new machine-readable file standards beginning April 1, 2026. Key changes tighten data quality requirements, standardize field formats, and expand the scope of required service-line disclosures. Meanwhile, the ACA marketplace is in flux: enhanced premium tax credits expired at the start of 2026, Aetna has exited major individual markets including Florida, and several other carriers are contracting their geographic footprints — creating coverage gaps that will pressure employer plan design in affected regions."
  ]'::jsonb,
  '[
    {"title":"DOJ Hospital Antitrust Crackdown 2026: What CFOs Must Review in Payer Contracts Now","outlet":"Healthcare Finance Innovations","url":"https://www.hfi.consulting/articles/g5e4amtl643x9aojon6bhct1ktptvb","date":"2026-04-01"},
    {"title":"Q1 2026 Health Insurance Payer-Provider Dispute Update","outlet":"FTI Communications","url":"https://fticommunications.com/q1-2026-health-insurance-payer-provider-dispute-update/","date":"2026-04-15"},
    {"title":"Health System M&A 2026 Round-Up","outlet":"Levin Associates","url":"https://healthcare.levinassociates.com/2026/04/27/health-system-ma-2026-round-up/","date":"2026-04-27"},
    {"title":"Hospital and Health System M&A Activity Ramps Up in Q1 2026","outlet":"Kaufman Hall","url":"https://www.kaufmanhall.com/insights/research-report/ma-quarterly-activity-report-q1-2026","date":"2026-04-10"},
    {"title":"Key Price Transparency Updates Hospitals Must Comply with by April 1, 2026","outlet":"Health Law Center","url":"https://healthlawcenter.com/key-price-transparency-updates-hospitals-must-comply-with-by-april-1-2026/","date":"2026-03-15"},
    {"title":"Hospital-Insurer Contract Disputes Could Intensify as Cost Pressures Persist","outlet":"HFMA","url":"https://www.hfma.org/payment-reimbursement-and-managed-care/hospital-insurer-contract-disputes-cost-pressures/","date":"2026-01-12"},
    {"title":"Payer Contracting Trends Shaping 2026","outlet":"Tribunus Health","url":"https://www.tribunushealth.com/insights/the-payer-contracting-trends-that-will-shape-2026/","date":"2026-01-08"},
    {"title":"Notable Health Insurance Policies Taking Effect in 2026","outlet":"Becker''s Payer Issues","url":"https://www.beckerspayer.com/policy-updates/notable-health-insurance-policies-taking-effect-in-2026/","date":"2026-01-02"}
  ]'::jsonb,
  false
);

-- Seed: current edition (June 16)
insert into horizon_signal_digests (published_at, body, articles, is_current) values (
  '2026-06-16',
  '[
    "The DOJ Antitrust Division has now filed two civil lawsuits against major health systems in 2026 — OhioHealth (February 20) and NewYork-Presbyterian (March 26) — and Acting Assistant Attorney General Omeed Assefi has publicly stated the department holds a \"zero-tolerance policy\" against anticompetitive payer contracting. Both suits target the same structural mechanism: \"all-or-nothing\" inclusion requirements and most-favored-tier clauses that prevent payers from building narrow or tiered network products that exclude or disadvantage the defendant system — even when competitors offer comparable quality at lower prices. The NYP complaint goes further, alleging the system explicitly prohibited payers from offering lower copays when members chose lower-cost rival hospitals. Legal analysis from Morgan Lewis and Arnold Porter confirms DOJ''s enforcement theory applies broadly — concentrated market position is not required to trigger scrutiny. Any large system using anti-steering or budget-plan restrictions is now in scope.",
    "The most significant structural development in health system consolidation since our last edition is the announced combination of Allina Health and Sutter Health — a proposed $26 billion nonprofit merger that would create one of the largest health systems in the country by revenue, extending Sutter''s California footprint into Allina''s Upper Midwest markets including the Twin Cities. The deal was announced May 21 and is now in regulatory review. Separately, Ascension cleared FTC review on June 8 to acquire AmSurg''s ambulatory surgery center portfolio, adding significant ASC capacity to its post-acute network. These transactions continue a pattern established in Q1 2026: consolidation is accelerating across both system and site-of-care dimensions simultaneously, compressing the competitive alternatives available to payers and employer plan sponsors in affected markets.",
    "CMS''s revised machine-readable file standards have been in mandatory enforcement since April 1, 2026. The most consequential change — requiring hospitals to disclose actual allowed amounts (median, 10th percentile, 90th percentile, and claim count) rather than estimated figures — is now 2.5 months into enforcement. This shifts MRF data from directional estimates to actuarially grounded rate benchmarks derived from real claims. Early compliance monitoring indicates significant variability: hospitals in competitive urban markets are updating files with greater fidelity, while rural and critical access hospitals show higher rates of continued estimation or missing data fields. For employer plan sponsors, the practical implication is that MRF-sourced benchmarking data is now more reliable for commercial rate negotiations where hospitals are compliant — and conspicuous non-compliance is itself a signal of where rate opacity is being protected."
  ]'::jsonb,
  '[
    {"title":"DOJ Continues Scrutiny of Health System Contracting in Second 2026 Antitrust Case","outlet":"Morgan Lewis","url":"https://www.morganlewis.com/pubs/2026/03/doj-continues-scrutiny-of-health-system-contracting-in-second-2026-antitrust-case","date":"2026-03-31"},
    {"title":"DOJ Prioritizes Antitrust Enforcement Against Large Health Systems for Payor Contracting Practices","outlet":"Arnold & Porter","url":"https://www.arnoldporter.com/en/perspectives/advisories/2026/04/doj-prioritizes-antitrust-enforcement-against-large-health-systems","date":"2026-04-01"},
    {"title":"DOJ Increasingly Investigating Health Systems, Claiming Anticompetitive Contracts","outlet":"Healthcare Brew","url":"https://www.healthcare-brew.com/stories/2026/04/16/doj-increasingly-investigating-health-systems-claiming-anticompetitive-contracts","date":"2026-04-16"},
    {"title":"Allina Health to Join Sutter Health in $26B Proposed Merger","outlet":"Fierce Healthcare","url":"https://www.fiercehealthcare.com/providers/allina-health-join-sutter-health-26b-proposed-merger","date":"2026-05-21"},
    {"title":"Ascension Clears FTC Hurdles to Acquire AmSurg Ambulatory Surgery Centers","outlet":"Healthcare Finance News","url":"https://www.healthcarefinancenews.com/topic/mergers-acquisitions","date":"2026-06-08"},
    {"title":"Hospital Price Transparency Changes for 2026","outlet":"Gigasheet","url":"https://www.gigasheet.com/post/hospital-price-transparency-changes-for-2026","date":"2026-01-15"},
    {"title":"Hospital Price Transparency — CY 2026 Enforcement","outlet":"CMS.gov","url":"https://www.cms.gov/priorities/key-initiatives/hospital-price-transparency","date":"2026-04-01"}
  ]'::jsonb,
  true
);

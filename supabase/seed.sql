-- Seed data from (3.9.26) Master Tracker.xlsx — PROD Tasks sheet
-- Generated from src/lib/baseball-card/seed-data.ts

-- =============================================================================
-- PROJECTS
-- =============================================================================

INSERT INTO projects (
  id, name, description, status, category, priority, pinned, manual_rank,
  last_activity_at, created_at, target_date, tags, archived_at,
  mma_version, mma_status, mma_priority, mma_contract_ref,
  mma_accountable, mma_responsible, mma_contributor, mma_informed,
  mma_estimated_turn_time, mma_comments, mma_date
) VALUES

-- task-01: Add Kaiser networks
(
  'task-01',
  'Add Kaiser networks',
  'Add Kaiser networks for v8. QC. Finalize in v9',
  'active',
  'Schedule E - Core',
  'urgent',
  false,
  NULL,
  '2026-02-15T00:00:00.000Z'::timestamptz,
  '2026-02-15T00:00:00.000Z'::timestamptz,
  '2026-03-01',
  ARRAY['v8','networks'],
  NULL,
  'v8',
  'In Production',
  'Very High',
  'Schedule E - Core',
  'David',
  'Chris, Andy',
  'Bobby, Kalvig',
  'Peter',
  '2026-03-01',
  '',
  '2026-02-15'
),

-- task-02: Add Cigna Third Party Networks
(
  'task-02',
  'Add Cigna Third Party Networks',
  'Priority Health, Health Partners',
  'active',
  'Schedule E - Enhancements',
  'urgent',
  false,
  NULL,
  '2026-02-15T00:00:00.000Z'::timestamptz,
  '2026-02-15T00:00:00.000Z'::timestamptz,
  NULL,
  ARRAY['v8','networks','cigna'],
  NULL,
  'v8',
  'In Production',
  'Very High',
  'Schedule E - Enhancements',
  'Hart',
  'Hart',
  'Bobby',
  'Peter, David',
  '',
  '',
  '2026-02-15'
),

-- task-03: Billing Code Type Analysis & Expansion
(
  'task-03',
  'Billing Code Type Analysis & Expansion',
  '% negotiated type passed through from carrier field for conversions (implement an approach for POC calcs), CSTM-00 review, APR-DRG review (starting with BCBS MN). This is a carrier rate pass through. Unsure whether or not that can happen this round because the team needs to determine methods/approach.',
  'active',
  'Schedule E - Core',
  'urgent',
  false,
  NULL,
  '2026-02-15T00:00:00.000Z'::timestamptz,
  '2026-02-15T00:00:00.000Z'::timestamptz,
  NULL,
  ARRAY['v8','billing-codes','methods'],
  NULL,
  'v8',
  'Set for Methods Sprint',
  'Very High',
  'Schedule E - Core',
  'Bobby',
  'Kalvig, Andy',
  'Jenna',
  'Peter, David',
  '',
  'Negotiated type that''s a percentage, versus the rate itself. We have the data, but need to convert it to a rate that can be used downstream in IRIS.',
  '2026-02-15'
),

-- task-04: APR-DRG Adjustment
(
  'task-04',
  'APR-DRG Adjustment',
  'MN, SD, and IA show rates in APR-DRG. We need a way to populate the APR-DRG as well as the MS-DRGs. This needs to be advanced for v8, but finalized for v9 at the latest.',
  'active',
  'Schedule E - Enhancements',
  'urgent',
  false,
  NULL,
  '2026-02-15T00:00:00.000Z'::timestamptz,
  '2026-02-15T00:00:00.000Z'::timestamptz,
  NULL,
  ARRAY['v8','apr-drg','methods'],
  NULL,
  'v8',
  'Set for Methods Sprint',
  'Very High',
  'Schedule E - Enhancements',
  'Bobby',
  'Kalvig, Andy',
  'Jenna',
  'Peter, David',
  '',
  '',
  '2026-02-15'
),

-- task-05: Taxonomy Flag Expansion
(
  'task-05',
  'Taxonomy Flag Expansion',
  'Add a care steerage taxonomy flag expansion to other high-volume OP. Needs to be implemented in v8.',
  'active',
  'Schedule E - Core',
  'urgent',
  false,
  NULL,
  '2026-02-15T00:00:00.000Z'::timestamptz,
  '2026-02-15T00:00:00.000Z'::timestamptz,
  NULL,
  ARRAY['v8','taxonomy'],
  NULL,
  'v8',
  'In Production',
  'Very High',
  'Schedule E - Core',
  'Bobby',
  'Andy',
  'Kalvig',
  'Peter, David',
  '',
  '',
  '2026-02-15'
),

-- task-06: 2.0 Files
(
  'task-06',
  '2.0 Files',
  'Processors are built and have been tested to run 2.0 schemas. Hold on this task until we begin production on v9.',
  'active',
  'Schedule E - Core',
  'urgent',
  false,
  NULL,
  '2026-02-15T00:00:00.000Z'::timestamptz,
  '2026-02-15T00:00:00.000Z'::timestamptz,
  NULL,
  ARRAY['v9','2.0-schema'],
  NULL,
  'v9',
  'Confirming Completion',
  'Very High',
  'Schedule E - Core',
  'Hart',
  'Hart',
  'Shammas',
  'David',
  '',
  '',
  '2026-02-15'
),

-- task-07: Blue HPN, Blue Select
(
  'task-07',
  'Blue HPN, Blue Select',
  'TBD',
  'active',
  'Schedule E - Core',
  'high',
  false,
  NULL,
  '2026-02-15T00:00:00.000Z'::timestamptz,
  '2026-02-15T00:00:00.000Z'::timestamptz,
  NULL,
  ARRAY['v9','pre-data-order'],
  NULL,
  'v9',
  'Pre-Data Order',
  'High',
  'Schedule E - Core',
  'TBD',
  'TBD',
  'TBD',
  'TBD',
  '',
  '',
  '2026-02-15'
),

-- task-08: Other HPAs, MVP (Upstate & Western NY), other regionals
(
  'task-08',
  'Other HPAs, MVP (Upstate & Western NY), other regionals',
  '[Break this category out when we have details]',
  'active',
  'Schedule E - Enhancements',
  'high',
  false,
  NULL,
  '2026-02-15T00:00:00.000Z'::timestamptz,
  '2026-02-15T00:00:00.000Z'::timestamptz,
  NULL,
  ARRAY['v9-11','pre-data-order','regionals'],
  NULL,
  'v9 - 11',
  'Pre-Data Order',
  'High',
  'Schedule E - Enhancements',
  'TBD',
  'TBD',
  'TBD',
  'TBD',
  '',
  '',
  '2026-02-15'
),

-- task-09: Professional Rates Reviewed from Hospital MRFs (starting with SC)
(
  'task-09',
  'Professional Rates Reviewed from Hospital MRFs (starting with SC)',
  'High importance (SC market launching). Big change in the professional coverage threshold in the v7. (Rates also needed for Promise).',
  'active',
  'Schedule E - Core',
  'high',
  false,
  NULL,
  '2026-02-15T00:00:00.000Z'::timestamptz,
  '2026-02-15T00:00:00.000Z'::timestamptz,
  NULL,
  ARRAY['v8','hospital-mrf','sc-market'],
  NULL,
  'v8',
  'In Queue',
  'High',
  'Schedule E - Core',
  'Bobby',
  'Kalvig, Andy',
  'Jenna',
  'Peter, David',
  '',
  '',
  '2026-02-15'
),

-- task-10: Secondary NPI Verification
(
  'task-10',
  'Secondary NPI Verification',
  'Focus on "priority" states for hospital MRF processing and mapping.',
  'active',
  'TBD',
  'high',
  false,
  NULL,
  '2026-02-15T00:00:00.000Z'::timestamptz,
  '2026-02-15T00:00:00.000Z'::timestamptz,
  NULL,
  ARRAY['v8','npi','hospital-mrf'],
  NULL,
  'v8',
  'Unknown',
  'High',
  'TBD',
  'Bobby',
  'Jenna/Kalvig (Processing); Jenna/Bobby/Kalvig (Mapping)',
  'N/A',
  'Peter, David',
  '',
  '',
  '2026-02-15'
),

-- task-11: Add Kaiser Networks (State Expansion)
(
  'task-11',
  'Add Kaiser Networks (State Expansion)',
  'Primary states for new Kaiser networks are: CA, CO, GA, HI, MD, OR, VA, WA, and DC',
  'active',
  'Schedule E - Core',
  'medium',
  false,
  NULL,
  '2026-02-15T00:00:00.000Z'::timestamptz,
  '2026-02-15T00:00:00.000Z'::timestamptz,
  NULL,
  ARRAY['v8','kaiser','states'],
  NULL,
  'v8',
  'Data is in PP',
  'Medium',
  'Schedule E - Core',
  'Bobby',
  'Kalvig, Bobby',
  'Andy, Jenna',
  'Peter, David',
  '',
  '',
  '2026-02-15'
),

-- task-12: Metropolitan Divisions
(
  'task-12',
  'Metropolitan Divisions',
  'GEO EXP #2. Further geographic expansion in v9. Peter needs to help us unpack this.',
  'active',
  'TBD',
  'medium',
  false,
  NULL,
  '2026-02-15T00:00:00.000Z'::timestamptz,
  '2026-02-15T00:00:00.000Z'::timestamptz,
  NULL,
  ARRAY['v9-v10','geo-expansion'],
  NULL,
  'v9 - v10',
  'In Queue',
  'Medium',
  'TBD',
  'TBD',
  'TBD',
  'TBD',
  'TBD',
  '',
  '',
  '2026-02-15'
),

-- task-13: Balance of State
(
  'task-13',
  'Balance of State',
  'GEO EXP #3.',
  'active',
  'TBD',
  'medium',
  false,
  NULL,
  '2026-02-15T00:00:00.000Z'::timestamptz,
  '2026-02-15T00:00:00.000Z'::timestamptz,
  NULL,
  ARRAY['v9-v10','geo-expansion'],
  NULL,
  'v9 - v10',
  'In Queue',
  'Medium',
  'TBD',
  'TBD',
  'TBD',
  'TBD',
  'TBD',
  '',
  '',
  '2026-02-15'
),

-- task-14: BCBS PPO Mapping
(
  'task-14',
  'BCBS PPO Mapping',
  'GEO EXP #1. Proceed with BCBS PPO mapping to enable broader geographic selection logic in the UI - micropolitan implementation in v8 (metro-divisions and balance of state for later version release).',
  'active',
  'Schedule E - Core',
  'medium',
  false,
  NULL,
  '2026-02-15T00:00:00.000Z'::timestamptz,
  '2026-02-15T00:00:00.000Z'::timestamptz,
  NULL,
  ARRAY['v8','geo-expansion','bcbs'],
  NULL,
  'v8',
  'Confirming Completion',
  'Medium',
  'Schedule E - Core',
  'Hart',
  'Hart',
  'Bobby',
  'Peter, David',
  '',
  '',
  '2026-02-15'
),

-- task-15: Water Filtration Companion Materials
(
  'task-15',
  'Water Filtration Companion Materials',
  'Share re-branded water filtration outline',
  'archived',
  'Schedule E - Core',
  'low',
  false,
  NULL,
  '2026-02-15T00:00:00.000Z'::timestamptz,
  '2026-02-15T00:00:00.000Z'::timestamptz,
  NULL,
  ARRAY['v8','complete'],
  '2026-02-15T00:00:00.000Z'::timestamptz,
  'v8',
  'Complete',
  'Low',
  'Schedule E - Core',
  'David',
  'Topher',
  'Peter',
  'Peter',
  '8 Days',
  '',
  '2026-02-15'
),

-- task-16: Analytic Tests Output
(
  'task-16',
  'Analytic Tests Output',
  'Create data output "analytic tests" (Detroit MSA NetNav vs. Turquoise (move coverage/v7 20 percent left to close)',
  'archived',
  'TBD',
  'low',
  false,
  NULL,
  '2026-02-15T00:00:00.000Z'::timestamptz,
  '2026-02-15T00:00:00.000Z'::timestamptz,
  NULL,
  ARRAY['v7'],
  '2026-02-15T00:00:00.000Z'::timestamptz,
  'v7',
  'TBD',
  'Low',
  'TBD',
  'Bobby/Jeremy',
  'Andy/Peter',
  'Cheryl',
  'David',
  '',
  '',
  '2026-02-15'
),

-- task-17: Regional Network List
(
  'task-17',
  'Regional Network List',
  'Send a list of the regional networks available and in queue for v8/v9',
  'archived',
  'Schedule E - Core',
  'low',
  false,
  NULL,
  '2026-02-15T00:00:00.000Z'::timestamptz,
  '2026-02-15T00:00:00.000Z'::timestamptz,
  NULL,
  ARRAY['v7','done'],
  '2026-02-15T00:00:00.000Z'::timestamptz,
  'v7',
  'Done',
  'Low',
  'Schedule E - Core',
  'David',
  'Hart',
  'Andy',
  'Peter',
  '',
  '',
  '2026-02-15'
);


-- =============================================================================
-- PROJECT PEOPLE
-- =============================================================================

INSERT INTO project_people (id, project_id, name, role) VALUES

-- task-01: Add Kaiser networks
('p-david', 'task-01', 'David', 'Accountable'),
('p-chris', 'task-01', 'Chris', 'Responsible'),
('p-andy-1', 'task-01', 'Andy', 'Responsible'),
('p-bobby-1', 'task-01', 'Bobby', 'Contributor'),
('p-kalvig-1', 'task-01', 'Kalvig', 'Contributor'),
('p-peter-1', 'task-01', 'Peter', 'Informed'),

-- task-02: Add Cigna Third Party Networks
('p-hart-2', 'task-02', 'Hart', 'Accountable'),
('p-hart-2r', 'task-02', 'Hart', 'Responsible'),
('p-bobby-2', 'task-02', 'Bobby', 'Contributor'),
('p-peter-2', 'task-02', 'Peter', 'Informed'),
('p-david-2', 'task-02', 'David', 'Informed'),

-- task-03: Billing Code Type Analysis & Expansion
('p-bobby-3a', 'task-03', 'Bobby', 'Accountable'),
('p-kalvig-3', 'task-03', 'Kalvig', 'Responsible'),
('p-andy-3', 'task-03', 'Andy', 'Responsible'),
('p-jenna-3', 'task-03', 'Jenna', 'Contributor'),
('p-peter-3', 'task-03', 'Peter', 'Informed'),
('p-david-3', 'task-03', 'David', 'Informed'),

-- task-04: APR-DRG Adjustment
('p-bobby-4a', 'task-04', 'Bobby', 'Accountable'),
('p-kalvig-4', 'task-04', 'Kalvig', 'Responsible'),
('p-andy-4', 'task-04', 'Andy', 'Responsible'),
('p-jenna-4', 'task-04', 'Jenna', 'Contributor'),
('p-peter-4', 'task-04', 'Peter', 'Informed'),
('p-david-4', 'task-04', 'David', 'Informed'),

-- task-05: Taxonomy Flag Expansion
('p-bobby-5a', 'task-05', 'Bobby', 'Accountable'),
('p-andy-5', 'task-05', 'Andy', 'Responsible'),
('p-kalvig-5', 'task-05', 'Kalvig', 'Contributor'),
('p-peter-5', 'task-05', 'Peter', 'Informed'),
('p-david-5', 'task-05', 'David', 'Informed'),

-- task-06: 2.0 Files
('p-hart-6a', 'task-06', 'Hart', 'Accountable'),
('p-hart-6r', 'task-06', 'Hart', 'Responsible'),
('p-shammas-6', 'task-06', 'Shammas', 'Contributor'),
('p-david-6', 'task-06', 'David', 'Informed'),

-- task-07: Blue HPN, Blue Select — no people

-- task-08: Other HPAs, MVP (Upstate & Western NY), other regionals — no people

-- task-09: Professional Rates Reviewed from Hospital MRFs (starting with SC)
('p-bobby-9a', 'task-09', 'Bobby', 'Accountable'),
('p-kalvig-9', 'task-09', 'Kalvig', 'Responsible'),
('p-andy-9', 'task-09', 'Andy', 'Responsible'),
('p-jenna-9', 'task-09', 'Jenna', 'Contributor'),
('p-peter-9', 'task-09', 'Peter', 'Informed'),
('p-david-9', 'task-09', 'David', 'Informed'),

-- task-10: Secondary NPI Verification
('p-bobby-10a', 'task-10', 'Bobby', 'Accountable'),
('p-jenna-10', 'task-10', 'Jenna/Kalvig', 'Responsible (Processing)'),
('p-jenna-10m', 'task-10', 'Jenna/Bobby/Kalvig', 'Responsible (Mapping)'),
('p-peter-10', 'task-10', 'Peter', 'Informed'),
('p-david-10', 'task-10', 'David', 'Informed'),

-- task-11: Add Kaiser Networks (State Expansion)
('p-bobby-11a', 'task-11', 'Bobby', 'Accountable'),
('p-kalvig-11', 'task-11', 'Kalvig', 'Responsible'),
('p-bobby-11r', 'task-11', 'Bobby', 'Responsible'),
('p-andy-11', 'task-11', 'Andy', 'Contributor'),
('p-jenna-11', 'task-11', 'Jenna', 'Contributor'),
('p-peter-11', 'task-11', 'Peter', 'Informed'),
('p-david-11', 'task-11', 'David', 'Informed'),

-- task-12: Metropolitan Divisions — no people

-- task-13: Balance of State — no people

-- task-14: BCBS PPO Mapping
('p-hart-14a', 'task-14', 'Hart', 'Accountable'),
('p-hart-14r', 'task-14', 'Hart', 'Responsible'),
('p-bobby-14', 'task-14', 'Bobby', 'Contributor'),
('p-peter-14', 'task-14', 'Peter', 'Informed'),
('p-david-14', 'task-14', 'David', 'Informed'),

-- task-15: Water Filtration Companion Materials
('p-david-15a', 'task-15', 'David', 'Accountable'),
('p-topher-15', 'task-15', 'Topher', 'Responsible'),
('p-peter-15', 'task-15', 'Peter', 'Contributor'),
('p-peter-15i', 'task-15', 'Peter', 'Informed'),

-- task-16: Analytic Tests Output
('p-bobby-16a', 'task-16', 'Bobby/Jeremy', 'Accountable'),
('p-andy-16', 'task-16', 'Andy/Peter', 'Responsible'),
('p-cheryl-16', 'task-16', 'Cheryl', 'Contributor'),
('p-david-16', 'task-16', 'David', 'Informed'),

-- task-17: Regional Network List
('p-david-17a', 'task-17', 'David', 'Accountable'),
('p-hart-17', 'task-17', 'Hart', 'Responsible'),
('p-andy-17', 'task-17', 'Andy', 'Contributor'),
('p-peter-17', 'task-17', 'Peter', 'Informed');

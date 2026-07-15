// Shared geography, metric, color, and label helpers for the Coverage Map page.
// Plain-English labels only — this page is read by non-technical executives.

import { REGIONS } from '../starset/USMap';
import { MSA_BUBBLE_DATA } from '../../data/pipeline-intelligence-data';

export { REGIONS };

export type DrillLevel = 'region' | 'state' | 'county';

// ─── FIPS ⇄ state ────────────────────────────────────────────────────────────

export const FIPS_TO_STATE: Record<string, string> = {
  '01':'AL','02':'AK','04':'AZ','05':'AR','06':'CA','08':'CO','09':'CT',
  '10':'DE','11':'DC','12':'FL','13':'GA','15':'HI','16':'ID','17':'IL',
  '18':'IN','19':'IA','20':'KS','21':'KY','22':'LA','23':'ME','24':'MD',
  '25':'MA','26':'MI','27':'MN','28':'MS','29':'MO','30':'MT','31':'NE',
  '32':'NV','33':'NH','34':'NJ','35':'NM','36':'NY','37':'NC','38':'ND',
  '39':'OH','40':'OK','41':'OR','42':'PA','44':'RI','45':'SC','46':'SD',
  '47':'TN','48':'TX','49':'UT','50':'VT','51':'VA','53':'WA','54':'WV',
  '55':'WI','56':'WY',
};

export const STATE_TO_FIPS: Record<string, string> = Object.fromEntries(
  Object.entries(FIPS_TO_STATE).map(([fips, abbr]) => [abbr, fips])
);

export const STATE_NAMES: Record<string, string> = {
  AL:'Alabama', AK:'Alaska', AZ:'Arizona', AR:'Arkansas', CA:'California',
  CO:'Colorado', CT:'Connecticut', DE:'Delaware', DC:'District of Columbia', FL:'Florida',
  GA:'Georgia', HI:'Hawaii', ID:'Idaho', IL:'Illinois', IN:'Indiana',
  IA:'Iowa', KS:'Kansas', KY:'Kentucky', LA:'Louisiana', ME:'Maine',
  MD:'Maryland', MA:'Massachusetts', MI:'Michigan', MN:'Minnesota',
  MS:'Mississippi', MO:'Missouri', MT:'Montana', NE:'Nebraska', NV:'Nevada',
  NH:'New Hampshire', NJ:'New Jersey', NM:'New Mexico', NY:'New York',
  NC:'North Carolina', ND:'North Dakota', OH:'Ohio', OK:'Oklahoma',
  OR:'Oregon', PA:'Pennsylvania', RI:'Rhode Island', SC:'South Carolina',
  SD:'South Dakota', TN:'Tennessee', TX:'Texas', UT:'Utah', VT:'Vermont',
  VA:'Virginia', WA:'Washington', WV:'West Virginia', WI:'Wisconsin', WY:'Wyoming',
};

export const STATE_TO_REGION_ID: Record<string, number> = {};
for (const region of REGIONS) {
  for (const st of region.states) STATE_TO_REGION_ID[st] = region.id;
}

export const NON_REGION_ID = 3; // UT/WY — kept for reference, still selectable

// ─── MSA centroids (same source Pipeline Intelligence uses) ──────────────────

export const MSA_CENTROIDS: Record<string, { lat: number; lng: number; name: string }> =
  Object.fromEntries(
    MSA_BUBBLE_DATA.map((m) => [m.msa_id, { lat: m.lat, lng: m.lng, name: m.msa_name }])
  );

// ─── Region matching ─────────────────────────────────────────────────────────

interface RegionKeyed {
  region_mma?: string | null;
  region_label_mma?: string | null;
  region_name_mma?: string | null;
}

/**
 * Resolve which MMA region (1–10) a ccm_region row describes. The 'UNASSIGNED'
 * bucket (states with no assigned region) resolves to null and is left off the map.
 */
export function regionIdFromRow(r: RegionKeyed): number | null {
  for (const cand of [r.region_mma, r.region_label_mma, r.region_name_mma]) {
    if (cand == null) continue;
    const m = String(cand).match(/\d+/);
    if (m) {
      const n = Number(m[0]);
      if (n >= 1 && n <= 10) return n;
    }
  }
  const name = String(r.region_name_mma ?? r.region_label_mma ?? '').toLowerCase().trim();
  if (name) {
    const found = REGIONS.find((reg) => reg.name.toLowerCase() === name);
    if (found) return found.id;
  }
  return null;
}

// ─── Buckets ─────────────────────────────────────────────────────────────────

export type CcmBucketLabelKey = 'Total' | 'IP' | 'OP' | 'Prof';
export const BUCKET_LABEL: Record<CcmBucketLabelKey, string> = {
  Total: 'Total',
  IP: 'Inpatient',
  OP: 'Outpatient',
  Prof: 'Professional',
};

// ─── Metrics ─────────────────────────────────────────────────────────────────
// Metric availability is LEVEL-AWARE. Area levels (region/state) expose the full
// quality metrics; the GY-only county level exposes rate-coverage / spend / Medicare.

export type MetricKey =
  | 'quality'    // gy9 — % of spend on good-confidence rates (area)
  | 'coverage'   // cb9 — % of standard code basket (area)
  | 'hospitals'  // pct_hosp9 — % of hospitals covered (area + county)
  | 'change'     // gyd — pp change vs prior version (area)
  | 'medicare'   // pct_medicare9 — % of the Medicare benchmark (all)
  | 'codebasket' // pct_codebasket_codes9 — % of codes with a good-confidence rate (county/hospital)
  | 'gy_rate';   // gy_rate9 — good-confidence spend per 1,000 members (county/hospital) — NOT a %

type MetricKind = 'pct' | 'delta' | 'ratio' | 'level';

export interface MetricDef {
  key: MetricKey;
  label: string;   // control-bar label
  short: string;   // legend / compact
  tooltip: string; // one-sentence plain-English explainer
  kind: MetricKind;
  levels: DrillLevel[];
}

export const METRICS: MetricDef[] = [
  {
    key: 'quality', label: 'Data quality (% good-confidence)', short: 'Data quality',
    tooltip: 'Share of spend backed by good-confidence rates — higher means more of the plan’s rates can be trusted.',
    kind: 'pct', levels: ['region', 'state'],
  },
  {
    key: 'coverage', label: 'Code coverage (%)', short: 'Code coverage',
    tooltip: 'Share of the standard set of billing codes that have a rate in this plan.',
    kind: 'pct', levels: ['region', 'state'],
  },
  {
    key: 'hospitals', label: 'Hospitals covered (%)', short: 'Hospitals covered',
    tooltip: 'Share of hospitals in this market that have rate data in this plan.',
    kind: 'pct', levels: ['region', 'state', 'county'],
  },
  {
    key: 'change', label: 'Change vs prior version', short: 'Change',
    tooltip: 'How much data quality moved since the previous data version — green is improvement, red is decline.',
    kind: 'delta', levels: ['region', 'state'],
  },
  {
    key: 'medicare', label: '% of Medicare', short: 'vs Medicare',
    tooltip: 'How this plan’s rates compare to the Medicare benchmark — higher means more expensive than Medicare.',
    kind: 'ratio', levels: ['region', 'state', 'county'],
  },
  {
    key: 'codebasket', label: 'Codes with a rate (%)', short: 'Rate coverage',
    tooltip: 'Share of the standard billing-code set that has a good-confidence rate here.',
    kind: 'pct', levels: ['county'],
  },
  {
    key: 'gy_rate', label: 'Good-confidence spend (per 1K)', short: 'Verified spend',
    tooltip: 'Spend backed by good-confidence rates, per 1,000 members. A dollar level, not a percentage.',
    kind: 'level', levels: ['county'],
  },
];

export const METRIC_BY_KEY: Record<MetricKey, MetricDef> = Object.fromEntries(
  METRICS.map((m) => [m.key, m])
) as Record<MetricKey, MetricDef>;

/** Metrics offered at a given map level. */
export function metricsForLevel(level: DrillLevel): MetricDef[] {
  return METRICS.filter((m) => m.levels.includes(level));
}

export function defaultMetricForLevel(level: DrillLevel): MetricKey {
  return level === 'county' ? 'codebasket' : 'quality';
}

/** Metrics meaningful for a single hospital (GY-only, no hospital-rollup %). */
export const HOSPITAL_METRIC_KEYS: MetricKey[] = ['codebasket', 'medicare', 'gy_rate'];
export const HOSPITAL_METRICS: MetricDef[] = HOSPITAL_METRIC_KEYS.map((k) => METRIC_BY_KEY[k]);

// Loose shape so both area rows and GY rows can be read by metric.
export interface MetricRow {
  gy9?: number | null;
  cb9?: number | null;
  gyd?: number | null;
  pct_hosp9?: number | null;
  pct_medicare9?: number | null;
  pct_codebasket_codes9?: number | null;
  gy_rate9?: number | null;
}

export function metricValue(r: MetricRow | undefined, key: MetricKey): number | null {
  if (!r) return null;
  switch (key) {
    case 'quality': return r.gy9 ?? null;
    case 'coverage': return r.cb9 ?? null;
    case 'hospitals': return r.pct_hosp9 ?? null;
    case 'change': return r.gyd ?? null;
    case 'medicare': return r.pct_medicare9 ?? null;
    case 'codebasket': return r.pct_codebasket_codes9 ?? null;
    case 'gy_rate': return r.gy_rate9 ?? null;
  }
}

// hospital drill-down uses the same accessor/labels
export const hospitalMetricValue = metricValue;
export function hospitalMetricLabel(key: MetricKey): string {
  return METRIC_BY_KEY[key].short;
}

export function metricValueIsDiverging(key: MetricKey): boolean {
  return METRIC_BY_KEY[key].kind === 'delta';
}

// ─── Color scales ────────────────────────────────────────────────────────────

const NO_DATA = '#e5e7eb';

const SEQ = [
  { min: 90, color: '#08519c' },
  { min: 75, color: '#2171b5' },
  { min: 60, color: '#4292c6' },
  { min: 45, color: '#6baed6' },
  { min: 30, color: '#9ecae1' },
  { min: 15, color: '#c6dbef' },
  { min: 0.0001, color: '#eff3ff' },
];
const SEQ_LABELS = ['90–100%', '75–90%', '60–75%', '45–60%', '30–45%', '15–30%', 'Under 15%'];

const DIV = [
  { min: 10, color: '#1a9850', label: 'Up 10+ pts' },
  { min: 3, color: '#66bd63', label: 'Up 3–10' },
  { min: 0.5, color: '#a6d96a', label: 'Up 0.5–3' },
  { min: -0.5, color: '#f2f4f7', label: 'About flat' },
  { min: -3, color: '#fdae61', label: 'Down 0.5–3' },
  { min: -10, color: '#f46d43', label: 'Down 3–10' },
  { min: -Infinity, color: '#d73027', label: 'Down 10+ pts' },
];

// % of Medicare — higher = more expensive than the benchmark
const RATIO = [
  { min: 250, color: '#08519c', label: '≥ 250%' },
  { min: 200, color: '#2171b5', label: '200–250%' },
  { min: 160, color: '#4292c6', label: '160–200%' },
  { min: 130, color: '#6baed6', label: '130–160%' },
  { min: 110, color: '#9ecae1', label: '110–130%' },
  { min: 90, color: '#c6dbef', label: '90–110%' },
  { min: 0.0001, color: '#eff3ff', label: 'Under 90%' },
];

const LEVEL_LABELS = ['Highest', 'High', 'Upper-mid', 'Mid', 'Lower-mid', 'Low', 'Lowest'];

function seqColor(v: number): string {
  for (const s of SEQ) if (v >= s.min) return s.color;
  return NO_DATA;
}

export interface ColorOpts { max?: number }

export function colorForMetric(key: MetricKey, value: number | null, opts?: ColorOpts): string {
  if (value === null || value === undefined || Number.isNaN(value)) return NO_DATA;
  const kind = METRIC_BY_KEY[key].kind;
  if (kind === 'delta') {
    for (const s of DIV) if (value >= s.min) return s.color;
    return DIV[DIV.length - 1].color;
  }
  if (kind === 'ratio') {
    for (const s of RATIO) if (value >= s.min) return s.color;
    return NO_DATA;
  }
  if (kind === 'level') {
    const max = opts?.max ?? 0;
    if (max <= 0 || value <= 0) return NO_DATA;
    return seqColor(Math.min(100, (value / max) * 100));
  }
  // pct
  if (value <= 0) return NO_DATA;
  return seqColor(value);
}

/** Legend entries for the active metric (best-first) plus a "No data" swatch. */
export function legendFor(key: MetricKey): { color: string; label: string }[] {
  const kind = METRIC_BY_KEY[key].kind;
  let entries: { color: string; label: string }[];
  if (kind === 'delta') entries = DIV.map((s) => ({ color: s.color, label: s.label }));
  else if (kind === 'ratio') entries = RATIO.map((s) => ({ color: s.color, label: s.label }));
  else if (kind === 'level') entries = SEQ.map((s, i) => ({ color: s.color, label: LEVEL_LABELS[i] }));
  else entries = SEQ.map((s, i) => ({ color: s.color, label: SEQ_LABELS[i] }));
  return [...entries, { color: NO_DATA, label: 'No data' }];
}

// ─── Formatters (plain English) ──────────────────────────────────────────────

export function fmtPct(v: number | null | undefined, digits = 0): string {
  if (v === null || v === undefined || Number.isNaN(v)) return '—';
  return v.toFixed(digits) + '%';
}

export function fmtDeltaPts(v: number | null | undefined): string {
  if (v === null || v === undefined || Number.isNaN(v)) return '—';
  const sign = v > 0 ? '+' : v < 0 ? '−' : '';
  return `${sign}${Math.abs(v).toFixed(1)} pts`;
}

export function fmtInt(v: number | null | undefined): string {
  if (v === null || v === undefined || Number.isNaN(v)) return '—';
  return Math.round(v).toLocaleString();
}

/** Good-confidence spend per 1,000 members — a dollar level, never a percentage. */
export function fmtSpendPer1k(v: number | null | undefined): string {
  if (v === null || v === undefined || Number.isNaN(v)) return '—';
  return '$' + Math.round(v).toLocaleString();
}

/** Format any metric's value in its natural units. */
export function formatMetric(key: MetricKey, value: number | null | undefined): string {
  const kind = METRIC_BY_KEY[key].kind;
  if (value === null || value === undefined || Number.isNaN(value)) return '—';
  if (kind === 'delta') return fmtDeltaPts(value);
  if (kind === 'level') return fmtSpendPer1k(value);
  return fmtPct(value); // pct + ratio both render as %
}

// "X of Y hospitals" — reads the area rollup (n_hosp_in_plan9) or the county
// rollup (n_hosp_gy9), whichever the row carries.
interface HospCountRow {
  n_hosp_in_plan9?: number | null;
  n_hosp_gy9?: number | null;
  n_hosp_universe?: number | null;
  pct_hosp9?: number | null;
}

export function hospitalsCoveredPhrase(r: HospCountRow | undefined): string | null {
  if (!r) return null;
  const inPlan = r.n_hosp_in_plan9 ?? r.n_hosp_gy9 ?? null;
  const universe = r.n_hosp_universe ?? null;
  if (inPlan === null || universe === null || universe === 0) return null;
  const pct = r.pct_hosp9 ?? (inPlan / universe) * 100;
  return `${fmtInt(inPlan)} of ${fmtInt(universe)} hospitals (${fmtPct(pct)})`;
}

// ─── BUCA plan families ──────────────────────────────────────────────────────

export type BucaFamily = 'BCBS' | 'UnitedHealthcare' | 'Cigna' | 'Aetna';

export const BUCA_FAMILY_LABEL: Record<BucaFamily, string> = {
  BCBS: 'Blue Cross Blue Shield',
  UnitedHealthcare: 'UnitedHealthcare',
  Cigna: 'Cigna',
  Aetna: 'Aetna',
};

export const BUCA_ORDER: BucaFamily[] = ['BCBS', 'UnitedHealthcare', 'Cigna', 'Aetna'];

const BCBS_KEYWORDS =
  /(^|\s)(anthem|bcbs|bc |bs |blue|premera|regence|highmark|horizon|carefirst|empire|excellus|capital bc|independence bc|wellmark|hcsc|asuris)/;

export function bucaFamily(carrier: string): BucaFamily | null {
  const c = carrier.toLowerCase().trim();
  if (c.startsWith('aetna')) return 'Aetna';
  if (c.startsWith('uhc') || c.includes('unitedhealth')) return 'UnitedHealthcare';
  if (c.startsWith('cigna')) return 'Cigna';
  if (BCBS_KEYWORDS.test(c)) return 'BCBS';
  return null;
}

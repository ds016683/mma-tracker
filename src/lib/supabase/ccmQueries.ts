import { supabase } from './client';

// ─────────────────────────────────────────────────────────────────────────────
// Carrier Coverage Metrics (ccm_*) query layer — v9 corrected pipeline
//
// The five tables split into two metric FAMILIES:
//
//   Family A — area rows (ccm_region, ccm_state, ccm_msa): full quality metrics
//     gy/red/miss spend split, codebasket %, hospital rollup counts, and (MSA
//     only) an anchor-carrier price comparison.
//
//   Family B — GY rows (ccm_county, ccm_hospital): good-confidence-ONLY metrics.
//     There is no gy9/cb9/imputed share below MSA (methodologically undefined).
//     Instead: gy_rate9 (good-confidence spend per 1,000 members — a price level,
//     NOT a %), and pct_codebasket_codes9 (count-based code coverage, 0–100).
//
// Every query is filtered server-side by carrier + bucket (+ geography) and
// paginated with .range() — we never pull a whole table to the client.
// ─────────────────────────────────────────────────────────────────────────────

export type CcmBucket = 'Total' | 'IP' | 'OP' | 'Prof';
export const CCM_BUCKETS: CcmBucket[] = ['Total', 'IP', 'OP', 'Prof'];

/** Family A — region / state / MSA. Full quality metrics. */
export interface CcmAreaRow {
  carrier: string;
  // one-to-many aggregate strings (BCBS consolidation) — display only, never join
  plan_ids: string | null;
  metadata_plan_ids: string | null;
  carrier_names: string | null;
  networks: string | null;
  bucket: CcmBucket;

  // spend-confidence split (gy + red + miss ≈ 100), v9 / v8 / delta
  gy9: number | null; gy8: number | null; gyd: number | null;
  red9: number | null; red8: number | null;
  miss9: number | null; miss8: number | null;
  // codebasket %
  cb9: number | null; cb8: number | null; cbd: number | null;

  rate9: number | null;
  rank9: number | null;
  n_rates_gy9: number | null;
  n_green9: number | null; n_yellow9: number | null; n_red9: number | null; n_notassigned9: number | null;
  pct_medicare9: number | null;

  // hospital rollup ("X of Y hospitals")
  n_hosp_in_plan9: number | null;
  n_hosp_universe: number | null;
  pct_hosp9: number | null;

  seg_pop: number | null;

  // geography (whichever set the source table carries)
  region_mma: string | null;
  region_name_mma: string | null;
  region_label_mma: string | null;
  state: string | null;
  msa_id: string | null;
  msa_name: string | null;
  n_msas: number | null;

  // MSA-only extras
  total_pop: number | null;
  ooa: number | null;
  plan_status: string | null;
  cnt_rate_mrf9: number | null;
  cnt_rate_imputed9: number | null;
  n_npi_gy9: number | null;
  n_codes_gy9: number | null;
  src_carrier_pct9: number | null;
  src_provider_pct9: number | null;
  src_imputed_pct9: number | null;
  anchor_carrier_plan_name: string | null;
  anchor_rate9: number | null;
  pct_diff_from_anchor9: number | null;
  outlier_check9: string | null;
}

/** Family B — county / hospital. Good-confidence-only metrics. */
export interface CcmGyRow {
  carrier: string;
  plan_ids: string | null;
  carrier_names: string | null;
  networks: string | null;
  bucket: CcmBucket;

  // good-confidence spend per 1,000 members (a price LEVEL — not a %)
  gy_rate9: number | null;
  gy_rate8: number | null;
  gy_rated: number | null;

  rank9: number | null;
  n_rates_gy9: number | null; n_rates_gy8: number | null;
  n_codes_gy9: number | null; n_codes_gy8: number | null;
  // share of the standard code set with a good-confidence rate (0–100)
  pct_codebasket_codes9: number | null;
  pct_codebasket_codes8: number | null;
  pct_codebasket_codesd: number | null;

  // only two rate sources below MSA (no imputed component)
  src_carrier_pct9: number | null;
  src_provider_pct9: number | null;

  n_green9: number | null; n_yellow9: number | null; n_red9: number | null; n_notassigned9: number | null;
  pct_medicare9: number | null;

  // geography
  state: string | null;
  county_code: string | null;
  county_name: string | null;

  // county-only rollup
  n_npi_gy9: number | null; n_npi_gy8: number | null;
  n_hosp_gy9: number | null; n_hosp_gy8: number | null;
  n_hosp_universe: number | null;
  pct_hosp9: number | null;
}

/** ccm_hospital = GY row + hospital identity/provenance fields. */
export interface CcmHospitalRow extends CcmGyRow {
  hospital_npi: string;
  hospital_name: string;
  ccn_number: string | null;
  city: string | null;
  msa_id: string | null;
  msa_cbsa_name: string | null;
  hospital_mrf_ingested: number | null;
  plan_status: string | null;
  has_plan_data: number | null; // 0 = in market but no data in plan (Total bucket, NULL metrics)
  ooa: number | null;
  source_versions9: string | null;
}

export interface GeoFilter {
  state?: string;
  county_code?: string;
  msa_id?: string;
}

// ─── mapping helpers ─────────────────────────────────────────────────────────

type Raw = Record<string, unknown>;

const num = (v: unknown): number | null => {
  if (v === null || v === undefined || v === '') return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};
const str = (v: unknown): string | null =>
  v === null || v === undefined ? null : String(v);

function mapAreaRow(r: Raw): CcmAreaRow {
  return {
    carrier: String(r.carrier ?? ''),
    plan_ids: str(r.plan_ids),
    metadata_plan_ids: str(r.metadata_plan_ids),
    carrier_names: str(r.carrier_names),
    networks: str(r.networks),
    bucket: String(r.bucket ?? 'Total') as CcmBucket,

    gy9: num(r.gy9), gy8: num(r.gy8), gyd: num(r.gyd),
    red9: num(r.red9), red8: num(r.red8),
    miss9: num(r.miss9), miss8: num(r.miss8),
    cb9: num(r.cb9), cb8: num(r.cb8), cbd: num(r.cbd),

    rate9: num(r.rate9),
    rank9: num(r.rank9),
    n_rates_gy9: num(r.n_rates_gy9),
    n_green9: num(r.n_green9), n_yellow9: num(r.n_yellow9), n_red9: num(r.n_red9), n_notassigned9: num(r.n_notassigned9),
    pct_medicare9: num(r.pct_medicare9),

    n_hosp_in_plan9: num(r.n_hosp_in_plan9),
    n_hosp_universe: num(r.n_hosp_universe),
    pct_hosp9: num(r.pct_hosp9),

    seg_pop: num(r.seg_pop),

    region_mma: str(r.region_mma),
    region_name_mma: str(r.region_name_mma),
    region_label_mma: str(r.region_label_mma),
    state: str(r.state),
    msa_id: str(r.msa_id),
    msa_name: str(r.msa_name),
    n_msas: num(r.n_msas),

    total_pop: num(r.total_pop),
    ooa: num(r.ooa),
    plan_status: str(r.plan_status),
    cnt_rate_mrf9: num(r.cnt_rate_mrf9),
    cnt_rate_imputed9: num(r.cnt_rate_imputed9),
    n_npi_gy9: num(r.n_npi_gy9),
    n_codes_gy9: num(r.n_codes_gy9),
    src_carrier_pct9: num(r.src_carrier_pct9),
    src_provider_pct9: num(r.src_provider_pct9),
    src_imputed_pct9: num(r.src_imputed_pct9),
    anchor_carrier_plan_name: str(r.anchor_carrier_plan_name),
    anchor_rate9: num(r.anchor_rate9),
    pct_diff_from_anchor9: num(r.pct_diff_from_anchor9),
    outlier_check9: str(r.outlier_check9),
  };
}

function mapGyRow(r: Raw): CcmGyRow {
  return {
    carrier: String(r.carrier ?? ''),
    plan_ids: str(r.plan_ids),
    carrier_names: str(r.carrier_names),
    networks: str(r.networks),
    bucket: String(r.bucket ?? 'Total') as CcmBucket,

    gy_rate9: num(r.gy_rate9), gy_rate8: num(r.gy_rate8), gy_rated: num(r.gy_rated),

    rank9: num(r.rank9),
    n_rates_gy9: num(r.n_rates_gy9), n_rates_gy8: num(r.n_rates_gy8),
    n_codes_gy9: num(r.n_codes_gy9), n_codes_gy8: num(r.n_codes_gy8),
    pct_codebasket_codes9: num(r.pct_codebasket_codes9),
    pct_codebasket_codes8: num(r.pct_codebasket_codes8),
    pct_codebasket_codesd: num(r.pct_codebasket_codesd),

    src_carrier_pct9: num(r.src_carrier_pct9),
    src_provider_pct9: num(r.src_provider_pct9),

    n_green9: num(r.n_green9), n_yellow9: num(r.n_yellow9), n_red9: num(r.n_red9), n_notassigned9: num(r.n_notassigned9),
    pct_medicare9: num(r.pct_medicare9),

    state: str(r.state),
    county_code: str(r.county_code),
    county_name: str(r.county_name),

    n_npi_gy9: num(r.n_npi_gy9), n_npi_gy8: num(r.n_npi_gy8),
    n_hosp_gy9: num(r.n_hosp_gy9), n_hosp_gy8: num(r.n_hosp_gy8),
    n_hosp_universe: num(r.n_hosp_universe),
    pct_hosp9: num(r.pct_hosp9),
  };
}

function mapHospitalRow(r: Raw): CcmHospitalRow {
  return {
    ...mapGyRow(r),
    hospital_npi: String(r.hospital_npi ?? ''),
    hospital_name: String(r.hospital_name ?? ''),
    ccn_number: str(r.ccn_number),
    city: str(r.city),
    msa_id: str(r.msa_id),
    msa_cbsa_name: str(r.msa_cbsa_name),
    hospital_mrf_ingested: num(r.hospital_mrf_ingested),
    plan_status: str(r.plan_status),
    has_plan_data: num(r.has_plan_data),
    ooa: num(r.ooa),
    source_versions9: str(r.source_versions9),
  };
}

// county_code is stored UNPADDED in the ccm_* tables (e.g. "1073" for FIPS 01073),
// but the map supplies the zero-padded 5-digit TopoJSON id ("01073"). Strip leading
// zeros so text-column equality matches. Non-numeric values (e.g. 'UNMAPPED') pass through.
function normCountyCode(v: string): string {
  return /^\d+$/.test(v) ? String(parseInt(v, 10)) : v;
}

const PAGE = 1000; // PostgREST hard cap per request

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// One page, with a few retries + backoff. Transient failures (network blips,
// rate-limit throttling → the browser's "TypeError: Failed to fetch") are retried
// rather than surfaced as a hard error.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function fetchPage(build: () => any, from: number): Promise<Raw[]> {
  let lastErr: unknown;
  for (let attempt = 0; attempt < 4; attempt++) {
    if (attempt > 0) await sleep(300 * attempt); // 0, 300, 600, 900ms
    try {
      const { data, error } = await build().range(from, from + PAGE - 1);
      if (error) throw error;
      return data ?? [];
    } catch (e) {
      lastErr = e;
    }
  }
  throw lastErr;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function fetchAllPages(build: () => any): Promise<Raw[]> {
  const out: Raw[] = [];
  let from = 0;
  for (;;) {
    const batch = await fetchPage(build, from);
    out.push(...batch);
    if (batch.length < PAGE) break;
    from += PAGE;
  }
  return out;
}

// ─── public helpers ──────────────────────────────────────────────────────────

/** Distinct plan (carrier) names, alphabetical, from the smallest table. */
export async function getCarrierList(): Promise<string[]> {
  const rows = await fetchAllPages(() => supabase.from('ccm_region').select('carrier'));
  const set = new Set<string>();
  for (const r of rows) if (r.carrier) set.add(String(r.carrier));
  return [...set].sort((a, b) => a.localeCompare(b));
}

/** MMA-region metrics for a plan+bucket. */
export async function getRegionMetrics(carrier: string, bucket: CcmBucket): Promise<CcmAreaRow[]> {
  const rows = await fetchAllPages(() =>
    supabase.from('ccm_region').select('*').eq('carrier', carrier).eq('bucket', bucket)
  );
  return rows.map(mapAreaRow);
}

/** State metrics for a plan+bucket, optionally restricted to a set of states. */
export async function getStateMetrics(carrier: string, bucket: CcmBucket, states?: string[]): Promise<CcmAreaRow[]> {
  const rows = await fetchAllPages(() => {
    let q = supabase.from('ccm_state').select('*').eq('carrier', carrier).eq('bucket', bucket);
    if (states && states.length) q = q.in('state', states);
    return q;
  });
  return rows.map(mapAreaRow);
}

/** MSA metrics for a plan+bucket within one state or a set of states (a region). */
export async function getMsaMetrics(carrier: string, bucket: CcmBucket, states: string | string[]): Promise<CcmAreaRow[]> {
  const list = Array.isArray(states) ? states : [states];
  const rows = await fetchAllPages(() => {
    const q = supabase.from('ccm_msa').select('*').eq('carrier', carrier).eq('bucket', bucket);
    return list.length === 1 ? q.eq('state', list[0]) : q.in('state', list);
  });
  return rows.map(mapAreaRow);
}

/** County (GY-only) metrics for a plan+bucket within one state. */
export async function getCountyMetrics(carrier: string, bucket: CcmBucket, state: string): Promise<CcmGyRow[]> {
  const rows = await fetchAllPages(() =>
    supabase.from('ccm_county').select('*').eq('carrier', carrier).eq('bucket', bucket).eq('state', state)
  );
  return rows.map(mapGyRow);
}

/**
 * Hospitals for a plan within a geography (Total bucket, for the roster).
 * Includes both has_plan_data = 0 and 1 rows so the roster can show the
 * in-plan vs no-data split; callers exclude the 0 rows from metric averages.
 */
export async function getHospitals(carrier: string, geoFilter: GeoFilter): Promise<CcmHospitalRow[]> {
  const rows = await fetchAllPages(() => {
    let q = supabase.from('ccm_hospital').select('*').eq('carrier', carrier).eq('bucket', 'Total');
    if (geoFilter.county_code) q = q.eq('county_code', normCountyCode(geoFilter.county_code));
    else if (geoFilter.msa_id) q = q.eq('msa_id', geoFilter.msa_id);
    else if (geoFilter.state) q = q.eq('state', geoFilter.state);
    return q;
  });
  return rows.map(mapHospitalRow);
}

/** All bucket rows for one hospital NPI under one plan. */
export async function getHospitalDetail(npi: string, carrier: string): Promise<CcmHospitalRow[]> {
  const rows = await fetchAllPages(() =>
    supabase.from('ccm_hospital').select('*').eq('carrier', carrier).eq('hospital_npi', npi)
  );
  return rows.map(mapHospitalRow);
}

/** Lightweight hospital list for map dots across a whole state (Total bucket). */
export interface HospitalDotRow { npi: string; name: string; hasData: boolean }

export async function getHospitalDots(carrier: string, state: string): Promise<HospitalDotRow[]> {
  const rows = await fetchAllPages(() =>
    supabase
      .from('ccm_hospital')
      .select('hospital_npi,hospital_name,has_plan_data')
      .eq('carrier', carrier)
      .eq('bucket', 'Total')
      .eq('state', state)
  );
  return rows.map((r) => ({
    npi: String(r.hospital_npi ?? ''),
    name: String(r.hospital_name ?? ''),
    hasData: Number(r.has_plan_data ?? 0) === 1,
  }));
}

/** All rows for one hospital NPI across every plan + bucket (cross-plan compare). */
export async function getHospitalAcrossPlans(npi: string): Promise<CcmHospitalRow[]> {
  const rows = await fetchAllPages(() =>
    supabase.from('ccm_hospital').select('*').eq('hospital_npi', npi)
  );
  return rows.map(mapHospitalRow);
}

// ─── adaptive plan list ──────────────────────────────────────────────────────

export interface CarrierScope {
  regionId?: number | null;
  state?: string | null;
  countyCode?: string | null;
  msaId?: string | null;
  npi?: string | null;
}

/** Distinct plans with data at a given geography, so the picker can adapt. */
export async function getScopedCarriers(scope: CarrierScope): Promise<string[]> {
  let table: string | null = null;
  let col = '';
  let val: string | number = '';
  if (scope.npi) { table = 'ccm_hospital'; col = 'hospital_npi'; val = scope.npi; }
  else if (scope.countyCode) { table = 'ccm_county'; col = 'county_code'; val = normCountyCode(scope.countyCode); }
  else if (scope.msaId) { table = 'ccm_msa'; col = 'msa_id'; val = scope.msaId; }
  else if (scope.state) { table = 'ccm_state'; col = 'state'; val = scope.state; }
  else if (scope.regionId != null) { table = 'ccm_region'; col = 'region_mma'; val = scope.regionId; }

  if (!table) return getCarrierList();

  const t = table;
  const rows = await fetchAllPages(() => supabase.from(t).select('carrier').eq(col, val));
  const set = new Set<string>();
  for (const r of rows) if (r.carrier) set.add(String(r.carrier));
  return [...set].sort((a, b) => a.localeCompare(b));
}

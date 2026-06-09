/**
 * Production run v8.2 vs v9 comparison data — types, constants, CSV parser.
 */

export type RowGrain = 'NATIONAL' | 'STATE' | 'MSA';
export type BillingClass = 'institutional' | 'professional' | 'TOTAL';
export type SettingType = 'inpatient' | 'outpatient' | 'TOTAL';
export type PresenceStatus = 'BOTH' | 'NEW_ONLY' | 'BASE_ONLY';
export type ReviewDirection = 'improved' | 'regressed' | 'stable' | 'still_clean';

export const CARRIERS = [
  'Aetna Choice POS',
  'BCBS PPO',
  'Cigna OAP',
  'UHC Choice POS Plus',
] as const;
export type Carrier = (typeof CARRIERS)[number];

export const CARRIER_SHORT: Record<Carrier, string> = {
  'Aetna Choice POS': 'Aetna',
  'BCBS PPO': 'BCBS',
  'Cigna OAP': 'Cigna',
  'UHC Choice POS Plus': 'UHC',
};

// Population-ranked state order from brief
export const STATE_ORDER: string[] = [
  'CA','TX','FL','NY','PA','IL','OH','GA','NC','MI','NJ','VA','WA','AZ','MA','TN','IN','MD','MO','WI',
  'CO','MN','SC','AL','LA','KY','OR','OK','CT','UT','IA','NV','AR','MS','KS','NM','NE','ID','WV','HI',
  'NH','ME','RI','MT','DE','SD','ND','AK','DC','VT','WY',
];

export const STATE_NAMES: Record<string, string> = {
  AL:'Alabama',AK:'Alaska',AZ:'Arizona',AR:'Arkansas',CA:'California',CO:'Colorado',CT:'Connecticut',
  DE:'Delaware',DC:'District of Columbia',FL:'Florida',GA:'Georgia',HI:'Hawaii',ID:'Idaho',IL:'Illinois',
  IN:'Indiana',IA:'Iowa',KS:'Kansas',KY:'Kentucky',LA:'Louisiana',ME:'Maine',MD:'Maryland',MA:'Massachusetts',
  MI:'Michigan',MN:'Minnesota',MS:'Mississippi',MO:'Missouri',MT:'Montana',NE:'Nebraska',NV:'Nevada',
  NH:'New Hampshire',NJ:'New Jersey',NM:'New Mexico',NY:'New York',NC:'North Carolina',ND:'North Dakota',
  OH:'Ohio',OK:'Oklahoma',OR:'Oregon',PA:'Pennsylvania',RI:'Rhode Island',SC:'South Carolina',SD:'South Dakota',
  TN:'Tennessee',TX:'Texas',UT:'Utah',VT:'Vermont',VA:'Virginia',WA:'Washington',WV:'West Virginia',
  WI:'Wisconsin',WY:'Wyoming',
};

// Lucide-react does not render special characters well in source; use unicode below
export const LABEL_ABBREV: Record<string, string> = {
  'Low Carrier MRF': 'LC',
  'Low Hospital MRF': 'LH',
  'High Red': 'HR',
  'High Missing': 'HM',
};

export const LABEL_FULL: Record<string, string> = {
  LC: 'Low Carrier MRF (<25%)',
  LH: 'Low Hospital MRF (<5%)',
  HR: 'High Red (>20%)',
  HM: 'High Missing (>50%)',
};

export interface PRRow {
  row_grain: RowGrain;
  state: string;            // '' for NATIONAL
  msa_id: string;
  msa_cbsa_name: string;
  carrier_plan_name: Carrier | string;
  billing_class: BillingClass | string;
  setting_type: SettingType | string;
  pos: string;
  presence_status: PresenceStatus | string;

  total_weighted_rate_base: number | null;
  total_weighted_rate_new: number | null;
  delta_total_weighted_rate: number | null;
  pct_change_total_weighted_rate: number | null;

  pct_carrier_mrf_spend_base: number | null;
  pct_carrier_mrf_spend_new: number | null;
  delta_pct_carrier_mrf: number | null;

  pct_hospital_mrf_spend_base: number | null;
  pct_hospital_mrf_spend_new: number | null;
  delta_pct_hospital_mrf: number | null;

  pct_imputed_spend_base: number | null;
  pct_imputed_spend_new: number | null;
  delta_pct_imputed: number | null;

  pct_greenyellow_base: number | null;
  pct_greenyellow_new: number | null;
  delta_pct_greenyellow: number | null;

  pct_red_base: number | null;
  pct_red_new: number | null;
  delta_pct_red: number | null;

  pct_missing_base: number | null;
  pct_missing_new: number | null;
  delta_pct_missing: number | null;

  spend_ratio_vs_bcbs_base: number | null;
  spend_ratio_vs_bcbs_new: number | null;
  delta_spend_ratio_vs_bcbs: number | null;

  n_rates_greenyellow_base: number | null;
  n_rates_greenyellow_new: number | null;
  n_msas_base: number | null;
  n_msas_new: number | null;
  n_states_in_msa_base: number | null;
  n_states_in_msa_new: number | null;
  is_multistate_msa_base: string;
  is_multistate_msa_new: string;
  is_multistate_msa: string;
  n_states_in_msa: number | null;

  review_label_base: string;
  review_label_new: string;
  supplementary_label_base: string;
  supplementary_label_new: string;
  label_changed: string;
  label_transition: string;
  flag_needs_review_base: number | null;
  flag_needs_review_new: number | null;
  flag_canonical_count_base: number | null;
  flag_canonical_count_new: number | null;
  review_direction: ReviewDirection | '';
  flag_big_spend_swing: number | null;
  flag_stoplight_swing: number | null;
  flag_source_swing: number | null;
  flag_label_changed: number | null;
  flag_appeared: number | null;
  flag_disappeared: number | null;
  flag_changed_any: number | null;
}

const NUMERIC_FIELDS = new Set<keyof PRRow>([
  'total_weighted_rate_base','total_weighted_rate_new','delta_total_weighted_rate','pct_change_total_weighted_rate',
  'pct_carrier_mrf_spend_base','pct_carrier_mrf_spend_new','delta_pct_carrier_mrf',
  'pct_hospital_mrf_spend_base','pct_hospital_mrf_spend_new','delta_pct_hospital_mrf',
  'pct_imputed_spend_base','pct_imputed_spend_new','delta_pct_imputed',
  'pct_greenyellow_base','pct_greenyellow_new','delta_pct_greenyellow',
  'pct_red_base','pct_red_new','delta_pct_red',
  'pct_missing_base','pct_missing_new','delta_pct_missing',
  'spend_ratio_vs_bcbs_base','spend_ratio_vs_bcbs_new','delta_spend_ratio_vs_bcbs',
  'n_rates_greenyellow_base','n_rates_greenyellow_new','n_msas_base','n_msas_new',
  'n_states_in_msa_base','n_states_in_msa_new','n_states_in_msa',
  'flag_needs_review_base','flag_needs_review_new','flag_canonical_count_base','flag_canonical_count_new',
  'flag_big_spend_swing','flag_stoplight_swing','flag_source_swing','flag_label_changed',
  'flag_appeared','flag_disappeared','flag_changed_any',
]);

// Lightweight CSV parser — handles quoted fields with embedded commas/quotes
export function parseCSV(text: string): PRRow[] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let inQuotes = false;
  let i = 0;
  const n = text.length;

  while (i < n) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') { field += '"'; i += 2; continue; }
        inQuotes = false; i++; continue;
      }
      field += ch; i++; continue;
    }
    if (ch === '"') { inQuotes = true; i++; continue; }
    if (ch === ',') { row.push(field); field = ''; i++; continue; }
    if (ch === '\n') { row.push(field); rows.push(row); row = []; field = ''; i++; continue; }
    if (ch === '\r') { i++; continue; }
    field += ch; i++;
  }
  if (field.length > 0 || row.length > 0) { row.push(field); rows.push(row); }

  if (rows.length < 2) return [];
  const header = rows[0];
  const out: PRRow[] = [];

  for (let r = 1; r < rows.length; r++) {
    const cells = rows[r];
    if (cells.length === 1 && cells[0] === '') continue;
    const obj: Record<string, unknown> = {};
    for (let c = 0; c < header.length; c++) {
      const key = header[c];
      const raw = cells[c] ?? '';
      if (NUMERIC_FIELDS.has(key as keyof PRRow)) {
        obj[key] = raw === '' ? null : Number(raw);
      } else {
        obj[key] = raw;
      }
    }
    out.push(obj as unknown as PRRow);
  }
  return out;
}

// Flag count → color classes
export function flagColorClasses(flagCount: number | null): string {
  if (flagCount === null) return 'bg-gray-50 text-gray-400 border-gray-200';
  if (flagCount === 0) return 'bg-emerald-50 text-emerald-700 border-emerald-200';
  if (flagCount === 1) return 'bg-yellow-50 text-yellow-800 border-yellow-300';
  if (flagCount === 2) return 'bg-orange-50 text-orange-800 border-orange-300';
  return 'bg-red-50 text-red-800 border-red-300';
}

// Convert a review_label string like "Low Carrier MRF, High Red" into abbreviation tags
export function labelToAbbrevs(label: string): string[] {
  if (!label || label.trim() === '' || label.trim().toLowerCase() === 'clean') return [];
  return label.split(',').map(s => s.trim()).map(s => LABEL_ABBREV[s] ?? s).filter(Boolean);
}

export type Version = 'base' | 'new' | 'delta';

export interface CellViewData {
  row: PRRow | null;
  label: string;
  abbrevs: string[];
  flagCount: number | null;
  direction: ReviewDirection | '';
  colorClasses: string;
}

export function getCellViewData(row: PRRow | undefined | null, version: Version): CellViewData {
  if (!row) {
    return { row: null, label: '', abbrevs: [], flagCount: null, direction: '', colorClasses: flagColorClasses(null) };
  }
  if (version === 'base') {
    const fc = row.flag_canonical_count_base;
    return {
      row,
      label: row.review_label_base ?? '',
      abbrevs: labelToAbbrevs(row.review_label_base ?? ''),
      flagCount: fc,
      direction: '',
      colorClasses: flagColorClasses(fc),
    };
  }
  if (version === 'new') {
    const fc = row.flag_canonical_count_new;
    return {
      row,
      label: row.review_label_new ?? '',
      abbrevs: labelToAbbrevs(row.review_label_new ?? ''),
      flagCount: fc,
      direction: '',
      colorClasses: flagColorClasses(fc),
    };
  }
  // delta
  const dir = (row.review_direction || '') as ReviewDirection | '';
  let cls = 'bg-gray-50 text-gray-500 border-gray-200';
  if (dir === 'improved') cls = 'bg-emerald-50 text-emerald-700 border-emerald-200';
  else if (dir === 'regressed') cls = 'bg-red-50 text-red-800 border-red-300';
  else if (dir === 'still_clean') cls = 'bg-emerald-50/60 text-emerald-700 border-emerald-200';
  else if (dir === 'stable') cls = 'bg-yellow-50 text-yellow-800 border-yellow-300';
  return {
    row,
    label: row.label_transition ?? '',
    abbrevs: [],
    flagCount: row.flag_canonical_count_new,
    direction: dir,
    colorClasses: cls,
  };
}

export function fmtPct(v: number | null | undefined, digits = 1): string {
  if (v === null || v === undefined || Number.isNaN(v)) return '—';
  return v.toFixed(digits) + '%';
}

export function fmtDelta(v: number | null | undefined, digits = 1): string {
  if (v === null || v === undefined || Number.isNaN(v)) return '—';
  const sign = v > 0 ? '+' : '';
  return sign + v.toFixed(digits) + ' pp';
}

export function fmtSpendPerK(v: number | null | undefined): string {
  if (v === null || v === undefined || Number.isNaN(v)) return '—';
  return '$' + Math.round(v).toLocaleString();
}

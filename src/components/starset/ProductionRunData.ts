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
  'AK','AL','AR','AZ','CA','CO','CT','DC','DE','FL','GA','HI','IA','ID','IL','IN','KS','KY','LA','MA',
  'MD','ME','MI','MN','MO','MS','MT','NC','ND','NE','NH','NJ','NM','NV','NY','OH','OK','OR','PA','RI',
  'SC','SD','TN','TX','UT','VA','VT','WA','WI','WV','WY',
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

// MSA population lookup by CBSA code (2020 Census / ACS estimates).
// Used for "Largest to Smallest" / "Smallest to Largest" sort on the MSA view.
// CBSAs not listed default to 0 (sort to bottom of L→S, top of S→L).

// MSA population lookup by CBSA code (2020 Census / ACS estimates).
// Used for "Largest to Smallest" / "Smallest to Largest" sort on the MSA view.
// CBSAs not listed default to 0 (sort to bottom of L→S, top of S→L).
export const MSA_POPULATION: Record<string, number> = {
  '35620': 19216182, // New York-Newark-Jersey City
  '31080': 13214799, // Los Angeles-Long Beach-Anaheim
  '16980': 9618502,  // Chicago-Naperville-Elgin
  '19100': 7759615,  // Dallas-Fort Worth-Arlington
  '26420': 7340216,  // Houston-The Woodlands-Sugar Land
  '47900': 6385162,  // Washington-Arlington-Alexandria
  '33100': 6166488,  // Miami-Fort Lauderdale-Pompano Beach
  '37980': 6245051,  // Philadelphia-Camden-Wilmington
  '12060': 6089815,  // Atlanta-Sandy Springs-Roswell
  '14460': 4873019,  // Boston-Cambridge-Newton
  '38060': 4946145,  // Phoenix-Mesa-Chandler
  '40140': 3338330,  // Riverside-San Bernardino-Ontario
  '41860': 4749008,  // San Francisco-Oakland-Berkeley
  '42660': 4018762,  // Seattle-Tacoma-Bellevue
  '19820': 4365205,  // Detroit-Warren-Dearborn
  '33460': 3690261,  // Minneapolis-St. Paul-Bloomington
  '41740': 3286069,  // San Diego-Chula Vista-Carlsbad
  '45300': 3175275,  // Tampa-St. Petersburg-Clearwater
  '41180': 2820253,  // St. Louis
  '16740': 2652513,  // Charlotte-Concord-Gastonia
  '36740': 2673376,  // Orlando-Kissimmee-Sanford
  '19740': 2963821,  // Denver-Aurora-Lakewood
  '32820': 2038578,  // Memphis
  '29820': 2227053,  // Las Vegas-Henderson-Paradise
  '18140': 2138926,  // Columbus, OH
  '26900': 2056851,  // Indianapolis-Carmel-Anderson
  '41940': 1990660,  // San Jose-Sunnyvale-Santa Clara
  '34980': 1994983,  // Nashville-Davidson-Murfreesboro-Franklin
  '12580': 2834316,  // Baltimore-Columbia-Towson
  '28140': 2206235,  // Kansas City
  '12420': 2283371,  // Austin-Round Rock-Georgetown
  '38860': 1387340,  // Portland-Vancouver-Hillsboro
  '35380': 1311049,  // New Orleans-Metairie
  '27260': 1571801,  // Jacksonville
  '33340': 1576236,  // Milwaukee-Waukesha
  '30980': 1669071,  // Louisville/Jefferson County
  '17140': 1303842,  // Cincinnati
  '46140': 1386116,  // Virginia Beach-Norfolk-Newport News
  '39580': 1362997,  // Raleigh-Cary
  '13820': 1133706,  // Birmingham-Hoover
  '41700': 1165109,  // San Antonio-New Braunfels
  '17460': 1135547,  // Cleveland-Elyria
  '25540': 1204877,  // Hartford-East Hartford-Middletown
  '38300': 1103271,  // Pittsburgh
  '22900': 1064877,  // Greenville-Anderson
  '14260': 1110511,  // Baton Rouge
  '49340': 1283517,  // Worcester
  '47260': 1186006,  // Tucson
  '24340': 1098248,  // Grand Rapids-Kentwood
  '40380': 1117806,  // Rochester, NY
  '22380': 1214379,  // Fresno
  '26180': 1359678,  // Honolulu
  '40060': 1233215,  // Richmond, VA
  '16620': 1244347,  // Chattanooga
  '41620': 1258150,  // Salt Lake City
  '41500': 313060,   // San Jose (metro only)
  '36420': 1425976,  // Oklahoma City
  '13140': 1041618,  // Baton Rouge alt
  '39300': 806896,   // Providence-Warwick
  '35100': 276018,   // New Bern
  '44060': 970849,   // Spokane-Spokane Valley
  '19380': 1007261,  // Dayton-Kettering
  '45820': 754131,   // Thousand Oaks
  '15980': 770577,   // Cape Coral-Fort Myers
  '16020': 444483,   // Canton-Massillon
  '29460': 819941,   // Lakeland-Winter Haven
  '32580': 805832,   // McAllen-Edinburg-Mission
  '39740': 794055,   // Sarasota-Bradenton-Venice
  '15260': 847006,   // Bridgeport-Stamford-Norwalk
  '28940': 869927,   // Knoxville
  '21340': 868549,   // El Paso
  '10740': 916528,   // Albuquerque
  '45060': 869545,   // Syracuse
  '24660': 765756,   // Greensboro-High Point
  '29180': 816581,   // Lafayette, LA
  '39900': 766901,   // Scranton-Wilkes-Barre
  '20500': 774619,   // Durham-Chapel Hill
  '17820': 773551,   // Colorado Springs
  '19700': 771830,   // Deltona-Daytona Beach-Ormond Beach
  '38900': 765936,   // Portland-South Portland, ME
  '20940': 664613,   // El Centro
  '10420': 703505,   // Akron
  '49660': 652517,   // Youngstown-Warren-Boardman
  '11260': 398328,   // Anchorage
  '24020': 395440,   // Gainesville, FL
  '17300': 557424,   // Columbia, SC
  '45780': 542063,   // Tallahassee
  '27980': 539294,   // Killeen-Temple
  '46060': 513387,   // Vallejo
  '37340': 498634,   // Pensacola-Ferry Pass-Brent
  '14500': 637682,   // Beaumont-Port Arthur
  '49420': 354026,   // Winston-Salem
  '30460': 348612,   // Lynchburg
  '31420': 339009,   // Lincoln, NE
  '13780': 336776,   // Binghamton
  '39460': 334253,   // Reno-Sparks
  '30700': 331500,   // Madison, WI
  '13020': 330013,   // Bakersfield
  '36500': 436564,   // Ogden-Clearfield
  '32900': 435146,   // Modesto
  '35300': 432157,   // New Haven-Milford
  '40580': 445530,   // Rockford
  '43620': 275402,   // Sioux Falls
  '33780': 274813,   // Mobile
  '47020': 316379,   // Trenton-Princeton
  '11100': 309631,   // Amarillo
  '44220': 328581,   // Springfield, OH
  '40220': 326833,   // Roanoke
  '18880': 322185,   // Crestview-Fort Walton Beach-Destin
  '22420': 319294,   // Fort Collins
  '49700': 455975,   // York-Hanover
  '49180': 364079,   // Wilmington, NC
  '44180': 357439,   // Springfield, MO
  '21780': 354905,   // Eugene-Springfield
  '28660': 413033,   // Kennewick-Richland
  '42680': 406000,   // Santa Rosa-Petaluma
  '33940': 399044,   // Myrtle Beach-Conway-North Myrtle Beach
  '34940': 388025,   // Naples-Marco Island
  '18580': 376601,   // Corpus Christi
  '11700': 479609,   // Asheville
  '29740': 541615,   // Lancaster, PA
  '19780': 499560,   // Des Moines-West Des Moines
  '21500': 476530,   // Erie
  '27100': 472866,   // Huntsville, AL
  '14980': 466789,   // Brownsville-Harlingen
  '33140': 458839,   // Midland, TX
  '36220': 454726,   // Odessa, TX
  '42540': 278168,   // Santa Barbara-Santa Maria-Goleta
  '31140': 823217,   // Lexington-Fayette
  '17860': 310634,   // Columbus, GA-AL
  '29100': 308158,   // Lafayette-West Lafayette, IN
  '14010': 305489,   // Bloomington, IL
  '21820': 304212,   // Evansville
  '28020': 302294,   // Kalamazoo-Portage
  '29420': 302196,   // Lake Charles
  '40340': 295432,   // Rochester, MN
  '37620': 291680,   // Peoria
  '11580': 291034,   // Appleton
  '43900': 288093,   // South Bend-Mishawaka
  '34060': 286032,   // Macon-Bibb County
  '29580': 280414,   // Lansing-East Lansing
  '44100': 280122,   // Springfield, IL
  '43100': 714088,   // Shreveport-Bossier City
  '25860': 706326,   // Hickory-Lenoir-Morganton
  '44700': 672492,   // Stockton
  '37100': 659890,   // Palm Bay-Melbourne-Titusville
  '48620': 654610,   // Waco
  '48140': 609755,   // Visalia
  '49020': 707571,   // Wichita
  '46700': 311680,   // Utica-Rome
  '38660': 311550,   // Port St. Lucie
  '35840': 1061360,  // North Port-Sarasota-Bradenton
  '24540': 507658,   // Greenville, NC
};

const XLSX = require('xlsx');
const fs   = require('fs');
const path = require('path');

const wb = XLSX.readFile(path.join(__dirname, '../public/data/national msa carrier reporting_20260612 1030 ranks BUCA.xlsx'));
const ws = wb.Sheets['BUCA ranking'];
const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: null });

const n = v => (v === null || v === undefined || v === '' || v === '#VALUE!') ? null : Number(v);
const s = v => (v === null || v === undefined) ? null : String(v).trim();

// ── Summary rows (rows 4-7, index 4-7) ──────────────────────────────────────
// Structure: carrier_plan_name | str_v82 | str_v9 | [gap] | pop_v82 | pop_v9 | [gap] | msas_v82 | msas_v9
const CARRIER_SHORT = {
  'Aetna Choice POS':    'Aetna',
  'BCBS PPO':            'BCBS',
  'Cigna OAP':           'Cigna',
  'UHC Choice POS Plus': 'UHC',
};

const summary = [];
for (let i = 4; i <= 7; i++) {
  const r = rows[i];
  if (!r || !r[0]) continue;
  const str_v82 = n(r[1]);
  const str_v9  = n(r[2]);
  const pop_v82 = n(r[4]);
  const pop_v9  = n(r[5]);
  summary.push({
    name:           s(r[0]),
    short_name:     CARRIER_SHORT[s(r[0])] ?? s(r[0]),
    rank_str_v82:   str_v82,
    rank_str_v9:    str_v9,
    rank_str_delta: (str_v82 !== null && str_v9 !== null) ? str_v9 - str_v82 : null,
    rank_pop_v82:   pop_v82,
    rank_pop_v9:    pop_v9,
    rank_pop_delta: (pop_v82 !== null && pop_v9 !== null) ? pop_v9 - pop_v82 : null,
    msas_v82:       n(r[7]),
    msas_v9:        n(r[8]),
  });
}

// ── MSA detail rows (row 18 onward, index 18+) ──────────────────────────────
// cols: msa_id | msa_cbsa_name | msa_total_pop |
//       rate_aetna | rate_bcbs | rate_cigna | rate_uhc |
//       all_rank_aetna | all_rank_bcbs | all_rank_cigna | all_rank_uhc |
//       buca_rank_aetna | buca_rank_bcbs | buca_rank_cigna | buca_rank_uhc
const detail = [];
for (let i = 18; i < rows.length; i++) {
  const r = rows[i];
  if (!r || !r[0] || typeof r[0] !== 'number') continue;
  detail.push({
    msa_id:           n(r[0]),
    msa_name:         s(r[1]),
    population:       n(r[2]),
    rate_aetna:       n(r[3]),
    rate_bcbs:        n(r[4]),
    rate_cigna:       n(r[5]),
    rate_uhc:         n(r[6]),
    all_rank_aetna:   n(r[7]),
    all_rank_bcbs:    n(r[8]),
    all_rank_cigna:   n(r[9]),
    all_rank_uhc:     n(r[10]),
    buca_rank_aetna:  n(r[11]),
    buca_rank_bcbs:   n(r[12]),
    buca_rank_cigna:  n(r[13]),
    buca_rank_uhc:    n(r[14]),
  });
}

const out = { summary, detail };
const outPath = path.join(__dirname, '../public/data/buca-ranking.json');
fs.writeFileSync(outPath, JSON.stringify(out, null, 2));
console.log(`Written: ${summary.length} summary rows, ${detail.length} MSA detail rows → ${outPath}`);

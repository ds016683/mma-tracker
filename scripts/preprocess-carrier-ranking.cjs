const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

const wb = XLSX.readFile(path.join(__dirname, '../public/data/carrier-benchmarking-quality-report.xlsx'));
const ws = wb.Sheets['Summary'];
const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: null });

const DEFAULT_CARRIERS = new Set([
  'Aetna Choice POS',
  'BCBS PPO',
  'Cigna OAP',
  'UHC Choice POS Plus',
]);

// Find the "All carriers" header row
let allCarriersHeaderIdx = -1;
for (let i = 0; i < rows.length; i++) {
  if (rows[i] && rows[i][0] === 'All carriers') { allCarriersHeaderIdx = i; break; }
}

// Data rows start 2 after "All carriers" label (skip the col header row)
const dataStart = allCarriersHeaderIdx + 2;

const carriers = [];
for (let i = dataStart; i < rows.length; i++) {
  const r = rows[i];
  if (!r || !r[0] || typeof r[0] !== 'string') continue;
  if (r[0].startsWith('Notes:') || r[0].startsWith('1.') || r[0].startsWith('2.') || r[0].startsWith('3.') || r[0].startsWith('4.')) continue;

  const n = (v) => (v === null || v === undefined || v === '#VALUE!' || v === '') ? null : Number(v);

  const straight_v82 = n(r[9]);
  const straight_v9  = n(r[10]);
  const straight_delta = (straight_v82 !== null && straight_v9 !== null) ? straight_v9 - straight_v82 : null;

  carriers.push({
    name:              r[0],
    is_default:        DEFAULT_CARRIERS.has(r[0]),
    // Spend-weighted % codebasket
    cb_v82:            n(r[1]),
    cb_v9:             n(r[2]),
    cb_delta:          n(r[3]),
    // Spend-weighted % green/yellow
    gy_v82:            n(r[4]),
    gy_v9:             n(r[5]),
    gy_delta:          n(r[6]),
    // Pop-weighted avg rank
    rank_pop_v82:      n(r[7]),
    rank_pop_v9:       n(r[8]),
    rank_pop_delta:    n(r[9]) !== null ? null : (n(r[7]) !== null && n(r[8]) !== null ? n(r[8]) - n(r[7]) : null),
    // re-derive pop rank delta properly
    _rpd:              (n(r[7]) !== null && n(r[8]) !== null) ? n(r[8]) - n(r[7]) : null,
    // Straight avg rank
    rank_str_v82:      straight_v82,
    rank_str_v9:       straight_v9,
    rank_str_delta:    straight_delta,
  });
}

// Fix pop rank delta field name collision
const out = carriers.map(c => ({
  name:           c.name,
  is_default:     c.is_default,
  cb_v82:         c.cb_v82,
  cb_v9:          c.cb_v9,
  cb_delta:       c.cb_delta,
  gy_v82:         c.gy_v82,
  gy_v9:          c.gy_v9,
  gy_delta:       c.gy_delta,
  rank_pop_v82:   c.rank_pop_v82,
  rank_pop_v9:    c.rank_pop_v9,
  rank_pop_delta: c._rpd,
  rank_str_v82:   c.rank_str_v82,
  rank_str_v9:    c.rank_str_v9,
  rank_str_delta: c.rank_str_delta,
}));

const outPath = path.join(__dirname, '../public/data/carrier-ranking.json');
fs.writeFileSync(outPath, JSON.stringify(out, null, 2));
console.log(`Written ${out.length} carriers to carrier-ranking.json`);
console.log(`Default carriers: ${out.filter(c => c.is_default).map(c => c.name).join(', ')}`);

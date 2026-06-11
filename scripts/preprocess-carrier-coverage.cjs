const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

const wb = XLSX.readFile(path.join(__dirname, '../public/data/carrier-benchmarking-quality-report.xlsx'));
const v9rows = XLSX.utils.sheet_to_json(wb.Sheets['msa detail - v9']);
const v82rows = XLSX.utils.sheet_to_json(wb.Sheets['msa detail - v8_2']);

// Map billing_class+setting_type → short bucket key
function bucketKey(bc, st) {
  if (bc === 'TOTAL'         && st === 'TOTAL')     return 'TOTAL';
  if (bc === 'institutional' && st === 'inpatient')  return 'IP';
  if (bc === 'institutional' && st === 'outpatient') return 'OP';
  if (bc === 'professional'  && st === 'outpatient') return 'PROF';
  return null;
}

const WANTED = new Set(['TOTAL','IP','OP','PROF']);

// Build v8_2 lookup: msa_id|carrier|bucket|state → row
const v82Map = new Map();
for (const r of v82rows) {
  const bk = bucketKey(r.billing_class, r.setting_type);
  if (!bk) continue;
  const key = `${r.msa_id}|${r.carrier_plan_name}|${bk}|${r.state ?? ''}`;
  v82Map.set(key, r);
}

const n = v => (v === null || v === undefined || v === '') ? '' : v;
const pct = v => (v === null || v === undefined || v === '') ? '' : Number(v).toFixed(2);
const dlt = (a, b) => (a !== '' && b !== '' && a !== null && b !== null) ? (Number(b) - Number(a)).toFixed(2) : '';

const rows = [];
for (const r of v9rows) {
  const bk = bucketKey(r.billing_class, r.setting_type);
  if (!bk) continue;
  const key = `${r.msa_id}|${r.carrier_plan_name}|${bk}|${r.state ?? ''}`;
  const base = v82Map.get(key) ?? null;

  const gy9 = pct(r.pct_gy);
  const gy8 = base ? pct(base.pct_gy) : '';
  const cb9 = pct(r.pct_codebasket);
  const cb8 = base ? pct(base.pct_codebasket) : '';

  rows.push([
    r.msa_id,
    r.msa_cbsa_name,
    r.carrier_plan_name,
    bk,
    r.state ?? '',
    n(r.seg_pop),
    n(r.msa_total_pop),
    n(r.flag_out_of_area),
    gy9, gy8, dlt(gy8, gy9),
    cb9, cb8, dlt(cb8, cb9),
    n(r.total_weighted_rate),
    bk === 'TOTAL' ? n(r.carrier_rate_rank) : '',
  ]);
}

const header = 'msa_id,msa_name,carrier,bucket,state,seg_pop,total_pop,ooa,gy9,gy8,gyd,cb9,cb8,cbd,rate9,rank9';
const csv = [header, ...rows.map(r => r.map(v => {
  const s = String(v ?? '');
  return s.includes(',') ? `"${s.replace(/"/g,'""')}"` : s;
}).join(','))].join('\n');

const outPath = path.join(__dirname, '../public/data/carrier-coverage-comparison.csv');
fs.writeFileSync(outPath, csv);
console.log(`Written ${rows.length} rows to carrier-coverage-comparison.csv`);
console.log(`File size: ${(fs.statSync(outPath).size / 1024 / 1024).toFixed(2)} MB`);

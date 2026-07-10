#!/usr/bin/env node
// Usage: node scripts/load-msa-carrier-coverage.mjs
// Prereq: table msa_carrier_coverage must exist (apply migration 20260710000000_msa_carrier_coverage.sql)
// Env: SUPABASE_MMA_URL, SUPABASE_MMA_SERVICE_ROLE

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';

const SUPABASE_URL = process.env.SUPABASE_MMA_URL || 'https://hpqvaaujwwozkcgnwvnc.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_MMA_SERVICE_ROLE;

if (!SUPABASE_KEY) {
  console.error('Missing SUPABASE_MMA_SERVICE_ROLE env var');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const csvPath = path.join(__dirname, '../public/data/carrier-coverage-comparison.csv');
const raw = readFileSync(csvPath, 'utf-8');

// Parse CSV manually (no extra deps)
const lines = raw.split('\n').filter(l => l.trim());
const headers = lines[0].split(',');

function parseVal(col, val) {
  if (val === '' || val === undefined) return null;
  const numCols = ['msa_id','seg_pop','total_pop','ooa','gy9','gy8','gyd','cb9','cb8','cbd','rate9','rank9'];
  if (numCols.includes(col)) return val === '' ? null : Number(val);
  return val;
}

function parseLine(line) {
  // Handle quoted fields (msa_name can contain commas)
  const fields = [];
  let cur = '', inQ = false;
  for (const ch of line) {
    if (ch === '"') { inQ = !inQ; }
    else if (ch === ',' && !inQ) { fields.push(cur); cur = ''; }
    else { cur += ch; }
  }
  fields.push(cur);
  const row = {};
  headers.forEach((h, i) => { row[h] = parseVal(h, fields[i]); });
  return row;
}

const records = lines.slice(1).map(parseLine);
console.log(`Parsed ${records.length} rows`);

// Truncate existing data
const { error: truncErr } = await supabase.from('msa_carrier_coverage').delete().neq('id', 0);
if (truncErr) console.warn('Truncate warning:', truncErr.message);

// Upsert in batches
const BATCH = 500;
let inserted = 0;
for (let i = 0; i < records.length; i += BATCH) {
  const batch = records.slice(i, i + BATCH);
  const { error } = await supabase.from('msa_carrier_coverage').insert(batch);
  if (error) {
    console.error(`Batch ${i}–${i+batch.length} error:`, error.message);
    process.exit(1);
  }
  inserted += batch.length;
  process.stdout.write(`\r  Inserted ${inserted}/${records.length}`);
}
console.log('\nDone.');

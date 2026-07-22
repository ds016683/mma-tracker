/**
 * load-ccm-msa — edge function to reload ccm_msa from the canonical CSV.
 *
 * The source file is carrier-coverage-comparison.csv hosted on GitHub Pages.
 * It has 47,904 rows covering all 51 states with the correct ccm_msa schema.
 *
 * Invoke: POST /functions/v1/load-ccm-msa
 * Uses SUPABASE_SERVICE_ROLE_KEY (already set as a project secret).
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const CSV_URL =
  'https://ds016683.github.io/mma-tracker/data/carrier-coverage-comparison.csv';

const BATCH = 500;

const NUM_COLS = new Set([
  'msa_id', 'seg_pop', 'total_pop', 'ooa',
  'gy9', 'gy8', 'gyd', 'cb9', 'cb8', 'cbd',
  'rate9', 'rank9',
]);

function parseCSV(raw: string) {
  const lines = raw.split('\n').filter(l => l.trim());
  const headers = lines[0].split(',');

  return lines.slice(1).map(line => {
    const fields: string[] = [];
    let cur = '', inQ = false;
    for (const ch of line) {
      if (ch === '"') { inQ = !inQ; }
      else if (ch === ',' && !inQ) { fields.push(cur); cur = ''; }
      else { cur += ch; }
    }
    fields.push(cur);
    const row: Record<string, string | number | null> = {};
    headers.forEach((h, i) => {
      const v = fields[i] ?? '';
      row[h] = NUM_COLS.has(h)
        ? (v === '' ? null : Number(v))
        : (v === '' ? null : v);
    });
    return row;
  });
}

Deno.serve(async () => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  // Fetch CSV
  const res = await fetch(CSV_URL);
  if (!res.ok) {
    return new Response(JSON.stringify({ error: `CSV fetch failed: ${res.status}` }), { status: 500 });
  }
  const raw = await res.text();
  const records = parseCSV(raw);

  // Truncate
  const { error: delErr } = await supabase
    .from('ccm_msa')
    .delete()
    .gte('id', 0);
  if (delErr) {
    return new Response(JSON.stringify({ error: `Truncate failed: ${delErr.message}` }), { status: 500 });
  }

  // Insert in batches
  let inserted = 0;
  const errors: string[] = [];
  for (let i = 0; i < records.length; i += BATCH) {
    const batch = records.slice(i, i + BATCH);
    const { error } = await supabase.from('ccm_msa').insert(batch);
    if (error) {
      errors.push(`Batch ${i}: ${error.message}`);
      break;
    }
    inserted += batch.length;
  }

  if (errors.length) {
    return new Response(JSON.stringify({ error: errors[0], inserted }), { status: 500 });
  }

  return new Response(
    JSON.stringify({ ok: true, inserted, total: records.length }),
    { headers: { 'Content-Type': 'application/json' } },
  );
});

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

Deno.serve(async () => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  const migrations = [
    `ALTER TABLE release_documents ADD COLUMN IF NOT EXISTS is_starred boolean NOT NULL DEFAULT false`,
    `ALTER TABLE release_documents ADD COLUMN IF NOT EXISTS doc_section text`,
    `UPDATE release_documents SET doc_section = 'other' WHERE file_name ILIKE '%Methodology%'`,
  ];

  const results = [];
  for (const sql of migrations) {
    const { error } = await supabase.rpc('exec_sql', { sql }).single();
    // Try raw postgres via pg connection
    results.push({ sql: sql.substring(0, 60), error: error?.message ?? 'attempted' });
  }

  // Use postgres directly via the built-in Deno postgres
  const { Pool } = await import('https://deno.land/x/postgres@v0.17.0/mod.ts');
  const pool = new Pool(Deno.env.get('SUPABASE_DB_URL')!, 1);
  const conn = await pool.connect();
  const migResults = [];
  for (const sql of migrations) {
    try {
      await conn.queryObject(sql);
      migResults.push({ sql: sql.substring(0, 60), status: 'ok' });
    } catch (e: any) {
      migResults.push({ sql: sql.substring(0, 60), status: 'error', msg: e.message });
    }
  }
  conn.release();
  await pool.end();

  return new Response(JSON.stringify({ results: migResults }), {
    headers: { 'Content-Type': 'application/json' },
  });
});

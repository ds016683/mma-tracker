import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ── JWT / OAuth helpers ──────────────────────────────────────────────────────

function base64url(buf: Uint8Array): string {
  const b64 = btoa(String.fromCharCode(...buf));
  return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

async function getAccessToken(serviceAccountKey: string): Promise<string> {
  const key = JSON.parse(serviceAccountKey);
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: 'RS256', typ: 'JWT' };
  const payload = {
    iss: key.client_email,
    scope: 'https://www.googleapis.com/auth/bigquery',
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600,
  };

  const enc = new TextEncoder();
  const headerB64 = base64url(enc.encode(JSON.stringify(header)));
  const payloadB64 = base64url(enc.encode(JSON.stringify(payload)));
  const sigInput = `${headerB64}.${payloadB64}`;

  // Import RSA private key
  const pemKey = key.private_key
    .replace(/-----BEGIN PRIVATE KEY-----/, '')
    .replace(/-----END PRIVATE KEY-----/, '')
    .replace(/\n/g, '');
  const keyDer = Uint8Array.from(atob(pemKey), c => c.charCodeAt(0));
  const cryptoKey = await crypto.subtle.importKey(
    'pkcs8', keyDer,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false, ['sign']
  );

  const sig = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', cryptoKey, enc.encode(sigInput));
  const jwt = `${sigInput}.${base64url(new Uint8Array(sig))}`;

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Ajwt-bearer&assertion=${jwt}`,
  });
  const data = await res.json();
  if (!data.access_token) throw new Error(`OAuth failed: ${JSON.stringify(data)}`);
  return data.access_token;
}

async function runBqQuery(token: string, projectId: string, query: string, params: Record<string, string | number> = {}) {
  const queryParams = Object.entries(params).map(([name, value]) => ({
    name,
    parameterType: { type: typeof value === 'number' ? 'INT64' : 'STRING' },
    parameterValue: { value: String(value) },
  }));

  const body = {
    kind: 'bigquery#queryRequest',
    query,
    useLegacySql: false,
    timeoutMs: 30000,
    maxResults: 500,
    ...(queryParams.length > 0 ? {
      parameterMode: 'NAMED',
      queryParameters: queryParams,
    } : {}),
  };

  const res = await fetch(
    `https://bigquery.googleapis.com/bigquery/v2/projects/${projectId}/queries`,
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }
  );
  const data = await res.json();
  if (data.error) throw new Error(`BQ error: ${JSON.stringify(data.error)}`);

  const fields = (data.schema?.fields || []).map((f: { name: string }) => f.name);
  const rows = (data.rows || []).map((row: { f: { v: string | null }[] }) =>
    Object.fromEntries(fields.map((f: string, i: number) => [f, row.f[i]?.v ?? null]))
  );
  return { rows, totalRows: data.totalRows || '0' };
}

// ── Query definitions ────────────────────────────────────────────────────────

const PROJECT = 'starset-lumen-bq';

const QUERIES = {
  // Code trace: look up source rates for a specific billing_code + npi
  codeTrace: (billingCode: string, npi: string, network?: string) => ({
    sql: `
      SELECT carrier_name, carrier_plan_name, npi_practice_state,
             billing_code, billing_code_type, billing_class, negotiated_type,
             ROUND(negotiated_rate, 2) as negotiated_rate,
             provider_taxonomy_code, version
      FROM \`starset-lumen-bq.admin_metadata_lineage_reports.national_price_transparency_carrier_source_rates_lookup_mma_v8_r2\`
      WHERE billing_code = @billing_code
        AND CAST(npi AS STRING) = @npi
      ${network ? `AND carrier_name LIKE @network_filter` : ''}
      LIMIT 200
    `,
    params: {
      billing_code: billingCode,
      npi: npi,
      ...(network ? { network_filter: `%${network}%` } : {}),
    },
  }),

  // MMA final output: look up final rate for code + npi in MMA transfer table
  mmaOutput: (billingCode: string, npi: string) => ({
    sql: `
      SELECT network, carrier_plan_name, billing_code, billing_code_type, billing_class,
             ROUND(negotiated_rate_final, 2) as negotiated_rate_final,
             negotiated_type, negotiated_type_source,
             msa_id, msa_cbsa_name, npi_practice_state,
             source_rate_flag, imputed_rate_flag, source_rate_version,
             code_description
      FROM \`starset-lumen-bq.price_transparency_national_mma_transfer.mma_price_transparency_negotiated_rates_providers_national_prod_handl_2026_02v8_2\`
      WHERE billing_code = @billing_code
        AND npi = @npi
      LIMIT 200
    `,
    params: { billing_code: billingCode, npi: npi },
  }),

  // Provider lookup from AHD
  providerLookup: (npi: string) => ({
    sql: `
      SELECT npi, facility_name, facility_type, hospital_ownership_type,
             npi_practice_state, npi_practice_city, npi_provider_zip_code,
             cbsa_code, bed_size, commercial_payer_mix, system_affiliation
      FROM \`starset-lumen-bq.external_sources_hospitals.dim_provider_directory_ahd_lv2\`
      WHERE CAST(npi AS STRING) = @npi
      LIMIT 1
    `,
    params: { npi },
  }),

  // Hospital network coverage for a specific NPI
  hospitalNetworkCoverage: (npi: string) => ({
    sql: `
      SELECT npi, hospital_name, states,
             in_v8_prov_mrf, in_v7_prov_mrf,
             in_aetna_pos, in_bcbs_ppo, in_cigna_oap, in_uhc_choice,
             total_komodo_util
      FROM \`starset-lumen-bq.admin_metadata_lineage_reports.hospital_npi_coverage_report_mma_v8\`
      WHERE CAST(npi AS STRING) = @npi
      LIMIT 1
    `,
    params: { npi },
  }),
};

// ── Main handler ─────────────────────────────────────────────────────────────

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });

  try {
    const serviceAccountKey = Deno.env.get('BQ_SERVICE_ACCOUNT_KEY');
    if (!serviceAccountKey) throw new Error('BQ_SERVICE_ACCOUNT_KEY not configured');

    const { action, billing_code, npi, network } = await req.json();
    const token = await getAccessToken(serviceAccountKey);

    let result: Record<string, unknown> = {};

    if (action === 'code-trace') {
      if (!billing_code || !npi) throw new Error('billing_code and npi required');

      // Run all three queries in parallel
      const [sourceRates, mmaOutput, provider, networkCoverage] = await Promise.all([
        runBqQuery(token, PROJECT, QUERIES.codeTrace(billing_code, npi, network).sql, QUERIES.codeTrace(billing_code, npi, network).params),
        runBqQuery(token, PROJECT, QUERIES.mmaOutput(billing_code, npi).sql, QUERIES.mmaOutput(billing_code, npi).params),
        runBqQuery(token, PROJECT, QUERIES.providerLookup(npi).sql, QUERIES.providerLookup(npi).params),
        runBqQuery(token, PROJECT, QUERIES.hospitalNetworkCoverage(npi).sql, QUERIES.hospitalNetworkCoverage(npi).params),
      ]);

      result = {
        provider: provider.rows[0] ?? null,
        network_coverage: networkCoverage.rows[0] ?? null,
        source_rates: sourceRates.rows,
        mma_output: mmaOutput.rows,
        source_rate_count: sourceRates.totalRows,
        mma_output_count: mmaOutput.totalRows,
      };
    } else {
      throw new Error(`Unknown action: ${action}`);
    }

    return new Response(JSON.stringify({ ok: true, data: result }), {
      headers: { ...CORS, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return new Response(JSON.stringify({ ok: false, error: msg }), {
      status: 400,
      headers: { ...CORS, 'Content-Type': 'application/json' },
    });
  }
});

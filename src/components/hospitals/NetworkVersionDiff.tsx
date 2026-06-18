import type { NetworkVersionChange } from '../../data/pipeline-intelligence-data';

const V8_COLOR = '#6b7280';
const V9_COLOR = '#4e8f33';

function fmt(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
  return String(n);
}

function DeltaBadge({ v8, v9 }: { v8: number; v9: number }) {
  const delta = v9 - v8;
  const pct = v8 > 0 ? ((delta / v8) * 100).toFixed(1) : '—';
  if (delta === 0) return <span className="text-xs text-gray-400">no change</span>;
  const up = delta > 0;
  return (
    <span className={`text-xs font-semibold ${up ? 'text-green-600' : 'text-red-500'}`}>
      {up ? '▲' : '▼'} {up ? '+' : ''}{fmt(delta)} ({pct}%)
    </span>
  );
}

interface Props {
  changes: NetworkVersionChange[];
  selectedNetwork?: string | null;
}

export function NetworkVersionDiff({ changes, selectedNetwork }: Props) {
  // Group by carrier_network
  const grouped: Record<string, { v8: NetworkVersionChange[]; v9: NetworkVersionChange[] }> = {};
  for (const c of changes) {
    if (!grouped[c.carrier_network]) grouped[c.carrier_network] = { v8: [], v9: [] };
    const ver = c.version.includes('v8') ? 'v8' : 'v9';
    grouped[c.carrier_network][ver].push(c);
  }

  const networks = selectedNetwork
    ? Object.keys(grouped).filter(k => k.toLowerCase().includes(selectedNetwork.toLowerCase()))
    : Object.keys(grouped);

  return (
    <div className="space-y-3">
      {networks.map(net => {
        const { v8, v9 } = grouped[net];
        const v8_codes = v8.reduce((s, r) => s + r.n_codes, 0);
        const v9_codes = v9.reduce((s, r) => s + r.n_codes, 0);
        const v8_prov = v8.reduce((s, r) => s + r.n_providers, 0);
        const v9_prov = v9.reduce((s, r) => s + r.n_providers, 0);
        const v8_msa = Math.max(...v8.map(r => r.n_msa), 0);
        const v9_msa = Math.max(...v9.map(r => r.n_msa), 0);
        const v8_rec = v8.reduce((s, r) => s + r.n_records, 0);
        const v9_rec = v9.reduce((s, r) => s + r.n_records, 0);

        return (
          <div key={net} className="rounded-lg border border-gray-200 bg-white overflow-hidden">
            <div className="px-4 py-2 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
              <span className="text-sm font-semibold text-gray-800">{net}</span>
              <div className="flex items-center gap-3 text-xs">
                <span className="px-2 py-0.5 rounded font-medium" style={{ background: '#f0f4ff', color: V8_COLOR }}>v8</span>
                <span>→</span>
                <span className="px-2 py-0.5 rounded font-medium" style={{ background: '#f0faf0', color: V9_COLOR }}>v9</span>
              </div>
            </div>
            <div className="grid grid-cols-4 divide-x divide-gray-100 px-0">
              {[
                { label: 'Codes', v8v: v8_codes, v9v: v9_codes },
                { label: 'Providers', v8v: v8_prov, v9v: v9_prov },
                { label: 'MSAs', v8v: v8_msa, v9v: v9_msa },
                { label: 'Records', v8v: v8_rec, v9v: v9_rec },
              ].map(col => (
                <div key={col.label} className="px-3 py-2">
                  <div className="text-xs text-gray-500 mb-1">{col.label}</div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-sm font-medium text-gray-700">{fmt(col.v9v)}</span>
                    <DeltaBadge v8={col.v8v} v9={col.v9v} />
                  </div>
                  <div className="text-xs text-gray-400 mt-0.5">was {fmt(col.v8v)}</div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

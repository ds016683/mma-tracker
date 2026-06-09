import { useMemo, useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell,
} from 'recharts';
import { ArrowUp, ArrowDown, Minus } from 'lucide-react';
import type { PRRow, Carrier, Version } from './ProductionRunData';
import { CARRIERS, CARRIER_SHORT, fmtPct, fmtDelta } from './ProductionRunData';

interface Props {
  // NATIONAL/TOTAL/TOTAL rows keyed by carrier
  nationalTotals: Record<string, PRRow>;
  // NATIONAL rows by carrier and billing/setting (for setting breakdown)
  nationalBySetting: Record<string, PRRow[]>;
  version: Version;
}

function deltaIcon(delta: number) {
  if (delta > 0.1) return <ArrowUp className="h-3 w-3 text-emerald-600" />;
  if (delta < -0.1) return <ArrowDown className="h-3 w-3 text-red-600" />;
  return <Minus className="h-3 w-3 text-gray-400" />;
}

export function ProductionRunNational({ nationalTotals, nationalBySetting, version }: Props) {
  const [chartVersion, setChartVersion] = useState<'base' | 'new'>(version === 'base' ? 'base' : 'new');
  const [settingCarrier, setSettingCarrier] = useState<Carrier>('Aetna Choice POS');

  const cards = CARRIERS.map((c) => {
    const row = nationalTotals[c];
    const baseV = row?.pct_greenyellow_base ?? null;
    const newV = row?.pct_greenyellow_new ?? null;
    const delta = row?.delta_pct_greenyellow ?? null;
    return { carrier: c, baseV, newV, delta };
  });

  // Bar chart data: 4 carriers × {G/Y, Red, Missing}
  const barData = useMemo(() => {
    return CARRIERS.map((c) => {
      const row = nationalTotals[c];
      const suf = chartVersion === 'base' ? '_base' : '_new';
      return {
        carrier: CARRIER_SHORT[c],
        'G/Y %': row ? (row[`pct_greenyellow${suf}` as keyof PRRow] as number | null) ?? 0 : 0,
        'Red %': row ? (row[`pct_red${suf}` as keyof PRRow] as number | null) ?? 0 : 0,
        'Missing %': row ? (row[`pct_missing${suf}` as keyof PRRow] as number | null) ?? 0 : 0,
      };
    });
  }, [nationalTotals, chartVersion]);

  // Setting breakdown for selected carrier
  const settingData = useMemo(() => {
    const rows = nationalBySetting[settingCarrier] ?? [];
    type Mapping = { billing: string; setting: string; label: string };
    const mapping: Mapping[] = [
      { billing: 'institutional', setting: 'inpatient',  label: 'Inpatient' },
      { billing: 'institutional', setting: 'outpatient', label: 'Outpatient Facility' },
      { billing: 'professional',  setting: 'outpatient', label: 'Professional' },
    ];
    return mapping.map(({ billing, setting, label }) => {
      const row = rows.find((r) => r.billing_class === billing && r.setting_type === setting);
      return {
        setting: label,
        'v8.2 G/Y': row?.pct_greenyellow_base ?? 0,
        'v9 G/Y':   row?.pct_greenyellow_new ?? 0,
      };
    });
  }, [nationalBySetting, settingCarrier]);

  return (
    <div className="space-y-5">
      {/* 4 metric cards */}
      <div>
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500">
          National G/Y (MRF-Backed) % — v8.2 → v9
        </h3>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {cards.map(({ carrier, baseV, newV, delta }) => (
            <div key={carrier} className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
              <div className="text-xs font-semibold uppercase tracking-wider text-gray-400">{carrier}</div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-3xl font-bold text-[#001A41]">{fmtPct(newV)}</span>
                <span className="text-xs text-gray-500">v9</span>
              </div>
              <div className="mt-1.5 flex items-center gap-2 text-xs text-gray-500">
                <span>v8.2: {fmtPct(baseV)}</span>
                <span className="text-gray-300">|</span>
                <span className="inline-flex items-center gap-1">
                  {delta !== null && deltaIcon(delta)}
                  <span className={delta === null ? '' : delta >= 0 ? 'text-emerald-600 font-semibold' : 'text-red-600 font-semibold'}>
                    {fmtDelta(delta)}
                  </span>
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Grouped bar chart: carriers × metrics */}
      <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500">
            Quality Mix by Carrier
          </h3>
          <div className="flex rounded-md border border-gray-200 p-0.5 text-xs">
            <button
              onClick={() => setChartVersion('base')}
              className={`rounded px-3 py-1 font-medium transition-colors ${
                chartVersion === 'base' ? 'bg-[#001A41] text-white' : 'text-gray-600 hover:bg-gray-50'
              }`}
            >v8.2</button>
            <button
              onClick={() => setChartVersion('new')}
              className={`rounded px-3 py-1 font-medium transition-colors ${
                chartVersion === 'new' ? 'bg-[#001A41] text-white' : 'text-gray-600 hover:bg-gray-50'
              }`}
            >v9</button>
          </div>
        </div>
        <div style={{ width: '100%', height: 280 }}>
          <ResponsiveContainer>
            <BarChart data={barData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="carrier" stroke="#6b7280" fontSize={12} />
              <YAxis stroke="#6b7280" fontSize={12} unit="%" />
              <Tooltip
                contentStyle={{ borderRadius: 6, border: '1px solid #e5e7eb', fontSize: 12 }}
                formatter={(v) => (typeof v === 'number' ? v.toFixed(1) + '%' : String(v))}
              />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="G/Y %"     fill="#22c55e" />
              <Bar dataKey="Red %"     fill="#ef4444" />
              <Bar dataKey="Missing %" fill="#9ca3af" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Setting breakdown */}
      <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500">
            Setting Breakdown — G/Y % (v8.2 vs v9)
          </h3>
          <div className="flex flex-wrap gap-1.5">
            {CARRIERS.map((c) => (
              <button
                key={c}
                onClick={() => setSettingCarrier(c)}
                className={`rounded-full border px-2.5 py-0.5 text-[11px] font-medium transition-colors ${
                  settingCarrier === c
                    ? 'border-[#001A41] bg-[#001A41] text-white'
                    : 'border-gray-200 bg-white text-gray-500 hover:border-gray-300'
                }`}
              >{CARRIER_SHORT[c]}</button>
            ))}
          </div>
        </div>
        <div style={{ width: '100%', height: 260 }}>
          <ResponsiveContainer>
            <BarChart data={settingData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="setting" stroke="#6b7280" fontSize={12} />
              <YAxis stroke="#6b7280" fontSize={12} unit="%" />
              <Tooltip
                contentStyle={{ borderRadius: 6, border: '1px solid #e5e7eb', fontSize: 12 }}
                formatter={(v) => (typeof v === 'number' ? v.toFixed(1) + '%' : String(v))}
              />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="v8.2 G/Y" fill="#94a3b8">
                {settingData.map((_, i) => <Cell key={i} />)}
              </Bar>
              <Bar dataKey="v9 G/Y" fill="#22c55e">
                {settingData.map((_, i) => <Cell key={i} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

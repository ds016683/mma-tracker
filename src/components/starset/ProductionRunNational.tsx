import { useEffect, useMemo, useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import { ArrowUp, ArrowDown, Minus } from 'lucide-react';
import type { PRRow, Carrier, Version } from './ProductionRunData';
import { CARRIER_SHORT, fmtPct, fmtDelta } from './ProductionRunData';

// Muted palette tuned to the dark-navy + cyan platform aesthetic
const COLOR_GY = '#86C4A4';        // soft sage — high is good
const COLOR_RED = '#D89999';       // muted rose — low is good
const COLOR_MISSING = '#A8B4C2';   // slate — low is good
const COLOR_V8 = '#A8B4C2';        // slate (prior)
const COLOR_V9 = '#86C4A4';        // sage (current)

const SETTINGS: { billing: string; setting: string; label: string }[] = [
  { billing: 'institutional', setting: 'inpatient',  label: 'Inpatient' },
  { billing: 'institutional', setting: 'outpatient', label: 'Outpatient Facility' },
  { billing: 'professional',  setting: 'outpatient', label: 'Professional' },
];

interface Props {
  // NATIONAL/TOTAL/TOTAL rows keyed by carrier
  nationalTotals: Record<string, PRRow>;
  // NATIONAL rows by carrier and billing/setting (for setting breakdown)
  nationalBySetting: Record<string, PRRow[]>;
  version: Version;
  visibleCarriers: Carrier[];
}

function deltaIcon(delta: number) {
  if (delta > 0.1) return <ArrowUp className="h-3 w-3 text-emerald-600" />;
  if (delta < -0.1) return <ArrowDown className="h-3 w-3 text-red-600" />;
  return <Minus className="h-3 w-3 text-gray-400" />;
}

function findSettingRow(rows: PRRow[] | undefined, billing: string, setting: string): PRRow | undefined {
  return rows?.find((r) => r.billing_class === billing && r.setting_type === setting);
}

export function ProductionRunNational({ nationalTotals, nationalBySetting, version, visibleCarriers }: Props) {
  const [chartVersion, setChartVersion] = useState<'base' | 'new'>(version === 'base' ? 'base' : 'new');
  const [settingCarrier, setSettingCarrier] = useState<Carrier>(visibleCarriers[0] ?? 'Aetna Choice POS');

  // If the selected per-carrier breakdown carrier is no longer visible, fall back to the first visible
  useEffect(() => {
    if (visibleCarriers.length === 0) return;
    if (!visibleCarriers.includes(settingCarrier)) setSettingCarrier(visibleCarriers[0]);
  }, [visibleCarriers, settingCarrier]);

  const cards = visibleCarriers.map((c) => {
    const row = nationalTotals[c];
    const baseV = row?.pct_greenyellow_base ?? null;
    const newV = row?.pct_greenyellow_new ?? null;
    const delta = row?.delta_pct_greenyellow ?? null;
    return { carrier: c, baseV, newV, delta };
  });

  // Bar chart data: visible carriers × {G/Y, Red, Missing}
  const barData = useMemo(() => {
    return visibleCarriers.map((c) => {
      const row = nationalTotals[c];
      const suf = chartVersion === 'base' ? '_base' : '_new';
      return {
        carrier: CARRIER_SHORT[c],
        'G/Y %': row ? (row[`pct_greenyellow${suf}` as keyof PRRow] as number | null) ?? 0 : 0,
        'Red %': row ? (row[`pct_red${suf}` as keyof PRRow] as number | null) ?? 0 : 0,
        'Missing %': row ? (row[`pct_missing${suf}` as keyof PRRow] as number | null) ?? 0 : 0,
      };
    });
  }, [nationalTotals, chartVersion, visibleCarriers]);

  // Per-carrier setting breakdown chart data
  const settingData = useMemo(() => {
    const rows = nationalBySetting[settingCarrier] ?? [];
    return SETTINGS.map(({ billing, setting, label }) => {
      const row = findSettingRow(rows, billing, setting);
      return {
        setting: label,
        'v8.2 G/Y': row?.pct_greenyellow_base ?? 0,
        'v9 G/Y':   row?.pct_greenyellow_new ?? 0,
      };
    });
  }, [nationalBySetting, settingCarrier]);

  // Setting summary table: visible carriers × settings
  const summaryRows = useMemo(() => {
    return visibleCarriers.map((c) => {
      const rows = nationalBySetting[c];
      const cells = SETTINGS.map(({ billing, setting, label }) => {
        const row = findSettingRow(rows, billing, setting);
        return {
          label,
          baseV: row?.pct_greenyellow_base ?? null,
          newV:  row?.pct_greenyellow_new ?? null,
          delta: row?.delta_pct_greenyellow ?? null,
        };
      });
      return { carrier: c, cells };
    });
  }, [visibleCarriers, nationalBySetting]);

  if (visibleCarriers.length === 0) return null;

  const cardsCols =
    visibleCarriers.length >= 4 ? 'lg:grid-cols-4'
    : visibleCarriers.length === 3 ? 'lg:grid-cols-3'
    : visibleCarriers.length === 2 ? 'lg:grid-cols-2'
    : 'lg:grid-cols-1';

  return (
    <div className="space-y-5">
      {/* Carrier G/Y metric cards */}
      <div>
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500">
          National G/Y (MRF-Backed) % — v8.2 → v9
        </h3>
        <div className={`grid grid-cols-1 gap-3 sm:grid-cols-2 ${cardsCols}`}>
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

      {/* Setting Summary table — carriers × settings */}
      <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-200 px-4 py-3">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500">
            Setting Summary — G/Y % by Carrier × Setting
          </h3>
          <p className="mt-0.5 text-[11px] text-gray-400">v9 value, with v8.2 baseline and Δ pp underneath.</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="px-4 py-2 text-left text-[10px] font-semibold uppercase tracking-wider text-gray-500">
                  Carrier
                </th>
                {SETTINGS.map((s) => (
                  <th key={s.label} className="px-4 py-2 text-right text-[10px] font-semibold uppercase tracking-wider text-gray-500">
                    {s.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {summaryRows.map(({ carrier, cells }) => (
                <tr key={carrier} className="border-b border-gray-100 last:border-0">
                  <th scope="row" className="px-4 py-3 text-left align-top">
                    <div className="text-sm font-semibold text-[#001A41]">{CARRIER_SHORT[carrier]}</div>
                    <div className="text-[10px] text-gray-400">{carrier}</div>
                  </th>
                  {cells.map((cell) => {
                    const dlt = cell.delta;
                    const dltColor = dlt === null
                      ? 'text-gray-400'
                      : dlt > 0 ? 'text-emerald-600' : dlt < 0 ? 'text-red-600' : 'text-gray-500';
                    return (
                      <td key={cell.label} className="px-4 py-3 text-right align-top">
                        <div className="font-mono text-base font-semibold text-[#001A41] tabular-nums">{fmtPct(cell.newV)}</div>
                        <div className="mt-0.5 font-mono text-[11px] text-gray-500 tabular-nums">
                          v8.2 {fmtPct(cell.baseV)}
                        </div>
                        <div className={`font-mono text-[11px] tabular-nums ${dltColor}`}>
                          {fmtDelta(dlt)}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
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
                cursor={{ fill: 'rgba(0,26,65,0.04)' }}
                formatter={(v) => (typeof v === 'number' ? v.toFixed(1) + '%' : String(v))}
              />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="G/Y %"     fill={COLOR_GY} />
              <Bar dataKey="Red %"     fill={COLOR_RED} />
              <Bar dataKey="Missing %" fill={COLOR_MISSING} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Per-carrier setting breakdown chart */}
      <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500">
            Setting Breakdown — G/Y % (v8.2 vs v9)
          </h3>
          <div className="flex flex-wrap gap-1.5">
            {visibleCarriers.map((c) => (
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
                cursor={{ fill: 'rgba(0,26,65,0.04)' }}
                formatter={(v) => (typeof v === 'number' ? v.toFixed(1) + '%' : String(v))}
              />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="v8.2 G/Y" fill={COLOR_V8} />
              <Bar dataKey="v9 G/Y"   fill={COLOR_V9} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

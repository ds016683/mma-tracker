import { Check, ArrowUp, ArrowDown, Minus } from 'lucide-react';
import type { Version } from './ProductionRunData';

interface Props {
  version: Version;
}

export function ProductionRunLegend({ version }: Props) {
  if (version === 'delta') {
    return (
      <div className="rounded-lg border border-gray-200 bg-white px-4 py-2.5 shadow-sm">
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">Δ Legend</span>

          <LegendItem
            badge={
              <span className="inline-flex h-5 items-center gap-0.5 rounded-md border border-emerald-200 bg-emerald-50 px-1.5 text-[11px] font-semibold text-emerald-700">
                <ArrowUp className="h-3 w-3" /> Improved
              </span>
            }
            text="fewer flags or higher G/Y % vs v8.2"
          />
          <LegendItem
            badge={
              <span className="inline-flex h-5 items-center gap-0.5 rounded-md border border-red-300 bg-red-50 px-1.5 text-[11px] font-semibold text-red-800">
                <ArrowDown className="h-3 w-3" /> Regressed
              </span>
            }
            text="more flags or lower G/Y % vs v8.2"
          />
          <LegendItem
            badge={
              <span className="inline-flex h-5 items-center gap-1 rounded-md border border-yellow-300 bg-yellow-50 px-1.5 text-[11px] font-semibold text-yellow-800">
                <span className="font-mono leading-none">~</span> Stable
              </span>
            }
            text="same flags, no meaningful Δ"
          />
          <LegendItem
            badge={
              <span className="inline-flex h-5 items-center gap-0.5 rounded-md border border-emerald-200 bg-emerald-50/60 px-1.5 text-[11px] font-semibold text-emerald-700">
                <Minus className="h-3 w-3" /> Clean
              </span>
            }
            text="was clean, still clean"
          />

          <span className="ml-auto text-[11px] text-gray-400">
            Cells show v9 G/Y % and Δ (pp) vs v8.2
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-white px-4 py-2.5 shadow-sm">
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">Legend</span>

        <LegendItem
          badge={
            <span className="inline-flex h-5 items-center gap-0.5 rounded-md border border-emerald-200 bg-emerald-50 px-1.5 text-[11px] font-semibold text-emerald-700">
              <Check className="h-3 w-3" /> Clean
            </span>
          }
          text="no review flags"
        />
        <LegendItem
          badge={<AbbrevTag>LC</AbbrevTag>}
          text="Low Carrier MRF (<25%)"
        />
        <LegendItem
          badge={<AbbrevTag>LH</AbbrevTag>}
          text="Low Hospital MRF (<5%)"
        />
        <LegendItem
          badge={<AbbrevTag>HR</AbbrevTag>}
          text="High Red (>20%)"
        />
        <LegendItem
          badge={<AbbrevTag>HM</AbbrevTag>}
          text="High Missing (>50%)"
        />

        <span className="ml-auto inline-flex items-center gap-2 text-[11px] text-gray-500">
          <span className="font-semibold uppercase tracking-wider text-gray-400">Color</span>
          <ColorSwatch cls="bg-emerald-50 border-emerald-200" label="0 flags" />
          <ColorSwatch cls="bg-yellow-50 border-yellow-300" label="1" />
          <ColorSwatch cls="bg-orange-50 border-orange-300" label="2" />
          <ColorSwatch cls="bg-red-50 border-red-300" label="3+" />
        </span>
      </div>
    </div>
  );
}

function LegendItem({ badge, text }: { badge: React.ReactNode; text: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      {badge}
      <span className="text-gray-600">{text}</span>
    </span>
  );
}

function AbbrevTag({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex h-5 items-center rounded border border-gray-300 bg-white px-1.5 font-mono text-[10px] font-bold text-gray-700">
      {children}
    </span>
  );
}

function ColorSwatch({ cls, label }: { cls: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1">
      <span className={`inline-block h-3 w-3 rounded-sm border ${cls}`} />
      <span className="text-gray-500">{label}</span>
    </span>
  );
}

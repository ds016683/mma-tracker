import { DollarSign, TrendingDown } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import type { BudgetItem } from '../../lib/baseball-card/types';
import { MONTHS } from '../../lib/baseball-card/seed-data';

interface BudgetViewProps {
  title: string;
  subtitle: string;
  items: BudgetItem[];
  totalAllocated: number;
  poolStart: number;
  accentHex: string;
}

export function BudgetView({ title, subtitle, items, totalAllocated, poolStart, accentHex }: BudgetViewProps) {
  const poolRemaining = poolStart - totalAllocated;

  const monthlyBurn = MONTHS.map((month, i) => ({
    month,
    amount: items.reduce((sum, item) => sum + item.monthlyAllocations[i], 0),
  }));

  let running = poolStart;
  const runningBalance = monthlyBurn.map(m => {
    running -= m.amount;
    return { ...m, balance: running };
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-gray-900">{title}</h2>
        <p className="mt-0.5 text-sm text-gray-500">{subtitle}</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-4">
        <SummaryCard label="Pool Start" value={poolStart} icon={<DollarSign className="h-4 w-4" />} />
        <SummaryCard label="Total Allocated" value={totalAllocated} icon={<TrendingDown className="h-4 w-4" />} />
        <SummaryCard label="Remaining" value={poolRemaining} icon={<DollarSign className="h-4 w-4" />} />
      </div>

      {/* Monthly Burn Chart */}
      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <h3 className="mb-4 text-sm font-medium text-gray-500">Monthly Burn</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={monthlyBurn}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fill: '#9ca3af', fontSize: 12 }} />
              <YAxis tick={{ fill: '#9ca3af', fontSize: 12 }} tickFormatter={v => `$${(Number(v) / 1000).toFixed(0)}k`} />
              <Tooltip
                contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                formatter={(value) => [`$${Number(value).toLocaleString()}`, 'Spend']}
              />
              <Bar dataKey="amount" radius={[4, 4, 0, 0]}>
                {monthlyBurn.map((entry, index) => (
                  <Cell key={index} fill={entry.amount > 0 ? accentHex : '#f3f4f6'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Pool Balance Over Time */}
      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <h3 className="mb-4 text-sm font-medium text-gray-500">Pool Balance Over Time</h3>
        <div className="grid grid-cols-6 gap-2 md:grid-cols-12">
          {runningBalance.map(m => (
            <div key={m.month} className="text-center">
              <div className="text-xs text-gray-400">{m.month}</div>
              <div className={`mt-1 text-xs font-medium ${m.balance < poolStart * 0.25 ? 'text-red-600' : m.balance < poolStart * 0.5 ? 'text-amber-600' : 'text-emerald-600'}`}>
                ${(m.balance / 1000).toFixed(0)}k
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Line Items */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-100 px-5 py-3">
          <h3 className="text-sm font-medium text-gray-500">Work Orders</h3>
        </div>
        <div className="divide-y divide-gray-100">
          {items.map(item => (
            <div key={item.id} className="px-5 py-4">
              <div className="mb-2 flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold" style={{ color: accentHex }}>{item.ewoNumber}</span>
                    {item.projectId !== 'NA' && (
                      <span className="text-xs text-gray-400">{item.projectId}</span>
                    )}
                  </div>
                  <p className="mt-1 text-sm text-gray-700">{item.description}</p>
                </div>
                <span className="shrink-0 text-sm font-semibold text-gray-900">
                  ${item.approvedBudget.toLocaleString()}
                </span>
              </div>
              <div className="flex gap-1">
                {item.monthlyAllocations.map((amt, i) => (
                  <div
                    key={i}
                    className={`flex-1 rounded px-1 py-0.5 text-center text-xs ${amt > 0 ? 'bg-gray-100 text-gray-600' : 'text-gray-300'}`}
                  >
                    {amt > 0 ? `$${(amt / 1000).toFixed(1)}k` : '-'}
                  </div>
                ))}
              </div>
              <div className="mt-1 flex justify-end text-xs text-gray-400">
                Pool after: ${item.poolBalance.toLocaleString()}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function SummaryCard({ label, value, icon }: { label: string; value: number; icon: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="mb-1 flex items-center gap-1.5 text-xs text-gray-500">
        {icon}
        {label}
      </div>
      <div className="text-lg font-bold text-gray-900">${value.toLocaleString()}</div>
    </div>
  );
}

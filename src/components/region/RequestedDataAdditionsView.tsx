import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase/client';
import { useAuth } from '../../contexts/AuthContext';

interface GapReport {
  id: string;
  data_type: 'hospital' | 'network';
  mma_region: string;
  state: string;
  msa_name: string;
  item_name: string;
  additional_details: string;
  submitted_by_email: string;
  submitted_by_name: string;
  status: string;
  status_note: string;
  reviewed_by: string;
  reviewed_at: string | null;
  created_at: string;
}

type Status = 'pending' | 'under_investigation' | 'to_be_added' | 'unable_to_add' | 'dismissed';

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; border: string }> = {
  pending:            { label: 'Pending',             color: 'text-gray-500',   bg: 'bg-gray-100',   border: 'border-gray-200' },
  under_investigation:{ label: 'Under Investigation', color: 'text-blue-700',   bg: 'bg-blue-50',    border: 'border-blue-200' },
  to_be_added:        { label: 'To Be Added',         color: 'text-green-700',  bg: 'bg-green-50',   border: 'border-green-200' },
  unable_to_add:      { label: 'Unable to Add',       color: 'text-red-600',    bg: 'bg-red-50',     border: 'border-red-200' },
  dismissed:          { label: 'Dismissed',           color: 'text-gray-400',   bg: 'bg-gray-50',    border: 'border-gray-200' },
};

const TYPE_LABEL: Record<string, string> = { hospital: 'Hospital', network: 'Network' };

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.pending;
  return (
    <span className={`inline-block rounded-full border px-2.5 py-0.5 text-xs font-semibold ${cfg.color} ${cfg.bg} ${cfg.border}`}>
      {cfg.label}
    </span>
  );
}

export function RequestedDataAdditionsView() {
  const { role, profile } = useAuth();
  const canReview = role === 'ths_user' || role === 'mma_analytics';

  const [reports, setReports] = useState<GapReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');
  const [updating, setUpdating] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => { loadReports(); }, []);

  async function loadReports() {
    setLoading(true);
    const { data } = await supabase
      .from('data_gap_reports')
      .select('*')
      .order('created_at', { ascending: false });
    setReports((data ?? []) as GapReport[]);
    setLoading(false);
  }

  async function updateStatus(id: string, status: Status) {
    setUpdating(id);
    await supabase
      .from('data_gap_reports')
      .update({
        status,
        reviewed_by: profile?.display_name || profile?.email || 'unknown',
        reviewed_at: new Date().toISOString(),
      })
      .eq('id', id);
    setReports(prev => prev.map(r => r.id === id ? { ...r, status, reviewed_by: profile?.display_name || '', reviewed_at: new Date().toISOString() } : r));
    setUpdating(null);
  }

  const filtered = reports.filter(r => {
    if (filterStatus !== 'all' && r.status !== filterStatus) return false;
    if (filterType !== 'all' && r.data_type !== filterType) return false;
    return true;
  });

  const counts = Object.fromEntries(
    Object.keys(STATUS_CONFIG).map(s => [s, reports.filter(r => r.status === s).length])
  );

  return (
    <div className="min-h-screen bg-gray-50/50 p-4 sm:p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-xl font-bold text-[#001A41]">Requested Data Additions</h1>
        <p className="mt-0.5 text-sm text-gray-500">
          {reports.length} total report{reports.length !== 1 ? 's' : ''} · {counts.pending ?? 0} pending review
        </p>
      </div>

      {/* Status summary pills */}
      <div className="mb-5 flex flex-wrap gap-2">
        {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
          <button
            key={key}
            onClick={() => setFilterStatus(filterStatus === key ? 'all' : key)}
            className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${
              filterStatus === key
                ? `${cfg.color} ${cfg.bg} ${cfg.border} ring-2 ring-offset-1 ring-[#009DE0]`
                : `${cfg.color} ${cfg.bg} ${cfg.border} opacity-70 hover:opacity-100`
            }`}
          >
            {cfg.label} {counts[key] !== undefined ? `(${counts[key]})` : ''}
          </button>
        ))}
        <button
          onClick={() => setFilterStatus('all')}
          className={`rounded-full border px-3 py-1 text-xs font-semibold transition border-gray-200 ${filterStatus === 'all' ? 'bg-[#001A41] text-white' : 'bg-white text-gray-500 hover:bg-gray-50'}`}
        >
          All ({reports.length})
        </button>

        <div className="ml-auto flex gap-2">
          {['all', 'hospital', 'network'].map(t => (
            <button
              key={t}
              onClick={() => setFilterType(t)}
              className={`rounded-full border px-3 py-1 text-xs font-semibold capitalize transition ${
                filterType === t
                  ? 'border-[#009DE0] bg-[#009DE0] text-white'
                  : 'border-gray-200 bg-white text-gray-500 hover:bg-gray-50'
              }`}
            >
              {t === 'all' ? 'All types' : t}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center py-16 text-sm text-gray-400">Loading…</div>
      ) : filtered.length === 0 ? (
        <div className="flex items-center justify-center rounded-xl border border-gray-200 bg-white py-16 text-sm text-gray-400">
          No reports match the current filters
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(r => {
            const isExpanded = expandedId === r.id;
            const cfg = STATUS_CONFIG[r.status] ?? STATUS_CONFIG.pending;
            return (
              <div key={r.id} className={`overflow-hidden rounded-xl border bg-white shadow-sm transition ${cfg.border}`}>
                {/* Main row */}
                <button
                  onClick={() => setExpandedId(isExpanded ? null : r.id)}
                  className="flex w-full items-center gap-4 px-5 py-4 text-left hover:bg-gray-50/60"
                >
                  {/* Type badge */}
                  <span className={`flex-shrink-0 rounded-md px-2 py-0.5 text-xs font-bold uppercase tracking-wide ${
                    r.data_type === 'hospital'
                      ? 'bg-purple-100 text-purple-700'
                      : 'bg-teal-100 text-teal-700'
                  }`}>
                    {TYPE_LABEL[r.data_type]}
                  </span>

                  {/* Main info */}
                  <div className="flex-1 min-w-0">
                    <p className="truncate font-semibold text-gray-800 text-sm">{r.item_name}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{r.mma_region} · {r.state} · {r.msa_name}</p>
                  </div>

                  {/* Status */}
                  <StatusBadge status={r.status} />

                  {/* Date */}
                  <span className="flex-shrink-0 text-xs text-gray-300">
                    {new Date(r.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </span>
                </button>

                {/* Expanded detail */}
                {isExpanded && (
                  <div className="border-t border-gray-100 px-5 py-4">
                    <div className="grid grid-cols-2 gap-4 text-xs text-gray-500 mb-4 sm:grid-cols-4">
                      <div><span className="block font-semibold text-gray-400 uppercase tracking-wide mb-0.5">Submitted by</span>{r.submitted_by_name || r.submitted_by_email || '—'}</div>
                      <div><span className="block font-semibold text-gray-400 uppercase tracking-wide mb-0.5">Email</span>{r.submitted_by_email || '—'}</div>
                      <div><span className="block font-semibold text-gray-400 uppercase tracking-wide mb-0.5">Submitted</span>{new Date(r.created_at).toLocaleDateString()}</div>
                      {r.reviewed_by && <div><span className="block font-semibold text-gray-400 uppercase tracking-wide mb-0.5">Reviewed by</span>{r.reviewed_by}</div>}
                    </div>

                    {r.additional_details && (
                      <div className="mb-4 rounded-lg bg-gray-50 px-4 py-3">
                        <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-1">Additional Details</p>
                        <p className="text-sm text-gray-700">{r.additional_details}</p>
                      </div>
                    )}

                    {/* Status actions — only for authorized roles */}
                    {canReview && (
                      <div>
                        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">Update Status</p>
                        <div className="flex flex-wrap gap-2">
                          {(['under_investigation', 'to_be_added', 'unable_to_add', 'dismissed'] as Status[]).map(s => {
                            const sCfg = STATUS_CONFIG[s];
                            const isActive = r.status === s;
                            return (
                              <button
                                key={s}
                                onClick={() => updateStatus(r.id, s)}
                                disabled={updating === r.id || isActive}
                                className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition ${
                                  isActive
                                    ? `${sCfg.color} ${sCfg.bg} ${sCfg.border} opacity-60 cursor-default`
                                    : `${sCfg.color} ${sCfg.bg} ${sCfg.border} hover:opacity-80 disabled:opacity-40`
                                }`}
                              >
                                {updating === r.id ? '…' : sCfg.label}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

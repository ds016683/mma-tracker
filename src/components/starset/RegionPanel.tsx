import { useState } from 'react';
import { X, Pencil, Save, XCircle, ExternalLink } from 'lucide-react';
import type { RegionRow } from '../../lib/supabase/regionQueries';
import type { Region } from './USMap';
import { useAuth } from '../../contexts/AuthContext';
import { useNotionOpportunities } from '../../hooks/useNotionOpportunities';

const ADMIN_EMAIL = 'david.smith@thirdhorizon.com';

interface RegionPanelProps {
  region: Region;
  data: RegionRow | null;
  onClose: () => void;
  onSave: (regionId: number, updates: Partial<RegionRow>) => Promise<void>;
}

interface EditState {
  networks_of_interest: string;
  v7_coverage: string;
  v8_coverage: string;
  areas_of_opportunity: string;
}

export function RegionPanel({ region, data, onClose, onSave }: RegionPanelProps) {
  const { user } = useAuth();
  const isAdmin = user?.email === ADMIN_EMAIL;
  const { opportunities, loading: notionLoading } = useNotionOpportunities(region.id);

  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [editState, setEditState] = useState<EditState>({
    networks_of_interest: data?.networks_of_interest ?? '',
    v7_coverage: data?.v7_coverage ?? '',
    v8_coverage: data?.v8_coverage ?? '',
    areas_of_opportunity: data?.areas_of_opportunity ?? '',
  });

  const handleEdit = () => {
    setEditState({
      networks_of_interest: data?.networks_of_interest ?? '',
      v7_coverage: data?.v7_coverage ?? '',
      v8_coverage: data?.v8_coverage ?? '',
      areas_of_opportunity: data?.areas_of_opportunity ?? '',
    });
    setEditing(true);
    setSaved(false);
  };

  const handleCancel = () => {
    setEditing(false);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(region.id, editState);
      setEditing(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } finally {
      setSaving(false);
    }
  };

  const updatedDate = data?.updated_at
    ? new Date(data.updated_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : null;

  return (
    <div className="flex h-full flex-col bg-white shadow-xl" style={{ width: 380, minWidth: 380 }}>
      {/* Header */}
      <div
        className="flex items-center justify-between px-5 py-4"
        style={{ background: region.color }}
      >
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-white/70">
            Region {region.id}
          </p>
          <h2 className="text-lg font-bold text-white">{region.name}</h2>
        </div>
        <div className="flex items-center gap-2">
          {isAdmin && !editing && (
            <button
              onClick={handleEdit}
              className="flex items-center gap-1.5 rounded-md bg-white/20 px-3 py-1.5 text-xs font-medium text-white hover:bg-white/30 transition-colors"
            >
              <Pencil className="h-3.5 w-3.5" />
              Edit
            </button>
          )}
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20 text-white hover:bg-white/30 transition-colors"
            aria-label="Close panel"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-5 space-y-5">
        {saved && (
          <div className="rounded-lg bg-green-50 border border-green-200 px-4 py-2.5 text-sm font-medium text-green-700">
            Saved successfully
          </div>
        )}

        <Section
          label="Current Networks of Interest"
          value={data?.networks_of_interest ?? ''}
          editValue={editState.networks_of_interest}
          editing={editing}
          onChange={(v) => setEditState((s) => ({ ...s, networks_of_interest: v }))}
          placeholder="Networks currently active in this region..."
        />

        <Section
          label="v7 Regional Coverage (by state)"
          value={data?.v7_coverage ?? ''}
          editValue={editState.v7_coverage}
          editing={editing}
          onChange={(v) => setEditState((s) => ({ ...s, v7_coverage: v }))}
          placeholder="Coverage data will be added here..."
        />

        <Section
          label="v8 Regional Coverage (by state)"
          value={data?.v8_coverage ?? ''}
          editValue={editState.v8_coverage}
          editing={editing}
          onChange={(v) => setEditState((s) => ({ ...s, v8_coverage: v }))}
          placeholder="Coverage data will be added here..."
        />

        {/* Areas of Opportunity — live from Notion */}
        <div>
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500">
              Current Areas of Opportunity
            </h3>
            <a
              href="https://www.notion.so/34f750fa613d813d8bf7c3578c5f2cfb"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-xs text-blue-500 hover:text-blue-700"
            >
              Edit in Notion <ExternalLink className="h-3 w-3" />
            </a>
          </div>
          {notionLoading ? (
            <div className="rounded-lg bg-gray-50 px-4 py-3 text-sm text-gray-400 italic">Loading...</div>
          ) : opportunities.length === 0 ? (
            <div className="rounded-lg bg-gray-50 px-4 py-3 text-sm text-gray-300 italic">No items logged</div>
          ) : (
            <div className="space-y-2">
              {opportunities.map((opp) => (
                <a
                  key={opp.id}
                  href={opp.notionUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block rounded-lg border border-gray-100 bg-gray-50 px-3 py-2.5 hover:bg-blue-50 hover:border-blue-200 transition-colors group"
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-sm font-medium text-gray-800 group-hover:text-blue-800 leading-snug">
                      {opp.issue}
                    </span>
                    <ExternalLink className="h-3 w-3 text-gray-300 group-hover:text-blue-400 flex-shrink-0 mt-0.5" />
                  </div>
                  <div className="mt-1 flex items-center gap-2 flex-wrap">
                    {opp.category && (
                      <span className="rounded px-1.5 py-0.5 text-xs bg-blue-100 text-blue-700">{opp.category}</span>
                    )}
                    {opp.priority && (
                      <span className={`rounded px-1.5 py-0.5 text-xs font-medium ${
                        opp.priority === 'High' ? 'bg-red-100 text-red-700' :
                        opp.priority === 'Medium' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-green-100 text-green-700'
                      }`}>{opp.priority}</span>
                    )}
                    {opp.status && (
                      <span className={`rounded px-1.5 py-0.5 text-xs ${
                        opp.status === 'Open' ? 'bg-red-50 text-red-600' :
                        opp.status === 'In Progress' ? 'bg-yellow-50 text-yellow-600' :
                        opp.status === 'Resolved' ? 'bg-green-50 text-green-600' :
                        'bg-gray-100 text-gray-500'
                      }`}>{opp.status}</span>
                    )}
                    {opp.notes && (
                      <span className="text-xs text-gray-400 truncate max-w-[200px]" title={opp.notes}>{opp.notes}</span>
                    )}
                  </div>
                </a>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      {editing ? (
        <div className="border-t border-gray-100 px-5 py-4 flex gap-3">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-[#001A41] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#002C5F] disabled:opacity-50 transition-colors"
          >
            <Save className="h-4 w-4" />
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
          <button
            onClick={handleCancel}
            disabled={saving}
            className="flex items-center justify-center gap-2 rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
          >
            <XCircle className="h-4 w-4" />
            Cancel
          </button>
        </div>
      ) : (
        <div className="border-t border-gray-100 px-5 py-3">
          <p className="text-xs text-gray-400">
            {updatedDate ? `Last updated: ${updatedDate}` : 'No data yet'}
          </p>
        </div>
      )}
    </div>
  );
}

function Section({
  label,
  value,
  editValue,
  editing,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  editValue: string;
  editing: boolean;
  onChange: (v: string) => void;
  placeholder: string;
}) {
  return (
    <div>
      <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500">
        {label}
      </h3>
      {editing ? (
        <textarea
          value={editValue}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={4}
          className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm text-gray-700 placeholder:text-gray-300 focus:border-[#009DE0] focus:outline-none focus:ring-1 focus:ring-[#009DE0] resize-y"
        />
      ) : (
        <div className="rounded-lg bg-gray-50 px-4 py-3 text-sm text-gray-700 min-h-[60px]">
          {value ? (
            <p className="whitespace-pre-wrap">{value}</p>
          ) : (
            <p className="text-gray-300 italic">Not yet configured</p>
          )}
        </div>
      )}
    </div>
  );
}

import { useState, useEffect, useMemo } from 'react';
import { supabase } from '../../lib/supabase/client';
import { useAuth } from '../../contexts/AuthContext';
import { AlertCircle, CheckCircle, ExternalLink } from 'lucide-react';
import { REGIONS } from '../starset/USMap';

// State abbreviation → full name
const STATE_NAMES: Record<string, string> = {
  AL:'Alabama',AK:'Alaska',AZ:'Arizona',AR:'Arkansas',CA:'California',
  CO:'Colorado',CT:'Connecticut',DE:'Delaware',DC:'District of Columbia',
  FL:'Florida',GA:'Georgia',HI:'Hawaii',ID:'Idaho',IL:'Illinois',
  IN:'Indiana',IA:'Iowa',KS:'Kansas',KY:'Kentucky',LA:'Louisiana',
  ME:'Maine',MD:'Maryland',MA:'Massachusetts',MI:'Michigan',MN:'Minnesota',
  MS:'Mississippi',MO:'Missouri',MT:'Montana',NE:'Nebraska',NV:'Nevada',
  NH:'New Hampshire',NJ:'New Jersey',NM:'New Mexico',NY:'New York',
  NC:'North Carolina',ND:'North Dakota',OH:'Ohio',OK:'Oklahoma',OR:'Oregon',
  PA:'Pennsylvania',RI:'Rhode Island',SC:'South Carolina',SD:'South Dakota',
  TN:'Tennessee',TX:'Texas',UT:'Utah',VT:'Vermont',VA:'Virginia',
  WA:'Washington',WV:'West Virginia',WI:'Wisconsin',WY:'Wyoming',
};

type Step = 'confirm' | 'form' | 'done';

interface MsaOption { msa_id: number; msa_name: string; }

const inputClass = 'w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:border-[#009DE0] focus:outline-none focus:ring-1 focus:ring-[#009DE0]/20';
const labelClass = 'mb-1 block text-xs font-semibold text-gray-500 uppercase tracking-wider';

export function DataGapReportView() {
  const { user, profile } = useAuth();

  const [step, setStep] = useState<Step>('confirm');
  const [confirmed, setConfirmed] = useState(false);

  const [dataType, setDataType] = useState<'hospital' | 'network' | ''>('');
  const [regionId, setRegionId] = useState<number | ''>('');
  const [state, setState] = useState('');
  const [msaId, setMsaId] = useState<number | ''>('');
  const [msaName, setMsaName] = useState('');
  const [itemName, setItemName] = useState('');
  const [details, setDetails] = useState('');

  const [msaOptions, setMsaOptions] = useState<MsaOption[]>([]);
  const [msaLoading, setMsaLoading] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // States for selected region
  const regionStates = useMemo(() => {
    if (!regionId) return [];
    const region = REGIONS.find(r => r.id === regionId);
    return region?.states ?? [];
  }, [regionId]);

  // When state changes, fetch MSAs
  useEffect(() => {
    if (!state) { setMsaOptions([]); setMsaId(''); setMsaName(''); return; }
    setMsaLoading(true);
    setMsaId(''); setMsaName('');
    supabase
      .from('ccm_msa')
      .select('msa_id, msa_name')
      .eq('state', state)
      .order('msa_name')
      .then(({ data }) => {
        // Deduplicate by msa_id
        const seen = new Set<number>();
        const unique = (data ?? []).filter(r => {
          if (seen.has(r.msa_id)) return false;
          seen.add(r.msa_id); return true;
        });
        setMsaOptions(unique as MsaOption[]);
        setMsaLoading(false);
      });
  }, [state]);

  // When region changes reset state + MSA
  useEffect(() => {
    setState(''); setMsaId(''); setMsaName(''); setMsaOptions([]);
  }, [regionId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!dataType || !regionId || !state || !msaName || !itemName) {
      setError('Please complete all required fields.');
      return;
    }
    setSubmitting(true);
    setError(null);

    const region = REGIONS.find(r => r.id === regionId);

    const { error: dbErr } = await supabase.from('data_gap_reports').insert({
      data_type: dataType,
      mma_region: region?.name ?? String(regionId),
      state,
      msa_name: msaName,
      item_name: itemName,
      additional_details: details,
      submitted_by_email: user?.email ?? '',
      submitted_by_name: profile?.display_name ?? user?.email ?? '',
    });

    if (dbErr) {
      setError(dbErr.message);
    } else {
      setStep('done');
    }
    setSubmitting(false);
  }

  // ── Step 1: Confirmation ──────────────────────────────────────────────────
  if (step === 'confirm') {
    return (
      <div className="flex min-h-[80vh] items-center justify-center p-6">
        <div className="w-full max-w-lg rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
          <div className="mb-6 flex items-start gap-4">
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-amber-100">
              <AlertCircle className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-[#001A41]">Before you report a gap</h1>
              <p className="mt-1 text-sm text-gray-500">
                Please confirm the data you're looking for isn't already scheduled for a future update.
              </p>
            </div>
          </div>

          <div className="mb-6 rounded-xl border border-blue-100 bg-blue-50 px-5 py-4">
            <p className="text-sm text-blue-800">
              Check the <strong>Payer Networks</strong> page to see which networks are currently planned or in progress before submitting.
            </p>
            <button
              onClick={() => window.dispatchEvent(new CustomEvent('navigate', { detail: 'payer-networks' }))}
              className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-[#009DE0] hover:underline"
            >
              View Payer Networks <ExternalLink className="h-3 w-3" />
            </button>
          </div>

          <label className="flex cursor-pointer items-start gap-3">
            <input
              type="checkbox"
              checked={confirmed}
              onChange={e => setConfirmed(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-gray-300 accent-[#009DE0]"
            />
            <span className="text-sm text-gray-700">
              I have checked the Payer Networks page and confirmed this data is not already planned for a future update.
            </span>
          </label>

          <button
            disabled={!confirmed}
            onClick={() => setStep('form')}
            className="mt-6 w-full rounded-lg bg-[#009DE0] py-2.5 text-sm font-semibold text-white transition hover:bg-[#007ab8] disabled:opacity-40"
          >
            Continue to Report
          </button>
        </div>
      </div>
    );
  }

  // ── Step 3: Done ─────────────────────────────────────────────────────────
  if (step === 'done') {
    return (
      <div className="flex min-h-[80vh] items-center justify-center p-6">
        <div className="w-full max-w-lg rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm">
          <div className="mb-4 flex justify-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
          </div>
          <h1 className="text-lg font-bold text-[#001A41]">Gap reported</h1>
          <p className="mt-2 text-sm text-gray-500">
            Your report has been submitted. The THS team will review it and follow up as needed.
          </p>
          <button
            onClick={() => { setStep('confirm'); setConfirmed(false); setDataType(''); setRegionId(''); setState(''); setMsaId(''); setMsaName(''); setItemName(''); setDetails(''); }}
            className="mt-6 rounded-lg border border-gray-200 px-5 py-2 text-sm font-semibold text-gray-600 transition hover:bg-gray-50"
          >
            Report another gap
          </button>
        </div>
      </div>
    );
  }

  // ── Step 2: Form ──────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50/50 p-4 sm:p-6">
      <div className="mx-auto max-w-xl">
        <div className="mb-6">
          <h1 className="text-xl font-bold text-[#001A41]">Report a Data Gap</h1>
          <p className="mt-0.5 text-sm text-gray-500">
            Let us know about missing data so we can investigate and plan for future updates.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">

          {/* 1 — Data type */}
          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <label className={labelClass}>1. What type of data is missing?</label>
            <div className="mt-2 flex gap-3">
              {(['hospital', 'network'] as const).map(t => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setDataType(t)}
                  className={`flex-1 rounded-lg border py-2.5 text-sm font-semibold capitalize transition ${
                    dataType === t
                      ? 'border-[#009DE0] bg-[#009DE0] text-white shadow-sm'
                      : 'border-gray-200 bg-gray-50 text-gray-600 hover:border-[#009DE0]/50'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* 2 — Location */}
          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <label className={labelClass}>2. Where is the data missing?</label>
            <div className="mt-2 space-y-3">
              {/* Region */}
              <div>
                <label className="mb-1 block text-xs text-gray-400">MMA Region</label>
                <select
                  value={regionId}
                  onChange={e => setRegionId(e.target.value ? Number(e.target.value) : '')}
                  className={inputClass}
                  required
                >
                  <option value="">Select a region…</option>
                  {REGIONS.map(r => (
                    <option key={r.id} value={r.id}>Region {r.id} — {r.name}</option>
                  ))}
                </select>
              </div>

              {/* State */}
              <div>
                <label className="mb-1 block text-xs text-gray-400">State</label>
                <select
                  value={state}
                  onChange={e => setState(e.target.value)}
                  disabled={!regionId}
                  className={inputClass}
                  required
                >
                  <option value="">Select a state…</option>
                  {regionStates.map(abbr => (
                    <option key={abbr} value={abbr}>{STATE_NAMES[abbr] ?? abbr} ({abbr})</option>
                  ))}
                </select>
              </div>

              {/* MSA */}
              <div>
                <label className="mb-1 block text-xs text-gray-400">MSA</label>
                {msaLoading ? (
                  <div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-400">Loading MSAs…</div>
                ) : (
                  <select
                    value={msaId}
                    onChange={e => {
                      const id = Number(e.target.value);
                      setMsaId(id || '');
                      const opt = msaOptions.find(m => m.msa_id === id);
                      setMsaName(opt?.msa_name ?? '');
                    }}
                    disabled={!state}
                    className={inputClass}
                    required
                  >
                    <option value="">Select an MSA…</option>
                    {msaOptions.map(m => (
                      <option key={m.msa_id} value={m.msa_id}>{m.msa_name}</option>
                    ))}
                  </select>
                )}
              </div>
            </div>
          </div>

          {/* 3 — Name */}
          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <label className={labelClass}>
              3. What is the name of the {dataType || 'hospital or network'} that is missing?
            </label>
            <input
              type="text"
              value={itemName}
              onChange={e => setItemName(e.target.value)}
              required
              placeholder={dataType === 'hospital' ? 'e.g. St. Mary\'s Medical Center' : dataType === 'network' ? 'e.g. Cigna LocalPlus' : 'Enter name…'}
              className={`mt-2 ${inputClass}`}
            />
          </div>

          {/* 4 — Additional details */}
          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <label className={labelClass}>4. Any additional details? <span className="text-gray-300 normal-case font-normal">(optional)</span></label>
            <textarea
              value={details}
              onChange={e => setDetails(e.target.value)}
              rows={3}
              placeholder="Any context that might help us locate or prioritize this data…"
              className={`mt-2 ${inputClass} resize-none`}
            />
          </div>

          {error && (
            <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>
          )}

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setStep('confirm')}
              className="rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-500 transition hover:bg-gray-50"
            >
              Back
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 rounded-lg bg-[#009DE0] py-2.5 text-sm font-semibold text-white transition hover:bg-[#007ab8] disabled:opacity-50"
            >
              {submitting ? 'Submitting…' : 'Submit Gap Report'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

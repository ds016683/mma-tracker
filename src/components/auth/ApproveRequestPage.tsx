import { useState } from 'react';
import { supabase } from '../../lib/supabase/client';
import mmaLogo from '../../assets/mma-logo.png';
import thsLogo from '../../assets/ths-logo.png';

function getParams() {
  const search = new URLSearchParams(window.location.search);
  const hash = new URLSearchParams(window.location.hash.replace('#', '?').replace('?', ''));
  return {
    token: search.get('token') ?? hash.get('token') ?? '',
    action: (search.get('action') ?? hash.get('action') ?? 'approve') as 'approve' | 'reject',
  };
}

export function ApproveRequestPage() {
  const { token, action } = getParams();
  const [reviewerEmail, setReviewerEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  async function handleConfirm() {
    setLoading(true);
    const { data, error } = await supabase.functions.invoke('approve-account-request', {
      body: { token, action, reviewer_email: reviewerEmail },
    });
    if (error || data?.error) {
      setResult({ success: false, message: data?.error ?? error?.message ?? 'Something went wrong.' });
    } else {
      setResult({
        success: true,
        message: action === 'approve'
          ? `Account approved. The user will receive an email with instructions to set their password.`
          : `Request rejected. The user has been notified.`,
      });
    }
    setLoading(false);
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#0d1a26] px-4">
      <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-[#16232f] p-8 shadow-2xl">
        <div className="mb-8 flex items-center justify-center gap-4">
          <img src={mmaLogo} alt="Marsh McLennan Agency" className="h-8 w-auto brightness-0 invert" />
          <div className="h-8 w-px bg-white/20" />
          <img src={thsLogo} alt="Third Horizon" className="h-8 w-auto brightness-0 invert" />
        </div>

        <h1 className="mb-1 text-center text-lg font-bold text-white">
          {action === 'approve' ? '✅ Approve Account' : '❌ Reject Request'}
        </h1>
        <p className="mb-6 text-center text-xs text-white/40">MMA Master Tracker</p>

        {result ? (
          <div className={`rounded-lg px-4 py-4 text-center ${result.success ? 'bg-green-500/10' : 'bg-red-500/10'}`}>
            <p className={`text-sm font-semibold ${result.success ? 'text-green-400' : 'text-red-400'}`}>
              {result.success ? 'Done' : 'Error'}
            </p>
            <p className="mt-1 text-xs text-white/60">{result.message}</p>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-white/70 text-center">
              Confirm your identity to {action === 'approve' ? 'approve' : 'reject'} this account request.
            </p>
            <div>
              <label className="mb-1 block text-xs font-medium text-white/50">Your Email</label>
              <input
                type="email"
                value={reviewerEmail}
                onChange={e => setReviewerEmail(e.target.value)}
                placeholder="you@thirdhorizon.com"
                className="w-full rounded-lg border border-white/10 bg-[#0d1a26] px-3 py-2.5 text-sm text-white placeholder-white/20 focus:border-[#009DE0] focus:outline-none"
              />
            </div>
            <button
              onClick={handleConfirm}
              disabled={loading || !reviewerEmail}
              className={`w-full rounded-lg py-2.5 text-sm font-semibold text-white transition-colors disabled:opacity-50 ${
                action === 'approve' ? 'bg-[#009DE0] hover:bg-[#007ab8]' : 'bg-[#EF4E45] hover:bg-[#c73c34]'
              }`}
            >
              {loading ? 'Processing…' : action === 'approve' ? 'Confirm Approval' : 'Confirm Rejection'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

import { useState } from 'react';
import { supabase } from '../../lib/supabase/client';
import mmaLogo from '../../assets/mma-logo.png';
import thsLogo from '../../assets/ths-logo.png';

type RequestRole = 'mma_regional' | 'mma_analytics';

export function RequestAccountPage() {
  const [form, setForm] = useState({ email: '', display_name: '', requested_role: 'mma_regional' as RequestRole, message: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { data, error: fnErr } = await supabase.functions.invoke('request-account', {
      body: form,
    });

    if (fnErr || data?.error) {
      setError(data?.error ?? fnErr?.message ?? 'Something went wrong.');
    } else {
      setSubmitted(true);
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

        <h1 className="mb-1 text-center text-lg font-bold text-white">Request Access</h1>
        <p className="mb-6 text-center text-xs text-white/40">MMA Master Tracker</p>

        {submitted ? (
          <div className="rounded-lg bg-green-500/10 px-4 py-4 text-center">
            <p className="text-sm font-semibold text-green-400">Request submitted!</p>
            <p className="mt-1 text-xs text-white/50">You'll receive an email once your account has been reviewed.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1 block text-xs font-medium text-white/50">Full Name</label>
              <input
                type="text"
                value={form.display_name}
                onChange={e => setForm(f => ({ ...f, display_name: e.target.value }))}
                required
                placeholder="Jane Smith"
                className="w-full rounded-lg border border-white/10 bg-[#0d1a26] px-3 py-2.5 text-sm text-white placeholder-white/20 focus:border-[#009DE0] focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-white/50">Work Email</label>
              <input
                type="email"
                value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                required
                placeholder="you@marshmma.com"
                className="w-full rounded-lg border border-white/10 bg-[#0d1a26] px-3 py-2.5 text-sm text-white placeholder-white/20 focus:border-[#009DE0] focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-white/50">Access Level</label>
              <select
                value={form.requested_role}
                onChange={e => setForm(f => ({ ...f, requested_role: e.target.value as RequestRole }))}
                className="w-full rounded-lg border border-white/10 bg-[#0d1a26] px-3 py-2.5 text-sm text-white focus:border-[#009DE0] focus:outline-none"
              >
                <option value="mma_regional">MMA Regional</option>
                <option value="mma_analytics">MMA Actuarial &amp; Analytics</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-white/50">Message (optional)</label>
              <textarea
                value={form.message}
                onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
                rows={3}
                placeholder="Briefly describe why you need access…"
                className="w-full rounded-lg border border-white/10 bg-[#0d1a26] px-3 py-2.5 text-sm text-white placeholder-white/20 focus:border-[#009DE0] focus:outline-none resize-none"
              />
            </div>
            {error && <p className="rounded-lg bg-red-500/10 px-3 py-2 text-xs text-red-400">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-[#009DE0] py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#007ab8] disabled:opacity-50"
            >
              {loading ? 'Submitting…' : 'Request Access'}
            </button>
            <div className="text-center">
              <a href="." className="text-xs text-white/40 hover:text-white/70 transition-colors">
                ← Back to sign in
              </a>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

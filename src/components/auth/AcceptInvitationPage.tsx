import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase/client';
import { ROLE_LABELS } from '../../lib/roles';
import type { AppRole } from '../../lib/roles';
import mmaLogo from '../../assets/mma-logo.png';
import thsLogo from '../../assets/ths-logo.png';

function getToken() {
  const search = new URLSearchParams(window.location.search);
  const hash = new URLSearchParams(window.location.hash.replace('#', '?').replace('?', ''));
  return search.get('token') ?? hash.get('token') ?? '';
}

export function AcceptInvitationPage() {
  const token = getToken();
  const [inviteInfo, setInviteInfo] = useState<{ email: string; role: AppRole; expires_at: string } | null>(null);
  const [form, setForm] = useState({ display_name: '', password: '', confirm: '' });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    async function load() {
      const { data, error } = await supabase.functions.invoke('accept-invitation', {
        body: { token },
      });
      if (error || data?.error) {
        setError(data?.error ?? error?.message ?? 'Invalid or expired invitation.');
      } else {
        setInviteInfo(data);
      }
      setLoading(false);
    }
    if (token) load();
    else { setError('No invitation token found.'); setLoading(false); }
  }, [token]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (form.password !== form.confirm) { setError('Passwords do not match.'); return; }
    if (form.password.length < 8) { setError('Password must be at least 8 characters.'); return; }
    setSubmitting(true);
    setError(null);

    const { data, error } = await supabase.functions.invoke('accept-invitation', {
      body: { token, display_name: form.display_name, password: form.password },
    });

    if (error || data?.error) {
      setError(data?.error ?? error?.message ?? 'Something went wrong.');
    } else {
      setDone(true);
    }
    setSubmitting(false);
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#0d1a26] px-4">
      <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-[#16232f] p-8 shadow-2xl">
        <div className="mb-8 flex items-center justify-center gap-4">
          <img src={mmaLogo} alt="Marsh McLennan Agency" className="h-8 w-auto brightness-0 invert" />
          <div className="h-8 w-px bg-white/20" />
          <img src={thsLogo} alt="Third Horizon" className="h-8 w-auto brightness-0 invert" />
        </div>

        <h1 className="mb-1 text-center text-lg font-bold text-white">Accept Invitation</h1>
        <p className="mb-6 text-center text-xs text-white/40">MMA Master Tracker</p>

        {loading && <p className="text-center text-sm text-white/50">Loading…</p>}

        {error && !loading && (
          <div className="rounded-lg bg-red-500/10 px-4 py-4 text-center">
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}

        {done && (
          <div className="rounded-lg bg-green-500/10 px-4 py-4 text-center">
            <p className="text-sm font-semibold text-green-400">Account created!</p>
            <p className="mt-1 text-xs text-white/50">You can now sign in with your email and password.</p>
            <a href="." className="mt-3 inline-block text-xs text-[#009DE0] hover:underline">Sign in →</a>
          </div>
        )}

        {inviteInfo && !done && !loading && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="rounded-lg bg-white/5 px-4 py-3 text-xs text-white/60 space-y-1">
              <div><span className="text-white/40">Email: </span>{inviteInfo.email}</div>
              <div><span className="text-white/40">Role: </span><span className="text-[#009DE0] font-semibold">{ROLE_LABELS[inviteInfo.role]}</span></div>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-white/50">Your Name</label>
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
              <label className="mb-1 block text-xs font-medium text-white/50">Password</label>
              <input
                type="password"
                value={form.password}
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                required
                placeholder="Min 8 characters"
                className="w-full rounded-lg border border-white/10 bg-[#0d1a26] px-3 py-2.5 text-sm text-white placeholder-white/20 focus:border-[#009DE0] focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-white/50">Confirm Password</label>
              <input
                type="password"
                value={form.confirm}
                onChange={e => setForm(f => ({ ...f, confirm: e.target.value }))}
                required
                placeholder="Repeat password"
                className="w-full rounded-lg border border-white/10 bg-[#0d1a26] px-3 py-2.5 text-sm text-white placeholder-white/20 focus:border-[#009DE0] focus:outline-none"
              />
            </div>
            {error && <p className="rounded-lg bg-red-500/10 px-3 py-2 text-xs text-red-400">{error}</p>}
            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-lg bg-[#009DE0] py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#007ab8] disabled:opacity-50"
            >
              {submitting ? 'Creating account…' : 'Create Account'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

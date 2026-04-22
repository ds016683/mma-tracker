import { useState } from 'react';
import { supabase } from '../../lib/supabase/client';
import mmaLogo from '../../assets/mma-logo.png';
import thsLogo from '../../assets/ths-logo.png';

export function AuthPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setError(error.message);
    }
    setLoading(false);
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#0d1a26] px-4">
      <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-[#16232f] p-8 shadow-2xl">
        {/* Logos */}
        <div className="mb-8 flex items-center justify-center gap-4">
          <img src={mmaLogo} alt="Marsh McLennan Agency" className="h-8 w-auto brightness-0 invert" />
          <div className="h-8 w-px bg-white/20" />
          <img src={thsLogo} alt="Third Horizon" className="h-8 w-auto brightness-0 invert" />
        </div>

        <h1 className="mb-1 text-center text-lg font-bold text-white">MMA Master Tracker</h1>
        <p className="mb-6 text-center text-xs text-white/40">Sign in to continue</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-white/50">Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              autoComplete="email"
              placeholder="you@example.com"
              className="w-full rounded-lg border border-white/10 bg-[#0d1a26] px-3 py-2.5 text-sm text-white placeholder-white/20 focus:border-[#009DE0] focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-white/50">Password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              placeholder="••••••••"
              className="w-full rounded-lg border border-white/10 bg-[#0d1a26] px-3 py-2.5 text-sm text-white placeholder-white/20 focus:border-[#009DE0] focus:outline-none"
            />
          </div>

          {error && (
            <p className="rounded-lg bg-red-500/10 px-3 py-2 text-xs text-red-400">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-[#009DE0] py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#007ab8] disabled:opacity-50"
          >
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
}

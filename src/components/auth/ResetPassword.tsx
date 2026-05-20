/**
 * ResetPassword — two-phase password reset component
 *
 * Phase 1 (request): user enters email → supabase.auth.resetPasswordForEmail()
 * Phase 2 (update):  user arrives via magic link with type=recovery →
 *                    supabase.auth.updateUser({ password })
 *
 * No custom email templates required; uses Supabase defaults.
 */
import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase/client';
import mmaLogo from '../../assets/mma-logo.png';
import thsLogo from '../../assets/ths-logo.png';

interface ResetPasswordProps {
  /** Called when user wants to go back to the sign-in page */
  onBack: () => void;
}

export function ResetPassword({ onBack }: ResetPasswordProps) {
  // Detect if we arrived here from a Supabase recovery link
  const [isRecovery, setIsRecovery] = useState(false);
  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    // Supabase fires PASSWORD_RECOVERY when the user clicks the reset link
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setIsRecovery(true);
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  // ── Phase 1: request reset email ─────────────────────────────────────────
  async function handleRequestReset(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    const redirectTo = `${window.location.origin}${window.location.pathname}?reset=true`;

    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });
    setLoading(false);

    if (error) {
      setError(error.message);
    } else {
      setMessage('Check your email — a password reset link is on its way.');
    }
  }

  // ── Phase 2: set new password ────────────────────────────────────────────
  async function handleUpdatePassword(e: React.FormEvent) {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setLoading(false);

    if (error) {
      setError(error.message);
    } else {
      setDone(true);
      setMessage('Password updated. You can now sign in with your new password.');
    }
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

        <h1 className="mb-1 text-center text-lg font-bold text-white">
          {isRecovery ? 'Set New Password' : 'Reset Password'}
        </h1>
        <p className="mb-6 text-center text-xs text-white/40">
          {isRecovery
            ? 'Choose a new password for your account'
            : 'Enter your email to receive a reset link'}
        </p>

        {/* Success / done state */}
        {done ? (
          <div className="space-y-4">
            <p className="rounded-lg bg-green-500/10 px-3 py-2 text-xs text-green-400">
              {message}
            </p>
            <button
              onClick={onBack}
              className="w-full rounded-lg bg-[#009DE0] py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#007ab8]"
            >
              Back to Sign In
            </button>
          </div>
        ) : isRecovery ? (
          /* Phase 2 form */
          <form onSubmit={handleUpdatePassword} className="space-y-4">
            <div>
              <label className="mb-1 block text-xs font-medium text-white/50">New Password</label>
              <input
                type="password"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                required
                autoComplete="new-password"
                placeholder="••••••••"
                className="w-full rounded-lg border border-white/10 bg-[#0d1a26] px-3 py-2.5 text-sm text-white placeholder-white/20 focus:border-[#009DE0] focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-white/50">Confirm Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                required
                autoComplete="new-password"
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
              {loading ? 'Updating…' : 'Update Password'}
            </button>
          </form>
        ) : (
          /* Phase 1 form */
          <form onSubmit={handleRequestReset} className="space-y-4">
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
            {error && (
              <p className="rounded-lg bg-red-500/10 px-3 py-2 text-xs text-red-400">{error}</p>
            )}
            {message && (
              <p className="rounded-lg bg-green-500/10 px-3 py-2 text-xs text-green-400">{message}</p>
            )}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-[#009DE0] py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#007ab8] disabled:opacity-50"
            >
              {loading ? 'Sending…' : 'Send Reset Link'}
            </button>
            <button
              type="button"
              onClick={onBack}
              className="w-full rounded-lg border border-white/10 py-2.5 text-sm font-medium text-white/60 transition-colors hover:border-white/20 hover:text-white/80"
            >
              Back to Sign In
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

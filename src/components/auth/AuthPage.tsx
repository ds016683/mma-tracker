import { useState } from 'react';
import mmaLogo from '../../assets/mma-logo.png';
import thsLogo from '../../assets/ths-logo.png';
import { useAuth } from '../../contexts/AuthContext';

export function AuthPage() {
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [signupSuccess, setSignupSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    const result = mode === 'login'
      ? await signIn(email, password)
      : await signUp(email, password);

    setSubmitting(false);

    if (result.error) {
      setError(result.error);
    } else if (mode === 'signup') {
      setSignupSuccess(true);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-mma-light-bg p-4">
      <div className="w-full max-w-sm space-y-6">
        {/* Logo header */}
        <div className="flex items-center justify-center gap-4">
          <img src={mmaLogo} alt="Marsh McLennan Agency" className="h-8 w-auto" />
          <div className="h-8 w-px bg-gray-300" />
          <img src={thsLogo} alt="Third Horizon" className="h-8 w-auto" />
        </div>

        <div className="text-center">
          <h1 className="text-xl font-bold text-mma-dark-blue">Master Tracker</h1>
          <p className="text-sm text-mma-blue-gray">
            {mode === 'login' ? 'Sign in to continue' : 'Create your account'}
          </p>
        </div>

        {signupSuccess ? (
          <div className="rounded-lg border border-green-200 bg-green-50 p-4 text-center text-sm text-green-800">
            Account created! You can now sign in.
            <button
              onClick={() => { setMode('login'); setSignupSuccess(false); }}
              className="mt-2 block w-full text-center font-medium text-mma-dark-blue hover:underline"
            >
              Go to sign in
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-mma-dark-blue focus:outline-none focus:ring-1 focus:ring-mma-dark-blue"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <input
                id="password"
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-mma-dark-blue focus:outline-none focus:ring-1 focus:ring-mma-dark-blue"
                placeholder="Min. 6 characters"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-md bg-mma-dark-blue px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-mma-dark-blue/90 disabled:opacity-50 transition-colors"
            >
              {submitting
                ? (mode === 'login' ? 'Signing in...' : 'Creating account...')
                : (mode === 'login' ? 'Sign in' : 'Create account')}
            </button>
          </form>
        )}

        {!signupSuccess && (
          <p className="text-center text-sm text-gray-500">
            {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
            <button
              onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setError(null); }}
              className="font-medium text-mma-dark-blue hover:underline"
            >
              {mode === 'login' ? 'Sign up' : 'Sign in'}
            </button>
          </p>
        )}
      </div>
    </div>
  );
}

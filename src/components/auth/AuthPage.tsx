import { useState } from 'react';
import mmaLogo from '../../assets/mma-logo.png';
import thsLogo from '../../assets/ths-logo.png';
import { useAuth } from '../../contexts/AuthContext';

type FlowState = 'idle' | 'loading' | 'sent' | 'error';

export function AuthPage() {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [flowState, setFlowState] = useState<FlowState>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFlowState('loading');
    setErrorMessage(null);

    const result = await signIn(email);

    if (result.error) {
      setFlowState('error');
      setErrorMessage(
        "We couldn't send a link to that address. Make sure you've been added as an authorized user."
      );
    } else {
      setFlowState('sent');
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
          <p className="text-sm text-mma-blue-gray">Authorized access only</p>
        </div>

        {flowState === 'sent' ? (
          <div className="rounded-lg border border-green-200 bg-green-50 p-6 text-center space-y-2">
            <div className="text-2xl">✉️</div>
            <p className="text-sm font-medium text-green-800">Check your email for a login link.</p>
            <p className="text-xs text-green-700">It expires in 1 hour. You can close this tab.</p>
            <button
              onClick={() => { setFlowState('idle'); setEmail(''); }}
              className="mt-3 block w-full text-center text-xs font-medium text-mma-dark-blue hover:underline"
            >
              Use a different email
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {flowState === 'error' && errorMessage && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                {errorMessage}
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email address
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

            <button
              type="submit"
              disabled={flowState === 'loading'}
              className="w-full rounded-md bg-mma-dark-blue px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-mma-dark-blue/90 disabled:opacity-50 transition-colors"
            >
              {flowState === 'loading' ? 'Sending...' : 'Send Login Link'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

import { useState, type FormEvent } from 'react';
import { FirebaseError } from 'firebase/app';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { logIn, resetPassword } from '../../auth/actions';
import { authErrorMessage } from '../../auth/errors';

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: Location } | null)?.from?.pathname;
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [resetting, setResetting] = useState(false);

  async function handleReset() {
    setError(null);
    setNotice(null);
    if (!email.trim()) {
      setError('Enter your email above first.');
      return;
    }
    setResetting(true);
    try {
      await resetPassword(email.trim());
    } catch (err) {
      // Unknown accounts get the same neutral notice to avoid revealing which emails exist.
      if (!(err instanceof FirebaseError && err.code === 'auth/user-not-found')) {
        setError(authErrorMessage(err));
        setResetting(false);
        return;
      }
    }
    setNotice(
      'If an account exists for that email, a reset link has been sent. Check your spam folder too.',
    );
    setResetting(false);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await logIn(email, password);
      // Return the user to where a guard redirected them from, otherwise the
      // member area. The guards decide what an unapproved user actually sees.
      navigate(from ?? '/app');
    } catch (err) {
      setError(authErrorMessage(err));
      setSubmitting(false);
    }
  }

  return (
    <section className="mx-auto max-w-sm space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Sign in</h1>
        <p className="text-sm text-forge-muted">
          Access the Waveform Forge team hub.
        </p>
      </header>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1">
          <label
            htmlFor="email"
            className="block text-sm font-medium text-forge-text"
          >
            Email
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-md border border-forge-border bg-forge-panel/50 px-3 py-2 text-sm text-forge-text outline-none focus:border-forge-accent"
          />
        </div>

        <div className="space-y-1">
          <label
            htmlFor="password"
            className="block text-sm font-medium text-forge-text"
          >
            Password
          </label>
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-md border border-forge-border bg-forge-panel/50 px-3 py-2 text-sm text-forge-text outline-none focus:border-forge-accent"
          />
        </div>

        <div className="text-right">
          <button
            type="button"
            onClick={handleReset}
            disabled={resetting}
            className="text-sm font-medium text-forge-accent hover:underline disabled:cursor-not-allowed disabled:opacity-60"
          >
            {resetting ? 'Sending…' : 'Forgot password?'}
          </button>
        </div>

        {error && (
          <p role="alert" className="text-sm text-red-400">
            {error}
          </p>
        )}

        {notice && (
          <p role="status" className="text-sm text-forge-muted">
            {notice}
          </p>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-md bg-forge-accent px-4 py-2 text-sm font-semibold text-forge-bg transition hover:bg-forge-accent/90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting ? 'Signing in…' : 'Sign in'}
        </button>
      </form>

      <p className="text-sm text-forge-muted">
        Don&apos;t have an account?{' '}
        <Link
          to="/signup"
          className="font-medium text-forge-accent hover:underline"
        >
          Request access
        </Link>
      </p>
    </section>
  );
}

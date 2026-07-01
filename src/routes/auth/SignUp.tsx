import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { signUp } from '../../auth/actions';
import { authErrorMessage } from '../../auth/errors';

export default function SignUp() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }

    setSubmitting(true);
    try {
      await signUp(email, password);
      // Account + pending profile created. Sending them to the member area lets
      // the RequireApproved guard show the "awaiting approval" screen.
      navigate('/app');
    } catch (err) {
      setError(authErrorMessage(err));
      setSubmitting(false);
    }
  }

  return (
    <section className="mx-auto max-w-sm space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Request access</h1>
        <p className="text-sm text-forge-muted">
          Create an account. An admin will review and approve it before you can
          access member features.
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
            autoComplete="new-password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-md border border-forge-border bg-forge-panel/50 px-3 py-2 text-sm text-forge-text outline-none focus:border-forge-accent"
          />
        </div>

        <div className="space-y-1">
          <label
            htmlFor="confirm"
            className="block text-sm font-medium text-forge-text"
          >
            Confirm password
          </label>
          <input
            id="confirm"
            type="password"
            autoComplete="new-password"
            required
            minLength={6}
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            className="w-full rounded-md border border-forge-border bg-forge-panel/50 px-3 py-2 text-sm text-forge-text outline-none focus:border-forge-accent"
          />
        </div>

        {error && (
          <p role="alert" className="text-sm text-red-400">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-md bg-forge-accent px-4 py-2 text-sm font-semibold text-forge-bg transition hover:bg-forge-accent/90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting ? 'Creating account…' : 'Request access'}
        </button>
      </form>

      <p className="text-sm text-forge-muted">
        Already have an account?{' '}
        <Link
          to="/login"
          className="font-medium text-forge-accent hover:underline"
        >
          Sign in
        </Link>
      </p>
    </section>
  );
}

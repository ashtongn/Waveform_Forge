import { NavLink } from 'react-router-dom';
import { useAuth } from '../../auth/useAuth';
import { logOut } from '../../auth/actions';

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  [
    'rounded px-3 py-2 text-sm font-medium transition-colors',
    isActive
      ? 'bg-forge-accent/10 text-forge-accent'
      : 'text-forge-muted hover:text-forge-text',
  ].join(' ');

export default function Header() {
  const { user, profile, loading } = useAuth();
  const isApproved = profile?.status === 'approved';
  const isAdmin = profile?.role === 'admin';

  return (
    <header className="border-b border-forge-border bg-forge-panel/60 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
        <NavLink to="/" className="flex items-center gap-2">
          <span className="font-mono text-lg font-semibold tracking-tight text-forge-accent">
            ⌁ Waveform&nbsp;Forge
          </span>
        </NavLink>
        <nav className="flex items-center gap-1">
          <NavLink to="/" end className={navLinkClass}>
            Home
          </NavLink>
          <NavLink to="/about" className={navLinkClass}>
            About
          </NavLink>

          {isApproved && (
            <NavLink to="/app" className={navLinkClass}>
              Members
            </NavLink>
          )}
          {isAdmin && (
            <NavLink to="/admin" className={navLinkClass}>
              Admin
            </NavLink>
          )}

          {/* Auth controls. Hidden until the initial auth state resolves to
              avoid a flash of the wrong control. */}
          {!loading &&
            (user ? (
              <button
                type="button"
                onClick={() => logOut()}
                className="rounded px-3 py-2 text-sm font-medium text-forge-muted transition-colors hover:text-forge-text"
              >
                Sign out
              </button>
            ) : (
              <NavLink to="/login" className={navLinkClass}>
                Sign in
              </NavLink>
            ))}
        </nav>
      </div>
    </header>
  );
}

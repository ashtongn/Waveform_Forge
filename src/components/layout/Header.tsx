import { NavLink } from 'react-router-dom';

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  [
    'rounded px-3 py-2 text-sm font-medium transition-colors',
    isActive
      ? 'bg-forge-accent/10 text-forge-accent'
      : 'text-forge-muted hover:text-forge-text',
  ].join(' ');

export default function Header() {
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
          {/* A "Sign in" link will appear here in Phase 1. */}
        </nav>
      </div>
    </header>
  );
}

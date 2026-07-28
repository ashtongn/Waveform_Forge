import { useEffect, useId, useRef, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';

export interface NavDropdownItem {
  to: string;
  label: string;
  /** Optional one-line explanation shown under the label. */
  description?: string;
}

interface NavDropdownProps {
  label: string;
  items: NavDropdownItem[];
}

/**
 * Header nav entry that expands into a small menu.
 *
 * Keeps the top bar uncluttered by grouping related destinations under a single
 * tab. The trigger is highlighted whenever the current route belongs to the
 * group, so the active section still reads at a glance.
 *
 * Interaction: click (or Enter / Space / ArrowDown) opens, Escape or an outside
 * click closes, and navigating closes it automatically.
 */
export default function NavDropdown({ label, items }: NavDropdownProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuId = useId();
  const { pathname } = useLocation();

  const isActiveSection = items.some(
    (item) => pathname === item.to || pathname.startsWith(`${item.to}/`),
  );

  // Close whenever the route changes.
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;

    function onPointerDown(event: MouseEvent | TouchEvent) {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== 'Escape') return;
      setOpen(false);
      triggerRef.current?.focus();
    }

    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('touchstart', onPointerDown);
    document.addEventListener('keydown', onKeyDown);

    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('touchstart', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  return (
    <div ref={containerRef} className="relative">
      <button
        ref={triggerRef}
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        onClick={() => setOpen((current) => !current)}
        onKeyDown={(event) => {
          if (event.key === 'ArrowDown') {
            event.preventDefault();
            setOpen(true);
          }
        }}
        className={[
          'flex items-center gap-1.5 rounded px-3 py-2 text-sm font-medium transition-colors',
          isActiveSection || open
            ? 'bg-forge-accent/10 text-forge-accent'
            : 'text-forge-muted hover:text-forge-text',
        ].join(' ')}
      >
        {label}
        <span
          aria-hidden="true"
          className={`text-[0.55rem] transition-transform ${open ? 'rotate-180' : ''}`}
        >
          ▼
        </span>
      </button>

      {open && (
        <div
          id={menuId}
          role="menu"
          aria-label={label}
          className="absolute right-0 z-50 mt-1 w-64 border border-forge-border bg-forge-panel shadow-lg shadow-black/40"
        >
          {items.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              role="menuitem"
              className={({ isActive }) =>
                [
                  'block border-l-2 px-3 py-2.5 transition-colors',
                  isActive
                    ? 'border-forge-accent bg-forge-accent/10 text-forge-accent'
                    : 'border-transparent text-forge-muted hover:bg-white/[0.03] hover:text-forge-text',
                ].join(' ')
              }
            >
              <span className="block text-sm font-medium">{item.label}</span>
              {item.description && (
                <span className="mt-0.5 block text-xs leading-snug text-forge-muted/80">
                  {item.description}
                </span>
              )}
            </NavLink>
          ))}
        </div>
      )}
    </div>
  );
}

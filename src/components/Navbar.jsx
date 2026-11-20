import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { GraduationCap, Menu, X, ChevronRight, MapPin, LayoutDashboard } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext.jsx';

const NAV_LINKS = [
  { label: 'Departments', href: '#departments' },
  { label: 'How It Works', href: '#how-it-works' },
  { label: 'Campus Support', href: '#support' },
];

export default function Navbar() {
  const { currentUser, userProfile } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 15);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [menuOpen]);

  return (
    <>
      <header
        className="fixed top-0 left-0 right-0 z-50 transition-all duration-200"
        style={{
          background: scrolled ? 'rgba(255, 255, 255, 0.96)' : 'rgba(255, 255, 255, 0.88)',
          backdropFilter: 'blur(16px) saturate(140%)',
          WebkitBackdropFilter: 'blur(16px) saturate(140%)',
          borderBottom: '1px solid #E2E8F0',
          boxShadow: scrolled ? '0 1px 3px 0 rgba(15, 23, 42, 0.05)' : 'none',
        }}
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-12 h-16 flex items-center justify-between">

          {/* ── Brand & LPU Campus Identifier ───── */}
          <div className="flex items-center gap-3">
            <a
              href="/"
              className="flex items-center gap-2.5 group outline-none"
              aria-label="CampusResolve AI — LPU Phagwara"
            >
              <div
                className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 transition-transform duration-200 group-hover:scale-105"
                style={{
                  background: 'linear-gradient(135deg, #1F47E8 0%, #2D56F5 100%)',
                  boxShadow: '0 2px 8px rgba(31, 71, 232, 0.25)',
                }}
              >
                <GraduationCap className="w-5 h-5 text-white" aria-hidden="true" />
              </div>
              <div className="flex flex-col">
                <span className="font-heading font-extrabold text-content-heading text-[1.125rem] tracking-tight leading-none">
                  CampusResolve <span className="text-brand-blue">AI</span>
                </span>
                <span className="text-[0.625rem] font-semibold text-content-muted tracking-wide flex items-center gap-1 mt-0.5">
                  <MapPin className="w-2.5 h-2.5 text-brand-blue" aria-hidden="true" />
                  LPU Phagwara Campus
                </span>
              </div>
            </a>
          </div>

          {/* ── Desktop nav links ────────────────── */}
          <nav className="hidden md:flex items-center gap-1" aria-label="Main navigation">
            {NAV_LINKS.map(({ label, href }) => (
              <a
                key={label}
                href={href}
                className="px-4 py-2 rounded-lg text-[0.875rem] font-semibold text-content-secondary transition-colors duration-150 hover:text-brand-blue hover:bg-brand-blue-pale"
              >
                {label}
              </a>
            ))}
          </nav>

          {/* ── Desktop right actions ─────────────── */}
          <div className="hidden md:flex items-center gap-3">
            {currentUser ? (
              <Link
                to={userProfile?.role === 'staff' ? '/staff-dashboard' : '/dashboard'}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-[0.875rem] font-semibold text-brand-blue bg-blue-50 border border-blue-200 hover:bg-blue-100 transition-all"
              >
                <LayoutDashboard className="w-4 h-4" />
                {userProfile?.role === 'staff' ? 'Staff Dashboard' : 'Student Dashboard'}
              </Link>
            ) : (
              <Link
                to="/login"
                className="px-4 py-2 rounded-lg text-[0.875rem] font-semibold text-content-secondary transition-all duration-150 hover:text-content-heading hover:bg-slate-100"
              >
                Student / Staff Login
              </Link>
            )}
            <Link
              to="/submit-complaint"
              className="px-5 py-2.5 rounded-lg text-[0.875rem] font-bold text-white transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0"
              style={{
                background: 'linear-gradient(90deg, #1F47E8 0%, #2D56F5 100%)',
                boxShadow: '0 4px 14px rgba(31, 71, 232, 0.28)',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.boxShadow = '0 6px 20px rgba(31, 71, 232, 0.38)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.boxShadow = '0 4px 14px rgba(31, 71, 232, 0.28)';
              }}
            >
              File Grievance
            </Link>
          </div>

          {/* ── Mobile hamburger ──────────────────── */}
          <button
            type="button"
            className="md:hidden w-10 h-10 flex items-center justify-center rounded-lg text-content-secondary hover:text-content-heading hover:bg-slate-100 transition-colors duration-150"
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen(v => !v)}
          >
            {menuOpen
              ? <X className="w-5 h-5" aria-hidden="true" />
              : <Menu className="w-5 h-5" aria-hidden="true" />}
          </button>
        </div>
      </header>

      {/* ── Mobile drawer ────────────────────────── */}
      {menuOpen && (
        <div
          className="fixed inset-0 z-40 md:hidden bg-white/95 backdrop-blur-md"
          aria-modal="true"
          role="dialog"
          aria-label="Mobile navigation"
        >
          {/* Top bar spacer */}
          <div className="h-16 border-b border-border-ui-subtle" />

          <nav className="flex flex-col px-6 pt-6 gap-2">
            <div className="px-4 py-2 mb-2 rounded-lg bg-blue-50 border border-blue-100 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-brand-blue" aria-hidden="true" />
              <span className="text-[0.75rem] font-semibold text-brand-blue">
                Dedicated to LPU Phagwara Campus
              </span>
            </div>

            {NAV_LINKS.map(({ label, href }) => (
              <a
                key={label}
                href={href}
                onClick={() => setMenuOpen(false)}
                className="flex items-center justify-between px-4 py-3.5 rounded-xl text-[1rem] font-semibold text-content-primary hover:text-brand-blue hover:bg-brand-blue-pale transition-colors duration-150"
              >
                {label}
                <ChevronRight className="w-4 h-4 text-content-muted" aria-hidden="true" />
              </a>
            ))}

            <div className="mt-8 flex flex-col gap-3">
              {currentUser ? (
                <Link
                  to={userProfile?.role === 'staff' ? '/staff-dashboard' : '/dashboard'}
                  onClick={() => setMenuOpen(false)}
                  className="w-full py-3 rounded-xl text-center text-[0.9375rem] font-bold text-brand-blue border border-blue-200 bg-blue-50 hover:bg-blue-100 transition-colors duration-150"
                >
                  {userProfile?.role === 'staff' ? 'Staff Dashboard' : 'Student Dashboard'}
                </Link>
              ) : (
                <Link
                  to="/login"
                  onClick={() => setMenuOpen(false)}
                  className="w-full py-3 rounded-xl text-center text-[0.9375rem] font-semibold text-content-primary border border-border-ui-default bg-white hover:bg-slate-50 transition-colors duration-150"
                >
                  Student / Staff Login
                </Link>
              )}
              <Link
                to="/submit-complaint"
                onClick={() => setMenuOpen(false)}
                className="w-full py-3.5 rounded-xl text-center text-[0.9375rem] font-bold text-white shadow-brand"
                style={{
                  background: 'linear-gradient(90deg, #1F47E8 0%, #2D56F5 100%)',
                }}
              >
                File Grievance
              </Link>
            </div>
          </nav>
        </div>
      )}
    </>
  );
}

import { GraduationCap, Shield, Zap, CheckCircle } from 'lucide-react';

const features = [
  {
    icon: <Zap className="w-5 h-5" />,
    label: 'AI-Powered',
    description: 'Intelligent complaint routing and analysis',
  },
  {
    icon: <Shield className="w-5 h-5" />,
    label: 'Secure',
    description: 'Role-based access and data encryption',
  },
  {
    icon: <CheckCircle className="w-5 h-5" />,
    label: 'Efficient',
    description: 'Streamlined resolution workflows',
  },
];

function TestPage() {
  return (
    <div className="min-h-screen gradient-hero flex flex-col">
      {/* Brand glow overlay */}
      <div
        className="pointer-events-none absolute inset-0 overflow-hidden"
        aria-hidden="true"
        style={{ background: 'var(--gradient-brand)' }}
      />

      {/* Minimal nav */}
      <header className="relative z-10 nav-glass border-b border-subtle">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Logo mark */}
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: 'var(--gradient-cta)' }}
              aria-hidden="true"
            >
              <GraduationCap className="w-4 h-4 text-white" />
            </div>
            <span
              className="text-white font-heading font-extrabold text-lg tracking-tight"
            >
              CampusResolve <span className="text-gradient-blue">AI</span>
            </span>
          </div>

          <span className="text-caption text-brand-blue-mid font-medium uppercase tracking-widest">
            Task 02 — Setup ✓
          </span>
        </div>
      </header>

      {/* Hero content */}
      <main className="relative z-10 flex-1 flex items-center justify-center px-6 py-24">
        <div className="max-w-2xl mx-auto text-center animate-fade-in">

          {/* Overline badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border mb-8"
            style={{
              background: 'rgba(31, 71, 232, 0.1)',
              borderColor: 'rgba(31, 71, 232, 0.3)',
            }}>
            <span className="w-1.5 h-1.5 rounded-full bg-accent-green animate-pulse" aria-hidden="true" />
            <span className="text-overline text-brand-blue-mid font-semibold uppercase tracking-widest">
              Frontend Scaffold Ready
            </span>
          </div>

          {/* Main heading */}
          <h1 className="font-heading font-extrabold text-white mb-6"
            style={{ fontSize: 'clamp(2.25rem, 5vw, 3.5rem)', lineHeight: '1.1', letterSpacing: '-0.03em' }}>
            CampusResolve AI
          </h1>

          {/* Sub-heading */}
          <p className="text-body-lg text-brand-blue-light mb-10 max-w-lg mx-auto">
            AI-powered university complaint management platform.
            Vite + React + Tailwind CSS is running successfully.
          </p>

          {/* Feature pills */}
          <div className="flex flex-wrap justify-center gap-3 mb-12">
            {features.map((f) => (
              <div
                key={f.label}
                className="flex items-center gap-2 px-4 py-2 rounded-xl border"
                style={{
                  background: 'rgba(10, 22, 40, 0.8)',
                  borderColor: 'rgba(106, 145, 233, 0.2)',
                }}
              >
                <span className="text-brand-blue-mid">{f.icon}</span>
                <span className="text-body-sm text-brand-blue-pale font-medium">{f.label}</span>
              </div>
            ))}
          </div>

          {/* Status card */}
          <div
            className="rounded-2xl border p-8 text-left"
            style={{
              background: 'rgba(10, 22, 40, 0.75)',
              borderColor: 'rgba(106, 145, 233, 0.15)',
              backdropFilter: 'blur(16px)',
            }}
          >
            <h2 className="font-heading font-semibold text-white text-h5 mb-4">
              Setup Checklist
            </h2>
            <ul className="space-y-3">
              {[
                ['React 18 + Vite 6', true],
                ['Tailwind CSS v3 configured', true],
                ['React Router v7 installed', true],
                ['Lucide React icons ready', true],
                ['Design tokens mapped to Tailwind', true],
                ['Folder structure created', true],
                ['Google Fonts loaded (Plus Jakarta Sans + Inter)', true],
              ].map(([item, done]) => (
                <li key={item} className="flex items-center gap-3">
                  <span
                    className={`flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center ${
                      done
                        ? 'bg-accent-green/20 text-accent-green'
                        : 'bg-brand-blue/20 text-brand-blue-mid'
                    }`}
                    aria-hidden="true"
                  >
                    <CheckCircle className="w-3 h-3" />
                  </span>
                  <span className="text-body-sm text-brand-blue-pale">{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Footer note */}
        </div>
      </main>
    </div>
  );
}

export default TestPage;

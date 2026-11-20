import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Search,
  MessageSquareText,
  CheckCircle2,
  Clock,
  Sparkles,
  MapPin,
  Building2,
  Layers,
  DoorOpen,
  Wifi,
  Wrench,
  Zap,
  UtensilsCrossed,
} from 'lucide-react';

/* ── Realistic LPU Complaint Example in Preview Card ─────────── */
const LPU_CHAT_CONVERSATION = [
  {
    id: 1,
    role: 'user',
    text: 'BH-2 Room 314 me LPU Wi-Fi connect nahi ho raha hai morning se, roll no authenticate nahi ho raha.',
  },
  {
    id: 2,
    role: 'ai',
    text: "Parsed grievance for Lovely Professional University. Extracted location: BH-2, 3rd Floor, Room 314. Assigned directly to LPU Network / Wi-Fi Support under Ticket #LPU-WF-4091.",
  },
];

const LPU_TICKET_DATA = {
  id: 'LPU-WF-4091',
  title: 'Hostel Wi-Fi Authentication Failure',
  dept: 'Wi-Fi',
  block: 'BH-2 (Boys Hostel 2)',
  floor: '3rd Floor',
  room: 'Room 314',
  status: 'In Review',
  time: 'Just now',
};

function StatusPill({ status }) {
  const map = {
    'In Review': {
      bg: '#EFF6FF',
      text: '#1F47E8',
      border: 'rgba(31, 71, 232, 0.25)',
    },
    Resolved: {
      bg: '#ECFDF5',
      text: '#065F46',
      border: 'rgba(16, 185, 129, 0.3)',
    },
    Pending: {
      bg: '#FFFBEB',
      text: '#B45309',
      border: 'rgba(245, 158, 11, 0.3)',
    },
  };
  const s = map[status] ?? map.Pending;
  return (
    <span
      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[0.6875rem] font-bold uppercase tracking-wider border"
      style={{ background: s.bg, color: s.text, borderColor: s.border }}
    >
      {status}
    </span>
  );
}

function LpuAssistantCard() {
  return (
    <div
      className="relative rounded-2xl bg-white border border-border-ui-subtle overflow-hidden"
      style={{
        boxShadow: '0 4px 6px -1px rgba(15, 23, 42, 0.05), 0 20px 25px -5px rgba(15, 23, 42, 0.08)',
      }}
    >
      {/* Card header */}
      <div className="flex items-center justify-between px-5 py-3.5 bg-slate-50 border-b border-border-ui-subtle">
        <div className="flex items-center gap-2.5">
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ background: 'linear-gradient(135deg, #1F47E8, #3B82F6)' }}
          >
            <Sparkles className="w-3.5 h-3.5 text-white" aria-hidden="true" />
          </div>
          <div>
            <p className="font-heading font-bold text-content-heading text-[0.8125rem] leading-none">
              LPU Complaint Assistant
            </p>
            <p className="text-[0.6875rem] text-content-muted mt-0.5">
              Automated Campus Routing
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-50 border border-blue-200">
          <span className="w-1.5 h-1.5 rounded-full bg-brand-blue" aria-hidden="true" />
          <span className="text-[0.6875rem] text-brand-blue font-bold">LPU Phagwara</span>
        </div>
      </div>

      {/* Chat messages */}
      <div className="p-5 space-y-3.5 bg-white">
        {LPU_CHAT_CONVERSATION.map(msg => (
          <div
            key={msg.id}
            className={`flex gap-2.5 ${msg.role === 'ai' ? '' : 'flex-row-reverse'}`}
          >
            {/* Avatar */}
            <div
              className="w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center text-[0.625rem] font-bold"
              style={
                msg.role === 'ai'
                  ? {
                      background: 'linear-gradient(135deg, #1F47E8, #3B82F6)',
                      color: '#ffffff',
                    }
                  : {
                      background: '#F1F5F9',
                      border: '1px solid #CBD5E1',
                      color: '#1E293B',
                    }
              }
            >
              {msg.role === 'ai' ? 'AI' : 'LPU'}
            </div>

            {/* Bubble */}
            <div
              className="max-w-[84%] rounded-xl px-3.5 py-2.5 text-[0.8125rem] leading-relaxed"
              style={
                msg.role === 'ai'
                  ? {
                      background: '#EFF6FF',
                      border: '1px solid rgba(31, 71, 232, 0.18)',
                      color: '#1E293B',
                    }
                  : {
                      background: '#F8FAFC',
                      border: '1px solid #E2E8F0',
                      color: '#334155',
                    }
              }
            >
              {msg.text}
            </div>
          </div>
        ))}
      </div>

      {/* Structured Location Breakdown (Block / Floor / Room Number) */}
      <div className="mx-5 mb-4 p-4 rounded-xl bg-slate-50 border border-border-ui-subtle">
        <div className="flex items-start justify-between gap-2 mb-2.5">
          <div>
            <span className="text-[0.6875rem] font-mono font-bold text-brand-blue uppercase tracking-wide">
              #{LPU_TICKET_DATA.id}
            </span>
            <p className="font-heading font-bold text-content-heading text-[0.875rem] mt-0.5">
              {LPU_TICKET_DATA.title}
            </p>
          </div>
          <StatusPill status={LPU_TICKET_DATA.status} />
        </div>

        {/* LPU Location Tag Matrix */}
        <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-200 text-[0.75rem]">
          <div className="flex items-center gap-1.5 text-content-secondary">
            <Building2 className="w-3.5 h-3.5 text-brand-blue flex-shrink-0" aria-hidden="true" />
            <span className="truncate font-medium">{LPU_TICKET_DATA.block}</span>
          </div>
          <div className="flex items-center gap-1.5 text-content-secondary">
            <Layers className="w-3.5 h-3.5 text-brand-blue flex-shrink-0" aria-hidden="true" />
            <span className="font-medium">{LPU_TICKET_DATA.floor}</span>
          </div>
          <div className="flex items-center gap-1.5 text-content-secondary">
            <DoorOpen className="w-3.5 h-3.5 text-brand-blue flex-shrink-0" aria-hidden="true" />
            <span className="font-medium">{LPU_TICKET_DATA.room}</span>
          </div>
        </div>
      </div>

      {/* LPU Department Quick Indicators */}
      <div className="px-5 py-3 border-t border-border-ui-subtle bg-slate-50/70 flex items-center justify-between text-[0.6875rem] font-medium text-content-secondary">
        <span className="font-bold text-content-heading">Target Department:</span>
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white border border-border-ui-subtle text-brand-blue font-bold">
          <Wifi className="w-3.5 h-3.5 text-brand-blue" aria-hidden="true" />
          Wi-Fi Helpdesk
        </span>
      </div>
    </div>
  );
}

export default function HeroSection() {
  return (
    <section
      className="relative min-h-[90vh] flex items-center pt-20 pb-16 lg:py-24 overflow-hidden gradient-hero"
      aria-label="Hero"
    >
      {/* Background ambient lighting */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-0 right-1/4 w-[500px] h-[500px] rounded-full opacity-40"
        style={{
          background: 'radial-gradient(circle, rgba(31, 71, 232, 0.07) 0%, transparent 70%)',
          filter: 'blur(60px)',
        }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute bottom-0 left-10 w-[400px] h-[400px] rounded-full opacity-30"
        style={{
          background: 'radial-gradient(circle, rgba(59, 130, 246, 0.08) 0%, transparent 70%)',
          filter: 'blur(70px)',
        }}
      />

      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-12 w-full">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">

          {/* ── Left: copy ─────────────────────── */}
          <div className="text-center lg:text-left">

            {/* Scope Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-brand-blue-pale border border-blue-200 mb-6">
              <MapPin className="w-3.5 h-3.5 text-brand-blue" aria-hidden="true" />
              <span className="text-[0.75rem] font-bold text-brand-blue uppercase tracking-wider">
                Lovely Professional University · Phagwara Campus
              </span>
            </div>

            {/* Mandatory Main Tagline */}
            <h1
              className="font-heading font-extrabold text-content-heading mb-6 tracking-tight"
              style={{
                fontSize: 'clamp(2.15rem, 4.8vw, 3.35rem)',
                lineHeight: '1.14',
                letterSpacing: '-0.03em',
              }}
            >
              One Campus.{' '}
              <span className="text-brand-blue">
                One Platform.
              </span>
              <br />
              Smarter Complaint Resolution.
            </h1>

            {/* Exclusive Scope Sub-copy */}
            <p
              className="text-content-secondary mb-8 max-w-lg mx-auto lg:mx-0"
              style={{ fontSize: '1.0625rem', lineHeight: '1.75' }}
            >
              Exclusively built for Lovely Professional University (LPU) students, hostel residents,
              and campus staff. Express complaints naturally in Hinglish, pinpoint your Block, Floor,
              and Room, and have tickets routed to the right maintenance desk.
            </p>

            {/* Realistic LPU Complaint Samples */}
            <div className="mb-8 p-4 rounded-xl bg-white border border-border-ui-subtle shadow-subtle text-left">
              <p className="text-[0.6875rem] font-bold text-content-muted uppercase tracking-wider mb-2">
                Common Campus Grievance Examples Handled:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[0.8125rem] text-content-primary">
                <div className="flex items-center gap-2">
                  <Wifi className="w-3.5 h-3.5 text-blue-600 flex-shrink-0" />
                  <span>Hostel room Wi-Fi connectivity</span>
                </div>
                <div className="flex items-center gap-2">
                  <Wrench className="w-3.5 h-3.5 text-blue-600 flex-shrink-0" />
                  <span>Campus washroom water leakage</span>
                </div>
                <div className="flex items-center gap-2">
                  <Zap className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
                  <span>Academic block electrical issues</span>
                </div>
                <div className="flex items-center gap-2">
                  <UtensilsCrossed className="w-3.5 h-3.5 text-rose-600 flex-shrink-0" />
                  <span>Student mess food & hygiene issues</span>
                </div>
              </div>
            </div>

            {/* CTA buttons */}
            <div className="flex flex-wrap justify-center lg:justify-start gap-3.5">
              <Link
                to="/submit-complaint"
                className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl font-bold text-white text-[0.9375rem] transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0"
                style={{
                  background: 'linear-gradient(90deg, #1F47E8 0%, #2D56F5 100%)',
                  boxShadow: '0 4px 14px rgba(31, 71, 232, 0.28)',
                  minWidth: '190px',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.boxShadow = '0 6px 20px rgba(31, 71, 232, 0.38)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.boxShadow = '0 4px 14px rgba(31, 71, 232, 0.28)';
                }}
              >
                <MessageSquareText className="w-4 h-4" aria-hidden="true" />
                Submit a Complaint
              </Link>

              <button
                type="button"
                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl font-semibold text-content-primary text-[0.9375rem] bg-white border border-border-ui-default transition-all duration-150 hover:bg-slate-50 hover:border-slate-400"
                style={{ minWidth: '165px' }}
              >
                <Search className="w-4 h-4 text-content-secondary" aria-hidden="true" />
                Track Complaint
                <ArrowRight className="w-3.5 h-3.5 ml-1 text-content-muted" aria-hidden="true" />
              </button>
            </div>

            {/* Clear student & staff confirmation */}
            <p className="text-[0.75rem] text-content-muted mt-5 text-center lg:text-left">
              * Dedicated to LPU Phagwara campus residents, faculty, and maintenance divisions.
            </p>
          </div>

          {/* ── Right: preview card ─────────────────── */}
          <div className="relative flex justify-center lg:justify-end">
            <div className="relative w-full max-w-md">
              <LpuAssistantCard />
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}

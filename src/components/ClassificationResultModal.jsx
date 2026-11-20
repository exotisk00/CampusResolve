import { useEffect } from 'react';
import {
  X,
  Sparkles,
  ShieldAlert,
  Clock,
  MapPin,
  CheckCircle2,
  AlertTriangle,
  Wrench,
  Zap,
  Wifi,
  UtensilsCrossed,
  BookOpen,
  HelpCircle,
  Building2,
  Layers,
  DoorOpen,
  Cpu,
  Ticket,
  FileText,
} from 'lucide-react';
import { Link } from 'react-router-dom';

const DEPT_CONFIG = {
  Plumbing: {
    icon: Wrench,
    badgeBg: 'bg-blue-100',
    badgeText: 'text-blue-700',
    borderColor: 'border-blue-300',
    headerBg: 'bg-gradient-to-r from-blue-50 to-sky-50',
  },
  Electrical: {
    icon: Zap,
    badgeBg: 'bg-amber-100',
    badgeText: 'text-amber-800',
    borderColor: 'border-amber-300',
    headerBg: 'bg-gradient-to-r from-amber-50 to-orange-50',
  },
  'Wi-Fi': {
    icon: Wifi,
    badgeBg: 'bg-emerald-100',
    badgeText: 'text-emerald-800',
    borderColor: 'border-emerald-300',
    headerBg: 'bg-gradient-to-r from-emerald-50 to-teal-50',
  },
  Mess: {
    icon: UtensilsCrossed,
    badgeBg: 'bg-rose-100',
    badgeText: 'text-rose-800',
    borderColor: 'border-rose-300',
    headerBg: 'bg-gradient-to-r from-rose-50 to-pink-50',
  },
  Academic: {
    icon: BookOpen,
    badgeBg: 'bg-purple-100',
    badgeText: 'text-purple-800',
    borderColor: 'border-purple-300',
    headerBg: 'bg-gradient-to-r from-purple-50 to-indigo-50',
  },
  Other: {
    icon: HelpCircle,
    badgeBg: 'bg-slate-100',
    badgeText: 'text-slate-800',
    borderColor: 'border-slate-300',
    headerBg: 'bg-gradient-to-r from-slate-50 to-gray-50',
  },
};

export default function ClassificationResultModal({ isOpen, onClose, data }) {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen || !data) return null;

  const deptKey = data.department in DEPT_CONFIG ? data.department : 'Other';
  const deptStyle = DEPT_CONFIG[deptKey];
  const DeptIcon = deptStyle.icon;

  const isGemini = data.method === 'gemini-ai';

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto"
    >
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
      />

      {/* Modal Dialog Card */}
      <div className="relative w-full max-w-xl bg-white rounded-2xl shadow-modal border border-border-ui-subtle overflow-hidden z-10 my-8 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header with Department Styling */}
        <div className={`p-6 border-b border-border-ui-subtle ${deptStyle.headerBg}`}>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center border shadow-xs ${deptStyle.badgeBg} ${deptStyle.badgeText} ${deptStyle.borderColor}`}>
                <DeptIcon className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[0.6875rem] font-bold uppercase tracking-wider text-content-muted">
                  Predicted Department
                </span>
                <h2 className="text-[1.5rem] font-extrabold text-content-heading font-heading leading-tight">
                  {data.department}
                </h2>
              </div>
            </div>

            <button
              onClick={onClose}
              type="button"
              className="p-1.5 rounded-lg text-content-muted hover:text-content-heading hover:bg-white/80 transition-colors"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Engine & Latency Badges */}
          <div className="mt-4 flex flex-wrap items-center gap-2">
            {isGemini ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[0.75rem] font-bold bg-indigo-50 border border-indigo-200 text-indigo-700">
                <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                Gemini 2.5 Flash AI
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[0.75rem] font-bold bg-amber-50 border border-amber-200 text-amber-800">
                <Cpu className="w-3.5 h-3.5 text-amber-600" />
                Rule-Based Fallback Engine
              </span>
            )}

            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[0.75rem] font-semibold bg-white border border-slate-200 text-content-secondary">
              <Clock className="w-3.5 h-3.5 text-slate-500" />
              Latency: {data.processingTimeMs} ms
            </span>

            {data.needsHumanReview ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[0.75rem] font-bold bg-amber-50 border border-amber-300 text-amber-800">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                Needs Human Review
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[0.75rem] font-bold bg-emerald-50 border border-emerald-300 text-emerald-800">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                Direct Automated Routing
              </span>
            )}
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-4 max-h-[65vh] overflow-y-auto">

          {/* Fallback Notice if API key missing */}
          {!isGemini && data.fallbackReason && (
            <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200 text-amber-900 text-[0.8125rem]">
              <div className="font-bold flex items-center gap-1.5 mb-1 text-amber-800">
                <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
                Resilient Fallback Mode Active
              </div>
              <p className="text-[0.75rem] leading-relaxed text-amber-800/90">
                {data.fallbackReason.includes('GEMINI_API_KEY')
                  ? 'The backend processed this classification via the rule-based engine because GEMINI_API_KEY is not yet configured in the backend .env file. Add your Gemini API key to activate live Gemini AI classification.'
                  : `Fallback activated: ${data.fallbackReason}`}
              </p>
            </div>
          )}

          {/* Original Complaint (Preserved verbatim) */}
          <div>
            <label className="block text-[0.6875rem] font-bold text-content-muted uppercase tracking-wider mb-1">
              Preserved Original Complaint
            </label>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-[0.875rem] text-content-primary italic">
              "{data.originalComplaint}"
            </div>
          </div>

          {/* Classification Reason */}
          <div>
            <label className="block text-[0.6875rem] font-bold text-content-muted uppercase tracking-wider mb-1">
              Classification Reason
            </label>
            <div className="p-3 rounded-xl bg-blue-50/50 border border-blue-100 text-[0.875rem] text-content-secondary leading-relaxed">
              {data.reasonForClassification}
            </div>
          </div>

          {/* Extracted Location Details */}
          <div>
            <label className="block text-[0.6875rem] font-bold text-content-muted uppercase tracking-wider mb-1.5 flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-brand-blue" />
              Extracted Campus Location
            </label>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                <span className="block text-[0.6875rem] font-bold text-content-muted uppercase">Block</span>
                <span className="block text-[0.8125rem] font-bold text-content-heading mt-0.5 truncate">
                  {data.extractedBlock || '—'}
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                <span className="block text-[0.6875rem] font-bold text-content-muted uppercase">Floor</span>
                <span className="block text-[0.8125rem] font-bold text-content-heading mt-0.5 truncate">
                  {data.extractedFloor || '—'}
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                <span className="block text-[0.6875rem] font-bold text-content-muted uppercase">Room</span>
                <span className="block text-[0.8125rem] font-bold text-content-heading mt-0.5 truncate">
                  {data.extractedRoom || '—'}
                </span>
              </div>
            </div>
            <p className="text-[0.6875rem] text-content-muted mt-1">
              * Locations are only extracted when explicitly specified; missing details are never fabricated.
            </p>
          </div>

          {/* Dispatch Routing Status */}
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-[0.8125rem]">
            <span className="text-content-secondary font-medium">Campus Triage Status:</span>
            <span className={`font-bold ${data.needsHumanReview ? 'text-amber-700' : 'text-emerald-700'}`}>
              {data.needsHumanReview ? 'Awaiting Human Supervisor Review' : 'Auto-routed to Department Supervisor'}
            </span>
          </div>

          {/* Ticket ID (shown when complaint was saved to Firestore) */}
          {data.savedTicketId && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-between gap-3">
              <div>
                <p className="text-[0.6875rem] font-bold text-emerald-700 uppercase tracking-wider mb-0.5">
                  ✅ Saved to Firestore — Ticket ID
                </p>
                <code className="text-[0.875rem] font-bold text-emerald-900 tracking-wide">
                  {data.savedTicketId}
                </code>
              </div>
              <Link
                to="/dashboard"
                onClick={onClose}
                className="shrink-0 px-3 py-1.5 rounded-lg text-[0.75rem] font-bold text-emerald-700 border border-emerald-300 hover:bg-emerald-100 transition-colors whitespace-nowrap"
              >
                Track in Dashboard
              </Link>
            </div>
          )}

        </div>

        {/* Modal Actions */}
        <div className="p-4 bg-slate-50 border-t border-border-ui-subtle flex items-center justify-end">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-6 py-2.5 rounded-xl text-[0.875rem] font-bold text-white transition-all shadow-xs"
            style={{
              background: 'linear-gradient(90deg, #1F47E8 0%, #2D56F5 100%)',
            }}
          >
            Done
          </button>
        </div>

      </div>
    </div>
  );
}

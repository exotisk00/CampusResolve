import { useEffect } from 'react';
import {
  X,
  Clock,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  RefreshCw,
  Wrench,
  Zap,
  Wifi,
  UtensilsCrossed,
  BookOpen,
  HelpCircle,
  MapPin,
  Building2,
  Layers,
  DoorOpen,
  Cpu,
  Sparkles,
  ShieldCheck,
  FileText,
  Calendar,
  UserCheck,
} from 'lucide-react';

const DEPT_CONFIG = {
  Plumbing: { icon: Wrench, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200' },
  Electrical: { icon: Zap, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200' },
  'Wi-Fi': { icon: Wifi, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200' },
  Mess: { icon: UtensilsCrossed, color: 'text-rose-600', bg: 'bg-rose-50', border: 'border-rose-200' },
  Academic: { icon: BookOpen, color: 'text-purple-600', bg: 'bg-purple-50', border: 'border-purple-200' },
  Other: { icon: HelpCircle, color: 'text-slate-600', bg: 'bg-slate-100', border: 'border-slate-200' },
};

const STATUS_CONFIG = {
  Submitted: {
    label: 'Submitted',
    color: 'text-blue-700',
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    icon: Clock,
  },
  'Under Review': {
    label: 'Under Review',
    color: 'text-amber-700',
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    icon: RefreshCw,
  },
  Assigned: {
    label: 'Assigned',
    color: 'text-indigo-700',
    bg: 'bg-indigo-50',
    border: 'border-indigo-200',
    icon: UserCheck,
  },
  'In Progress': {
    label: 'In Progress',
    color: 'text-orange-700',
    bg: 'bg-orange-50',
    border: 'border-orange-200',
    icon: RefreshCw,
  },
  Resolved: {
    label: 'Resolved',
    color: 'text-emerald-700',
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
    icon: CheckCircle2,
  },
  Rejected: {
    label: 'Rejected',
    color: 'text-rose-700',
    bg: 'bg-rose-50',
    border: 'border-rose-200',
    icon: XCircle,
  },
};

const TIMELINE_STAGES = [
  {
    key: 'Submitted',
    label: 'Complaint Submitted',
    desc: 'Ticket generated and stored in campus grievance queue',
  },
  {
    key: 'Under Review',
    label: 'Under Department Review',
    desc: 'Supervisors triaged the grievance and validated location',
  },
  {
    key: 'Assigned',
    label: 'Staff Assigned',
    desc: 'Authorized field technician designated to the ticket',
  },
  {
    key: 'In Progress',
    label: 'Work In Progress',
    desc: 'Maintenance or repair work actively underway on site',
  },
  {
    key: 'Resolved',
    label: 'Issue Resolved',
    desc: 'Service restored and verified by maintenance division',
  },
];

function getStageIndex(status) {
  switch (status) {
    case 'Submitted':
      return 0;
    case 'Under Review':
      return 1;
    case 'Assigned':
      return 2;
    case 'In Progress':
      return 3;
    case 'Resolved':
      return 4;
    case 'Rejected':
      return -1;
    default:
      return 0;
  }
}

function formatDateTime(ts) {
  if (!ts) return 'Just now';
  const date = ts.toDate ? ts.toDate() : (ts.seconds ? new Date(ts.seconds * 1000) : new Date(ts));
  return date.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function ComplaintDetailsModal({ isOpen, onClose, complaint }) {
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
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

  if (!isOpen || !complaint) return null;

  const dept = complaint.department || 'Other';
  const deptConfig = DEPT_CONFIG[dept] || DEPT_CONFIG.Other;
  const DeptIcon = deptConfig.icon;

  const currentStatus = complaint.status || 'Submitted';
  const statusConfig = STATUS_CONFIG[currentStatus] || STATUS_CONFIG.Submitted;
  const StatusIcon = statusConfig.icon;

  const isRejected = currentStatus === 'Rejected';
  const currentStageIdx = getStageIndex(currentStatus);

  const isGemini = complaint.classificationMethod === 'gemini-ai';

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
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-modal border border-border-ui-subtle overflow-hidden z-10 my-8 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="p-6 border-b border-border-ui-subtle bg-gradient-to-r from-slate-50 to-blue-50/40">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-1.5">
                <span className="text-[0.6875rem] font-bold uppercase tracking-wider text-content-muted">
                  Complaint Ticket
                </span>
                <code className="text-[0.875rem] font-bold text-brand-blue bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-md">
                  {complaint.ticketId || complaint.id}
                </code>
              </div>
              <h2 className="text-[1.25rem] sm:text-[1.375rem] font-extrabold text-content-heading font-heading">
                Grievance Lifecycle Details
              </h2>
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

          {/* Quick Badges Row */}
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[0.75rem] font-bold border ${statusConfig.bg} ${statusConfig.color} ${statusConfig.border}`}
            >
              <StatusIcon className="w-3.5 h-3.5" />
              Status: {currentStatus}
            </span>

            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[0.75rem] font-bold border ${deptConfig.bg} ${deptConfig.color} ${deptConfig.border}`}
            >
              <DeptIcon className="w-3.5 h-3.5" />
              {dept} Division
            </span>

            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[0.75rem] font-semibold bg-white border border-slate-200 text-content-secondary">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              Submitted {formatDateTime(complaint.createdAt)}
            </span>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">

          {/* 1. Status Timeline Section */}
          <div className="p-5 rounded-2xl bg-slate-50/70 border border-border-ui-subtle">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[0.8125rem] font-bold uppercase tracking-wider text-content-heading flex items-center gap-2">
                <Clock className="w-4 h-4 text-brand-blue" />
                Resolution Progress Timeline
              </h3>
              <span className="text-[0.6875rem] text-content-muted">
                LPU Maintenance Dispatch
              </span>
            </div>

            {/* Standard 5-stage progress (or Rejected special state) */}
            {isRejected ? (
              <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-3">
                <XCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-[0.875rem] font-bold text-rose-800">
                    Complaint Rejected / Closed
                  </h4>
                  <p className="text-[0.8125rem] text-rose-700 mt-1 leading-relaxed">
                    This grievance could not be processed. Please review any staff notes below or reach out to the campus administrative office.
                  </p>
                </div>
              </div>
            ) : (
              <div className="relative pl-6 sm:pl-8 space-y-6 before:absolute before:left-3 sm:before:left-4 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                {TIMELINE_STAGES.map((stage, idx) => {
                  const isDone = idx < currentStageIdx;
                  const isCurrent = idx === currentStageIdx;
                  const isUpcoming = idx > currentStageIdx;

                  return (
                    <div key={stage.key} className="relative flex items-start gap-3.5 group">
                      {/* Node Bullet */}
                      <div
                        className={`absolute -left-6 sm:-left-8 w-6 h-6 rounded-full flex items-center justify-center text-[0.75rem] transition-all shadow-xs ${
                          isDone
                            ? 'bg-emerald-600 text-white ring-4 ring-emerald-50'
                            : isCurrent
                            ? 'bg-brand-blue text-white ring-4 ring-blue-100 animate-pulse'
                            : 'bg-white border-2 border-slate-300 text-slate-400'
                        }`}
                      >
                        {isDone ? (
                          <CheckCircle2 className="w-3.5 h-3.5" />
                        ) : (
                          <span className="font-bold text-[0.6875rem]">{idx + 1}</span>
                        )}
                      </div>

                      {/* Stage Text */}
                      <div className="pt-0.5">
                        <div className="flex items-center gap-2">
                          <p
                            className={`text-[0.875rem] font-bold ${
                              isDone
                                ? 'text-content-heading'
                                : isCurrent
                                ? 'text-brand-blue font-extrabold'
                                : 'text-content-muted'
                            }`}
                          >
                            {stage.label}
                          </p>
                          {isCurrent && (
                            <span className="px-2 py-0.5 rounded-full text-[0.625rem] font-bold uppercase bg-blue-100 text-brand-blue tracking-wide">
                              Current Stage
                            </span>
                          )}
                        </div>
                        <p className="text-[0.75rem] text-content-secondary mt-0.5 leading-relaxed">
                          {stage.desc}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* 2. Verbatim Original Complaint */}
          <div>
            <label className="block text-[0.6875rem] font-bold text-content-muted uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-brand-blue" />
              Original Grievance (Verbatim Input)
            </label>
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-[0.9375rem] text-content-primary italic leading-relaxed">
              "{complaint.originalComplaint}"
            </div>
          </div>

          {/* 3. Extracted Campus Location Grid */}
          <div>
            <label className="block text-[0.6875rem] font-bold text-content-muted uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-brand-blue" />
              Designated Campus Location
            </label>
            <div className="grid grid-cols-3 gap-2.5 text-center">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <span className="block text-[0.6875rem] font-bold text-content-muted uppercase flex items-center justify-center gap-1">
                  <Building2 className="w-3 h-3" /> Block
                </span>
                <span className="block text-[0.875rem] font-bold text-content-heading mt-0.5 truncate">
                  {complaint.extractedBlock || 'Not specified'}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <span className="block text-[0.6875rem] font-bold text-content-muted uppercase flex items-center justify-center gap-1">
                  <Layers className="w-3 h-3" /> Floor
                </span>
                <span className="block text-[0.875rem] font-bold text-content-heading mt-0.5 truncate">
                  {complaint.extractedFloor || 'Not specified'}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <span className="block text-[0.6875rem] font-bold text-content-muted uppercase flex items-center justify-center gap-1">
                  <DoorOpen className="w-3 h-3" /> Room
                </span>
                <span className="block text-[0.875rem] font-bold text-content-heading mt-0.5 truncate">
                  {complaint.extractedRoom || 'Not specified'}
                </span>
              </div>
            </div>
          </div>

          {/* 4. AI Classification Diagnostics */}
          <div className="p-4 rounded-xl bg-blue-50/50 border border-blue-100 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[0.6875rem] font-bold uppercase tracking-wider text-brand-blue flex items-center gap-1">
                {isGemini ? <Sparkles className="w-3.5 h-3.5" /> : <Cpu className="w-3.5 h-3.5" />}
                Classification Engine: {isGemini ? 'Gemini 2.5 Flash' : 'Rule-Based Fallback'}
              </span>

              <span
                className={`text-[0.6875rem] font-bold px-2 py-0.5 rounded-full ${
                  complaint.needsHumanReview
                    ? 'bg-amber-100 text-amber-800'
                    : 'bg-emerald-100 text-emerald-800'
                }`}
              >
                {complaint.needsHumanReview ? 'Flagged for Human Review' : 'Auto Triage Approved'}
              </span>
            </div>

            {complaint.reasonForClassification && (
              <p className="text-[0.8125rem] text-content-secondary leading-relaxed pt-1">
                <span className="font-semibold text-content-heading">Routing Rationale:</span>{' '}
                {complaint.reasonForClassification}
              </p>
            )}
          </div>

          {/* 5. Resolution Confirmation Card (When Resolved) */}
          {currentStatus === 'Resolved' && (
            <div className="p-5 rounded-2xl bg-emerald-50/90 border border-emerald-200 shadow-xs space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-[0.9375rem] font-bold text-emerald-900">
                      Grievance Successfully Resolved
                    </h4>
                    <p className="text-[0.75rem] text-emerald-700">
                      Resolved on {formatDateTime(complaint.updatedAt || complaint.createdAt)}
                    </p>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-full text-[0.6875rem] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-300">
                  Closed & Verified
                </span>
              </div>

              {complaint.staffNote ? (
                <div className="pt-2 border-t border-emerald-200/60">
                  <span className="block text-[0.6875rem] font-bold uppercase tracking-wider text-emerald-800 mb-1 flex items-center gap-1">
                    <UserCheck className="w-3.5 h-3.5" /> Staff Resolution Notes
                  </span>
                  <div className="p-3 rounded-xl bg-white/80 border border-emerald-200 text-[0.8125rem] text-emerald-950 font-medium whitespace-pre-line leading-relaxed font-sans">
                    {complaint.staffNote}
                  </div>
                </div>
              ) : (
                <p className="text-[0.75rem] text-emerald-700 italic">
                  Issue addressed and verified by {dept} maintenance department.
                </p>
              )}
            </div>
          )}

          {/* 6. Staff Remarks for Non-Resolved complaints */}
          {currentStatus !== 'Resolved' && complaint.staffNote && (
            <div className="p-4 rounded-xl bg-amber-50/90 border border-amber-200 space-y-2">
              <span className="block text-[0.6875rem] font-bold uppercase tracking-wider text-amber-800 flex items-center gap-1.5">
                <UserCheck className="w-3.5 h-3.5 text-amber-700" />
                Maintenance Staff Remark
              </span>
              <div className="p-3 rounded-lg bg-white/70 border border-amber-200 text-[0.8125rem] text-amber-950 whitespace-pre-line leading-relaxed font-sans font-medium">
                {complaint.staffNote}
              </div>
            </div>
          )}

          {/* 6. Security Notice: Read-only */}
          <div className="flex items-center gap-2 p-3 rounded-xl bg-slate-50 border border-border-ui-subtle text-[0.75rem] text-content-muted">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>
              This grievance record is protected by Firestore security rules. Status transitions are controlled strictly by authorized campus maintenance personnel.
            </span>
          </div>

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
            Close Details
          </button>
        </div>

      </div>
    </div>
  );
}

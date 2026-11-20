import { useEffect } from 'react';
import { AlertTriangle, AlertCircle, CheckCircle2, Info, X } from 'lucide-react';

/**
 * Reusable Alert & Warning Modal Component
 * 
 * @param {boolean} isOpen - Whether modal is visible
 * @param {() => void} onClose - Callback to close modal
 * @param {'warning' | 'error' | 'success' | 'info'} type - Type of alert
 * @param {string} title - Heading of alert
 * @param {string} message - Primary explanation of what happened or needs correction
 * @param {string[]} [details] - Optional bullet points explaining exact correction steps
 * @param {string} [actionText] - Label for primary dismiss button
 */
export default function AlertModal({
  isOpen,
  onClose,
  type = 'warning',
  title,
  message,
  details = [],
  actionText = 'Understood',
}) {
  // Handle Escape key to close modal
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Lock scroll when open
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

  if (!isOpen) return null;

  // Visual configuration based on alert type
  const config = {
    warning: {
      icon: AlertTriangle,
      iconColor: '#D97706',
      iconBg: '#FFFBEB',
      iconBorder: '#FDE68A',
      badgeBg: '#FEF3C7',
      badgeText: '#92400E',
      badgeLabel: 'Input Warning',
      buttonBg: 'linear-gradient(90deg, #D97706 0%, #F59E0B 100%)',
    },
    error: {
      icon: AlertCircle,
      iconColor: '#DC2626',
      iconBg: '#FEF2F2',
      iconBorder: '#FECACA',
      badgeBg: '#FEE2E2',
      badgeText: '#991B1B',
      badgeLabel: 'Validation Error',
      buttonBg: 'linear-gradient(90deg, #DC2626 0%, #EF4444 100%)',
    },
    success: {
      icon: CheckCircle2,
      iconColor: '#059669',
      iconBg: '#ECFDF5',
      iconBorder: '#A7F3D0',
      badgeBg: '#D1FAE5',
      badgeText: '#065F46',
      badgeLabel: 'Demo Success',
      buttonBg: 'linear-gradient(90deg, #059669 0%, #10B981 100%)',
    },
    info: {
      icon: Info,
      iconColor: '#1F47E8',
      iconBg: '#EFF6FF',
      iconBorder: '#BFDBFE',
      badgeBg: '#DBEAFE',
      badgeText: '#1E40AF',
      badgeLabel: 'Notice',
      buttonBg: 'linear-gradient(90deg, #1F47E8 0%, #2D56F5 100%)',
    },
  }[type] || {
    icon: AlertTriangle,
    iconColor: '#D97706',
    iconBg: '#FFFBEB',
    iconBorder: '#FDE68A',
    badgeBg: '#FEF3C7',
    badgeText: '#92400E',
    badgeLabel: 'Warning',
    buttonBg: 'linear-gradient(90deg, #D97706 0%, #F59E0B 100%)',
  };

  const IconComponent = config.icon;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md p-6 sm:p-7 bg-white rounded-2xl border border-border-ui-subtle shadow-2xl transition-all transform animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-content-muted hover:text-content-heading hover:bg-slate-100 rounded-lg transition-colors"
          aria-label="Close popup"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-start gap-4 mb-4">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 border"
            style={{
              backgroundColor: config.iconBg,
              borderColor: config.iconBorder,
            }}
          >
            <IconComponent className="w-6 h-6" style={{ color: config.iconColor }} aria-hidden="true" />
          </div>
          <div>
            <span
              className="inline-block text-[0.6875rem] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full mb-1"
              style={{
                backgroundColor: config.badgeBg,
                color: config.badgeText,
              }}
            >
              {config.badgeLabel}
            </span>
            <h3
              id="modal-title"
              className="font-heading font-bold text-content-heading text-[1.15rem] leading-snug"
            >
              {title}
            </h3>
          </div>
        </div>

        {/* Modal Body */}
        <div className="mb-6">
          <p className="text-[0.9375rem] text-content-secondary leading-relaxed">
            {message}
          </p>

          {/* Detailed correction items if provided */}
          {details && details.length > 0 && (
            <div className="mt-3.5 p-3 rounded-xl bg-slate-50 border border-slate-200">
              <p className="text-[0.75rem] font-bold text-content-heading uppercase tracking-wide mb-1.5">
                Required action:
              </p>
              <ul className="space-y-1.5 text-[0.8125rem] text-content-secondary">
                {details.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-brand-blue font-bold mt-0.5">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Modal Action Button */}
        <div className="flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-6 py-2.5 rounded-xl font-bold text-white text-[0.875rem] shadow-sm hover:opacity-95 transition-all"
            style={{ background: config.buttonBg }}
          >
            {actionText}
          </button>
        </div>
      </div>
    </div>
  );
}

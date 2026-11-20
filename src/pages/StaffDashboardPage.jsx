import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  GraduationCap,
  Wrench,
  Zap,
  Wifi,
  UtensilsCrossed,
  BookOpen,
  HelpCircle,
  Clock,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  RefreshCw,
  Search,
  Filter,
  Eye,
  LogOut,
  MapPin,
  Building2,
  FileText,
  Loader2,
  ShieldAlert,
  ChevronRight,
  Inbox,
  UserCheck,
  Send,
  MessageSquare,
  Sparkles,
  X,
  Layers,
  DoorOpen,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext.jsx';
import {
  subscribeToDepartmentComplaints,
  updateComplaintStatus,
  COMPLAINT_STATUSES,
} from '../services/complaintsService.js';
import { isFirebaseConfigured } from '../lib/firebase.js';

const DEPT_CONFIG = {
  Plumbing: { icon: Wrench, color: 'text-blue-700', bg: 'bg-blue-50', border: 'border-blue-200' },
  Electrical: { icon: Zap, color: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-200' },
  'Wi-Fi': { icon: Wifi, color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200' },
  Mess: { icon: UtensilsCrossed, color: 'text-rose-700', bg: 'bg-rose-50', border: 'border-rose-200' },
  Academic: { icon: BookOpen, color: 'text-purple-700', bg: 'bg-purple-50', border: 'border-purple-200' },
  Other: { icon: HelpCircle, color: 'text-slate-700', bg: 'bg-slate-100', border: 'border-slate-200' },
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

function formatTimestamp(ts) {
  if (!ts) return 'Just now';
  const date = ts.toDate ? ts.toDate() : (ts.seconds ? new Date(ts.seconds * 1000) : new Date(ts));
  return date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function getComplaintSnippet(text) {
  if (!text) return 'No description provided';
  const clean = text.trim();
  if (clean.length > 80) {
    return clean.substring(0, 77) + '...';
  }
  return clean;
}

export default function StaffDashboardPage() {
  const navigate = useNavigate();
  const { currentUser, userProfile, logout } = useAuth();

  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters & search
  const [statusFilter, setStatusFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Selected complaint for details & status modal
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [newStatus, setNewStatus] = useState('');
  const [staffNote, setStaffNote] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateFeedback, setUpdateFeedback] = useState(null);

  // Authenticated department from Firestore profile
  const department = userProfile?.department;

  // Real-time Firestore subscription to department complaints
  useEffect(() => {
    if (!currentUser) {
      setLoading(false);
      return;
    }

    if (!department) {
      setLoading(false);
      setError(new Error('No assigned campus department found in staff profile.'));
      return;
    }

    setLoading(true);
    setError(null);

    const unsubscribe = subscribeToDepartmentComplaints(
      department,
      (items) => {
        setComplaints(items);
        setLoading(false);
        setError(null);

        // If a complaint is currently open in modal, refresh its data live
        setSelectedComplaint((prev) => {
          if (!prev) return null;
          const updated = items.find((c) => (c.ticketId || c.id) === (prev.ticketId || prev.id));
          return updated || prev;
        });
      },
      (err) => {
        console.error('[StaffDashboard] Subscription error:', err);
        setError(err);
        setLoading(false);
      }
    );

    return () => {
      unsubscribe();
    };
  }, [currentUser, department]);

  // Derived real-time statistics
  const stats = useMemo(() => {
    const total = complaints.length;
    const submitted = complaints.filter((c) => c.status === 'Submitted').length;
    const underReview = complaints.filter((c) => c.status === 'Under Review').length;
    const inProgress = complaints.filter(
      (c) => c.status === 'In Progress' || c.status === 'Assigned'
    ).length;
    const resolved = complaints.filter((c) => c.status === 'Resolved').length;

    return { total, submitted, underReview, inProgress, resolved };
  }, [complaints]);

  // Filtered complaints based on search query and status filter
  const filteredComplaints = useMemo(() => {
    let result = complaints;

    if (statusFilter !== 'All') {
      result = result.filter((c) => c.status === statusFilter);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter((c) => {
        const idMatch = (c.ticketId || c.id || '').toLowerCase().includes(q);
        const textMatch = (c.originalComplaint || '').toLowerCase().includes(q);
        const blockMatch = (c.extractedBlock || '').toLowerCase().includes(q);
        const roomMatch = (c.extractedRoom || '').toLowerCase().includes(q);
        return idMatch || textMatch || blockMatch || roomMatch;
      });
    }

    return result;
  }, [complaints, statusFilter, searchQuery]);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login', { replace: true });
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  const openDetailsModal = (complaint) => {
    setSelectedComplaint(complaint);
    setNewStatus(complaint.status || 'Under Review');
    setStaffNote('');
    setUpdateFeedback(null);
  };

  const closeDetailsModal = () => {
    setSelectedComplaint(null);
    setStaffNote('');
    setUpdateFeedback(null);
  };

  const handleStatusUpdate = async (e) => {
    e.preventDefault();
    if (!selectedComplaint) return;

    const ticketId = selectedComplaint.ticketId || selectedComplaint.id;
    if (!newStatus) return;

    setIsUpdating(true);
    setUpdateFeedback(null);

    try {
      // Build appended note with timestamp and staff identity
      let updatedNote = selectedComplaint.staffNote || '';
      if (staffNote.trim()) {
        const dateStr = new Date().toLocaleDateString('en-IN', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        });
        const staffName = userProfile?.fullName || 'Staff Officer';
        const formattedEntry = `[${dateStr} - ${staffName} (${department})]: ${staffNote.trim()}`;
        updatedNote = updatedNote ? `${updatedNote}\n\n${formattedEntry}` : formattedEntry;
      }

      await updateComplaintStatus(ticketId, newStatus, updatedNote);

      setUpdateFeedback({
        type: 'success',
        message: `Complaint #${ticketId} status successfully updated to "${newStatus}".`,
      });
      setStaffNote('');
    } catch (err) {
      console.error('[StaffDashboard] Failed to update status:', err);
      setUpdateFeedback({
        type: 'error',
        message: err.message.includes('permission-denied')
          ? 'Permission Denied: Security rules only allow updates to authorized department staff.'
          : `Failed to update complaint status: ${err.message}`,
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const deptBadge = DEPT_CONFIG[department] || DEPT_CONFIG.Other;
  const DeptIcon = deptBadge.icon;

  return (
    <div className="min-h-screen bg-bg-base text-content-primary flex flex-col font-sans">
      {/* ── Top Header Bar ───────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-border-ui-subtle shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Brand */}
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{
                background: 'linear-gradient(135deg, #1F47E8 0%, #2D56F5 100%)',
                boxShadow: '0 2px 8px rgba(31, 71, 232, 0.25)',
              }}
            >
              <GraduationCap className="w-5 h-5 text-white" aria-hidden="true" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-heading font-extrabold text-content-heading text-[1.125rem] tracking-tight leading-none">
                  CampusResolve <span className="text-brand-blue">AI</span>
                </span>
                <span className="px-2 py-0.5 rounded-full text-[0.6875rem] font-bold bg-blue-100 text-brand-blue uppercase tracking-wide">
                  Staff Portal
                </span>
              </div>
              <span className="text-[0.6875rem] font-medium text-content-muted flex items-center gap-1 mt-0.5">
                <MapPin className="w-2.5 h-2.5 text-brand-blue" />
                LPU Phagwara Campus
              </span>
            </div>
          </div>

          {/* Department Badge & Staff Profile */}
          <div className="flex items-center gap-3 sm:gap-4">
            {/* Authenticated Department Badge */}
            {department && (
              <div
                className={`hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[0.8125rem] font-bold border ${deptBadge.bg} ${deptBadge.color} ${deptBadge.border}`}
              >
                <DeptIcon className="w-3.5 h-3.5" />
                <span>{department} Department</span>
              </div>
            )}

            {/* Staff User Info */}
            <div className="flex items-center gap-2.5 pl-2 border-l border-slate-200">
              <div className="w-8 h-8 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center shadow-sm">
                {(userProfile?.fullName || 'S').charAt(0).toUpperCase()}
              </div>
              <div className="hidden md:flex flex-col text-left">
                <span className="text-[0.8125rem] font-bold text-content-heading leading-tight">
                  {userProfile?.fullName || 'Campus Staff'}
                </span>
                <span className="text-[0.6875rem] text-content-muted leading-tight truncate max-w-[150px]">
                  {currentUser?.email}
                </span>
              </div>
            </div>

            {/* Sign Out Button */}
            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[0.8125rem] font-semibold text-rose-600 bg-rose-50 border border-rose-200 hover:bg-rose-100 transition-colors"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </header>

      {/* ── Main Content Container ───────────────────────────────────── */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Welcome & Department Greeting */}
        <div className="bg-white rounded-2xl border border-border-ui-subtle shadow-card p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-brand-blue uppercase tracking-wider mb-1">
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Live Operational Queue • LPU Campus
            </div>
            <h1 className="font-heading font-extrabold text-content-heading text-[1.625rem] sm:text-[1.875rem] tracking-tight">
              Welcome back, {userProfile?.fullName || 'Officer'}
            </h1>
            <p className="text-[0.875rem] text-content-secondary mt-1">
              Authorized triage and resolution dashboard for the{' '}
              <strong className="text-content-heading">{department}</strong> Department.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-[0.875rem] font-bold border shadow-sm ${deptBadge.bg} ${deptBadge.color} ${deptBadge.border}`}
            >
              <DeptIcon className="w-4 h-4" />
              <span>{department} Department Queue</span>
            </div>
          </div>
        </div>

        {/* ── Statistics Grid ─────────────────────────────────────────── */}
        <section aria-label="Department Statistics" className="grid grid-cols-2 lg:grid-cols-5 gap-3.5 sm:gap-4">
          {/* Total Complaints */}
          <div className="bg-white rounded-xl border border-border-ui-subtle p-4 sm:p-5 shadow-sm">
            <div className="flex items-center justify-between text-content-muted mb-2">
              <span className="text-[0.75rem] font-bold uppercase tracking-wider">Total</span>
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                <FileText className="w-4 h-4" />
              </div>
            </div>
            <div className="text-[1.625rem] font-heading font-extrabold text-content-heading">
              {stats.total}
            </div>
            <p className="text-[0.6875rem] text-content-muted mt-1">All tickets in department</p>
          </div>

          {/* Pending Triage (Submitted) */}
          <div className="bg-white rounded-xl border border-border-ui-subtle p-4 sm:p-5 shadow-sm">
            <div className="flex items-center justify-between text-content-muted mb-2">
              <span className="text-[0.75rem] font-bold uppercase tracking-wider">Pending Triage</span>
              <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                <Clock className="w-4 h-4" />
              </div>
            </div>
            <div className="text-[1.625rem] font-heading font-extrabold text-amber-700">
              {stats.submitted}
            </div>
            <p className="text-[0.6875rem] text-content-muted mt-1">Awaiting review</p>
          </div>

          {/* Under Review */}
          <div className="bg-white rounded-xl border border-border-ui-subtle p-4 sm:p-5 shadow-sm">
            <div className="flex items-center justify-between text-content-muted mb-2">
              <span className="text-[0.75rem] font-bold uppercase tracking-wider">Under Review</span>
              <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <RefreshCw className="w-4 h-4" />
              </div>
            </div>
            <div className="text-[1.625rem] font-heading font-extrabold text-indigo-700">
              {stats.underReview}
            </div>
            <p className="text-[0.6875rem] text-content-muted mt-1">Being assessed</p>
          </div>

          {/* In Progress */}
          <div className="bg-white rounded-xl border border-border-ui-subtle p-4 sm:p-5 shadow-sm">
            <div className="flex items-center justify-between text-content-muted mb-2">
              <span className="text-[0.75rem] font-bold uppercase tracking-wider">In Progress</span>
              <div className="w-8 h-8 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center">
                <Wrench className="w-4 h-4" />
              </div>
            </div>
            <div className="text-[1.625rem] font-heading font-extrabold text-orange-700">
              {stats.inProgress}
            </div>
            <p className="text-[0.6875rem] text-content-muted mt-1">Assigned or active</p>
          </div>

          {/* Resolved */}
          <div className="bg-white rounded-xl border border-border-ui-subtle p-4 sm:p-5 shadow-sm col-span-2 lg:col-span-1">
            <div className="flex items-center justify-between text-content-muted mb-2">
              <span className="text-[0.75rem] font-bold uppercase tracking-wider">Resolved</span>
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <CheckCircle2 className="w-4 h-4" />
              </div>
            </div>
            <div className="text-[1.625rem] font-heading font-extrabold text-emerald-700">
              {stats.resolved}
            </div>
            <p className="text-[0.6875rem] text-content-muted mt-1">Successfully closed</p>
          </div>
        </section>

        {/* ── Complaint Management Table Card ─────────────────────────── */}
        <section className="bg-white rounded-2xl border border-border-ui-subtle shadow-card overflow-hidden">
          {/* Table Header: Filters & Search */}
          <div className="p-5 sm:p-6 border-b border-border-ui-subtle space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="font-heading font-extrabold text-content-heading text-[1.125rem] tracking-tight">
                  {department} Department Complaints
                </h2>
                <p className="text-[0.8125rem] text-content-secondary mt-0.5">
                  Real-time synchronization with Cloud Firestore • Showing {filteredComplaints.length} of {complaints.length} tickets
                </p>
              </div>

              {/* Search Field */}
              <div className="relative w-full sm:w-72">
                <Search className="w-4 h-4 text-content-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search ID, text, room..."
                  className="w-full pl-9 pr-3.5 py-2 rounded-xl text-[0.875rem] border border-border-ui-default bg-slate-50/50 focus:bg-white outline-none transition-all focus:border-brand-blue focus:ring-2 focus:ring-blue-100"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Status Filter Tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-[0.8125rem]">
              <span className="text-content-muted font-bold text-xs uppercase tracking-wider mr-1 flex items-center gap-1">
                <Filter className="w-3.5 h-3.5" />
                Filter:
              </span>
              {['All', 'Submitted', 'Under Review', 'Assigned', 'In Progress', 'Resolved', 'Rejected'].map(
                (status) => {
                  const isSelected = statusFilter === status;
                  return (
                    <button
                      key={status}
                      onClick={() => setStatusFilter(status)}
                      className={`px-3 py-1.5 rounded-lg font-semibold transition-all whitespace-nowrap ${
                        isSelected
                          ? 'bg-brand-blue text-white shadow-sm'
                          : 'bg-slate-100 text-content-secondary hover:bg-slate-200'
                      }`}
                    >
                      {status}
                      {status !== 'All' && (
                        <span className={`ml-1.5 text-xs ${isSelected ? 'text-blue-100' : 'text-slate-500'}`}>
                          ({complaints.filter((c) => c.status === status).length})
                        </span>
                      )}
                    </button>
                  );
                }
              )}
            </div>
          </div>

          {/* Table Body / States */}
          {loading ? (
            <div className="py-20 text-center">
              <Loader2 className="w-8 h-8 text-brand-blue animate-spin mx-auto mb-3" />
              <p className="text-sm font-semibold text-content-secondary">
                Subscribing to {department} complaints queue...
              </p>
            </div>
          ) : error ? (
            <div className="p-8 text-center bg-rose-50/50">
              <ShieldAlert className="w-10 h-10 text-rose-500 mx-auto mb-3" />
              <h3 className="text-base font-bold text-rose-900">Access Restricted</h3>
              <p className="text-sm text-rose-700 max-w-md mx-auto mt-1">
                {error.code === 'permission-denied'
                  ? 'Cloud Firestore Security Rules strictly restrict access to authorized departmental staff only.'
                  : error.message}
              </p>
            </div>
          ) : filteredComplaints.length === 0 ? (
            <div className="py-16 text-center">
              <Inbox className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <h3 className="text-base font-bold text-content-heading">No Complaints Found</h3>
              <p className="text-sm text-content-muted max-w-sm mx-auto mt-1">
                {complaints.length === 0
                  ? `There are currently no active complaints logged for the ${department} Department.`
                  : 'No complaints match your current search or status filter.'}
              </p>
              {statusFilter !== 'All' && (
                <button
                  onClick={() => setStatusFilter('All')}
                  className="mt-3 text-xs font-bold text-brand-blue hover:underline"
                >
                  Clear Status Filter
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/75 border-b border-border-ui-subtle text-[0.75rem] font-bold text-content-muted uppercase tracking-wider">
                    <th className="py-3 px-4">Ticket ID</th>
                    <th className="py-3 px-4">Complaint Description</th>
                    <th className="py-3 px-4">Location</th>
                    <th className="py-3 px-4">Submitted</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-ui-subtle text-[0.875rem]">
                  {filteredComplaints.map((item) => {
                    const ticketId = item.ticketId || item.id;
                    const statusConf = STATUS_CONFIG[item.status] || STATUS_CONFIG.Submitted;
                    const StatusIcon = statusConf.icon;

                    // Formatted Location: Show only explicit details
                    const locationParts = [];
                    if (item.extractedBlock) locationParts.push(item.extractedBlock);
                    if (item.extractedFloor) locationParts.push(item.extractedFloor);
                    if (item.extractedRoom) locationParts.push(item.extractedRoom);
                    const locationStr = locationParts.length > 0 ? locationParts.join(' • ') : '—';

                    return (
                      <tr
                        key={ticketId}
                        className="hover:bg-blue-50/30 transition-colors cursor-pointer group"
                        onClick={() => openDetailsModal(item)}
                      >
                        {/* Ticket ID */}
                        <td className="py-3.5 px-4 font-mono font-bold text-brand-blue text-[0.8125rem] whitespace-nowrap">
                          {ticketId}
                        </td>

                        {/* Complaint Preview */}
                        <td className="py-3.5 px-4 max-w-xs sm:max-w-md">
                          <p className="font-medium text-content-heading line-clamp-1">
                            {getComplaintSnippet(item.originalComplaint)}
                          </p>
                          {item.staffNote && (
                            <span className="inline-flex items-center gap-1 text-[0.6875rem] text-indigo-600 font-semibold mt-0.5">
                              <MessageSquare className="w-3 h-3" /> Has Staff Note
                            </span>
                          )}
                        </td>

                        {/* Location */}
                        <td className="py-3.5 px-4 whitespace-nowrap text-[0.8125rem] text-content-secondary">
                          <div className="flex items-center gap-1.5">
                            <Building2 className="w-3.5 h-3.5 text-slate-400" />
                            <span>{locationStr}</span>
                          </div>
                        </td>

                        {/* Submitted Date */}
                        <td className="py-3.5 px-4 whitespace-nowrap text-[0.8125rem] text-content-muted">
                          {formatTimestamp(item.createdAt)}
                        </td>

                        {/* Status Badge */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[0.75rem] font-bold border ${statusConf.bg} ${statusConf.color} ${statusConf.border}`}
                          >
                            <StatusIcon className="w-3 h-3" />
                            {item.status || 'Submitted'}
                          </span>
                        </td>

                        {/* Action */}
                        <td className="py-3.5 px-4 text-right whitespace-nowrap">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              openDetailsModal(item);
                            }}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold text-brand-blue bg-blue-50 border border-blue-200 group-hover:bg-brand-blue group-hover:text-white transition-all"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            Manage
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>

      {/* ── Complaint Details & Status Management Modal ───────────────── */}
      {selectedComplaint && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn"
          onClick={closeDetailsModal}
        >
          <div
            className="bg-white rounded-2xl border border-border-ui-subtle shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-border-ui-subtle flex items-center justify-between bg-slate-50/80">
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-sm text-brand-blue">
                  {selectedComplaint.ticketId || selectedComplaint.id}
                </span>
                <span
                  className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold border ${deptBadge.bg} ${deptBadge.color} ${deptBadge.border}`}
                >
                  <DeptIcon className="w-3 h-3" />
                  {selectedComplaint.department}
                </span>
              </div>
              <button
                onClick={closeDetailsModal}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Scrollable Body */}
            <div className="p-6 overflow-y-auto space-y-6">
              {/* Feedback Alert */}
              {updateFeedback && (
                <div
                  className={`p-3.5 rounded-xl text-sm flex items-start gap-2 border ${
                    updateFeedback.type === 'success'
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                      : 'bg-rose-50 border-rose-200 text-rose-800'
                  }`}
                >
                  {updateFeedback.type === 'success' ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  )}
                  <span>{updateFeedback.message}</span>
                </div>
              )}

              {/* Status Update Form (Staff Action) */}
              <div className="p-4 rounded-xl bg-blue-50/60 border border-blue-200 space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-brand-blue flex items-center gap-1.5">
                  <UserCheck className="w-3.5 h-3.5" />
                  Manage Complaint Status
                </h3>

                <form onSubmit={handleStatusUpdate} className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-content-heading mb-1">
                        Select New Status
                      </label>
                      <select
                        value={newStatus}
                        onChange={(e) => setNewStatus(e.target.value)}
                        disabled={isUpdating}
                        className="w-full px-3 py-2 rounded-xl text-sm font-semibold bg-white border border-border-ui-default focus:border-brand-blue outline-none"
                      >
                        {COMPLAINT_STATUSES.map((st) => (
                          <option key={st} value={st}>
                            {st}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="flex items-end">
                      <button
                        type="submit"
                        disabled={isUpdating || newStatus === selectedComplaint.status && !staffNote.trim()}
                        className="w-full py-2 px-4 rounded-xl text-sm font-bold text-white bg-brand-blue hover:bg-blue-700 transition-colors shadow-sm disabled:opacity-60 flex items-center justify-center gap-1.5"
                      >
                        {isUpdating ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Updating...
                          </>
                        ) : (
                          <>
                            <Send className="w-4 h-4" />
                            Save Status Update
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-content-heading mb-1">
                      Add Staff Resolution Note (Optional)
                    </label>
                    <textarea
                      rows={2}
                      value={staffNote}
                      onChange={(e) => setStaffNote(e.target.value)}
                      placeholder="e.g. Technician dispatched to Block 14 washroom to replace broken pipe valve."
                      disabled={isUpdating}
                      className="w-full p-2.5 rounded-xl text-sm border border-border-ui-default bg-white focus:border-brand-blue outline-none transition-all placeholder:text-slate-400"
                    />
                    <p className="text-[0.6875rem] text-content-muted mt-1">
                      Notes will be appended with your name and timestamp, visible to campus records.
                    </p>
                  </div>
                </form>
              </div>

              {/* Verbatim Original Complaint */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-content-muted mb-1.5 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-brand-blue" />
                  Original Complaint (Verbatim)
                </h4>
                <div className="p-3.5 rounded-xl bg-slate-50 border border-border-ui-subtle text-sm text-content-primary leading-relaxed font-mono">
                  {selectedComplaint.originalComplaint}
                </div>
              </div>

              {/* Extracted Location Details */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-content-muted mb-2 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-brand-blue" />
                  Campus Location Information
                </h4>
                <div className="grid grid-cols-3 gap-3">
                  <div className="p-3 rounded-xl bg-slate-50 border border-border-ui-subtle">
                    <span className="text-[0.6875rem] font-bold text-content-muted uppercase">Block</span>
                    <p className="text-sm font-bold text-content-heading mt-0.5">
                      {selectedComplaint.extractedBlock || '—'}
                    </p>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 border border-border-ui-subtle">
                    <span className="text-[0.6875rem] font-bold text-content-muted uppercase">Floor</span>
                    <p className="text-sm font-bold text-content-heading mt-0.5">
                      {selectedComplaint.extractedFloor || '—'}
                    </p>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 border border-border-ui-subtle">
                    <span className="text-[0.6875rem] font-bold text-content-muted uppercase">Room</span>
                    <p className="text-sm font-bold text-content-heading mt-0.5">
                      {selectedComplaint.extractedRoom || '—'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Staff Notes History */}
              {selectedComplaint.staffNote && (
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-content-muted mb-1.5 flex items-center gap-1.5">
                    <MessageSquare className="w-3.5 h-3.5 text-indigo-600" />
                    Internal Staff Notes Log
                  </h4>
                  <div className="p-3.5 rounded-xl bg-indigo-50/50 border border-indigo-100 text-xs text-indigo-950 whitespace-pre-wrap font-sans leading-relaxed">
                    {selectedComplaint.staffNote}
                  </div>
                </div>
              )}

              {/* Diagnostic / AI Metadata */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-border-ui-subtle text-xs space-y-1.5 text-content-secondary">
                <div className="flex items-center justify-between">
                  <span className="font-semibold">Submitter:</span>
                  <span className="font-mono">{selectedComplaint.userEmail || 'Anonymous'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-semibold">Classification Method:</span>
                  <span className="font-mono">{selectedComplaint.classificationMethod || 'ai'}</span>
                </div>
                {selectedComplaint.reasonForClassification && (
                  <div className="pt-1 border-t border-slate-200">
                    <span className="font-semibold block text-slate-700">Classification Reason:</span>
                    <span className="text-slate-600">{selectedComplaint.reasonForClassification}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3 border-t border-border-ui-subtle bg-slate-50 flex items-center justify-between">
              <span className="text-xs text-content-muted">
                Last Updated: {formatTimestamp(selectedComplaint.updatedAt || selectedComplaint.createdAt)}
              </span>
              <button
                onClick={closeDetailsModal}
                className="px-4 py-1.5 rounded-lg text-xs font-bold text-content-secondary hover:bg-slate-200 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

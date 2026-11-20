import { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  GraduationCap,
  PlusCircle,
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
  Wrench,
  Zap,
  Wifi,
  UtensilsCrossed,
  BookOpen,
  HelpCircle,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext.jsx';
import { subscribeToUserComplaints } from '../services/complaintsService.js';
import { isFirebaseConfigured } from '../lib/firebase.js';
import ComplaintDetailsModal from '../components/ComplaintDetailsModal.jsx';

const DEPT_BADGES = {
  Plumbing: { icon: Wrench, color: 'text-blue-700', bg: 'bg-blue-50', border: 'border-blue-200' },
  Electrical: { icon: Zap, color: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-200' },
  'Wi-Fi': { icon: Wifi, color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200' },
  Mess: { icon: UtensilsCrossed, color: 'text-rose-700', bg: 'bg-rose-50', border: 'border-rose-200' },
  Academic: { icon: BookOpen, color: 'text-purple-700', bg: 'bg-purple-50', border: 'border-purple-200' },
  Other: { icon: HelpCircle, color: 'text-slate-700', bg: 'bg-slate-100', border: 'border-slate-200' },
};

const STATUS_BADGES = {
  Submitted: { icon: Clock, color: 'text-blue-700', bg: 'bg-blue-50', border: 'border-blue-200' },
  'Under Review': { icon: RefreshCw, color: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-200' },
  Assigned: { icon: Clock, color: 'text-indigo-700', bg: 'bg-indigo-50', border: 'border-indigo-200' },
  'In Progress': { icon: RefreshCw, color: 'text-orange-700', bg: 'bg-orange-50', border: 'border-orange-200' },
  Resolved: { icon: CheckCircle2, color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200' },
  Rejected: { icon: XCircle, color: 'text-rose-700', bg: 'bg-rose-50', border: 'border-rose-200' },
};

function formatTimestamp(ts) {
  if (!ts) return 'Just now';
  const date = ts.toDate ? ts.toDate() : new Date(ts);
  return date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function getComplaintTitle(text) {
  if (!text) return 'Campus Grievance';
  const clean = text.trim();
  const firstSentence = clean.split(/[.?!;\n]/)[0].trim();
  if (firstSentence.length > 60) {
    return firstSentence.substring(0, 57) + '...';
  }
  return firstSentence || clean.substring(0, 50);
}

export default function StudentDashboardPage() {
  const navigate = useNavigate();
  const { currentUser, userProfile, logout } = useAuth();

  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Selected complaint for details modal
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  // Filters & search
  const [statusFilter, setStatusFilter] = useState('All');
  const [deptFilter, setDeptFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  // If staff user visits student dashboard, redirect to staff dashboard
  useEffect(() => {
    if (userProfile?.role === 'staff') {
      navigate('/staff-dashboard', { replace: true });
    }
  }, [userProfile, navigate]);

  // Real-time subscription to complaints
  useEffect(() => {
    if (!currentUser) {
      setLoading(false);
      return;
    }

    if (!isFirebaseConfigured) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const unsubscribe = subscribeToUserComplaints(
      currentUser.uid,
      (data) => {
        setComplaints(data);
        setLoading(false);
        // Live-refresh currently selected complaint in modal
        setSelectedComplaint((prev) => {
          if (!prev) return null;
          const updated = data.find((c) => (c.ticketId || c.id) === (prev.ticketId || prev.id));
          return updated || prev;
        });
      },
      (err) => {
        console.error('[StudentDashboard] Error fetching complaints:', err);
        setError(err.message || 'Failed to load your complaints.');
        setLoading(false);
      }
    );

    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, [currentUser]);

  // Dynamic Statistics Calculation (never hardcoded!)
  const stats = useMemo(() => {
    const total = complaints.length;
    let pending = 0;
    let inProgress = 0;
    let resolved = 0;

    for (const c of complaints) {
      const s = c.status;
      if (s === 'Submitted' || s === 'Under Review' || s === 'Assigned') {
        pending++;
      } else if (s === 'In Progress') {
        inProgress++;
      } else if (s === 'Resolved') {
        resolved++;
      }
    }

    return { total, pending, inProgress, resolved };
  }, [complaints]);

  // Filtered complaints list
  const filteredComplaints = useMemo(() => {
    return complaints.filter((c) => {
      // 1. Status Filter
      if (statusFilter !== 'All') {
        if (statusFilter === 'Pending') {
          if (!['Submitted', 'Under Review', 'Assigned'].includes(c.status)) return false;
        } else if (c.status !== statusFilter) {
          return false;
        }
      }

      // 2. Department Filter
      if (deptFilter !== 'All' && c.department !== deptFilter) {
        return false;
      }

      // 3. Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTicket = (c.ticketId || '').toLowerCase().includes(q);
        const matchesText = (c.originalComplaint || '').toLowerCase().includes(q);
        const matchesBlock = (c.extractedBlock || '').toLowerCase().includes(q);
        const matchesRoom = (c.extractedRoom || '').toLowerCase().includes(q);
        if (!matchesTicket && !matchesText && !matchesBlock && !matchesRoom) {
          return false;
        }
      }

      return true;
    });
  }, [complaints, statusFilter, deptFilter, searchQuery]);

  const handleOpenDetails = (complaint) => {
    setSelectedComplaint(complaint);
    setIsDetailsOpen(true);
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const studentDisplayName =
    userProfile?.fullName ||
    currentUser?.displayName ||
    currentUser?.email?.split('@')[0] ||
    'Student';

  return (
    <div className="min-h-screen bg-bg-base gradient-hero flex flex-col py-8 px-4 sm:px-6 lg:px-8">

      {/* Complaint Details Modal */}
      <ComplaintDetailsModal
        isOpen={isDetailsOpen}
        onClose={() => setIsDetailsOpen(false)}
        complaint={selectedComplaint}
      />

      {/* Top Header / Brand Bar */}
      <header className="max-w-6xl mx-auto w-full flex items-center justify-between mb-8">
        <Link
          to="/"
          className="flex items-center gap-2.5 group outline-none"
          aria-label="CampusResolve AI — Home"
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
              <MapPin className="w-2.5 h-2.5 text-brand-blue" />
              LPU Phagwara Campus
            </span>
          </div>
        </Link>

        {/* User Badge & Actions */}
        <div className="flex items-center gap-2.5">
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-200">
            <GraduationCap className="w-3.5 h-3.5 text-brand-blue" />
            <span className="text-[0.75rem] font-bold text-brand-blue">
              Student Portal
            </span>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[0.75rem] font-semibold text-slate-600 border border-slate-200 hover:border-rose-300 hover:text-rose-600 transition-all bg-white"
          >
            <LogOut className="w-3.5 h-3.5" />
            Sign Out
          </button>
        </div>
      </header>

      {/* Main Dashboard Container */}
      <main className="flex-1 max-w-6xl mx-auto w-full space-y-6">

        {/* 1. Welcome Section */}
        <div className="bg-white rounded-2xl border border-border-ui-subtle shadow-card p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-blue-50 border border-blue-200 text-brand-blue text-[0.6875rem] font-bold uppercase tracking-wider mb-2">
              <MapPin className="w-3 h-3 text-brand-blue" />
              Lovely Professional University (LPU), Phagwara
            </div>
            <h1 className="font-heading font-extrabold text-content-heading text-[1.75rem] sm:text-[2rem] tracking-tight">
              Welcome back, {studentDisplayName}!
            </h1>
            <p className="text-[0.9375rem] text-content-secondary mt-1 leading-relaxed">
              Track the live resolution status of your campus grievances across hostels, academic blocks, mess, and campus utilities.
            </p>
          </div>

          {/* Quick Action: Submit New Complaint */}
          <Link
            to="/submit-complaint"
            className="w-full sm:w-auto px-6 py-3.5 rounded-xl font-bold text-white text-[0.9375rem] transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-2 shadow-brand hover:shadow-brand-hover shrink-0"
            style={{
              background: 'linear-gradient(90deg, #1F47E8 0%, #2D56F5 100%)',
            }}
          >
            <PlusCircle className="w-4 h-4" />
            Submit New Complaint
          </Link>
        </div>

        {/* Firebase unconfigured warning banner */}
        {!isFirebaseConfigured && (
          <div className="p-4 rounded-xl bg-amber-50 border border-amber-300 flex items-start gap-3">
            <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-[0.875rem] font-bold text-amber-900">
                Firebase Credentials Awaiting Configuration
              </p>
              <p className="text-[0.8125rem] text-amber-800 mt-0.5">
                The Student Dashboard is ready to stream real Firestore complaints. Add your Firebase credentials to <code className="bg-amber-100 px-1 rounded text-xs">.env.local</code> to activate live persistence.
              </p>
            </div>
          </div>
        )}

        {/* 2. Four Statistics Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Total */}
          <div className="bg-white rounded-2xl border border-border-ui-subtle shadow-card p-5 transition-all hover:border-slate-300">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[0.75rem] font-bold uppercase tracking-wider text-content-muted">
                Total Filed
              </span>
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-brand-blue flex items-center justify-center border border-blue-100">
                <FileText className="w-4 h-4" />
              </div>
            </div>
            <div className="font-heading font-extrabold text-[2rem] text-content-heading leading-none">
              {loading ? '—' : stats.total}
            </div>
            <p className="text-[0.75rem] text-content-secondary mt-2">
              All submitted campus grievances
            </p>
          </div>

          {/* Card 2: Pending */}
          <div className="bg-white rounded-2xl border border-border-ui-subtle shadow-card p-5 transition-all hover:border-amber-300">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[0.75rem] font-bold uppercase tracking-wider text-amber-700">
                Pending Triage
              </span>
              <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center border border-amber-200">
                <Clock className="w-4 h-4" />
              </div>
            </div>
            <div className="font-heading font-extrabold text-[2rem] text-amber-800 leading-none">
              {loading ? '—' : stats.pending}
            </div>
            <p className="text-[0.75rem] text-amber-700/80 mt-2">
              Submitted, Under Review or Assigned
            </p>
          </div>

          {/* Card 3: In Progress */}
          <div className="bg-white rounded-2xl border border-border-ui-subtle shadow-card p-5 transition-all hover:border-orange-300">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[0.75rem] font-bold uppercase tracking-wider text-orange-700">
                In Progress
              </span>
              <div className="w-8 h-8 rounded-lg bg-orange-50 text-orange-700 flex items-center justify-center border border-orange-200">
                <RefreshCw className="w-4 h-4" />
              </div>
            </div>
            <div className="font-heading font-extrabold text-[2rem] text-orange-800 leading-none">
              {loading ? '—' : stats.inProgress}
            </div>
            <p className="text-[0.75rem] text-orange-700/80 mt-2">
              Active maintenance or field repair
            </p>
          </div>

          {/* Card 4: Resolved */}
          <div className="bg-white rounded-2xl border border-border-ui-subtle shadow-card p-5 transition-all hover:border-emerald-300">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[0.75rem] font-bold uppercase tracking-wider text-emerald-700">
                Resolved
              </span>
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-200">
                <CheckCircle2 className="w-4 h-4" />
              </div>
            </div>
            <div className="font-heading font-extrabold text-[2rem] text-emerald-800 leading-none">
              {loading ? '—' : stats.resolved}
            </div>
            <p className="text-[0.75rem] text-emerald-700/80 mt-2">
              Successfully addressed & closed
            </p>
          </div>
        </div>

        {/* 3. Recent Complaints Table Section */}
        <div className="bg-white rounded-2xl border border-border-ui-subtle shadow-card overflow-hidden">
          
          {/* Table Header & Controls Bar */}
          <div className="p-6 border-b border-border-ui-subtle flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <h2 className="font-heading font-extrabold text-content-heading text-[1.25rem]">
                Recent Grievances
              </h2>
              <p className="text-[0.8125rem] text-content-secondary mt-0.5">
                Real-time updates directly synced with campus maintenance divisions
              </p>
            </div>

            {/* Filter and Search Bar */}
            <div className="flex flex-wrap items-center gap-2.5">
              {/* Search input */}
              <div className="relative min-w-[200px] flex-1 sm:flex-initial">
                <Search className="w-3.5 h-3.5 text-content-muted absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search tickets, text, block..."
                  className="w-full pl-8 pr-3 py-1.5 rounded-xl text-[0.8125rem] text-content-primary bg-slate-50 border border-border-ui-default placeholder:text-content-muted outline-none focus:bg-white focus:border-brand-blue"
                />
              </div>

              {/* Status Filter Dropdown */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-1.5 rounded-xl text-[0.8125rem] font-semibold text-content-secondary bg-slate-50 border border-border-ui-default outline-none focus:border-brand-blue focus:bg-white"
              >
                <option value="All">All Statuses</option>
                <option value="Pending">Pending Triage</option>
                <option value="In Progress">In Progress</option>
                <option value="Resolved">Resolved</option>
                <option value="Rejected">Rejected</option>
              </select>

              {/* Department Filter Dropdown */}
              <select
                value={deptFilter}
                onChange={(e) => setDeptFilter(e.target.value)}
                className="px-3 py-1.5 rounded-xl text-[0.8125rem] font-semibold text-content-secondary bg-slate-50 border border-border-ui-default outline-none focus:border-brand-blue focus:bg-white"
              >
                <option value="All">All Departments</option>
                <option value="Plumbing">Plumbing</option>
                <option value="Electrical">Electrical</option>
                <option value="Wi-Fi">Wi-Fi</option>
                <option value="Mess">Mess</option>
                <option value="Academic">Academic</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="py-20 flex flex-col items-center justify-center text-center">
              <Loader2 className="w-8 h-8 text-brand-blue animate-spin mb-3" />
              <p className="text-[0.875rem] font-semibold text-content-heading">
                Syncing your grievances with Firestore...
              </p>
              <p className="text-[0.75rem] text-content-muted mt-1">
                LPU Phagwara Campus Real-time Stream
              </p>
            </div>
          )}

          {/* Error State */}
          {!loading && error && (
            <div className="p-8 text-center">
              <AlertTriangle className="w-8 h-8 text-rose-500 mx-auto mb-2" />
              <h3 className="text-[0.9375rem] font-bold text-rose-800">
                Failed to Load Grievance Records
              </h3>
              <p className="text-[0.8125rem] text-rose-700 mt-1 max-w-md mx-auto">
                {error}
              </p>
            </div>
          )}

          {/* Empty State (0 Complaints Ever) */}
          {!loading && !error && complaints.length === 0 && (
            <div className="py-16 px-6 text-center">
              <div className="w-16 h-16 rounded-2xl bg-blue-50 border border-blue-200 text-brand-blue flex items-center justify-center mx-auto mb-4 shadow-xs">
                <Inbox className="w-8 h-8" />
              </div>
              <h3 className="font-heading font-extrabold text-[1.25rem] text-content-heading mb-1.5">
                No Complaints Filed Yet
              </h3>
              <p className="text-[0.875rem] text-content-secondary max-w-md mx-auto mb-6 leading-relaxed">
                You haven't submitted any grievances for Lovely Professional University. Facing an issue with Wi-Fi, electricity, washrooms, or mess food?
              </p>
              <Link
                to="/submit-complaint"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-white text-[0.875rem] shadow-brand hover:shadow-brand-hover transition-all"
                style={{
                  background: 'linear-gradient(90deg, #1F47E8 0%, #2D56F5 100%)',
                }}
              >
                <PlusCircle className="w-4 h-4" />
                Submit Your First Complaint
              </Link>
            </div>
          )}

          {/* Empty Filter State (Complaints exist but none match filter) */}
          {!loading && !error && complaints.length > 0 && filteredComplaints.length === 0 && (
            <div className="py-12 px-6 text-center">
              <Filter className="w-8 h-8 text-content-muted mx-auto mb-2" />
              <h3 className="text-[0.9375rem] font-bold text-content-heading">
                No matching grievances found
              </h3>
              <p className="text-[0.8125rem] text-content-secondary mt-1">
                Try adjusting your search query, status, or department filter.
              </p>
              <button
                type="button"
                onClick={() => {
                  setStatusFilter('All');
                  setDeptFilter('All');
                  setSearchQuery('');
                }}
                className="mt-3 text-[0.75rem] font-bold text-brand-blue hover:underline"
              >
                Reset all filters
              </button>
            </div>
          )}

          {/* 4. Table Layout (Desktop & Tablet) */}
          {!loading && !error && filteredComplaints.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-border-ui-subtle text-[0.6875rem] font-bold text-content-muted uppercase tracking-wider">
                    <th className="py-3.5 px-5">Ticket ID</th>
                    <th className="py-3.5 px-4">Complaint Description</th>
                    <th className="py-3.5 px-4">Department</th>
                    <th className="py-3.5 px-4">Submitted</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-ui-subtle text-[0.875rem]">
                  {filteredComplaints.map((item) => {
                    const deptBadge = DEPT_BADGES[item.department] || DEPT_BADGES.Other;
                    const DeptIcon = deptBadge.icon;
                    const statusBadge = STATUS_BADGES[item.status] || STATUS_BADGES.Submitted;
                    const StatusIcon = statusBadge.icon;
                    const title = getComplaintTitle(item.originalComplaint);

                    return (
                      <tr
                        key={item.id}
                        onClick={() => handleOpenDetails(item)}
                        className="hover:bg-blue-50/40 cursor-pointer transition-colors group"
                      >
                        {/* Ticket ID */}
                        <td className="py-4 px-5">
                          <code className="text-[0.75rem] font-bold text-brand-blue bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-md tracking-wider">
                            {item.ticketId || item.id}
                          </code>
                        </td>

                        {/* Title & Excerpt */}
                        <td className="py-4 px-4 max-w-xs sm:max-w-sm">
                          <p className="font-bold text-content-heading truncate group-hover:text-brand-blue transition-colors">
                            {title}
                          </p>
                          <div className="flex items-center gap-2 mt-0.5 text-[0.75rem] text-content-muted">
                            {item.extractedBlock && (
                              <span className="flex items-center gap-0.5">
                                <Building2 className="w-3 h-3" /> {item.extractedBlock}
                              </span>
                            )}
                            {item.extractedRoom && (
                              <span>• {item.extractedRoom}</span>
                            )}
                            {item.needsHumanReview && (
                              <span className="inline-flex items-center gap-0.5 text-amber-700 font-semibold text-[0.6875rem]">
                                • Review needed
                              </span>
                            )}
                            {item.staffNote && (
                              <span className="inline-flex items-center gap-0.5 text-brand-blue font-semibold text-[0.6875rem]">
                                • Staff note
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Department */}
                        <td className="py-4 px-4">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[0.75rem] font-bold border ${deptBadge.bg} ${deptBadge.color} ${deptBadge.border}`}
                          >
                            <DeptIcon className="w-3.5 h-3.5" />
                            {item.department}
                          </span>
                        </td>

                        {/* Submitted Date */}
                        <td className="py-4 px-4 text-[0.8125rem] text-content-secondary whitespace-nowrap">
                          {formatTimestamp(item.createdAt)}
                        </td>

                        {/* Current Status */}
                        <td className="py-4 px-4 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[0.75rem] font-bold border ${statusBadge.bg} ${statusBadge.color} ${statusBadge.border}`}
                          >
                            <StatusIcon className="w-3.5 h-3.5" />
                            {item.status}
                          </span>
                        </td>

                        {/* Action: View Details */}
                        <td className="py-4 px-5 text-right whitespace-nowrap">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenDetails(item);
                            }}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[0.75rem] font-bold text-brand-blue border border-blue-200 bg-white hover:bg-brand-blue hover:text-white transition-all shadow-xs"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            View Details
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

        </div>

      </main>

      {/* Footer */}
      <footer className="text-center text-[0.75rem] text-content-muted mt-8">
        CampusResolve AI · Lovely Professional University (LPU), Phagwara Campus · Grievance System
      </footer>
    </div>
  );
}

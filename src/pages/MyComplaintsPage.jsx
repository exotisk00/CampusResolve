import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  MapPin,
  FileText,
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
  Loader2,
  LogOut,
  PlusCircle,
  ShieldAlert,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext.jsx';
import { getComplaintsByUser } from '../services/complaintsService.js';
import { isFirebaseConfigured } from '../lib/firebase.js';

const DEPT_ICONS = {
  Plumbing: { icon: Wrench, color: 'text-blue-600', bg: 'bg-blue-50' },
  Electrical: { icon: Zap, color: 'text-amber-600', bg: 'bg-amber-50' },
  'Wi-Fi': { icon: Wifi, color: 'text-emerald-600', bg: 'bg-emerald-50' },
  Mess: { icon: UtensilsCrossed, color: 'text-rose-600', bg: 'bg-rose-50' },
  Academic: { icon: BookOpen, color: 'text-purple-600', bg: 'bg-purple-50' },
  Other: { icon: HelpCircle, color: 'text-slate-600', bg: 'bg-slate-100' },
};

const STATUS_CONFIG = {
  Submitted: { icon: Clock, color: 'text-blue-700', bg: 'bg-blue-50', border: 'border-blue-200' },
  'Under Review': { icon: RefreshCw, color: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-200' },
  Assigned: { icon: FileText, color: 'text-indigo-700', bg: 'bg-indigo-50', border: 'border-indigo-200' },
  'In Progress': { icon: RefreshCw, color: 'text-orange-700', bg: 'bg-orange-50', border: 'border-orange-200' },
  Resolved: { icon: CheckCircle2, color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200' },
  Rejected: { icon: XCircle, color: 'text-rose-700', bg: 'bg-rose-50', border: 'border-rose-200' },
};

function formatTimestamp(ts) {
  if (!ts) return 'Unknown date';
  const date = ts.toDate ? ts.toDate() : new Date(ts);
  return date.toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

export default function MyComplaintsPage() {
  const navigate = useNavigate();
  const { currentUser, userProfile, logout } = useAuth();

  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  async function fetchComplaints() {
    if (!currentUser) return;
    setLoading(true);
    setError(null);
    try {
      const data = await getComplaintsByUser(currentUser.uid);
      setComplaints(data);
    } catch (err) {
      setError(err.message || 'Failed to load complaints.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (isFirebaseConfigured && currentUser) {
      fetchComplaints();
    } else {
      setLoading(false);
    }
  }, [currentUser]);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-bg-base gradient-hero flex flex-col py-8 px-4 sm:px-6 lg:px-8">

      {/* Top Nav */}
      <header className="max-w-4xl mx-auto w-full flex items-center justify-between mb-8">
        <Link
          to="/submit-complaint"
          className="inline-flex items-center gap-2 text-[0.875rem] font-semibold text-content-secondary hover:text-brand-blue transition-colors group"
        >
          <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
          Submit Complaint
        </Link>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-200">
            <MapPin className="w-3.5 h-3.5 text-brand-blue" />
            <span className="text-[0.75rem] font-bold text-brand-blue">LPU Phagwara Campus</span>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[0.75rem] font-semibold text-slate-600 border border-slate-200 hover:border-rose-300 hover:text-rose-600 transition-all"
          >
            <LogOut className="w-3.5 h-3.5" />
            Sign Out
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-4xl mx-auto w-full">

        {/* Page Header */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="font-heading font-extrabold text-content-heading text-[1.75rem] tracking-tight">
              My Complaints
            </h1>
            <p className="text-[0.875rem] text-content-secondary mt-0.5">
              {currentUser?.email && (
                <>Logged in as <span className="font-semibold">{currentUser.email}</span></>
              )}
              {userProfile?.role && (
                <span className="ml-2 px-2 py-0.5 rounded-full text-[0.6875rem] font-bold uppercase bg-blue-50 border border-blue-200 text-brand-blue">
                  {userProfile.role}
                </span>
              )}
            </p>
          </div>

          <Link
            to="/submit-complaint"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-white text-[0.875rem] shadow-brand hover:shadow-brand-hover transition-all hover:-translate-y-0.5 active:translate-y-0 shrink-0"
            style={{ background: 'linear-gradient(90deg, #1F47E8 0%, #2D56F5 100%)' }}
          >
            <PlusCircle className="w-4 h-4" />
            New Complaint
          </Link>
        </div>

        {/* Firebase not configured notice */}
        {!isFirebaseConfigured && (
          <div className="p-4 rounded-xl bg-amber-50 border border-amber-300 flex items-start gap-3 mb-6">
            <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-[0.875rem] font-bold text-amber-900">Firebase Not Configured</p>
              <p className="text-[0.8125rem] text-amber-800 mt-0.5">
                Complaint history requires Firebase. Add your credentials to <code className="bg-amber-100 px-1 rounded">.env.local</code> and restart the dev server.
              </p>
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Loader2 className="w-8 h-8 text-brand-blue animate-spin mb-3" />
            <p className="text-content-secondary text-sm">Loading your complaint history...</p>
          </div>
        )}

        {/* Error State */}
        {!loading && error && (
          <div className="p-5 rounded-xl bg-rose-50 border border-rose-200 text-center">
            <AlertTriangle className="w-6 h-6 text-rose-500 mx-auto mb-2" />
            <p className="text-[0.875rem] font-bold text-rose-800">Failed to load complaints</p>
            <p className="text-[0.8125rem] text-rose-700 mt-1">{error}</p>
            <button
              onClick={fetchComplaints}
              className="mt-3 px-4 py-1.5 rounded-lg text-[0.8125rem] font-bold text-rose-700 border border-rose-300 hover:bg-rose-100 transition-colors"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && isFirebaseConfigured && complaints.length === 0 && (
          <div className="text-center py-20">
            <div className="w-16 h-16 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-center mx-auto mb-4">
              <FileText className="w-8 h-8 text-brand-blue" />
            </div>
            <h2 className="font-heading font-bold text-content-heading text-lg mb-2">No complaints yet</h2>
            <p className="text-content-secondary text-sm mb-5">
              You haven't submitted any campus complaints yet.
            </p>
            <Link
              to="/submit-complaint"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-white text-[0.875rem] shadow-brand hover:shadow-brand-hover transition-all"
              style={{ background: 'linear-gradient(90deg, #1F47E8 0%, #2D56F5 100%)' }}
            >
              <PlusCircle className="w-4 h-4" />
              Submit Your First Complaint
            </Link>
          </div>
        )}

        {/* Complaints List */}
        {!loading && !error && complaints.length > 0 && (
          <div className="space-y-4">
            {complaints.map((complaint) => {
              const deptConfig = DEPT_ICONS[complaint.department] || DEPT_ICONS['Other'];
              const DeptIcon = deptConfig.icon;
              const statusConfig = STATUS_CONFIG[complaint.status] || STATUS_CONFIG['Submitted'];
              const StatusIcon = statusConfig.icon;

              return (
                <div
                  key={complaint.id}
                  className="bg-white rounded-2xl border border-border-ui-subtle shadow-card p-5 sm:p-6"
                >
                  {/* Ticket header row */}
                  <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
                    <div>
                      <code className="text-[0.75rem] font-bold text-brand-blue bg-blue-50 px-2 py-0.5 rounded-md">
                        {complaint.ticketId}
                      </code>
                      <p className="text-[0.6875rem] text-content-muted mt-1">
                        {formatTimestamp(complaint.createdAt)}
                      </p>
                    </div>

                    {/* Status Badge */}
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[0.75rem] font-bold border ${statusConfig.bg} ${statusConfig.color} ${statusConfig.border}`}>
                      <StatusIcon className="w-3.5 h-3.5" />
                      {complaint.status}
                    </span>
                  </div>

                  {/* Original complaint text */}
                  <p className="text-[0.9375rem] text-content-primary italic mb-3 leading-relaxed">
                    "{complaint.originalComplaint}"
                  </p>

                  {/* Department and location row */}
                  <div className="flex flex-wrap gap-2 items-center">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[0.75rem] font-bold border border-transparent ${deptConfig.bg} ${deptConfig.color}`}>
                      <DeptIcon className="w-3.5 h-3.5" />
                      {complaint.department}
                    </span>

                    {complaint.extractedBlock && (
                      <span className="text-[0.75rem] text-content-secondary bg-slate-50 border border-slate-200 px-2 py-0.5 rounded-lg">
                        📍 {complaint.extractedBlock}
                      </span>
                    )}
                    {complaint.extractedFloor && (
                      <span className="text-[0.75rem] text-content-secondary bg-slate-50 border border-slate-200 px-2 py-0.5 rounded-lg">
                        {complaint.extractedFloor}
                      </span>
                    )}
                    {complaint.extractedRoom && (
                      <span className="text-[0.75rem] text-content-secondary bg-slate-50 border border-slate-200 px-2 py-0.5 rounded-lg">
                        {complaint.extractedRoom}
                      </span>
                    )}

                    {complaint.needsHumanReview && (
                      <span className="inline-flex items-center gap-1 text-[0.6875rem] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                        <AlertTriangle className="w-3 h-3" />
                        Needs Review
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      <footer className="text-center text-[0.75rem] text-content-muted mt-8">
        CampusResolve AI · Exclusively for Lovely Professional University (LPU), Phagwara Campus
      </footer>
    </div>
  );
}

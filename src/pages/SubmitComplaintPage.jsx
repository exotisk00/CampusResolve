import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  GraduationCap,
  MessageSquarePlus,
  Languages,
  MapPin,
  Building2,
  Layers,
  DoorOpen,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Check,
  Wrench,
  Zap,
  Wifi,
  UtensilsCrossed,
  BookOpen,
  HelpCircle,
  HelpCircle as QuestionIcon,
  Loader2,
  LogOut,
  FileText,
  LayoutDashboard,
} from 'lucide-react';
import AlertModal from '../components/AlertModal.jsx';
import ClassificationResultModal from '../components/ClassificationResultModal.jsx';
import { useAuth } from '../contexts/AuthContext.jsx';
import { saveComplaint } from '../services/complaintsService.js';
import { isFirebaseConfigured } from '../lib/firebase.js';

const LANGUAGE_OPTIONS = [
  { id: 'auto', label: 'Auto Detect', hint: 'Automatic language identification' },
  { id: 'hinglish', label: 'Hinglish', hint: 'Natural Hindi + English mix' },
  { id: 'english', label: 'English', hint: 'Standard English' },
  { id: 'punjabi', label: 'Romanised Punjabi', hint: 'Punjabi written in English script' },
];

const LPU_EXAMPLE_PROMPTS = [
  'Mere hostel room mein Wi-Fi nahi chal raha.',
  'Block 14 ke washroom mein water leakage hai.',
  'Classroom mein fan kaam nahi kar raha.',
];

const LPU_OFFICIAL_DEPARTMENTS = [
  { name: 'Plumbing', icon: Wrench, color: 'text-blue-600', bg: 'bg-blue-50' },
  { name: 'Electrical', icon: Zap, color: 'text-amber-600', bg: 'bg-amber-50' },
  { name: 'Wi-Fi', icon: Wifi, color: 'text-emerald-600', bg: 'bg-emerald-50' },
  { name: 'Mess', icon: UtensilsCrossed, color: 'text-rose-600', bg: 'bg-rose-50' },
  { name: 'Academic', icon: BookOpen, color: 'text-purple-600', bg: 'bg-purple-50' },
  { name: 'Other', icon: HelpCircle, color: 'text-slate-600', bg: 'bg-slate-100' },
];

export default function SubmitComplaintPage() {
  const navigate = useNavigate();
  const { currentUser, userProfile, logout, isFirebaseConfigured } = useAuth();

  const [complaintText, setComplaintText] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState('auto');
  const [targetDepartment, setTargetDepartment] = useState('Auto / Any');

  // Optional Location State
  const [block, setBlock] = useState('');
  const [floor, setFloor] = useState('');
  const [roomNumber, setRoomNumber] = useState('');

  // AI Classification & Submission State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [classificationResult, setClassificationResult] = useState(null);
  const [isResultModalOpen, setIsResultModalOpen] = useState(false);
  const [savedTicketId, setSavedTicketId] = useState(null);

  // Reusable Alert Modal State
  const [modalState, setModalState] = useState({
    isOpen: false,
    type: 'warning',
    title: '',
    message: '',
    details: [],
    actionText: 'Understood',
  });

  const closeModal = () => {
    setModalState((prev) => ({ ...prev, isOpen: false }));
  };

  const maxChars = 1000;
  const charCount = complaintText.length;

  const handleApplyExample = (example) => {
    setComplaintText(example);
    // Reset manual location inputs when selecting an example prompt
    setBlock('');
    setFloor('');
    setRoomNumber('');
  };

  const handleSubmitComplaint = async (e) => {
    e.preventDefault();

    const trimmedText = complaintText.trim();

    // 1. Validation: Empty complaint
    if (!trimmedText) {
      setModalState({
        isOpen: true,
        type: 'warning',
        title: 'Complaint Description Required',
        message: 'Please write your complaint description before submitting.',
        details: [
          'Describe the issue you are facing on campus',
          'You may write in Hinglish, English, or Romanised Punjabi',
          'Try clicking one of the sample prompt chips above if you need an example',
        ],
        actionText: 'Write Complaint',
      });
      return;
    }

    // 2. Validation: Very short complaint (< 5 characters)
    if (trimmedText.length < 5) {
      setModalState({
        isOpen: true,
        type: 'warning',
        title: 'Complaint Too Brief',
        message: 'Your complaint description is very short. Please provide a little more detail so maintenance staff can understand and locate the issue.',
        details: [
          `Current length: ${trimmedText.length} character(s)`,
          'Recommendation: Briefly state what is broken or malfunctioning',
        ],
        actionText: 'Add Details',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/classify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: trimmedText,
          language: selectedLanguage,
          block: block.trim(),
          floor: floor.trim(),
          roomNumber: roomNumber.trim(),
        }),
      });

      const jsonResult = await response.json();

      if (!response.ok || !jsonResult.success) {
        throw new Error(jsonResult.error || 'Failed to classify complaint.');
      }

      setClassificationResult(jsonResult.data);
      if (jsonResult.data.department) {
        setTargetDepartment(jsonResult.data.department);
      }

      // Save to Firestore if Firebase is configured and user is authenticated
      let ticketId = null;
      if (isFirebaseConfigured && currentUser) {
        try {
          const result = await saveComplaint({
            userId: currentUser.uid,
            userEmail: currentUser.email,
            originalComplaint: trimmedText,
            language: selectedLanguage,
            classificationResult: jsonResult.data,
          });
          ticketId = result.ticketId;
          setSavedTicketId(ticketId);
        } catch (saveErr) {
          console.warn('[SubmitComplaintPage] Firestore save failed:', saveErr.message);
          // Don't block UI — still show classification result
        }
      }

      // Attach ticketId to result for display in modal
      setClassificationResult({ ...jsonResult.data, savedTicketId: ticketId });
      setIsResultModalOpen(true);
    } catch (err) {
      setModalState({
        isOpen: true,
        type: 'error',
        title: 'Classification Request Failed',
        message: err.message || 'Could not connect to the backend classification service.',
        details: [
          'Verify that the backend server is running on port 5001',
          'Vite proxy connects /api to http://localhost:5001',
          'Check terminal/server console logs for error details',
        ],
        actionText: 'Close',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setComplaintText('');
    setBlock('');
    setFloor('');
    setRoomNumber('');
    setSelectedLanguage('auto');
    setTargetDepartment('Auto / Any');
  };

  return (
    <div className="min-h-screen bg-bg-base gradient-hero flex flex-col justify-between py-8 px-4 sm:px-6 lg:px-8">
      {/* Reusable Alert Modal */}
      <AlertModal
        isOpen={modalState.isOpen}
        onClose={closeModal}
        type={modalState.type}
        title={modalState.title}
        message={modalState.message}
        details={modalState.details}
        actionText={modalState.actionText}
      />

      {/* Structured AI Classification Result Modal */}
      <ClassificationResultModal
        isOpen={isResultModalOpen}
        onClose={() => setIsResultModalOpen(false)}
        data={classificationResult}
      />

      {/* Top Navigation Bar */}
      <header className="max-w-4xl mx-auto w-full flex items-center justify-between mb-8">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-[0.875rem] font-semibold text-content-secondary hover:text-brand-blue transition-colors group"
        >
          <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
          Back to Home
        </Link>

        <div className="flex items-center gap-2">
          {/* LPU Campus Badge */}
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-200">
            <MapPin className="w-3.5 h-3.5 text-brand-blue" />
            <span className="text-[0.75rem] font-bold text-brand-blue">LPU Phagwara Campus</span>
          </div>

          {/* Student Dashboard Link */}
          {currentUser && (
            <Link
              to="/dashboard"
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[0.75rem] font-semibold text-content-secondary border border-border-ui-subtle hover:border-brand-blue hover:text-brand-blue transition-all"
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              Dashboard
            </Link>
          )}

          {/* Logout Button */}
          {currentUser && (
            <button
              type="button"
              onClick={async () => { await logout(); navigate('/login'); }}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[0.75rem] font-semibold text-slate-600 border border-slate-200 hover:border-rose-300 hover:text-rose-600 transition-all"
            >
              <LogOut className="w-3.5 h-3.5" />
              Sign Out
            </button>
          )}
        </div>
      </header>

      {/* Main Submission Form Container */}
      <main className="flex-1 flex items-center justify-center">
        <div className="w-full max-w-3xl">
          <div className="bg-white rounded-2xl border border-border-ui-subtle shadow-card p-6 sm:p-9">

            {/* Form Header */}
            <div className="mb-8">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-blue-pale border border-blue-200 mb-3">
                <MessageSquarePlus className="w-3.5 h-3.5 text-brand-blue" />
                <span className="text-[0.6875rem] font-bold text-brand-blue uppercase tracking-wider">
                  Student Grievance Intake
                </span>
              </div>
              <h1 className="font-heading font-extrabold text-content-heading text-[1.75rem] sm:text-[2rem] tracking-tight">
                Submit a Campus Complaint
              </h1>
              <p className="text-[0.9375rem] text-content-secondary mt-1.5 leading-relaxed">
                Describe your campus issue naturally. You do not need to translate or format your grievance into formal English — Hinglish, Hindi, and Punjabi phrases are fully understood.
              </p>
            </div>

            {/* Quick Sample Prompts */}
            <div className="mb-6 p-4 rounded-xl bg-slate-50 border border-slate-200">
              <p className="text-[0.75rem] font-bold text-content-heading uppercase tracking-wide mb-2 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-brand-blue" />
                Try these common LPU complaint examples:
              </p>
              <div className="flex flex-wrap gap-2">
                {LPU_EXAMPLE_PROMPTS.map((prompt) => (
                  <button
                    key={prompt}
                    type="button"
                    onClick={() => handleApplyExample(prompt)}
                    className="text-left text-[0.8125rem] px-3 py-1.5 rounded-lg bg-white border border-border-ui-subtle text-content-primary hover:border-brand-blue hover:text-brand-blue transition-all"
                  >
                    "{prompt}"
                  </button>
                ))}
              </div>
            </div>

            {/* Form Start */}
            <form onSubmit={handleSubmitComplaint} noValidate className="space-y-6">

              {/* 1. Language Selector */}
              <div>
                <label className="block text-[0.8125rem] font-bold text-content-heading uppercase tracking-wide mb-2">
                  Select Language Mode
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {LANGUAGE_OPTIONS.map((lang) => {
                    const isSelected = selectedLanguage === lang.id;
                    return (
                      <button
                        key={lang.id}
                        type="button"
                        onClick={() => setSelectedLanguage(lang.id)}
                        className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between ${
                          isSelected
                            ? 'bg-blue-50 border-brand-blue shadow-sm'
                            : 'bg-white border-border-ui-default hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center justify-between w-full mb-1">
                          <span
                            className={`text-[0.875rem] font-bold ${
                              isSelected ? 'text-brand-blue' : 'text-content-heading'
                            }`}
                          >
                            {lang.label}
                          </span>
                          {isSelected && <Check className="w-3.5 h-3.5 text-brand-blue" />}
                        </div>
                        <span className="text-[0.6875rem] text-content-muted leading-tight">
                          {lang.hint}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 2. Large Complaint Text Area */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label
                    htmlFor="complaint-text"
                    className="block text-[0.8125rem] font-bold text-content-heading uppercase tracking-wide"
                  >
                    Complaint Description <span className="text-rose-500">*</span>
                  </label>
                  <span
                    className={`text-[0.75rem] font-semibold ${
                      charCount > maxChars ? 'text-rose-600' : 'text-content-muted'
                    }`}
                  >
                    {charCount} / {maxChars} characters
                  </span>
                </div>
                <div className="relative">
                  <textarea
                    id="complaint-text"
                    rows={6}
                    value={complaintText}
                    onChange={(e) => setComplaintText(e.target.value)}
                    maxLength={maxChars}
                    placeholder="Write your grievance naturally here... e.g. 'Mere hostel room mein Wi-Fi nahi chal raha' or 'Block 14 washroom tap leak ho raha hai'"
                    className="w-full p-4 rounded-xl text-[0.9375rem] text-content-primary bg-white border border-border-ui-default placeholder:text-content-muted outline-none transition-all focus:border-brand-blue focus:ring-2 focus:ring-blue-100 leading-relaxed"
                  />
                </div>
                <p className="text-[0.75rem] text-content-muted mt-1.5">
                  Your exact words are preserved. Do not worry about grammatical formalization.
                </p>
              </div>

              {/* 3. Optional Location Fields */}
              <div className="p-5 rounded-2xl bg-slate-50 border border-border-ui-subtle">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="font-heading font-bold text-content-heading text-[0.9375rem]">
                      Campus Location Details
                    </h3>
                    <p className="text-[0.75rem] text-content-secondary mt-0.5">
                      Optional: Pinpointing your Block, Floor, and Room helps staff reach the spot faster.
                    </p>
                  </div>
                  <span className="text-[0.6875rem] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-200 text-slate-700">
                    Optional
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                  {/* Block */}
                  <div>
                    <label
                      htmlFor="loc-block"
                      className="block text-[0.75rem] font-bold text-content-heading uppercase tracking-wide mb-1"
                    >
                      Block <span className="text-content-muted font-normal">(Optional)</span>
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-content-muted">
                        <Building2 className="w-3.5 h-3.5" />
                      </div>
                      <input
                        id="loc-block"
                        type="text"
                        value={block}
                        onChange={(e) => setBlock(e.target.value)}
                        placeholder="e.g. Block 14, BH-2, GH-1"
                        className="w-full pl-9 pr-3 py-2 rounded-xl text-[0.875rem] text-content-primary bg-white border border-border-ui-default placeholder:text-content-muted outline-none focus:border-brand-blue"
                      />
                    </div>
                  </div>

                  {/* Floor */}
                  <div>
                    <label
                      htmlFor="loc-floor"
                      className="block text-[0.75rem] font-bold text-content-heading uppercase tracking-wide mb-1"
                    >
                      Floor <span className="text-content-muted font-normal">(Optional)</span>
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-content-muted">
                        <Layers className="w-3.5 h-3.5" />
                      </div>
                      <input
                        id="loc-floor"
                        type="text"
                        value={floor}
                        onChange={(e) => setFloor(e.target.value)}
                        placeholder="e.g. Ground, 2nd, 3rd"
                        className="w-full pl-9 pr-3 py-2 rounded-xl text-[0.875rem] text-content-primary bg-white border border-border-ui-default placeholder:text-content-muted outline-none focus:border-brand-blue"
                      />
                    </div>
                  </div>

                  {/* Room Number */}
                  <div>
                    <label
                      htmlFor="loc-room"
                      className="block text-[0.75rem] font-bold text-content-heading uppercase tracking-wide mb-1"
                    >
                      Room Number <span className="text-content-muted font-normal">(Optional)</span>
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-content-muted">
                        <DoorOpen className="w-3.5 h-3.5" />
                      </div>
                      <input
                        id="loc-room"
                        type="text"
                        value={roomNumber}
                        onChange={(e) => setRoomNumber(e.target.value)}
                        placeholder="e.g. Room 314, Lab 201"
                        className="w-full pl-9 pr-3 py-2 rounded-xl text-[0.875rem] text-content-primary bg-white border border-border-ui-default placeholder:text-content-muted outline-none focus:border-brand-blue"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* 4. Official 6 Departments Notice */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-[0.8125rem] font-bold text-content-heading uppercase tracking-wide">
                    Designated Maintenance Division
                  </label>
                  <span className="text-[0.6875rem] text-content-muted">
                    6 campus categories
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {LPU_OFFICIAL_DEPARTMENTS.map((dept) => {
                    const Icon = dept.icon;
                    const isTarget = targetDepartment === dept.name;
                    return (
                      <button
                        key={dept.name}
                        type="button"
                        onClick={() => setTargetDepartment(dept.name)}
                        className={`p-2.5 rounded-xl border flex items-center gap-2.5 text-[0.8125rem] font-semibold transition-all ${
                          isTarget
                            ? 'bg-blue-50 border-brand-blue text-brand-blue shadow-sm'
                            : 'bg-white border-border-ui-subtle text-content-secondary hover:bg-slate-50'
                        }`}
                      >
                        <span className={`p-1 rounded-md ${dept.bg} ${dept.color}`}>
                          <Icon className="w-3.5 h-3.5" />
                        </span>
                        <span>{dept.name}</span>
                        {isTarget && <Check className="w-3 h-3 ml-auto text-brand-blue" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Form Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-border-ui-subtle">
                <button
                  type="button"
                  onClick={handleReset}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl text-[0.875rem] font-semibold text-content-secondary hover:bg-slate-100 transition-colors"
                >
                  Clear Form
                </button>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`w-full sm:w-auto px-8 py-3.5 rounded-xl font-bold text-white text-[0.9375rem] transition-all duration-200 flex items-center justify-center gap-2 shadow-brand hover:shadow-brand-hover ${
                    isSubmitting
                      ? 'opacity-80 cursor-wait'
                      : 'hover:-translate-y-0.5 active:translate-y-0'
                  }`}
                  style={{
                    background: 'linear-gradient(90deg, #1F47E8 0%, #2D56F5 100%)',
                  }}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-white" />
                      Classifying with AI...
                    </>
                  ) : (
                    <>
                      Submit Complaint
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>

            </form>

          </div>
        </div>
      </main>

      {/* Footer info */}
      <footer className="text-center text-[0.75rem] text-content-muted mt-8">
        CampusResolve AI · Lovely Professional University (LPU), Phagwara Campus · Grievance System
      </footer>
    </div>
  );
}

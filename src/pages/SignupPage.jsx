import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  GraduationCap,
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  ArrowLeft,
  MapPin,
  Check,
  Loader2,
  ShieldAlert,
} from 'lucide-react';
import AlertModal from '../components/AlertModal.jsx';
import { useAuth } from '../contexts/AuthContext.jsx';
import { getFirebaseErrorMessage } from '../utils/firebaseErrors.js';

export default function SignupPage() {
  const navigate = useNavigate();
  const { signup, isFirebaseConfigured, currentUser } = useAuth();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [modalState, setModalState] = useState({
    isOpen: false,
    type: 'warning',
    title: '',
    message: '',
    details: [],
    actionText: 'Understood',
  });

  const closeModal = () => {
    const callback = modalState.onAction;
    setModalState({
      isOpen: false,
      type: 'warning',
      title: '',
      message: '',
      details: [],
      actionText: 'Understood',
      onAction: null,
    });
    if (typeof callback === 'function') {
      callback();
    }
  };

  // If user is already authenticated (e.g. after login), clear any errors and redirect
  useEffect(() => {
    if (currentUser) {
      setModalState({
        isOpen: false,
        type: 'warning',
        title: '',
        message: '',
        details: [],
        actionText: 'Understood',
      });
      navigate('/dashboard', { replace: true });
    }
  }, [currentUser, navigate]);

  // Ensure modal state is completely cleared on mount and unmount
  useEffect(() => {
    setModalState({
      isOpen: false,
      type: 'warning',
      title: '',
      message: '',
      details: [],
      actionText: 'Understood',
    });
    return () => {
      setModalState({
        isOpen: false,
        type: 'warning',
        title: '',
        message: '',
        details: [],
        actionText: 'Understood',
      });
    };
  }, []);

  const handleSignupSubmit = async (e) => {
    e.preventDefault();

    const trimmedName = fullName.trim();
    const trimmedEmail = email.trim();

    // ── Frontend validation ──────────────────────────────────────────
    const missingFields = [];
    if (!trimmedName) missingFields.push('Full Name');
    if (!trimmedEmail) missingFields.push('Email Address');
    if (!password) missingFields.push('Password');
    if (!confirmPassword) missingFields.push('Confirm Password');

    if (missingFields.length > 0) {
      setModalState({
        isOpen: true, type: 'warning',
        title: 'Required Information Missing',
        message: 'Please complete all required fields before creating your account.',
        details: missingFields.map((f) => `Missing: ${f}`),
        actionText: 'Complete Fields',
      });
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      setModalState({
        isOpen: true, type: 'warning',
        title: 'Invalid Email Format',
        message: `"${trimmedEmail}" is not a valid email address.`,
        details: [
          'Include the "@" symbol and a valid domain',
          'Example: name@gmail.com or name@outlook.com',
        ],
        actionText: 'Fix Email',
      });
      return;
    }

    if (password.length < 8) {
      setModalState({
        isOpen: true, type: 'warning',
        title: 'Password Too Short',
        message: 'Your password must be at least 8 characters long.',
        details: [
          `Current length: ${password.length} character(s)`,
          'Minimum required: 8 characters',
          'Mix letters, numbers and symbols for stronger security',
        ],
        actionText: 'Lengthen Password',
      });
      return;
    }

    if (password !== confirmPassword) {
      setModalState({
        isOpen: true, type: 'warning',
        title: 'Passwords Do Not Match',
        message: 'The password and confirmation password do not match.',
        details: [
          'Make sure both password fields have the exact same text',
          'Watch for accidental spaces or caps lock',
        ],
        actionText: 'Re-enter Password',
      });
      return;
    }

    // ── Firebase registration ────────────────────────────────────────
    if (!isFirebaseConfigured) {
      setModalState({
        isOpen: true, type: 'warning',
        title: 'Firebase Not Configured',
        message: 'Firebase credentials are not set up yet. Account creation requires Firebase.',
        details: [
          'Create a .env.local file in the project root',
          'Add all VITE_FIREBASE_* variables from .env.local.example',
          'Restart the Vite dev server after adding credentials',
        ],
        actionText: 'Understood',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await signup(
        trimmedEmail,
        password,
        trimmedName
      );
      // Registration successful → redirect to submit complaint
      navigate('/submit-complaint', { replace: true });
    } catch (error) {
      const isAlreadyInUse = error?.code === 'auth/email-already-in-use';
      setModalState({
        isOpen: true,
        type: isAlreadyInUse ? 'info' : 'error',
        title: isAlreadyInUse ? 'Account Already Exists' : 'Registration Failed',
        message: isAlreadyInUse
          ? 'This email address is already registered on CampusResolve AI.'
          : getFirebaseErrorMessage(error),
        details: isAlreadyInUse
          ? [
              `Account for "${trimmedEmail}" already exists.`,
              'Click "Go to Login" below to sign in with your password.',
              'If you forgot your password, you can reset it from the login screen.',
            ]
          : [
              'Please check your network connection and details.',
              'Ensure all fields comply with university requirements.',
            ],
        actionText: isAlreadyInUse ? 'Go to Login' : 'Try Again',
        onAction: isAlreadyInUse ? () => navigate('/login', { state: { email: trimmedEmail } }) : null,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg-base gradient-hero flex flex-col justify-between py-8 px-4 sm:px-6 lg:px-8">
      <AlertModal
        isOpen={modalState.isOpen}
        onClose={closeModal}
        type={modalState.type}
        title={modalState.title}
        message={modalState.message}
        details={modalState.details}
        actionText={modalState.actionText}
      />

      {/* Top Navigation */}
      <header className="max-w-6xl mx-auto w-full flex items-center justify-between mb-8">
        <Link
          to="/"
          onClick={() =>
            setModalState({
              isOpen: false,
              type: 'warning',
              title: '',
              message: '',
              details: [],
              actionText: 'Understood',
            })
          }
          className="inline-flex items-center gap-2 text-[0.875rem] font-semibold text-content-secondary hover:text-brand-blue transition-colors group"
        >
          <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
          Back to Home
        </Link>
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-200">
          <MapPin className="w-3.5 h-3.5 text-brand-blue" />
          <span className="text-[0.75rem] font-bold text-brand-blue">LPU Phagwara Campus</span>
        </div>
      </header>

      {/* Main Signup Card */}
      <main className="flex-1 flex items-center justify-center">
        <div className="w-full max-w-lg">
          <div className="bg-white rounded-2xl border border-border-ui-subtle shadow-card p-7 sm:p-9">

            {/* Header */}
            <div className="text-center mb-6">
              <div
                className="w-12 h-12 rounded-xl mx-auto flex items-center justify-center mb-3 shadow-sm"
                style={{ background: 'linear-gradient(135deg, #1F47E8 0%, #2D56F5 100%)' }}
              >
                <GraduationCap className="w-6 h-6 text-white" aria-hidden="true" />
              </div>
              <h1 className="font-heading font-extrabold text-content-heading text-[1.5rem] tracking-tight">
                Create Your Account
              </h1>
              <p className="text-[0.875rem] text-content-secondary mt-1">
                Join CampusResolve AI — Student Portal for LPU Phagwara Campus
              </p>
            </div>

            {/* Firebase not configured banner */}
            {!isFirebaseConfigured && (
              <div className="mb-5 p-3.5 rounded-xl bg-amber-50 border border-amber-300 flex items-start gap-2.5">
                <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <p className="text-[0.75rem] text-amber-900 leading-relaxed">
                  <strong>Setup Required:</strong> Firebase credentials are not configured.
                  Add your <code className="bg-amber-100 px-1 rounded text-xs">.env.local</code> file to enable account creation.
                </p>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSignupSubmit} noValidate className="space-y-4">
              {/* Student Role Notice */}
              <div className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl bg-blue-50/80 border border-blue-100 text-brand-blue text-[0.8125rem]">
                <GraduationCap className="w-4 h-4 shrink-0 text-brand-blue" />
                <span className="font-semibold">Student Account &bull; LPU Phagwara Campus</span>
              </div>

              {/* Full Name */}
              <div>
                <label
                  htmlFor="signup-name"
                  className="block text-[0.8125rem] font-bold text-content-heading uppercase tracking-wide mb-1.5"
                >
                  Full Legal Name
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-content-muted">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    id="signup-name"
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Aman Sharma"
                    disabled={isSubmitting}
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl text-[0.9375rem] text-content-primary bg-white border border-border-ui-default placeholder:text-content-muted outline-none transition-all focus:border-brand-blue focus:ring-2 focus:ring-blue-100 disabled:bg-slate-50 disabled:cursor-not-allowed"
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label
                  htmlFor="signup-email"
                  className="block text-[0.8125rem] font-bold text-content-heading uppercase tracking-wide mb-1.5"
                >
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-content-muted">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    id="signup-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@gmail.com, outlook, yahoo..."
                    disabled={isSubmitting}
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl text-[0.9375rem] text-content-primary bg-white border border-border-ui-default placeholder:text-content-muted outline-none transition-all focus:border-brand-blue focus:ring-2 focus:ring-blue-100 disabled:bg-slate-50 disabled:cursor-not-allowed"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label
                  htmlFor="signup-password"
                  className="block text-[0.8125rem] font-bold text-content-heading uppercase tracking-wide mb-1.5"
                >
                  Password <span className="text-content-muted font-normal normal-case">(min 8 characters)</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-content-muted">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    id="signup-password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Create account password"
                    disabled={isSubmitting}
                    className="w-full pl-10 pr-11 py-2.5 rounded-xl text-[0.9375rem] text-content-primary bg-white border border-border-ui-default placeholder:text-content-muted outline-none transition-all focus:border-brand-blue focus:ring-2 focus:ring-blue-100 disabled:bg-slate-50 disabled:cursor-not-allowed"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-content-muted hover:text-content-primary transition-colors"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div>
                <label
                  htmlFor="signup-confirm-password"
                  className="block text-[0.8125rem] font-bold text-content-heading uppercase tracking-wide mb-1.5"
                >
                  Confirm Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-content-muted">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    id="signup-confirm-password"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter your password"
                    disabled={isSubmitting}
                    className="w-full pl-10 pr-11 py-2.5 rounded-xl text-[0.9375rem] text-content-primary bg-white border border-border-ui-default placeholder:text-content-muted outline-none transition-all focus:border-brand-blue focus:ring-2 focus:ring-blue-100 disabled:bg-slate-50 disabled:cursor-not-allowed"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-content-muted hover:text-content-primary transition-colors"
                    aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className={`w-full mt-3 py-3 rounded-xl font-bold text-white text-[0.9375rem] transition-all duration-200 flex items-center justify-center gap-2 shadow-brand hover:shadow-brand-hover ${
                  isSubmitting ? 'opacity-80 cursor-wait' : 'hover:-translate-y-0.5 active:translate-y-0'
                }`}
                style={{ background: 'linear-gradient(90deg, #1F47E8 0%, #2D56F5 100%)' }}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Creating Account...
                  </>
                ) : (
                  <>
                    Create Account
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            {/* Login Link */}
            <div className="mt-6 pt-5 border-t border-border-ui-subtle text-center">
              <p className="text-[0.875rem] text-content-secondary">
                Already registered with CampusResolve?{' '}
                <Link
                  to="/login"
                  onClick={() =>
                    setModalState({
                      isOpen: false,
                      type: 'warning',
                      title: '',
                      message: '',
                      details: [],
                      actionText: 'Understood',
                    })
                  }
                  className="font-bold text-brand-blue hover:underline"
                >
                  Log in here
                </Link>
              </p>
            </div>
          </div>
        </div>
      </main>

      <footer className="text-center text-[0.75rem] text-content-muted mt-8">
        CampusResolve AI · Exclusively for Lovely Professional University (LPU), Phagwara Campus
      </footer>
    </div>
  );
}

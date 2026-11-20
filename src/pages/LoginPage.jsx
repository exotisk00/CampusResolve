import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  GraduationCap,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  ArrowLeft,
  MapPin,
  Loader2,
  ShieldAlert,
} from 'lucide-react';
import AlertModal from '../components/AlertModal.jsx';
import { useAuth } from '../contexts/AuthContext.jsx';
import { getFirebaseErrorMessage } from '../utils/firebaseErrors.js';

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isFirebaseConfigured, currentUser, userProfile, fetchUserProfile } = useAuth();

  const [email, setEmail] = useState(location.state?.email || '');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Where to go after successful login
  const redirectTo = location.state?.from?.pathname || '/dashboard';

  const [modalState, setModalState] = useState({
    isOpen: false,
    type: 'warning',
    title: '',
    message: '',
    details: [],
    actionText: 'Understood',
  });

  const closeModal = () => setModalState((prev) => ({ ...prev, isOpen: false }));

  // Clear modal and redirect if user is already authenticated
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
      if (userProfile?.role === 'staff') {
        navigate('/staff-dashboard', { replace: true });
      } else if (userProfile?.role === 'student') {
        navigate(redirectTo, { replace: true });
      }
    }
  }, [currentUser, userProfile, navigate, redirectTo]);

  // Ensure any stale modal state is cleared on mount and unmount
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

  const handleLoginSubmit = async (e) => {
    e.preventDefault();

    const trimmedEmail = email.trim();
    const trimmedPassword = password;

    // ── Frontend validation ──────────────────────────────────────────
    if (!trimmedEmail && !trimmedPassword) {
      setModalState({
        isOpen: true, type: 'warning',
        title: 'Missing Required Fields',
        message: 'Please provide both your email address and password.',
        details: ['Enter a valid email (Gmail, Outlook, Yahoo, etc.)', 'Enter your account password'],
        actionText: 'Fill In Fields',
      });
      return;
    }

    if (!trimmedEmail) {
      setModalState({
        isOpen: true, type: 'warning',
        title: 'Email Address Required',
        message: 'The email address field cannot be empty.',
        details: ['Enter your registered email address'],
        actionText: 'Enter Email',
      });
      return;
    }

    if (!trimmedPassword) {
      setModalState({
        isOpen: true, type: 'warning',
        title: 'Password Required',
        message: 'The password field cannot be empty.',
        details: ['Enter the password for your account'],
        actionText: 'Enter Password',
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

    // ── Firebase Authentication ──────────────────────────────────────
    if (!isFirebaseConfigured) {
      setModalState({
        isOpen: true, type: 'warning',
        title: 'Firebase Not Configured',
        message: 'Firebase credentials are not set up yet.',
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
    setModalState((prev) => ({ ...prev, isOpen: false }));
    try {
      const cred = await login(trimmedEmail, trimmedPassword);
      let targetUrl = redirectTo;
      try {
        const profile = await fetchUserProfile(cred.user);
        if (profile?.role === 'staff') {
          targetUrl = '/staff-dashboard';
        }
      } catch (_) {
        // fallback to redirectTo
      }

      // Success → clear modal and navigate to intended page
      setModalState({
        isOpen: false,
        type: 'warning',
        title: '',
        message: '',
        details: [],
        actionText: 'Understood',
      });
      navigate(targetUrl, { replace: true });
    } catch (error) {
      setModalState({
        isOpen: true, type: 'error',
        title: 'Sign In Failed',
        message: getFirebaseErrorMessage(error),
        details: [
          'Double-check your email address',
          'Ensure your password is correct',
          'If you haven\'t signed up yet, create an account first',
        ],
        actionText: 'Try Again',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleForgotPassword = async () => {
    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setModalState({
        isOpen: true, type: 'info',
        title: 'Enter Email for Password Reset',
        message: 'Please type your email address in the email field above, then click "Forgot password?" again.',
        details: [],
        actionText: 'Got It',
      });
      return;
    }

    if (!isFirebaseConfigured) {
      setModalState({
        isOpen: true, type: 'warning',
        title: 'Firebase Not Configured',
        message: 'Password reset requires Firebase to be configured.',
        details: ['Add your VITE_FIREBASE_* credentials to .env.local and restart the dev server.'],
        actionText: 'Understood',
      });
      return;
    }

    try {
      await resetPassword(trimmedEmail);
      setModalState({
        isOpen: true, type: 'success',
        title: 'Password Reset Email Sent',
        message: `A password reset link has been sent to ${trimmedEmail}.`,
        details: ['Check your inbox (and spam folder)', 'Follow the link in the email to reset your password'],
        actionText: 'Done',
      });
    } catch (error) {
      setModalState({
        isOpen: true, type: 'error',
        title: 'Password Reset Failed',
        message: getFirebaseErrorMessage(error),
        details: [],
        actionText: 'Try Again',
      });
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

      {/* Main Login Card */}
      <main className="flex-1 flex items-center justify-center">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl border border-border-ui-subtle shadow-card p-7 sm:p-9">

            {/* Header */}
            <div className="text-center mb-7">
              <div
                className="w-12 h-12 rounded-xl mx-auto flex items-center justify-center mb-3.5 shadow-sm"
                style={{ background: 'linear-gradient(135deg, #1F47E8 0%, #2D56F5 100%)' }}
              >
                <GraduationCap className="w-6 h-6 text-white" aria-hidden="true" />
              </div>
              <h1 className="font-heading font-extrabold text-content-heading text-[1.5rem] tracking-tight">
                Welcome Back
              </h1>
              <p className="text-[0.875rem] text-content-secondary mt-1">
                Sign in to your CampusResolve AI portal
              </p>
            </div>

            {/* Firebase not configured banner */}
            {!isFirebaseConfigured && (
              <div className="mb-5 p-3.5 rounded-xl bg-amber-50 border border-amber-300 flex items-start gap-2.5">
                <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <p className="text-[0.75rem] text-amber-900 leading-relaxed">
                  <strong>Setup Required:</strong> Firebase credentials are not configured.
                  Add your <code className="bg-amber-100 px-1 rounded text-xs">.env.local</code> file to enable authentication.
                </p>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleLoginSubmit} noValidate className="space-y-4">
              {/* Email */}
              <div>
                <label
                  htmlFor="login-email"
                  className="block text-[0.8125rem] font-bold text-content-heading uppercase tracking-wide mb-1.5"
                >
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-content-muted">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    id="login-email"
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
                <div className="flex items-center justify-between mb-1.5">
                  <label
                    htmlFor="login-password"
                    className="block text-[0.8125rem] font-bold text-content-heading uppercase tracking-wide"
                  >
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={handleForgotPassword}
                    disabled={isSubmitting}
                    className="text-[0.75rem] font-semibold text-brand-blue hover:underline disabled:opacity-50"
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-content-muted">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    id="login-password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    disabled={isSubmitting}
                    className="w-full pl-10 pr-11 py-2.5 rounded-xl text-[0.9375rem] text-content-primary bg-white border border-border-ui-default placeholder:text-content-muted outline-none transition-all focus:border-brand-blue focus:ring-2 focus:ring-blue-100 disabled:bg-slate-50 disabled:cursor-not-allowed"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={isSubmitting}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-content-muted hover:text-content-primary transition-colors"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className={`w-full mt-2 py-3 rounded-xl font-bold text-white text-[0.9375rem] transition-all duration-200 flex items-center justify-center gap-2 shadow-brand hover:shadow-brand-hover ${
                  isSubmitting ? 'opacity-80 cursor-wait' : 'hover:-translate-y-0.5 active:translate-y-0'
                }`}
                style={{ background: 'linear-gradient(90deg, #1F47E8 0%, #2D56F5 100%)' }}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Signing In...
                  </>
                ) : (
                  <>
                    Sign In
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            {/* Signup Link */}
            <div className="mt-6 pt-5 border-t border-border-ui-subtle text-center">
              <p className="text-[0.875rem] text-content-secondary">
                Don't have an account yet?{' '}
                <Link
                  to="/signup"
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
                  Sign up here
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

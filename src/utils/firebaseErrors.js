/**
 * useFirebaseErrorMessage — Translate Firebase Auth error codes into user-friendly messages
 * CampusResolve AI — LPU Phagwara Campus
 */

export function getFirebaseErrorMessage(error) {
  if (!error) return 'An unknown error occurred.';

  const code = error?.code || '';

  switch (code) {
    // Auth errors
    case 'auth/email-already-in-use':
      return 'This email address is already registered. Please log in or use a different email.';
    case 'auth/invalid-email':
      return 'The email address format is invalid. Please check and try again.';
    case 'auth/user-not-found':
      return 'No account found with this email address. Please sign up first.';
    case 'auth/wrong-password':
      return 'The password you entered is incorrect. Please try again.';
    case 'auth/invalid-credential':
      return 'The email or password is incorrect. Please check your credentials and try again.';
    case 'auth/too-many-requests':
      return 'Too many failed login attempts. Please wait a moment, then try again.';
    case 'auth/user-disabled':
      return 'This account has been disabled. Please contact the LPU campus administrator.';
    case 'auth/network-request-failed':
      return 'Network error. Please check your internet connection and try again.';
    case 'auth/weak-password':
      return 'Password is too weak. Please use at least 8 characters with a mix of letters and numbers.';
    case 'auth/operation-not-allowed':
      return 'Email/password login is not enabled. Please contact the system administrator.';
    case 'auth/requires-recent-login':
      return 'This action requires you to log in again for security. Please log out and log back in.';
    case 'auth/popup-closed-by-user':
      return 'The login popup was closed. Please try again.';
    case 'FIREBASE_NOT_CONFIGURED':
      return 'Firebase is not configured yet. Please follow the setup instructions to add your Firebase credentials.';
    // Firestore / general
    case 'permission-denied':
      return 'You do not have permission to perform this action.';
    case 'unavailable':
      return 'Service temporarily unavailable. Please try again in a moment.';
    default:
      if (error.message === 'FIREBASE_NOT_CONFIGURED') {
        return 'Firebase is not configured yet. Please follow the setup instructions.';
      }
      return error.message || 'An unexpected error occurred. Please try again.';
  }
}

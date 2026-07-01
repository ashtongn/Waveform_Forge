import { FirebaseError } from 'firebase/app';

// Map the Firebase Auth error codes we can actually hit from the email/password
// flow into short, user-facing messages. Anything unexpected falls back to a
// generic message so we never surface raw Firebase internals to the user.
export function authErrorMessage(err: unknown): string {
  if (err instanceof FirebaseError) {
    switch (err.code) {
      case 'auth/invalid-email':
        return 'That email address is not valid.';
      case 'auth/missing-password':
        return 'Please enter a password.';
      case 'auth/weak-password':
        return 'Password should be at least 6 characters.';
      case 'auth/email-already-in-use':
        return 'An account already exists for that email.';
      case 'auth/invalid-credential':
      case 'auth/wrong-password':
      case 'auth/user-not-found':
        return 'Incorrect email or password.';
      case 'auth/too-many-requests':
        return 'Too many attempts. Please wait a moment and try again.';
      case 'auth/network-request-failed':
        return 'Network error. Check your connection and try again.';
      default:
        return 'Something went wrong. Please try again.';
    }
  }
  return 'Something went wrong. Please try again.';
}

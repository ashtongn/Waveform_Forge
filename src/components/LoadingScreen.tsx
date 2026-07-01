// Full-height centered spinner shown while auth state is still resolving.
// Prevents route guards from flashing a redirect before we know who the user
// is (AuthProvider keeps `loading` true until the first profile snapshot).
export default function LoadingScreen() {
  return (
    <div className="flex min-h-[40vh] items-center justify-center">
      <div
        role="status"
        aria-label="Loading"
        className="h-8 w-8 animate-spin rounded-full border-2 border-forge-border border-t-forge-accent"
      />
    </div>
  );
}

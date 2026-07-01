import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <section className="space-y-4 text-center">
      <p className="font-mono text-6xl font-bold text-forge-accent">404</p>
      <h1 className="text-2xl font-semibold">Page not found</h1>
      <p className="text-forge-muted">
        The page you&apos;re looking for doesn&apos;t exist or has moved.
      </p>
      <Link
        to="/"
        className="inline-block rounded-md bg-forge-accent px-4 py-2 text-sm font-semibold text-forge-bg transition hover:bg-forge-accent/90"
      >
        Back to home
      </Link>
    </section>
  );
}

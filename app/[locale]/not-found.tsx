import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="max-w-[var(--container-max)] mx-auto px-4 py-24 text-center">
      <h1 className="text-6xl font-bold text-slate-900 mb-4">404</h1>
      <p className="text-xl text-slate-600 mb-8">Page not found</p>
      <p className="text-slate-500 mb-8">The page you&apos;re looking for doesn&apos;t exist or has been moved.</p>
      <Link href="/" className="btn-primary">
        Go Home
      </Link>
    </main>
  );
}

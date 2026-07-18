import Image from 'next/image';

export const metadata = {
  title: 'Not Available in Your Region | Cartzii',
};

export default function BlockedPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="flex justify-center">
          <Image
            src="/assets/cartzii-logo.png"
            alt="Cartzii"
            width={180}
            height={48}
            priority
          />
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-8 space-y-4">
          <div className="text-5xl">🌍</div>
          <h1 className="text-2xl font-bold text-slate-900">
            Not Available in Your Region
          </h1>
          <p className="text-slate-600 leading-relaxed">
            Cartzii is currently only available in the{' '}
            <span className="font-semibold">United States</span> and{' '}
            <span className="font-semibold">Canada</span>.
          </p>
          <p className="text-sm text-slate-600">
            We&apos;re working on expanding to more regions. Stay tuned!
          </p>
        </div>

        <p className="text-xs text-slate-500">
          &copy; {new Date().getFullYear()} Cartzii. All rights reserved.
        </p>
      </div>
    </main>
  );
}

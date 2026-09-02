import { Breadcrumb } from '@/components/layout/Breadcrumb';
import {
  Cookie, Mail, Info, BarChart3, Megaphone, Settings, Shield,
} from 'lucide-react';
import { generateAlternates } from '@/lib/seo';
import { Link } from '@/i18n/navigation';

const SUPPORT_EMAIL = 'support@cartzii.ca';
const LAST_UPDATED = 'September 2, 2026';

export async function generateMetadata() {
  const alternates = await generateAlternates(
    process.env.NEXT_PUBLIC_BASE_URL || 'https://cartzii.com',
    '/cookies',
  );
  return {
    title: 'Cookie Policy - Cartzii',
    description:
      'How Cartzii uses cookies and similar technologies, what each category does, and how you can manage your preferences.',
    alternates,
  };
}

const categories = [
  {
    icon: Shield,
    title: 'Strictly necessary',
    description:
      'Required for the Service to work — keeping you signed in, remembering your cart, applying security tokens, and load-balancing. These cannot be turned off.',
    examples: ['Session ID', 'CSRF token', 'Cart contents', 'Country / locale'],
    gradient: 'from-slate-700 to-slate-900',
  },
  {
    icon: BarChart3,
    title: 'Analytics',
    description:
      'Help us understand how the Service is used so we can improve it — which pages are popular, where checkout gets stuck, which features are worth building.',
    examples: ['First-party analytics', 'Aggregated page views', 'Performance metrics'],
    gradient: 'from-blue-500 to-indigo-600',
  },
  {
    icon: Megaphone,
    title: 'Marketing',
    description:
      'Enable us and our partners to show you more relevant ads on other sites, and to measure whether our own campaigns work. Off by default.',
    examples: ['Retargeting pixels', 'Conversion tracking', 'Affiliate attribution'],
    gradient: 'from-primary to-orange-600',
  },
  {
    icon: Settings,
    title: 'Preferences',
    description:
      'Remember choices you have made — dark mode, saved shipping country, recently viewed products — so the Service feels familiar the next time you visit.',
    examples: ['UI theme', 'Recently viewed', 'Sort & filter preferences'],
    gradient: 'from-emerald-500 to-teal-600',
  },
];

export default async function CookiePolicyPage() {
  return (
    <div className="overflow-x-hidden">
      <div className="max-w-[var(--container-max)] mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        <Breadcrumb items={[{ label: 'Cookie Policy' }]} />
      </div>

      <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
        <div className="absolute -top-40 -right-40 w-[600px] h-[600px] rounded-full bg-primary/20 blur-[120px] pointer-events-none" />
        <div className="relative max-w-[var(--container-max)] mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-24">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-4 py-2 text-sm font-medium mb-6">
              <Cookie className="w-4 h-4 text-amber-400" /> Legal
            </div>
            <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-4 leading-tight">
              Cookie Policy
            </h1>
            <p className="text-slate-300 text-lg leading-relaxed">
              What cookies we use, why we use them, and how to control them.
            </p>
            <p className="mt-4 text-sm text-slate-400">Last updated: {LAST_UPDATED}</p>
          </div>
        </div>
      </section>

      {/* INTRO */}
      <section className="bg-[#F0F2F2]">
        <div className="max-w-[var(--container-max)] mx-auto px-4 sm:px-6 lg:px-8 py-14 md:py-16">
          <div className="max-w-3xl mx-auto bg-white rounded-3xl p-8 md:p-10 border border-slate-100 shadow-sm">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center flex-shrink-0">
                <Info className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-slate-900 mb-3">What is a cookie?</h2>
                <p className="text-slate-700 leading-relaxed mb-3">
                  A cookie is a small text file that a website places on your device to remember things
                  between visits. Cartzii uses both first-party cookies (set by us) and, in some cases,
                  third-party cookies (set by partners we work with, such as analytics and payment providers).
                </p>
                <p className="text-slate-700 leading-relaxed">
                  We also use closely related technologies — local storage, session storage, pixels, and
                  SDKs — which are covered by this Policy even though they are not technically cookies.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CATEGORIES */}
      <section className="bg-white">
        <div className="max-w-[var(--container-max)] mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-20">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 text-primary font-semibold text-sm uppercase tracking-widest mb-4">
              <Cookie className="w-4 h-4" /> Cookie categories
            </div>
            <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 mb-3">The four types we use.</h2>
            <p className="text-slate-500 max-w-2xl mx-auto">Only the first category is required for the Service to function.</p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto">
            {categories.map((c) => (
              <div key={c.title} className="bg-[#F0F2F2] rounded-3xl p-8 border border-slate-100">
                <div className={`w-14 h-14 bg-gradient-to-br ${c.gradient} rounded-2xl flex items-center justify-center mb-5 shadow-lg`}>
                  <c.icon className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">{c.title}</h3>
                <p className="text-slate-700 leading-relaxed mb-4">{c.description}</p>
                <div className="flex flex-wrap gap-2">
                  {c.examples.map((e) => (
                    <span key={e} className="bg-white border border-slate-200 text-slate-700 text-xs font-medium px-3 py-1 rounded-full">
                      {e}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* MANAGE */}
      <section className="bg-[#F0F2F2]">
        <div className="max-w-[var(--container-max)] mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-20">
          <div className="max-w-3xl mx-auto">
            <div className="bg-white rounded-3xl p-8 md:p-10 border border-slate-100 shadow-sm">
              <h2 className="text-2xl md:text-3xl font-extrabold text-slate-900 mb-4">Managing your cookies</h2>
              <div className="space-y-4 text-slate-700 leading-relaxed">
                <p>
                  When you first visit Cartzii we show a cookie banner where you can accept, reject, or
                  customise non-essential cookies. You can re-open your preferences at any time from the
                  "Cookie settings" link in the footer or your account preferences.
                </p>
                <p>
                  You can also block or delete cookies from your browser settings, but doing so may cause
                  parts of the Service to stop working correctly — for example, staying signed in or keeping
                  your cart.
                </p>
                <p>
                  Cartzii honours the Global Privacy Control (GPC) signal where legally required. Sending a
                  GPC signal from a supported browser will automatically opt you out of marketing cookies.
                </p>
              </div>
            </div>

            <div className="mt-6 p-6 bg-white rounded-2xl border border-slate-100 flex flex-col md:flex-row items-start md:items-center gap-4 justify-between">
              <p className="text-slate-700">Questions about how we use cookies?</p>
              <a href={`mailto:${SUPPORT_EMAIL}?subject=Cookie%20Policy%20question`} className="inline-flex items-center gap-2 text-primary font-semibold hover:underline">
                <Mail className="w-4 h-4" /> {SUPPORT_EMAIL}
              </a>
            </div>

            <p className="mt-6 text-center text-sm text-slate-500">
              See also our{' '}
              <Link href="/privacy" className="text-primary font-semibold hover:underline">Privacy Policy</Link>{' '}and{' '}
              <Link href="/terms" className="text-primary font-semibold hover:underline">Terms of Service</Link>.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}

import { Breadcrumb } from '@/components/layout/Breadcrumb';
import {
  Mail, MessageSquare, Sparkles, Clock, ShieldCheck, ShoppingBag,
  Briefcase, LifeBuoy, Building2, MapPin,
} from 'lucide-react';
import { generateAlternates } from '@/lib/seo';
import { Link } from '@/i18n/navigation';

const SUPPORT_EMAIL = 'support@cartzii.ca';
const CAREERS_EMAIL = 'career@cartzii.ca';

export async function generateMetadata() {
  const alternates = await generateAlternates(
    process.env.NEXT_PUBLIC_BASE_URL || 'https://cartzii.com',
    '/contact',
  );
  return {
    title: 'Contact Us - Cartzii | We\'re here to help',
    description:
      'Reach the Cartzii team. Email support@cartzii.ca for orders, returns, and account help. Real people, real answers, usually within one business day.',
    alternates,
  };
}

export default async function ContactPage() {
  const supportMailto = `mailto:${SUPPORT_EMAIL}?subject=Cartzii%20-%20Support%20Request`;
  const careersMailto = `mailto:${CAREERS_EMAIL}?subject=Exploring%20opportunities%20at%20Cartzii`;

  const reasons = [
    {
      icon: ShoppingBag,
      title: 'Order & shopping help',
      description: 'Track an order, request a refund, update an address, or fix a payment issue.',
      email: SUPPORT_EMAIL,
      href: supportMailto,
      accent: 'from-orange-500 to-red-600',
    },
    {
      icon: Briefcase,
      title: 'Seller support',
      description: 'Storefront setup, payouts, shipping profiles — anything about running your shop on Cartzii.',
      email: SUPPORT_EMAIL,
      href: `mailto:${SUPPORT_EMAIL}?subject=Seller%20support%20-%20`,
      accent: 'from-emerald-500 to-teal-600',
    },
    {
      icon: LifeBuoy,
      title: 'Trust & safety',
      description: 'Report suspicious activity, a policy violation, or a buyer protection claim.',
      email: SUPPORT_EMAIL,
      href: `mailto:${SUPPORT_EMAIL}?subject=Trust%20%26%20safety%20-%20`,
      accent: 'from-blue-500 to-indigo-600',
    },
    {
      icon: Sparkles,
      title: 'Careers & press',
      description: 'Interested in joining the team or writing about Cartzii? Say hello.',
      email: CAREERS_EMAIL,
      href: careersMailto,
      accent: 'from-violet-500 to-purple-600',
    },
  ];

  return (
    <div className="overflow-x-hidden">
      <div className="max-w-[var(--container-max)] mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        <Breadcrumb items={[{ label: 'Contact Us' }]} />
      </div>

      {/* HERO */}
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
        <div className="absolute -top-40 -right-40 w-[600px] h-[600px] rounded-full bg-primary/20 blur-[120px] pointer-events-none" />
        <div className="absolute -bottom-40 -left-40 w-[500px] h-[500px] rounded-full bg-orange-400/15 blur-[100px] pointer-events-none" />

        <div className="relative max-w-[var(--container-max)] mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28 text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-4 py-2 text-sm font-medium mb-8">
            <MessageSquare className="w-4 h-4 text-amber-400" />
            <span>We reply to every message</span>
          </div>

          <h1 className="text-5xl sm:text-6xl md:text-7xl font-extrabold tracking-tight mb-6 leading-none">
            Contact{' '}
            <span className="bg-gradient-to-r from-orange-400 via-primary to-red-500 bg-clip-text text-transparent">
              Cartzii
            </span>
          </h1>

          <p className="text-lg md:text-xl text-slate-300 max-w-2xl mx-auto leading-relaxed mb-10">
            Real people, real answers. Send us an email and we&apos;ll get back to you — usually within one business day.
          </p>

          <a
            href={supportMailto}
            className="inline-flex items-center gap-3 bg-primary hover:bg-primary-dark text-white font-semibold px-8 py-4 rounded-2xl transition-all duration-300 hover:scale-105 shadow-lg shadow-primary/30"
          >
            <Mail className="w-5 h-5" /> {SUPPORT_EMAIL}
          </a>
        </div>

        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 80" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none" className="w-full h-16 md:h-20">
            <path d="M0 80L60 70C120 60 240 40 360 35C480 30 600 40 720 45C840 50 960 50 1080 45C1200 40 1320 30 1380 25L1440 20V80H0Z" fill="#F0F2F2" />
          </svg>
        </div>
      </section>

      {/* REASONS */}
      <section className="bg-[#F0F2F2]">
        <div className="max-w-[var(--container-max)] mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-24">
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-2 text-primary font-semibold text-sm uppercase tracking-widest mb-4">
              <MessageSquare className="w-4 h-4" /> How can we help?
            </div>
            <h2 className="text-4xl md:text-5xl font-extrabold text-slate-900 mb-4">Pick the topic that fits.</h2>
            <p className="text-slate-500 text-lg max-w-2xl mx-auto">
              Each option opens a pre-filled email so the right team sees it first.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 gap-6">
            {reasons.map((r) => (
              <a
                key={r.title}
                href={r.href}
                className="group bg-white rounded-3xl p-8 border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 block"
              >
                <div className={`w-14 h-14 bg-gradient-to-br ${r.accent} rounded-2xl flex items-center justify-center mb-5 shadow-lg group-hover:scale-110 transition-transform`}>
                  <r.icon className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">{r.title}</h3>
                <p className="text-slate-500 leading-relaxed mb-4">{r.description}</p>
                <p className="inline-flex items-center gap-2 text-primary font-semibold text-sm">
                  <Mail className="w-4 h-4" /> {r.email}
                </p>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* WHAT TO INCLUDE + RESPONSE PROMISE */}
      <section className="bg-white">
        <div className="max-w-[var(--container-max)] mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-24">
          <div className="grid lg:grid-cols-2 gap-12">
            <div className="bg-[#F0F2F2] rounded-3xl p-8 border border-slate-100">
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-5">
                <ShieldCheck className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-4">Help us help you faster</h3>
              <ul className="space-y-3 text-slate-600">
                <li className="flex gap-3"><span className="text-primary font-bold">•</span> Your order number (starts with <code className="bg-white px-1.5 py-0.5 rounded text-sm">CZ-</code>)</li>
                <li className="flex gap-3"><span className="text-primary font-bold">•</span> The email address on your Cartzii account</li>
                <li className="flex gap-3"><span className="text-primary font-bold">•</span> A short description of what you&apos;re trying to do</li>
                <li className="flex gap-3"><span className="text-primary font-bold">•</span> Screenshots if you&apos;re seeing an error</li>
              </ul>
            </div>

            <div className="bg-[#F0F2F2] rounded-3xl p-8 border border-slate-100">
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-5">
                <Clock className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-4">When you&apos;ll hear back</h3>
              <ul className="space-y-3 text-slate-600">
                <li className="flex gap-3"><span className="text-primary font-bold">•</span> Most emails are answered within <strong>one business day</strong></li>
                <li className="flex gap-3"><span className="text-primary font-bold">•</span> Trust & safety issues are triaged the same day</li>
                <li className="flex gap-3"><span className="text-primary font-bold">•</span> Weekends and public holidays: we&apos;ll get to you Monday</li>
                <li className="flex gap-3"><span className="text-primary font-bold">•</span> You&apos;ll receive an auto-reply confirming we got your message</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* COMPANY */}
      <section className="bg-[#F0F2F2]">
        <div className="max-w-[var(--container-max)] mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 text-primary font-semibold text-sm uppercase tracking-widest mb-4">
              <Building2 className="w-4 h-4" /> Company
            </div>
            <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 mb-3">Cartzii Marketplace</h2>
            <p className="text-slate-600 inline-flex items-center gap-2 justify-center">
              <MapPin className="w-4 h-4 text-primary" /> Ontario, Canada
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3 text-sm">
              <Link href="/about" className="bg-white border border-slate-200 text-slate-700 font-medium px-4 py-2 rounded-full hover:bg-slate-50 transition-colors">
                About Us
              </Link>
              <Link href="/careers" className="bg-white border border-slate-200 text-slate-700 font-medium px-4 py-2 rounded-full hover:bg-slate-50 transition-colors">
                Careers
              </Link>
              <Link href="/help" className="bg-white border border-slate-200 text-slate-700 font-medium px-4 py-2 rounded-full hover:bg-slate-50 transition-colors">
                Help Center
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

import { Breadcrumb } from '@/components/layout/Breadcrumb';
import {
  RotateCcw, Clock, CheckCircle2, XCircle, Mail, ShieldCheck,
  CreditCard, Package, AlertCircle, ArrowRight,
} from 'lucide-react';
import { generateAlternates } from '@/lib/seo';
import { Link } from '@/i18n/navigation';

const SUPPORT_EMAIL = 'support@cartzii.ca';

export async function generateMetadata() {
  const alternates = await generateAlternates(
    process.env.NEXT_PUBLIC_BASE_URL || 'https://cartzii.com',
    '/returns',
  );
  return {
    title: 'Returns & Refunds - Cartzii | Easy, Buyer-Protected Returns',
    description:
      'Cartzii returns and refunds: seller-specific policies, how to open a return, when you\'re refunded, and what our Buyer Protection covers. Email support@cartzii.ca for help.',
    alternates,
  };
}

export default async function ReturnsRefundsPage() {
  const supportMailto = `mailto:${SUPPORT_EMAIL}?subject=Cartzii%20-%20Return%20%2F%20refund%20request`;

  const steps = [
    { n: '01', title: 'Open the order', description: 'Sign in and go to Account → Orders. Find the item you want to return.' },
    { n: '02', title: 'Choose a reason', description: 'Pick from the list (wrong item, damaged, not as described, changed my mind). Add photos when helpful.' },
    { n: '03', title: 'Get the return label', description: 'If the seller\'s policy provides one, it\'s emailed to you immediately. Otherwise the seller shares return instructions.' },
    { n: '04', title: 'Ship it back', description: 'Drop the parcel at the carrier location on your label. Tracking updates on your order page.' },
    { n: '05', title: 'Get refunded', description: 'Refunds are issued to your original payment method within 5–10 business days after the seller confirms the return.' },
  ];

  const returnable = [
    'Unopened items in original packaging',
    'Items with all tags and accessories included',
    'Damaged, defective, or wrong items (always covered)',
    'Items significantly not-as-described',
  ];
  const nonReturnable = [
    'Custom, personalised, or made-to-order items',
    'Perishable goods and consumables',
    'Digital downloads once accessed',
    'Intimate apparel and pierced jewellery (hygiene)',
    'Items marked "Final Sale" on the product page',
  ];

  return (
    <div className="overflow-x-hidden">
      <div className="max-w-[var(--container-max)] mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        <Breadcrumb items={[{ label: 'Returns & Refunds' }]} />
      </div>

      {/* HERO */}
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
        <div className="absolute -top-40 -right-40 w-[600px] h-[600px] rounded-full bg-primary/20 blur-[120px] pointer-events-none" />
        <div className="relative max-w-[var(--container-max)] mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28 text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-4 py-2 text-sm font-medium mb-8">
            <RotateCcw className="w-4 h-4 text-amber-400" /> Simple, buyer-protected returns
          </div>
          <h1 className="text-5xl sm:text-6xl md:text-7xl font-extrabold tracking-tight mb-6 leading-none">
            Returns &amp;{' '}
            <span className="bg-gradient-to-r from-orange-400 via-primary to-red-500 bg-clip-text text-transparent">Refunds</span>
          </h1>
          <p className="text-lg md:text-xl text-slate-300 max-w-2xl mx-auto leading-relaxed">
            If it isn&apos;t right, we make it right. Every seller sets their own return window — Buyer Protection has your back either way.
          </p>
        </div>
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 80" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none" className="w-full h-16 md:h-20">
            <path d="M0 80L60 70C120 60 240 40 360 35C480 30 600 40 720 45C840 50 960 50 1080 45C1200 40 1320 30 1380 25L1440 20V80H0Z" fill="#F0F2F2" />
          </svg>
        </div>
      </section>

      {/* HOW TO RETURN */}
      <section className="bg-[#F0F2F2]">
        <div className="max-w-[var(--container-max)] mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-24">
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-2 text-primary font-semibold text-sm uppercase tracking-widest mb-4">
              <ArrowRight className="w-4 h-4" /> How it works
            </div>
            <h2 className="text-4xl md:text-5xl font-extrabold text-slate-900 mb-4">Start a return in 5 steps.</h2>
          </div>
          <div className="grid md:grid-cols-5 gap-4 max-w-6xl mx-auto">
            {steps.map((s) => (
              <div key={s.n} className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm">
                <div className="text-3xl font-extrabold text-primary/20 mb-2">{s.n}</div>
                <h3 className="text-base font-bold text-slate-900 mb-2">{s.title}</h3>
                <p className="text-sm text-slate-600 leading-relaxed">{s.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* POLICIES BY SELLER */}
      <section className="bg-white">
        <div className="max-w-[var(--container-max)] mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-24">
          <div className="max-w-4xl mx-auto bg-[#F0F2F2] rounded-3xl p-8 md:p-10 border border-slate-100">
            <div className="flex items-start gap-5">
              <div className="flex-shrink-0 w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center">
                <Clock className="w-7 h-7 text-primary" />
              </div>
              <div>
                <h2 className="text-2xl md:text-3xl font-extrabold text-slate-900 mb-3">Every seller sets their own window.</h2>
                <p className="text-slate-600 leading-relaxed mb-4">
                  Most Cartzii sellers offer <strong>14 or 30 day</strong> returns from delivery. Some categories are shorter,
                  and a few custom sellers offer no returns at all — this is always shown on the product page <em>before</em> you buy.
                </p>
                <p className="text-slate-600 leading-relaxed">
                  Regardless of the seller&apos;s policy, if an item arrives <strong>damaged, defective, or significantly not-as-described</strong>,
                  Cartzii Buyer Protection covers you.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* RETURNABLE VS NON */}
      <section className="bg-[#F0F2F2]">
        <div className="max-w-[var(--container-max)] mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-24">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
                  <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                </div>
                <h3 className="text-2xl font-bold text-slate-900">Generally returnable</h3>
              </div>
              <ul className="space-y-3">
                {returnable.map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-emerald-500 mt-0.5 flex-shrink-0" />
                    <span className="text-slate-700">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
                  <XCircle className="w-6 h-6 text-red-600" />
                </div>
                <h3 className="text-2xl font-bold text-slate-900">Generally non-returnable</h3>
              </div>
              <ul className="space-y-3">
                {nonReturnable.map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <XCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
                    <span className="text-slate-700">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* REFUND DETAILS */}
      <section className="bg-white">
        <div className="max-w-[var(--container-max)] mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-24">
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { icon: CreditCard, title: 'How you\'re refunded', text: 'Always to your original payment method — card, wallet, or store credit if that\'s what you used.' },
              { icon: Clock, title: 'How long it takes', text: '5–10 business days after the seller confirms your return. Some banks post the refund the same day.' },
              { icon: Package, title: 'Shipping costs', text: 'If the return is the seller\'s fault (wrong item, defective), return shipping is covered. Otherwise it may be deducted.' },
              { icon: ShieldCheck, title: 'Buyer Protection', text: 'If the seller doesn\'t respond in 3 business days, escalate the order. Cartzii reviews and issues a decision within 5.' },
              { icon: RotateCcw, title: 'Exchanges', text: 'Not automatic yet — start a return, then place a new order for the correct size or variant.' },
              { icon: AlertCircle, title: 'Partial refunds', text: 'Reserved for items returned outside the seller\'s policy window or with obvious wear beyond inspection.' },
            ].map((item) => (
              <div key={item.title} className="bg-[#F0F2F2] rounded-3xl p-6 border border-slate-100">
                <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center mb-4 shadow-sm">
                  <item.icon className="w-5 h-5 text-primary" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">{item.title}</h3>
                <p className="text-sm text-slate-600 leading-relaxed">{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-gradient-to-r from-slate-900 via-primary/90 to-slate-900">
        <div className="max-w-[var(--container-max)] mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center text-white">
          <h2 className="text-3xl md:text-4xl font-extrabold mb-4">Need help with a return?</h2>
          <p className="text-white/80 max-w-xl mx-auto mb-8">Email us with your order number and we&apos;ll walk you through it.</p>
          <a href={supportMailto} className="inline-flex items-center gap-2 bg-white text-slate-900 font-semibold px-8 py-4 rounded-2xl hover:bg-slate-100 transition-colors">
            <Mail className="w-5 h-5" /> {SUPPORT_EMAIL}
          </a>
          <div className="mt-6 text-sm">
            <Link href="/help" className="text-white/80 hover:text-white underline underline-offset-4">
              Browse the Help Center
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

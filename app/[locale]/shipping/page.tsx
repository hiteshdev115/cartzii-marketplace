import { Breadcrumb } from '@/components/layout/Breadcrumb';
import {
  Truck, Globe, Clock, PackageCheck, Mail, ShieldCheck, Info,
  MapPin, Package, CreditCard, AlertCircle,
} from 'lucide-react';
import { generateAlternates } from '@/lib/seo';
import { Link } from '@/i18n/navigation';

const SUPPORT_EMAIL = 'support@cartzii.ca';

export async function generateMetadata() {
  const alternates = await generateAlternates(
    process.env.NEXT_PUBLIC_BASE_URL || 'https://cartzii.com',
    '/shipping',
  );
  return {
    title: 'Shipping Information - Cartzii | Rates, Times & Tracking',
    description:
      'Cartzii shipping information: domestic and international rates, delivery times, tracking, DDP customs, and split shipments. Email support@cartzii.ca for shipping questions.',
    alternates,
  };
}

export default async function ShippingInfoPage() {
  const supportMailto = `mailto:${SUPPORT_EMAIL}?subject=Cartzii%20-%20Shipping%20question`;

  const zones = [
    {
      icon: MapPin,
      title: 'Domestic (Canada & US)',
      speed: '2–7 business days',
      cost: 'Free over CA$50 / US$50',
      description: 'Standard ground service with Canada Post, UPS, or FedEx. Expedited options available at checkout.',
      gradient: 'from-primary to-orange-600',
    },
    {
      icon: Globe,
      title: 'International (DDP)',
      speed: '5–14 business days',
      cost: 'Calculated at checkout',
      description: 'DHL Express Worldwide and other carriers. Duties and taxes are prepaid — no surprise fees on delivery.',
      gradient: 'from-blue-500 to-indigo-600',
    },
  ];

  const steps = [
    { icon: Package, title: 'Order placed', description: 'You get an instant order confirmation email with a summary of every item.' },
    { icon: PackageCheck, title: 'Seller preparing', description: 'The seller has 1–3 business days to pack and hand your parcel to the carrier.' },
    { icon: Truck, title: 'In transit', description: 'The moment the label is scanned, tracking goes live in your Cartzii account and by email.' },
    { icon: MapPin, title: 'Delivered', description: 'Carrier confirms delivery. If anything is wrong, you have 30 days to open a return.' },
  ];

  return (
    <div className="overflow-x-hidden">
      <div className="max-w-[var(--container-max)] mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        <Breadcrumb items={[{ label: 'Shipping Information' }]} />
      </div>

      {/* HERO */}
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
        <div className="absolute -top-40 -right-40 w-[600px] h-[600px] rounded-full bg-primary/20 blur-[120px] pointer-events-none" />
        <div className="relative max-w-[var(--container-max)] mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28 text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-4 py-2 text-sm font-medium mb-8">
            <Truck className="w-4 h-4 text-amber-400" /> Fast, tracked, and transparent
          </div>
          <h1 className="text-5xl sm:text-6xl md:text-7xl font-extrabold tracking-tight mb-6 leading-none">
            Shipping{' '}
            <span className="bg-gradient-to-r from-orange-400 via-primary to-red-500 bg-clip-text text-transparent">Info</span>
          </h1>
          <p className="text-lg md:text-xl text-slate-300 max-w-2xl mx-auto leading-relaxed">
            How your Cartzii order gets to you — the rates, the timelines, and the tracking.
          </p>
        </div>
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 80" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none" className="w-full h-16 md:h-20">
            <path d="M0 80L60 70C120 60 240 40 360 35C480 30 600 40 720 45C840 50 960 50 1080 45C1200 40 1320 30 1380 25L1440 20V80H0Z" fill="#F0F2F2" />
          </svg>
        </div>
      </section>

      {/* ZONES */}
      <section className="bg-[#F0F2F2]">
        <div className="max-w-[var(--container-max)] mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-24">
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-2 text-primary font-semibold text-sm uppercase tracking-widest mb-4">
              <Globe className="w-4 h-4" /> Rates & Times
            </div>
            <h2 className="text-4xl md:text-5xl font-extrabold text-slate-900 mb-4">Where we ship.</h2>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {zones.map((z) => (
              <div key={z.title} className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm">
                <div className={`w-14 h-14 bg-gradient-to-br ${z.gradient} rounded-2xl flex items-center justify-center mb-5 shadow-lg`}>
                  <z.icon className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-slate-900 mb-3">{z.title}</h3>
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="bg-[#F0F2F2] rounded-xl p-3">
                    <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-1">Delivery</p>
                    <p className="text-slate-900 font-bold">{z.speed}</p>
                  </div>
                  <div className="bg-[#F0F2F2] rounded-xl p-3">
                    <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-1">Cost</p>
                    <p className="text-slate-900 font-bold">{z.cost}</p>
                  </div>
                </div>
                <p className="text-slate-600 leading-relaxed">{z.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* JOURNEY */}
      <section className="bg-white">
        <div className="max-w-[var(--container-max)] mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-24">
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-2 text-primary font-semibold text-sm uppercase tracking-widest mb-4">
              <Clock className="w-4 h-4" /> The Journey
            </div>
            <h2 className="text-4xl md:text-5xl font-extrabold text-slate-900 mb-4">Order to doorstep.</h2>
          </div>
          <div className="grid md:grid-cols-4 gap-6 max-w-5xl mx-auto">
            {steps.map((s, i) => (
              <div key={s.title} className="relative bg-[#F0F2F2] rounded-3xl p-6 border border-slate-100">
                <div className="absolute -top-3 -left-3 w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center font-bold text-sm shadow-lg">
                  {i + 1}
                </div>
                <s.icon className="w-8 h-8 text-primary mb-4" />
                <h3 className="text-lg font-bold text-slate-900 mb-2">{s.title}</h3>
                <p className="text-sm text-slate-600 leading-relaxed">{s.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* GOOD-TO-KNOW */}
      <section className="bg-[#F0F2F2]">
        <div className="max-w-[var(--container-max)] mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-24">
          <div className="grid md:grid-cols-2 gap-6">
            {[
              { icon: PackageCheck, title: 'Split shipments', text: 'A cart with multiple sellers ships in multiple parcels. Each has its own tracking number. You are not charged extra for the split.' },
              { icon: CreditCard, title: 'Duties & taxes', text: 'International orders use DDP: duties and taxes are collected at checkout so the carrier does not bill you on arrival.' },
              { icon: AlertCircle, title: 'Delays & lost parcels', text: 'If tracking has not updated for 7 days, or a parcel is marked lost, email us. We coordinate the carrier claim and your refund or replacement.' },
              { icon: ShieldCheck, title: 'Wrong address?', text: 'You can edit the shipping address any time before the seller marks the order Preparing. After that, contact support and we will try to intercept.' },
              { icon: Info, title: 'Custom & handmade', text: 'Made-to-order items have their own preparation window shown on the product page — this is on top of the shipping time.' },
              { icon: Truck, title: 'Signature on delivery', text: 'High-value parcels ship with signature required. If nobody is home, the carrier leaves a redelivery notice.' },
            ].map((item) => (
              <div key={item.title} className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm">
                <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center mb-3">
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
          <h2 className="text-3xl md:text-4xl font-extrabold mb-4">Question about your shipment?</h2>
          <p className="text-white/80 max-w-xl mx-auto mb-8">Include your order number and we&apos;ll get straight to it.</p>
          <a href={supportMailto} className="inline-flex items-center gap-2 bg-white text-slate-900 font-semibold px-8 py-4 rounded-2xl hover:bg-slate-100 transition-colors">
            <Mail className="w-5 h-5" /> {SUPPORT_EMAIL}
          </a>
          <div className="mt-6 text-sm">
            <Link href="/help" className="text-white/80 hover:text-white underline underline-offset-4">
              Or browse the Help Center
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

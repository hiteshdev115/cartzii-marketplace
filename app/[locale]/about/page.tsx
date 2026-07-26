import { Breadcrumb } from '@/components/layout/Breadcrumb';
import {
  ShieldCheck, Truck, HeartHandshake, Globe, Users, Award,
  Sparkles, Zap, Star, ArrowRight, CheckCircle2, TrendingUp,
  Package, Headphones, MapPin, Rocket
} from 'lucide-react';
import { generateAlternates } from '@/lib/seo';
import Link from 'next/link';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const alternates = generateAlternates(process.env.NEXT_PUBLIC_BASE_URL || 'https://cartzii.com', '/about', locale);
  return {
    title: 'About Us - Cartziio | Your Trusted Marketplace',
    description: 'Discover the story behind Cartziio — a next-generation marketplace built on trust, quality, and innovation. Learn about our mission, values, and the team behind your shopping experience.',
    alternates,
  };
}

export default async function AboutPage() {

  const values = [
    {
      icon: ShieldCheck,
      title: 'Quality First',
      description: 'Every product on Cartziio is hand-curated from verified sellers and trusted brands — no compromises.',
      gradient: 'from-orange-500 to-red-600',
      bg: 'bg-orange-50',
    },
    {
      icon: Truck,
      title: 'Lightning Delivery',
      description: 'Free shipping on orders over $50 with real-time tracking and same-day dispatch on select items.',
      gradient: 'from-blue-500 to-indigo-600',
      bg: 'bg-blue-50',
    },
    {
      icon: HeartHandshake,
      title: 'Human-First Support',
      description: 'Real people, real help — 24/7. Our support team is always ready to make things right.',
      gradient: 'from-pink-500 to-rose-600',
      bg: 'bg-pink-50',
    },
    {
      icon: Globe,
      title: 'Global Reach',
      description: 'Serving shoppers across North America with fully localized experiences in multiple languages.',
      gradient: 'from-emerald-500 to-teal-600',
      bg: 'bg-emerald-50',
    },
    {
      icon: Users,
      title: 'Thriving Community',
      description: 'Over 100,000 happy customers and growing. Join a community that shops smarter together.',
      gradient: 'from-violet-500 to-purple-600',
      bg: 'bg-violet-50',
    },
    {
      icon: Award,
      title: 'Best-in-Class Prices',
      description: 'Exclusive deals, flash sales, and loyalty rewards — we work hard so you always get more.',
      gradient: 'from-amber-500 to-yellow-600',
      bg: 'bg-amber-50',
    },
  ];

  const stats = [
    { value: '50K+', label: 'Products Listed', icon: Package },
    { value: '100K+', label: 'Happy Customers', icon: Users },
    { value: '2', label: 'Countries Served', icon: MapPin },
    { value: '99%', label: 'Satisfaction Rate', icon: Star },
  ];

  const milestones = [
    { year: '2022', title: 'The Spark', description: 'Cartziio was founded with a simple idea: make online shopping feel personal again.' },
    { year: '2023', title: 'First 10K Customers', description: 'We hit our first major milestone and expanded our product catalog to 10,000+ items.' },
    { year: '2024', title: 'Going Bilingual', description: 'Launched full French-language support and expanded into Canadian markets.' },
    { year: '2025', title: 'Platform 2.0', description: 'Complete platform rebuild with AI-powered recommendations and a reimagined checkout experience.' },
    { year: '2026', title: 'The Future', description: 'Expanding to new categories, new countries, and building the marketplace of tomorrow.' },
  ];

  const whyUs = [
    'Verified sellers and authentic products only',
    'Secure, encrypted checkout with multiple payment options',
    'Hassle-free returns within 30 days',
    'Real-time order tracking from dispatch to door',
    'Exclusive member deals and early access sales',
    'Eco-conscious packaging initiatives',
  ];

  return (
    <div className="overflow-x-hidden">
      {/* Breadcrumb */}
      <div className="max-w-[var(--container-max)] mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        <Breadcrumb items={[{ label: 'About Us' }]} />
      </div>

      {/* ─── HERO ─────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
        {/* Decorative blobs */}
        <div className="absolute -top-40 -right-40 w-[600px] h-[600px] rounded-full bg-primary/20 blur-[120px] pointer-events-none" />
        <div className="absolute -bottom-40 -left-40 w-[500px] h-[500px] rounded-full bg-orange-400/15 blur-[100px] pointer-events-none" />

        <div className="relative max-w-[var(--container-max)] mx-auto px-4 sm:px-6 lg:px-8 py-24 md:py-36 text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-4 py-2 text-sm font-medium mb-8">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>Built for the modern shopper</span>
          </div>

          <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-extrabold tracking-tight mb-6 leading-none">
            Shop Smarter.{' '}
            <span className="bg-gradient-to-r from-orange-400 via-primary to-red-500 bg-clip-text text-transparent">
              Live Better.
            </span>
          </h1>

          <p className="text-lg md:text-xl text-slate-300 max-w-2xl mx-auto leading-relaxed mb-10">
            Cartziio is more than a marketplace — it&apos;s a curated world of quality products, 
            trusted sellers, and an experience designed entirely around you.
          </p>

          <div className="flex flex-wrap justify-center gap-4">
            <Link
              href="/en-US/products"
              className="inline-flex items-center gap-2 bg-primary hover:bg-primary-dark text-white font-semibold px-8 py-4 rounded-2xl transition-all duration-300 hover:scale-105 shadow-lg shadow-primary/30"
            >
              Start Shopping <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              href="/en-US/categories"
              className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/20 text-white font-semibold px-8 py-4 rounded-2xl transition-all duration-300"
            >
              Explore Categories
            </Link>
          </div>
        </div>

        {/* Bottom wave */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 80" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none" className="w-full h-16 md:h-20">
            <path d="M0 80L60 70C120 60 240 40 360 35C480 30 600 40 720 45C840 50 960 50 1080 45C1200 40 1320 30 1380 25L1440 20V80H0Z" fill="#F0F2F2" />
          </svg>
        </div>
      </section>

      {/* ─── BRAND STORY ──────────────────────────────────────── */}
      <section className="bg-[#F0F2F2]">
        <div className="max-w-[var(--container-max)] mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            <div>
              <div className="inline-flex items-center gap-2 text-primary font-semibold text-sm uppercase tracking-widest mb-4">
                <Zap className="w-4 h-4" /> Our Story
              </div>
              <h2 className="text-4xl md:text-5xl font-extrabold text-slate-900 leading-tight mb-6">
                We didn&apos;t just build a <span className="text-primary">store</span> — we built a <span className="text-primary">movement.</span>
              </h2>
              <p className="text-slate-600 text-lg leading-relaxed mb-6">
                Cartziio was born out of frustration with the ordinary. We saw a world of online shopping 
                that felt cold, cluttered, and untrusted — and we knew we could do better.
              </p>
              <p className="text-slate-600 text-lg leading-relaxed mb-8">
                From a small team with a big dream, we&apos;ve grown into a thriving marketplace trusted by 
                over 100,000 customers across North America. Every feature, every product, every interaction 
                is crafted with one goal: <strong className="text-slate-900">to delight you.</strong>
              </p>
              <div className="flex flex-wrap gap-3">
                {['Authentic Products', 'Verified Sellers', 'Secure Payments', 'Real Support'].map((tag) => (
                  <span key={tag} className="bg-white border border-slate-200 text-slate-700 text-sm font-medium px-4 py-2 rounded-full shadow-sm">
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            {/* Visual card stack */}
            <div className="relative flex items-center justify-center min-h-[380px]">
              <div className="absolute w-72 h-72 bg-gradient-to-br from-primary/10 to-orange-300/20 rounded-3xl rotate-6 shadow-xl" />
              <div className="absolute w-72 h-72 bg-gradient-to-br from-slate-100 to-white rounded-3xl -rotate-3 shadow-xl border border-slate-200" />
              <div className="relative bg-white rounded-3xl p-8 shadow-2xl border border-slate-100 w-72 z-10">
                <div className="w-16 h-16 bg-gradient-to-br from-primary to-orange-600 rounded-2xl flex items-center justify-center mb-5 shadow-lg shadow-primary/30">
                  <Rocket className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-slate-900 mb-2">Founded 2022</h3>
                <p className="text-slate-500 text-sm leading-relaxed">
                  A marketplace reimagined from the ground up — for shoppers who expect more.
                </p>
                <div className="mt-5 pt-5 border-t border-slate-100 flex items-center gap-3">
                  <div className="flex -space-x-2">
                    {['bg-primary', 'bg-blue-500', 'bg-emerald-500', 'bg-amber-500'].map((c, i) => (
                      <div key={i} className={`w-8 h-8 ${c} rounded-full border-2 border-white flex items-center justify-center text-white text-xs font-bold`}>
                        {String.fromCharCode(65 + i)}
                      </div>
                    ))}
                  </div>
                  <span className="text-xs text-slate-500 font-medium">100K+ happy customers</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── STATS ────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-gradient-to-r from-slate-900 via-primary/90 to-slate-900">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-primary/30 via-transparent to-transparent pointer-events-none" />
        <div className="relative max-w-[var(--container-max)] mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-4 py-2 text-white/80 text-sm font-medium mb-4">
              <TrendingUp className="w-4 h-4" /> Growing every day
            </div>
            <h2 className="text-4xl md:text-5xl font-extrabold text-white">Cartziio in Numbers</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center group">
                <div className="inline-flex items-center justify-center w-14 h-14 bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl mb-4 group-hover:bg-white/20 transition-all">
                  <stat.icon className="w-7 h-7 text-white" />
                </div>
                <p className="text-4xl md:text-5xl font-extrabold text-white mb-1">{stat.value}</p>
                <p className="text-white/60 text-sm font-medium">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── VALUES ───────────────────────────────────────────── */}
      <section className="bg-[#F0F2F2]">
        <div className="max-w-[var(--container-max)] mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 text-primary font-semibold text-sm uppercase tracking-widest mb-4">
              <HeartHandshake className="w-4 h-4" /> What We Stand For
            </div>
            <h2 className="text-4xl md:text-5xl font-extrabold text-slate-900 mb-4">Our Core Values</h2>
            <p className="text-slate-500 text-lg max-w-xl mx-auto">
              These aren&apos;t just words on a wall — they&apos;re the principles behind every decision we make.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {values.map((value) => (
              <div
                key={value.title}
                className="group bg-white rounded-3xl p-8 shadow-sm border border-slate-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
              >
                <div className={`w-14 h-14 bg-gradient-to-br ${value.gradient} rounded-2xl flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                  <value.icon className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">{value.title}</h3>
                <p className="text-slate-500 leading-relaxed">{value.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── MISSION + WHY US ─────────────────────────────────── */}
      <section className="bg-white">
        <div className="max-w-[var(--container-max)] mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28">
          <div className="grid lg:grid-cols-2 gap-16 items-start">
            {/* Mission */}
            <div>
              <div className="inline-flex items-center gap-2 text-primary font-semibold text-sm uppercase tracking-widest mb-4">
                <Rocket className="w-4 h-4" /> Our Mission
              </div>
              <h2 className="text-4xl md:text-5xl font-extrabold text-slate-900 leading-tight mb-6">
                Shopping that feels <span className="text-primary">right.</span>
              </h2>
              <p className="text-slate-600 text-lg leading-relaxed mb-6">
                At Cartziio, our mission is to bridge the gap between quality products and the people who deserve them. 
                We believe that great shopping is about more than just transactions — it&apos;s about discovery, trust, and joy.
              </p>
              <p className="text-slate-600 text-lg leading-relaxed">
                From electronics to fashion, home essentials to wellness — everything is chosen with intention. 
                We hold ourselves to the highest standard so you never have to settle.
              </p>
            </div>

            {/* Why us checklist */}
            <div>
              <div className="inline-flex items-center gap-2 text-primary font-semibold text-sm uppercase tracking-widest mb-4">
                <CheckCircle2 className="w-4 h-4" /> Why Choose Cartziio
              </div>
              <h2 className="text-4xl md:text-5xl font-extrabold text-slate-900 leading-tight mb-8">
                The Cartziio <span className="text-primary">difference.</span>
              </h2>
              <ul className="space-y-4">
                {whyUs.map((item) => (
                  <li key={item} className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center mt-0.5">
                      <CheckCircle2 className="w-4 h-4 text-primary" />
                    </div>
                    <span className="text-slate-700 text-base leading-relaxed">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ─── TIMELINE ─────────────────────────────────────────── */}
      <section className="bg-[#F0F2F2]">
        <div className="max-w-[var(--container-max)] mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 text-primary font-semibold text-sm uppercase tracking-widest mb-4">
              <TrendingUp className="w-4 h-4" /> Our Journey
            </div>
            <h2 className="text-4xl md:text-5xl font-extrabold text-slate-900">How We Got Here</h2>
          </div>

          <div className="relative max-w-3xl mx-auto">
            {/* Vertical line */}
            <div className="absolute left-6 md:left-1/2 top-0 bottom-0 w-0.5 bg-gradient-to-b from-primary via-orange-400 to-slate-200 md:-translate-x-px" />

            <div className="space-y-10">
              {milestones.map((m, i) => (
                <div key={m.year} className={`relative flex items-start gap-6 md:gap-0 ${i % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'}`}>
                  {/* Content */}
                  <div className={`md:w-[calc(50%-3rem)] pl-14 md:pl-0 ${i % 2 === 0 ? 'md:pr-10 md:text-right' : 'md:pl-10 md:text-left'}`}>
                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
                      <span className="text-xs font-bold text-primary uppercase tracking-widest">{m.year}</span>
                      <h3 className="text-xl font-bold text-slate-900 mt-1 mb-2">{m.title}</h3>
                      <p className="text-slate-500 text-sm leading-relaxed">{m.description}</p>
                    </div>
                  </div>

                  {/* Dot */}
                  <div className="absolute left-6 md:left-1/2 md:-translate-x-1/2 w-3 h-3 bg-primary rounded-full ring-4 ring-white shadow-md mt-6" />

                  {/* Spacer for opposite side */}
                  <div className="hidden md:block md:w-[calc(50%-3rem)]" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ─── SUPPORT PILLARS ──────────────────────────────────── */}
      <section className="bg-white">
        <div className="max-w-[var(--container-max)] mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28">
          <div className="text-center mb-14">
            <h2 className="text-4xl md:text-5xl font-extrabold text-slate-900 mb-4">Every Step of the Way</h2>
            <p className="text-slate-500 text-lg max-w-lg mx-auto">From browse to doorstep, we&apos;ve got your back.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: Package, title: 'Curated Catalog', desc: '50K+ products across categories, all verified for quality and authenticity.', color: 'text-orange-500', bg: 'bg-orange-50' },
              { icon: Truck, title: 'Fast Shipping', desc: 'Express delivery options with real-time GPS tracking on every order.', color: 'text-blue-500', bg: 'bg-blue-50' },
              { icon: ShieldCheck, title: 'Buyer Protection', desc: 'Every purchase is covered by our full money-back guarantee policy.', color: 'text-emerald-500', bg: 'bg-emerald-50' },
              { icon: Headphones, title: '24/7 Support', desc: 'Chat, email, or call — our team is always available to help.', color: 'text-violet-500', bg: 'bg-violet-50' },
            ].map((p) => (
              <div key={p.title} className="group text-center p-8 rounded-3xl border border-slate-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 bg-white">
                <div className={`inline-flex items-center justify-center w-16 h-16 ${p.bg} rounded-2xl mb-5 group-hover:scale-110 transition-transform duration-300`}>
                  <p.icon className={`w-8 h-8 ${p.color}`} />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">{p.title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed">{p.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CTA ──────────────────────────────────────────────── */}
      <section className="bg-[#F0F2F2] pb-20 md:pb-28">
        <div className="max-w-[var(--container-max)] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl px-8 py-16 md:py-20 text-center text-white shadow-2xl">
            <div className="absolute -top-20 -right-20 w-80 h-80 bg-primary/25 rounded-full blur-[80px] pointer-events-none" />
            <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-orange-400/15 rounded-full blur-[80px] pointer-events-none" />
            <div className="relative">
              <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-4 py-2 text-sm font-medium mb-6">
                <Star className="w-4 h-4 text-amber-400 fill-amber-400" /> Join 100,000+ happy shoppers
              </div>
              <h2 className="text-4xl md:text-5xl font-extrabold mb-4 leading-tight">
                Ready to experience{' '}
                <span className="bg-gradient-to-r from-orange-400 to-red-400 bg-clip-text text-transparent">
                  Cartziio?
                </span>
              </h2>
              <p className="text-slate-300 text-lg max-w-xl mx-auto mb-10">
                Discover thousands of curated products, unbeatable deals, and a shopping experience you&apos;ll actually enjoy.
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                <Link
                  href="/en-US/products"
                  className="inline-flex items-center gap-2 bg-primary hover:bg-primary-dark text-white font-bold px-10 py-4 rounded-2xl transition-all duration-300 hover:scale-105 shadow-lg shadow-primary/40 text-base"
                >
                  Shop Now <ArrowRight className="w-5 h-5" />
                </Link>
                <Link
                  href="/en-US/deals"
                  className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-semibold px-10 py-4 rounded-2xl transition-all duration-300 text-base"
                >
                  View Deals
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

import { Breadcrumb } from '@/components/layout/Breadcrumb';
import {
  Sparkles, Mail, ArrowRight, Truck, RotateCcw, CreditCard, ShieldCheck,
  Store, Wallet, PackageCheck, Search, LifeBuoy, MessageSquare, ExternalLink,
  ShoppingBag, Briefcase, ChevronRight,
} from 'lucide-react';
import { generateAlternates } from '@/lib/seo';
import { Link } from '@/i18n/navigation';

const SUPPORT_EMAIL = 'support@cartzii.ca';
// Where "Become a seller" / "Open Quickstart" send the visitor. Points at
// the wizard's entry step, which handles both new signups (renders the
// register form) and returning sellers (auto-forwards to their resume
// step). Set per environment via env var; defaults to the QA .ca URL.
const SELLER_QUICKSTART_URL =
  process.env.NEXT_PUBLIC_SELLER_WIZARD_URL
  ?? 'https://qa-seller.cartzii.ca/onboarding/account-basics';

export async function generateMetadata() {
  const alternates = await generateAlternates(
    process.env.NEXT_PUBLIC_BASE_URL || 'https://cartzii.com',
    '/help',
  );
  return {
    title: 'Help Center - Cartzii | Buyer & Seller Support',
    description:
      'Find answers about orders, returns, payments, buyer protection, seller onboarding, payouts, shipping, and storefront SEO. Email support@cartzii.ca for quick help.',
    alternates,
  };
}

type Article = { title: string; description: string };
type Category = {
  icon: typeof Truck;
  title: string;
  description: string;
  gradient: string;
  articles: Article[];
};

export default async function HelpCenterPage() {
  const buyerCategories: Category[] = [
    {
      icon: Truck,
      title: 'Order Tracking',
      description: 'How to find shipping updates and track custom packages.',
      gradient: 'from-blue-500 to-indigo-600',
      articles: [
        { title: 'Where is my order?', description: 'Check real-time status from your account, or use the tracking number in your shipment email.' },
        { title: 'Tracking custom & handmade packages', description: 'Made-to-order items may take longer to ship. The seller confirms the dispatch date on your order page.' },
        { title: 'Split shipments explained', description: 'A cart with multiple sellers ships in multiple parcels — each with its own tracking number.' },
        { title: 'Delivery estimates & delays', description: 'What to do if the carrier marks your package as delayed or lost in transit.' },
      ],
    },
    {
      icon: RotateCcw,
      title: 'Returns & Refunds',
      description: 'Step-by-step guides on how to request a refund based on individual vendor policies.',
      gradient: 'from-orange-500 to-red-600',
      articles: [
        { title: 'How to start a return', description: 'Open the order, choose the item, and pick a reason. We\'ll walk you through the seller\'s policy.' },
        { title: 'Seller-specific return windows', description: 'Every seller sets their own return window (7, 14, or 30 days). The exact policy is shown before checkout.' },
        { title: 'When will I be refunded?', description: 'Refunds are issued once the seller confirms the return. Funds typically appear on your card in 5–10 business days.' },
        { title: 'Non-returnable items', description: 'Custom, personalised, or perishable goods may be final sale — this is disclosed on the product page.' },
      ],
    },
    {
      icon: CreditCard,
      title: 'Account & Payments',
      description: 'Managing saved cards, changing shipping addresses, and troubleshooting failed transactions.',
      gradient: 'from-emerald-500 to-teal-600',
      articles: [
        { title: 'Add, remove, or update a saved card', description: 'Manage payment methods from Account → Payments. We store them securely with Stripe.' },
        { title: 'Update your shipping address', description: 'Edit your default address in Account → Addresses, or change it during checkout before you pay.' },
        { title: 'Why was my card declined?', description: 'Common reasons: expired card, incorrect ZIP, or a bank hold on international merchants. Try another card or contact your bank.' },
        { title: 'Missing charges or duplicates', description: 'Pending authorisations may look like duplicates — they clear within a few days if the order didn\'t complete.' },
      ],
    },
    {
      icon: ShieldCheck,
      title: 'Buyer Protection',
      description: 'How Cartzii protects you if a seller fails to ship an item or the item arrives not as described.',
      gradient: 'from-violet-500 to-purple-600',
      articles: [
        { title: 'What Cartzii Buyer Protection covers', description: 'Non-delivery, significantly-not-as-described items, and unauthorised transactions are all covered.' },
        { title: 'Opening a protection claim', description: 'If the seller doesn\'t resolve the issue within 3 business days, escalate the order to Cartzii for review.' },
        { title: 'How refunds are decided', description: 'Our team reviews the order, messages, tracking, and photos before issuing a decision — usually within 5 business days.' },
        { title: 'Fraud & unauthorised charges', description: 'Report unrecognised orders immediately. We freeze the shipment and work with your bank on the chargeback.' },
      ],
    },
  ];

  const sellerCategories: Category[] = [
    {
      icon: Store,
      title: 'Shop Onboarding',
      description: 'Set up your storefront, configure payout methods, and list your first product.',
      gradient: 'from-primary to-orange-600',
      articles: [
        { title: 'Create your storefront', description: 'Add your shop name, logo, banner, and policies. Your storefront is live the moment you publish your first product.' },
        { title: 'Connect your payouts with Stripe Connect', description: 'Cartzii uses Stripe Connect for payouts. Complete Stripe\'s embedded onboarding once — we handle KYC and cross-border compliance from there.' },
        { title: 'List your first product', description: 'Title, description, price, variants, inventory, shipping profile, and images. Our editor validates each step before you publish.' },
        { title: 'Onboarding checklist', description: 'Track exactly what Stripe still needs (ID, bank details, tax info) from your seller dashboard notification banner.' },
      ],
    },
    {
      icon: Wallet,
      title: 'Fees & Payouts',
      description: 'Absolute transparency on marketplace commission, processing fees, and payout schedules.',
      gradient: 'from-emerald-500 to-teal-600',
      articles: [
        { title: 'Marketplace commission', description: 'Cartzii\'s commission is 9.99% on the goods subtotal (tax and shipping are excluded from the commission base).' },
        { title: 'Stripe processing fees', description: 'Stripe\'s standard card-processing fee applies to every transaction and is billed to the platform, not to you.' },
        { title: 'When you get paid', description: 'Payouts are triggered per order once the buyer\'s Cartzii return window closes. Funds land in your bank via Stripe\'s standard schedule.' },
        { title: 'Reading your seller ledger', description: 'Every payout line matches an order line: gross, commission, refund, and net transfer are itemised so nothing is guessed.' },
      ],
    },
    {
      icon: PackageCheck,
      title: 'Shipping & Fulfillment',
      description: 'Set up shipping profiles, print labels, and handle international orders.',
      gradient: 'from-blue-500 to-indigo-600',
      articles: [
        { title: 'Build a shipping profile', description: 'Define zones, weight brackets, and rates once — then attach the profile to any product. Update in one place, apply everywhere.' },
        { title: 'Print carrier labels', description: 'Buy DHL, Canada Post, and UPS labels directly from your order dashboard. Tracking is auto-attached to the buyer\'s order.' },
        { title: 'Selling internationally', description: 'DDP shipping and customs paperwork are generated automatically for eligible destinations. Ineligible countries are hidden at checkout.' },
        { title: 'Handling lost or damaged parcels', description: 'File the carrier claim, mark the order in Cartzii, and we coordinate the buyer refund and replacement.' },
      ],
    },
    {
      icon: Search,
      title: 'Storefront SEO',
      description: 'How our slug generator and keyword fields help you rank on Google.',
      gradient: 'from-amber-500 to-yellow-600',
      articles: [
        { title: 'Write a Google-friendly title', description: 'Lead with the product noun, follow with distinguishing details. Cartzii generates a clean, hyphenated slug from this title automatically.' },
        { title: 'Using the keyword fields', description: 'Keywords are indexed for on-site search AND emitted as structured data. Use the exact terms shoppers actually type — not internal jargon.' },
        { title: 'Product descriptions that rank', description: 'Cover materials, dimensions, use cases, and what makes it different. Cartzii injects these into schema.org Product markup for you.' },
        { title: 'Images, alt text & filenames', description: 'Descriptive filenames and alt text help both accessibility and Google Images. Cartzii serves your images through a globally cached CDN.' },
      ],
    },
  ];

  const supportMailto = `mailto:${SUPPORT_EMAIL}?subject=Cartzii%20Help%20Center%20-%20Support%20Request`;

  return (
    <div className="overflow-x-hidden">
      {/* Breadcrumb */}
      <div className="max-w-[var(--container-max)] mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        <Breadcrumb items={[{ label: 'Help Center' }]} />
      </div>

      {/* ─── HERO ─────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
        <div className="absolute -top-40 -right-40 w-[600px] h-[600px] rounded-full bg-primary/20 blur-[120px] pointer-events-none" />
        <div className="absolute -bottom-40 -left-40 w-[500px] h-[500px] rounded-full bg-orange-400/15 blur-[100px] pointer-events-none" />

        <div className="relative max-w-[var(--container-max)] mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28 text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-4 py-2 text-sm font-medium mb-8">
            <LifeBuoy className="w-4 h-4 text-amber-400" />
            <span>How can we help?</span>
          </div>

          <h1 className="text-5xl sm:text-6xl md:text-7xl font-extrabold tracking-tight mb-6 leading-none">
            Help{' '}
            <span className="bg-gradient-to-r from-orange-400 via-primary to-red-500 bg-clip-text text-transparent">
              Center
            </span>
          </h1>

          <p className="text-lg md:text-xl text-slate-300 max-w-2xl mx-auto leading-relaxed mb-10">
            Answers for shoppers and sellers — from tracking a parcel to setting up your Stripe Connect payouts.
            Can&apos;t find what you need? Our team is one email away.
          </p>

          <div className="flex flex-wrap justify-center gap-4">
            <a
              href="#buyers"
              className="inline-flex items-center gap-2 bg-primary hover:bg-primary-dark text-white font-semibold px-8 py-4 rounded-2xl transition-all duration-300 hover:scale-105 shadow-lg shadow-primary/30"
            >
              <ShoppingBag className="w-5 h-5" /> I&apos;m a buyer
            </a>
            <a
              href="#sellers"
              className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/20 text-white font-semibold px-8 py-4 rounded-2xl transition-all duration-300"
            >
              <Briefcase className="w-5 h-5" /> I&apos;m a seller
            </a>
          </div>

          {/* Quick support strip */}
          <div className="mt-12 inline-flex flex-wrap items-center justify-center gap-3 bg-white/5 border border-white/10 rounded-2xl px-5 py-3 text-sm">
            <Mail className="w-4 h-4 text-amber-300" />
            <span className="text-slate-300">Need quick support?</span>
            <a href={supportMailto} className="text-white font-semibold hover:text-amber-300 transition-colors">
              {SUPPORT_EMAIL}
            </a>
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 80" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none" className="w-full h-16 md:h-20">
            <path d="M0 80L60 70C120 60 240 40 360 35C480 30 600 40 720 45C840 50 960 50 1080 45C1200 40 1320 30 1380 25L1440 20V80H0Z" fill="#F0F2F2" />
          </svg>
        </div>
      </section>

      {/* ─── BUYER SECTION ────────────────────────────────────── */}
      <section id="buyers" className="bg-[#F0F2F2] scroll-mt-24">
        <div className="max-w-[var(--container-max)] mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28">
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-2 text-primary font-semibold text-sm uppercase tracking-widest mb-4">
              <ShoppingBag className="w-4 h-4" /> For Buyers
            </div>
            <h2 className="text-4xl md:text-5xl font-extrabold text-slate-900 mb-4">
              Everything you need to shop with confidence.
            </h2>
            <p className="text-slate-500 text-lg max-w-2xl mx-auto">
              Trust, safety, and clear answers — from checkout to your doorstep.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {buyerCategories.map((cat) => (
              <article
                key={cat.title}
                className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300"
              >
                <div className="flex items-start gap-5 mb-6">
                  <div className={`flex-shrink-0 w-14 h-14 bg-gradient-to-br ${cat.gradient} rounded-2xl flex items-center justify-center shadow-lg`}>
                    <cat.icon className="w-7 h-7 text-white" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-slate-900 mb-1">{cat.title}</h3>
                    <p className="text-slate-500 text-sm leading-relaxed">{cat.description}</p>
                  </div>
                </div>
                <ul className="space-y-3 border-t border-slate-100 pt-5">
                  {cat.articles.map((article) => (
                    <li key={article.title} className="group">
                      <div className="flex items-start gap-3">
                        <ChevronRight className="w-4 h-4 text-primary mt-1 flex-shrink-0 group-hover:translate-x-0.5 transition-transform" />
                        <div>
                          <p className="font-semibold text-slate-800 text-sm mb-0.5">{article.title}</p>
                          <p className="text-slate-500 text-sm leading-relaxed">{article.description}</p>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ─── SELLER SECTION ───────────────────────────────────── */}
      <section id="sellers" className="bg-white scroll-mt-24">
        <div className="max-w-[var(--container-max)] mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28">
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-2 text-primary font-semibold text-sm uppercase tracking-widest mb-4">
              <Briefcase className="w-4 h-4" /> For Sellers
            </div>
            <h2 className="text-4xl md:text-5xl font-extrabold text-slate-900 mb-4">
              Run your business, not the plumbing.
            </h2>
            <p className="text-slate-500 text-lg max-w-2xl mx-auto">
              Technical and operational clarity on payouts, shipping, and getting found on Google.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {sellerCategories.map((cat) => (
              <article
                key={cat.title}
                className="bg-[#F0F2F2] rounded-3xl p-8 border border-slate-100 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300"
              >
                <div className="flex items-start gap-5 mb-6">
                  <div className={`flex-shrink-0 w-14 h-14 bg-gradient-to-br ${cat.gradient} rounded-2xl flex items-center justify-center shadow-lg`}>
                    <cat.icon className="w-7 h-7 text-white" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-slate-900 mb-1">{cat.title}</h3>
                    <p className="text-slate-600 text-sm leading-relaxed">{cat.description}</p>
                  </div>
                </div>
                <ul className="space-y-3 border-t border-slate-200 pt-5">
                  {cat.articles.map((article) => (
                    <li key={article.title} className="group">
                      <div className="flex items-start gap-3">
                        <ChevronRight className="w-4 h-4 text-primary mt-1 flex-shrink-0 group-hover:translate-x-0.5 transition-transform" />
                        <div>
                          <p className="font-semibold text-slate-800 text-sm mb-0.5">{article.title}</p>
                          <p className="text-slate-600 text-sm leading-relaxed">{article.description}</p>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </div>

          {/* Seller quickstart CTA */}
          <div className="mt-14 max-w-4xl mx-auto bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl p-8 md:p-10 text-white shadow-xl">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div>
                <div className="inline-flex items-center gap-2 text-amber-300 font-semibold text-xs uppercase tracking-widest mb-3">
                  <Sparkles className="w-4 h-4" /> New sellers
                </div>
                <h3 className="text-2xl md:text-3xl font-extrabold mb-2">Ready to start selling?</h3>
                <p className="text-slate-300">Follow the seller quickstart to open your storefront in minutes.</p>
              </div>
              <a
                href={SELLER_QUICKSTART_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-primary hover:bg-primary-dark text-white font-semibold px-6 py-3 rounded-xl transition-all duration-300 shadow-lg shadow-primary/30 whitespace-nowrap"
              >
                Open Quickstart <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ─── CONTACT CTA ──────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-gradient-to-r from-slate-900 via-primary/90 to-slate-900">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-primary/30 via-transparent to-transparent pointer-events-none" />
        <div className="relative max-w-[var(--container-max)] mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-24 text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-4 py-2 text-white/80 text-sm font-medium mb-6">
            <MessageSquare className="w-4 h-4" /> Still need help?
          </div>
          <h2 className="text-4xl md:text-5xl font-extrabold text-white mb-4 leading-tight">
            Talk to a real person.
          </h2>
          <p className="text-lg text-white/80 max-w-2xl mx-auto leading-relaxed mb-8">
            Our support team replies to every email — usually within one business day. Include your order number
            or shop name so we can help faster.
          </p>
          <a
            href={supportMailto}
            className="inline-flex items-center gap-3 bg-white hover:bg-slate-100 text-slate-900 font-semibold px-8 py-4 rounded-2xl transition-all duration-300 hover:scale-105 shadow-xl"
          >
            <Mail className="w-5 h-5" />
            {SUPPORT_EMAIL}
          </a>
          <div className="mt-8 flex flex-wrap justify-center gap-4 text-sm text-white/70">
            <Link href="/about" className="inline-flex items-center gap-1 hover:text-white transition-colors">
              About Cartzii <ArrowRight className="w-4 h-4" />
            </Link>
            <span className="text-white/30">•</span>
            <Link href="/careers" className="inline-flex items-center gap-1 hover:text-white transition-colors">
              Careers <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

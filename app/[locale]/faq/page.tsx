import { Breadcrumb } from '@/components/layout/Breadcrumb';
import {
  HelpCircle, Mail, ShoppingBag, Store, ShieldCheck, Truck,
  RotateCcw, CreditCard, ChevronDown,
} from 'lucide-react';
import { generateAlternates } from '@/lib/seo';
import { Link } from '@/i18n/navigation';

const SUPPORT_EMAIL = 'support@cartzii.ca';

export async function generateMetadata() {
  const alternates = await generateAlternates(
    process.env.NEXT_PUBLIC_BASE_URL || 'https://cartzii.com',
    '/faq',
  );
  return {
    title: 'FAQ - Cartzii | Frequently Asked Questions',
    description:
      'Frequently asked questions about shopping and selling on Cartzii — orders, shipping, returns, payments, seller onboarding, and payouts.',
    alternates,
  };
}

type QA = { q: string; a: string };
type Group = { icon: typeof ShoppingBag; title: string; description: string; gradient: string; items: QA[] };

const groups: Group[] = [
  {
    icon: ShoppingBag,
    title: 'Orders & Shopping',
    description: 'Placing, tracking, and modifying orders.',
    gradient: 'from-primary to-orange-600',
    items: [
      { q: 'How do I place an order?', a: 'Add items to your cart, then click Checkout. You can sign in, use guest checkout, or sign in with Google. Enter a shipping address, choose a payment method, and confirm.' },
      { q: 'Can I change or cancel my order after checkout?', a: 'You can edit the shipping address or cancel while the order status is still Preparing. Once the seller marks it Ready to Ship, contact support and we\'ll try to help.' },
      { q: 'Where do I find my order history?', a: 'Go to Account → Orders. Every order includes its items, tracking, and a "Get help" button if something goes wrong.' },
      { q: 'Why did my order arrive in multiple boxes?', a: 'If you bought from multiple sellers, each ships separately. You are not charged extra — you just get multiple tracking numbers.' },
      { q: 'Do you offer gift wrapping?', a: 'It depends on the seller. When it\'s available, you\'ll see a "Gift options" toggle at checkout for that item.' },
    ],
  },
  {
    icon: Truck,
    title: 'Shipping',
    description: 'Rates, timelines, and tracking.',
    gradient: 'from-blue-500 to-indigo-600',
    items: [
      { q: 'How long does shipping take?', a: 'Domestic orders in Canada and the US typically arrive in 2–7 business days. International orders take 5–14 business days depending on destination and carrier.' },
      { q: 'How much does shipping cost?', a: 'Shipping is free on domestic orders over CA$50 / US$50. Otherwise, rates are calculated at checkout based on weight, destination, and the seller\'s shipping profile.' },
      { q: 'Do you ship internationally?', a: 'Yes. Eligible international destinations show at checkout. We use DDP shipping, so duties and taxes are prepaid — no surprise fees at your door.' },
      { q: 'How do I track my order?', a: 'When your parcel ships, you get an email with the tracking number. You can also see live status from Account → Orders on the site.' },
      { q: 'What if my parcel is delayed or lost?', a: 'If tracking has not moved for 7+ days, email support@cartzii.ca with your order number. We coordinate the carrier claim and your refund or reshipment.' },
    ],
  },
  {
    icon: RotateCcw,
    title: 'Returns & Refunds',
    description: 'Returning items and getting refunded.',
    gradient: 'from-emerald-500 to-teal-600',
    items: [
      { q: 'What is the return window?', a: 'Every seller sets their own return window — typically 14 or 30 days from delivery. The exact policy is shown on the product page before you buy.' },
      { q: 'How do I start a return?', a: 'Go to Account → Orders, click the item, and choose "Start a return". Select a reason, upload photos if it\'s damaged, and we\'ll walk you through the rest.' },
      { q: 'Who pays for return shipping?', a: 'If the return is the seller\'s fault (defective, wrong item, not as described), return shipping is free. For change-of-mind returns, shipping may be deducted from your refund.' },
      { q: 'When will I be refunded?', a: 'Refunds are issued to your original payment method within 5–10 business days after the seller confirms the return. Some banks post it the same day.' },
      { q: 'What if the seller doesn\'t respond?', a: 'After 3 business days without a response, you can escalate to Cartzii Buyer Protection. We review the case and issue a decision within 5 business days.' },
    ],
  },
  {
    icon: CreditCard,
    title: 'Account & Payments',
    description: 'Cards, addresses, sign-in.',
    gradient: 'from-violet-500 to-purple-600',
    items: [
      { q: 'Which payment methods do you accept?', a: 'Visa, Mastercard, American Express, Apple Pay, Google Pay, and other methods supported by Stripe. Available options are shown at checkout.' },
      { q: 'Is my payment information safe?', a: 'Yes. Card numbers are handled by Stripe (PCI-DSS Level 1) and never stored on Cartzii servers. Transactions are protected with TLS and 3-D Secure where required.' },
      { q: 'Why was my card declined?', a: 'Common reasons: expired card, wrong billing ZIP, insufficient funds, or a bank hold on international merchants. Try another card or call your bank to whitelist Cartzii.' },
      { q: 'How do I update my shipping address?', a: 'Edit your default address any time from Account → Addresses, or change it during checkout before you pay.' },
      { q: 'How do I delete my account?', a: 'From Account → Settings, choose "Close account". We honour data deletion requests as required by law — see our Privacy Policy for details.' },
    ],
  },
  {
    icon: ShieldCheck,
    title: 'Buyer Protection',
    description: 'How we protect you.',
    gradient: 'from-slate-700 to-slate-900',
    items: [
      { q: 'What does Buyer Protection cover?', a: 'Non-delivery, items significantly not-as-described, damaged items, and unauthorised transactions are all covered when reported in time.' },
      { q: 'How long do I have to raise a claim?', a: '60 days from the delivery date, or 30 days from the original expected delivery date if the parcel never arrived.' },
      { q: 'How is a claim decided?', a: 'Our trust & safety team reviews the order, tracking, messages between you and the seller, and any photos. Most decisions are issued within 5 business days.' },
      { q: 'What if I don\'t recognise a charge?', a: 'Report it immediately at support@cartzii.ca. We freeze the shipment if it hasn\'t left the seller yet and work with your bank on the chargeback.' },
    ],
  },
  {
    icon: Store,
    title: 'Selling on Cartzii',
    description: 'Onboarding, fees, and payouts.',
    gradient: 'from-amber-500 to-yellow-600',
    items: [
      { q: 'How do I open a Cartzii shop?', a: 'Head to the Seller portal (qa-seller.cartzii.ca), complete Stripe Connect onboarding, and list your first product. Full step-by-step in the Help Center.' },
      { q: 'What are the fees?', a: 'Cartzii\'s commission is 9.99% on the goods subtotal (tax and shipping excluded). Stripe\'s standard card-processing fee applies to every transaction and is billed to the platform.' },
      { q: 'When do I get paid?', a: 'Payouts are triggered per order once the buyer\'s Cartzii return window closes, and land in your bank via Stripe\'s standard schedule.' },
      { q: 'What can I sell on Cartzii?', a: 'Anything legal to sell in your country and the buyer\'s country. Prohibited items are listed in the Seller Agreement — weapons, drugs, counterfeit goods, and similar.' },
      { q: 'Do I need a business number?', a: 'For CA/US sellers, Stripe collects the tax information required at onboarding — an SSN, EIN, SIN, or BN as appropriate. We do not accept sellers who cannot complete this step.' },
    ],
  },
];

export default async function FAQPage() {
  const supportMailto = `mailto:${SUPPORT_EMAIL}?subject=Cartzii%20-%20FAQ%20follow-up`;

  return (
    <div className="overflow-x-hidden">
      <div className="max-w-[var(--container-max)] mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        <Breadcrumb items={[{ label: 'FAQ' }]} />
      </div>

      {/* HERO */}
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
        <div className="absolute -top-40 -right-40 w-[600px] h-[600px] rounded-full bg-primary/20 blur-[120px] pointer-events-none" />
        <div className="relative max-w-[var(--container-max)] mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-24 text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-4 py-2 text-sm font-medium mb-6">
            <HelpCircle className="w-4 h-4 text-amber-400" /> Frequently asked questions
          </div>
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-4 leading-none">
            <span className="bg-gradient-to-r from-orange-400 via-primary to-red-500 bg-clip-text text-transparent">FAQ</span>
          </h1>
          <p className="text-lg md:text-xl text-slate-300 max-w-2xl mx-auto leading-relaxed">
            The quick answers to the questions we hear most.
          </p>
        </div>
      </section>

      {/* CATEGORY NAV */}
      <section className="bg-[#F0F2F2] border-b border-slate-200">
        <div className="max-w-[var(--container-max)] mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-wrap justify-center gap-3">
            {groups.map((g) => (
              <a
                key={g.title}
                href={`#${g.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`}
                className="inline-flex items-center gap-2 bg-white border border-slate-200 text-slate-700 hover:text-primary hover:border-primary font-medium px-4 py-2 rounded-full text-sm transition-colors"
              >
                <g.icon className="w-4 h-4" /> {g.title}
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* GROUPS */}
      <section className="bg-[#F0F2F2]">
        <div className="max-w-[var(--container-max)] mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-20">
          <div className="max-w-4xl mx-auto space-y-10">
            {groups.map((g) => {
              const anchor = g.title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
              return (
                <div key={g.title} id={anchor} className="scroll-mt-24">
                  <div className="flex items-start gap-4 mb-6">
                    <div className={`w-14 h-14 bg-gradient-to-br ${g.gradient} rounded-2xl flex items-center justify-center shadow-lg flex-shrink-0`}>
                      <g.icon className="w-7 h-7 text-white" />
                    </div>
                    <div>
                      <h2 className="text-2xl md:text-3xl font-extrabold text-slate-900">{g.title}</h2>
                      <p className="text-slate-500">{g.description}</p>
                    </div>
                  </div>

                  <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
                    {g.items.map((qa, i) => (
                      <details
                        key={qa.q}
                        className={`group ${i > 0 ? 'border-t border-slate-100' : ''}`}
                      >
                        <summary className="flex items-center justify-between gap-4 cursor-pointer list-none px-6 py-5 hover:bg-slate-50 transition-colors">
                          <span className="font-semibold text-slate-900 text-base md:text-lg">{qa.q}</span>
                          <ChevronDown className="w-5 h-5 text-slate-400 flex-shrink-0 transition-transform group-open:rotate-180" />
                        </summary>
                        <div className="px-6 pb-5 -mt-1 text-slate-600 leading-relaxed">
                          {qa.a}
                        </div>
                      </details>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-gradient-to-r from-slate-900 via-primary/90 to-slate-900">
        <div className="max-w-[var(--container-max)] mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center text-white">
          <h2 className="text-3xl md:text-4xl font-extrabold mb-4">Didn&apos;t find the answer?</h2>
          <p className="text-white/80 max-w-xl mx-auto mb-8">Send us a note — we&apos;ll get back to you within one business day.</p>
          <a href={supportMailto} className="inline-flex items-center gap-2 bg-white text-slate-900 font-semibold px-8 py-4 rounded-2xl hover:bg-slate-100 transition-colors">
            <Mail className="w-5 h-5" /> {SUPPORT_EMAIL}
          </a>
          <div className="mt-6 text-sm">
            <Link href="/help" className="text-white/80 hover:text-white underline underline-offset-4">
              Browse the full Help Center
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

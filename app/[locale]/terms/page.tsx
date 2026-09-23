import { Breadcrumb } from '@/components/layout/Breadcrumb';
import {
  ScrollText, Mail, ShoppingBag, Store, CreditCard, ShieldAlert,
  Scale, Gavel, RefreshCw, XCircle,
} from 'lucide-react';
import { generateAlternates } from '@/lib/seo';

const SUPPORT_EMAIL = 'support@cartzii.ca';
const LAST_UPDATED = 'September 2, 2026';

export async function generateMetadata() {
  const alternates = await generateAlternates(
    process.env.NEXT_PUBLIC_BASE_URL || 'https://cartzii.com',
    '/terms',
  );
  return {
    title: 'Terms of Service - Cartzii',
    description:
      'The Terms of Service governing your use of Cartzii Marketplace as a buyer or seller — accounts, orders, payments, disputes, and more.',
    alternates,
  };
}

const sections = [
  {
    id: 'agreement',
    icon: ScrollText,
    title: '1. Agreement',
    body: `These Terms of Service ("Terms") are a binding agreement between you and Cartzii Marketplace ("Cartzii", "we", "us"). They govern your use of cartzii.ca, cartzii.com, and related services (the "Service"). By creating an account or placing an order, you accept these Terms. If you do not accept them, you may not use the Service.`,
  },
  {
    id: 'accounts',
    icon: ShoppingBag,
    title: '2. Accounts',
    body: `You must be at least 18 (or the age of majority in your jurisdiction) to hold a Cartzii account. You are responsible for information you provide, for activity on your account, and for keeping your password secure. Notify us immediately if you suspect unauthorised access. We may suspend or terminate accounts that violate these Terms.`,
  },
  {
    id: 'marketplace',
    icon: Store,
    title: '3. The Marketplace model',
    body: `Cartzii is a marketplace. Sellers are independent third parties who list and sell products directly. When you buy something, the contract of sale is between you and the seller — Cartzii facilitates the transaction and collects payment on the seller's behalf. Product descriptions, images, and policies are provided by sellers. We take steps to keep them accurate but do not guarantee them.`,
  },
  {
    id: 'orders',
    icon: CreditCard,
    title: '4. Orders, prices, and payment',
    body: `Prices and availability are shown at the time of your order and can change. Applicable taxes, duties, and shipping are added at checkout. Payment is captured when your order is placed. If a listing was priced or described in obvious error, Cartzii and the seller reserve the right to cancel and refund the order. Payments are processed by Stripe under Stripe's terms.`,
  },
  {
    id: 'returns',
    icon: RefreshCw,
    title: '5. Shipping, returns, and refunds',
    body: `Shipping options and delivery times depend on the seller and destination. Returns are subject to each seller's published policy. Cartzii Buyer Protection covers items that are not delivered, arrive damaged, or are significantly not-as-described. See our Returns & Refunds and Shipping Information pages for full details.`,
  },
  {
    id: 'sellers',
    icon: Store,
    title: '6. Selling on Cartzii',
    body: `Sellers must accept the Cartzii Seller Agreement in addition to these Terms, comply with all applicable laws, list only items they have the right to sell, describe them accurately, honour the policies they publish, and complete payout onboarding with our payments partner (Stripe Connect). Cartzii's commission and processing fees are set out in the Seller Agreement and on the Help Center.`,
  },
  {
    id: 'conduct',
    icon: ShieldAlert,
    title: '7. Acceptable use',
    body: `You agree not to use the Service to infringe intellectual property, defraud anyone, sell prohibited items, harass others, transmit malware, scrape or reverse-engineer the Service, or interfere with its operation. Prohibited items include, without limitation, weapons, illegal drugs, counterfeit goods, and any item unlawful to sell where the seller or buyer is located.`,
  },
  {
    id: 'ip',
    icon: Scale,
    title: '8. Intellectual property',
    body: `The Cartzii name, logo, and Service (excluding seller content) are owned by us. You may not copy, modify, or distribute them without permission. Sellers retain rights to their content and grant Cartzii a non-exclusive licence to host, display, and promote it as needed to operate the Service.`,
  },
  {
    id: 'disclaimers',
    icon: XCircle,
    title: '9. Disclaimers',
    body: `The Service is provided "as is" without warranties of any kind, express or implied, to the maximum extent permitted by law. Cartzii is not responsible for the quality, safety, or legality of products listed by sellers, or for a seller's ability to complete a transaction. Nothing in these Terms limits any statutory consumer rights that cannot be waived by law.`,
  },
  {
    id: 'liability',
    icon: Gavel,
    title: '10. Limitation of liability',
    body: `To the extent permitted by law, Cartzii will not be liable for indirect, incidental, special, or consequential damages, or for lost profits or data. Our aggregate liability for any claim relating to the Service is limited to the amount you paid Cartzii in the 12 months before the event giving rise to the claim.`,
  },
  {
    id: 'termination',
    icon: XCircle,
    title: '11. Termination',
    body: `You may close your account at any time from your settings. We may suspend or terminate accounts that breach these Terms, engage in fraud, or expose Cartzii or its users to risk. Provisions that by their nature should survive termination (ownership, indemnity, limits of liability) will survive.`,
  },
  {
    id: 'governing',
    icon: Gavel,
    title: '12. Governing law and disputes',
    body: `These Terms are governed by the laws of the Province of Ontario, Canada, without regard to conflict of laws principles. Disputes will be submitted to the courts of Ontario, except where mandatory local consumer law grants you rights to a different forum.`,
  },
  {
    id: 'changes',
    icon: RefreshCw,
    title: '13. Changes to these Terms',
    body: `We may update these Terms. When we do, we will update the "Last updated" date at the top and, for material changes, notify you through the Service or by email. Continued use after changes take effect means you accept the updated Terms.`,
  },
  {
    id: 'contact',
    icon: Mail,
    title: '14. Contact',
    body: `Questions? Email ${SUPPORT_EMAIL}. Cartzii Marketplace is based in Ontario, Canada.`,
  },
];

export default async function TermsPage() {
  return (
    <div className="overflow-x-hidden">
      <div className="max-w-[var(--container-max)] mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        <Breadcrumb items={[{ label: 'Terms of Service' }]} />
      </div>

      <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
        <div className="absolute -top-40 -right-40 w-[600px] h-[600px] rounded-full bg-primary/20 blur-[120px] pointer-events-none" />
        <div className="relative max-w-[var(--container-max)] mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-24">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-4 py-2 text-sm font-medium mb-6">
              <Scale className="w-4 h-4 text-amber-400" /> Legal
            </div>
            <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-4 leading-tight">
              Terms of Service
            </h1>
            <p className="text-slate-300 text-lg leading-relaxed">
              The agreement governing your use of Cartzii — buyer or seller.
            </p>
            <p className="mt-4 text-sm text-slate-400">Last updated: {LAST_UPDATED}</p>
          </div>
        </div>
      </section>

      <section className="bg-[#F0F2F2]">
        <div className="max-w-[var(--container-max)] mx-auto px-4 sm:px-6 lg:px-8 py-14 md:py-20">
          <div className="grid lg:grid-cols-[240px_1fr] gap-10 max-w-6xl mx-auto">
            <aside className="hidden lg:block">
              <div className="sticky top-24 bg-white rounded-2xl p-5 border border-slate-100 shadow-sm max-h-[calc(100vh-8rem)] overflow-y-auto">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">On this page</p>
                <ul className="space-y-2 text-sm">
                  {sections.map((s) => (
                    <li key={s.id}>
                      <a href={`#${s.id}`} className="text-slate-600 hover:text-primary transition-colors">
                        {s.title}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            </aside>

            <div className="bg-white rounded-3xl p-8 md:p-12 border border-slate-100 shadow-sm">
              {sections.map((s) => (
                <section key={s.id} id={s.id} className="mb-10 scroll-mt-24">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center flex-shrink-0">
                      <s.icon className="w-5 h-5 text-primary" />
                    </div>
                    <h2 className="text-2xl font-bold text-slate-900 m-0">{s.title}</h2>
                  </div>
                  <p className="text-slate-700 leading-relaxed">{s.body}</p>
                </section>
              ))}

              <div className="mt-8 p-6 bg-[#F0F2F2] rounded-2xl border border-slate-100">
                <p className="text-slate-700 mb-3">Legal enquiries or clarifications:</p>
                <a href={`mailto:${SUPPORT_EMAIL}?subject=Legal%20-%20Terms%20of%20Service`} className="inline-flex items-center gap-2 text-primary font-semibold hover:underline">
                  <Mail className="w-4 h-4" /> {SUPPORT_EMAIL}
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

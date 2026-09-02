import { Breadcrumb } from '@/components/layout/Breadcrumb';
import { Shield, Mail, Lock, Eye, Cookie, Users, FileText, Globe } from 'lucide-react';
import { generateAlternates } from '@/lib/seo';
import { Link } from '@/i18n/navigation';

const SUPPORT_EMAIL = 'support@cartzii.ca';
const LAST_UPDATED = 'September 2, 2026';

export async function generateMetadata() {
  const alternates = await generateAlternates(
    process.env.NEXT_PUBLIC_BASE_URL || 'https://cartzii.com',
    '/privacy',
  );
  return {
    title: 'Privacy Policy - Cartzii',
    description:
      'How Cartzii collects, uses, and protects your personal information. Read our privacy policy for details on data, cookies, marketing, and your rights.',
    alternates,
  };
}

const sections = [
  {
    id: 'overview',
    icon: Shield,
    title: '1. Overview',
    body: `Cartzii Marketplace ("Cartzii", "we", "us") respects your privacy. This Privacy Policy explains what information we collect when you use cartzii.ca, cartzii.com, and related services (collectively, the "Service"), how we use it, and the choices you have. By using the Service you agree to this Policy. If you do not agree, please do not use the Service.`,
  },
  {
    id: 'information',
    icon: Eye,
    title: '2. Information we collect',
    body: `We collect information you give us directly (name, email, shipping address, payment details, communications), information we generate as you use the Service (orders, browsing, search history, device and log data), and information from third parties (payment processors, shipping carriers, sign-in providers). Payment card numbers are handled by Stripe and never stored on Cartzii servers.`,
  },
  {
    id: 'use',
    icon: Users,
    title: '3. How we use your information',
    body: `We use your information to provide the Service (process orders, deliver goods, handle returns), to keep the Service safe and lawful (fraud prevention, dispute resolution, legal obligations), to improve our products and personalise your experience, and to communicate with you about orders, service updates, and — if you opt in — marketing.`,
  },
  {
    id: 'sharing',
    icon: Globe,
    title: '4. How we share your information',
    body: `We share the minimum information required with sellers (name, shipping address, items ordered), carriers (label & tracking data), payment processors (Stripe), and service providers who process data on our behalf under contract. We do not sell personal information. We may disclose information if legally required or to protect Cartzii, our users, or the public.`,
  },
  {
    id: 'cookies',
    icon: Cookie,
    title: '5. Cookies and tracking',
    body: `We and our partners use cookies and similar technologies to keep you signed in, remember your cart, understand how the Service is used, and (with your consent) show relevant ads. For details, see our Cookie Policy. You can manage cookie preferences from the banner shown on your first visit or in your browser settings.`,
    link: { href: '/cookies', label: 'Read the Cookie Policy →' },
  },
  {
    id: 'security',
    icon: Lock,
    title: '6. Security',
    body: `We use industry-standard measures to protect your information — TLS in transit, encryption at rest, access controls, and continuous monitoring. No system is perfectly secure. If we detect a breach affecting your information, we will notify you as required by law.`,
  },
  {
    id: 'rights',
    icon: FileText,
    title: '7. Your rights',
    body: `Depending on where you live, you may have rights to access, correct, delete, or export your personal information, restrict or object to certain processing, and withdraw consent. You can exercise most of these directly from your account settings. For anything else, email us at ${SUPPORT_EMAIL} and we will respond within the time required by applicable law.`,
  },
  {
    id: 'children',
    icon: Users,
    title: '8. Children',
    body: `The Service is not directed to children under 13 (or 16 in the EEA). We do not knowingly collect personal information from them. If you believe a child has provided us with information, contact us and we will delete it.`,
  },
  {
    id: 'changes',
    icon: FileText,
    title: '9. Changes to this Policy',
    body: `We may update this Policy from time to time. When we do, we will update the "Last updated" date at the top. Material changes will be brought to your attention through the Service or by email.`,
  },
  {
    id: 'contact',
    icon: Mail,
    title: '10. Contact us',
    body: `Questions, requests, or complaints about this Policy? Email ${SUPPORT_EMAIL}. Cartzii Marketplace is based in Ontario, Canada.`,
  },
];

export default async function PrivacyPolicyPage() {
  return (
    <div className="overflow-x-hidden">
      <div className="max-w-[var(--container-max)] mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        <Breadcrumb items={[{ label: 'Privacy Policy' }]} />
      </div>

      {/* HERO */}
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
        <div className="absolute -top-40 -right-40 w-[600px] h-[600px] rounded-full bg-primary/20 blur-[120px] pointer-events-none" />
        <div className="relative max-w-[var(--container-max)] mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-24">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-4 py-2 text-sm font-medium mb-6">
              <Shield className="w-4 h-4 text-amber-400" /> Legal
            </div>
            <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-4 leading-tight">
              Privacy Policy
            </h1>
            <p className="text-slate-300 text-lg leading-relaxed">
              How Cartzii collects, uses, and protects your personal information.
            </p>
            <p className="mt-4 text-sm text-slate-400">Last updated: {LAST_UPDATED}</p>
          </div>
        </div>
      </section>

      {/* BODY */}
      <section className="bg-[#F0F2F2]">
        <div className="max-w-[var(--container-max)] mx-auto px-4 sm:px-6 lg:px-8 py-14 md:py-20">
          <div className="grid lg:grid-cols-[240px_1fr] gap-10 max-w-6xl mx-auto">
            {/* TOC */}
            <aside className="hidden lg:block">
              <div className="sticky top-24 bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
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

            {/* Content */}
            <div className="bg-white rounded-3xl p-8 md:p-12 border border-slate-100 shadow-sm">
              <div className="prose prose-slate max-w-none">
                {sections.map((s) => (
                  <section key={s.id} id={s.id} className="mb-10 scroll-mt-24">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center flex-shrink-0">
                        <s.icon className="w-5 h-5 text-primary" />
                      </div>
                      <h2 className="text-2xl font-bold text-slate-900 m-0">{s.title}</h2>
                    </div>
                    <p className="text-slate-700 leading-relaxed">{s.body}</p>
                    {s.link && (
                      <p className="mt-3">
                        <Link href={s.link.href} className="text-primary font-semibold hover:underline">
                          {s.link.label}
                        </Link>
                      </p>
                    )}
                  </section>
                ))}
              </div>

              <div className="mt-8 p-6 bg-[#F0F2F2] rounded-2xl border border-slate-100">
                <p className="text-slate-700 mb-3">Questions about your privacy?</p>
                <a href={`mailto:${SUPPORT_EMAIL}?subject=Privacy%20question`} className="inline-flex items-center gap-2 text-primary font-semibold hover:underline">
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

import { Breadcrumb } from '@/components/layout/Breadcrumb';
import {
  Sparkles, Mail, Heart, Rocket, Users, Globe, Coffee, TrendingUp,
  ArrowRight, CheckCircle2, Briefcase, Lightbulb, Award, Handshake,
} from 'lucide-react';
import { generateAlternates } from '@/lib/seo';
import { Link } from '@/i18n/navigation';

const CAREERS_EMAIL = 'career@cartzii.ca';

export async function generateMetadata() {
  const alternates = await generateAlternates(
    process.env.NEXT_PUBLIC_BASE_URL || 'https://cartzii.com',
    '/careers',
  );
  return {
    title: 'Careers - Cartzii | Join the team building the marketplace of tomorrow',
    description:
      'We\'re not hiring for specific roles right now — but we\'re always excited to meet talented people. Reach out to career@cartzii.ca to explore future opportunities at Cartzii.',
    alternates,
  };
}

export default async function CareersPage() {
  const values = [
    {
      icon: Rocket,
      title: 'Move Fast, Ship Real',
      description:
        'We favour momentum over meetings. If it makes the shopper\'s life better, we build it — and we ship it this week.',
      gradient: 'from-orange-500 to-red-600',
    },
    {
      icon: Heart,
      title: 'Care Deeply',
      description:
        'Every customer, every seller, every teammate — treated the way we\'d want to be treated. No exceptions.',
      gradient: 'from-pink-500 to-rose-600',
    },
    {
      icon: Lightbulb,
      title: 'Curious by Default',
      description:
        'Titles don\'t decide who\'s right. The best idea wins, wherever it comes from. Ask questions. Question answers.',
      gradient: 'from-amber-500 to-yellow-600',
    },
    {
      icon: Handshake,
      title: 'Own the Outcome',
      description:
        'We don\'t hand off problems. We see them through — from the first Slack message to the last customer email.',
      gradient: 'from-emerald-500 to-teal-600',
    },
    {
      icon: Users,
      title: 'Better Together',
      description:
        'We hire for character as much as craft. Kindness and candour aren\'t opposites — they\'re how great teams work.',
      gradient: 'from-blue-500 to-indigo-600',
    },
    {
      icon: Globe,
      title: 'Build for the World',
      description:
        'From Toronto to Texas, our shoppers speak different languages and live different lives. We build for all of them.',
      gradient: 'from-violet-500 to-purple-600',
    },
  ];

  const perks = [
    { icon: Coffee, title: 'Flexible schedules', description: 'Work when you do your best work. Async-first, meeting-light.' },
    { icon: Globe, title: 'Remote-friendly', description: 'Hire the best person for the job — wherever they call home.' },
    { icon: TrendingUp, title: 'Real ownership', description: 'Meaningful scope from day one. Your work reaches customers, not slide decks.' },
    { icon: Award, title: 'Growth budget', description: 'Books, courses, conferences — we invest in you becoming better at your craft.' },
  ];

  const areas = [
    { icon: Briefcase, title: 'Engineering', description: 'Frontend, backend, mobile, platform, data — building the marketplace end to end.' },
    { icon: Sparkles, title: 'Design & UX', description: 'Product design, brand, and research — crafting the shopper experience.' },
    { icon: Users, title: 'Operations & Support', description: 'Customer support, seller success, trust & safety, logistics.' },
    { icon: TrendingUp, title: 'Marketing & Growth', description: 'Content, performance marketing, SEO, partnerships.' },
  ];

  const mailtoHref = `mailto:${CAREERS_EMAIL}?subject=Exploring%20opportunities%20at%20Cartzii`;

  return (
    <div className="overflow-x-hidden">
      {/* Breadcrumb */}
      <div className="max-w-[var(--container-max)] mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        <Breadcrumb items={[{ label: 'Careers' }]} />
      </div>

      {/* ─── HERO ─────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
        <div className="absolute -top-40 -right-40 w-[600px] h-[600px] rounded-full bg-primary/20 blur-[120px] pointer-events-none" />
        <div className="absolute -bottom-40 -left-40 w-[500px] h-[500px] rounded-full bg-orange-400/15 blur-[100px] pointer-events-none" />

        <div className="relative max-w-[var(--container-max)] mx-auto px-4 sm:px-6 lg:px-8 py-24 md:py-36 text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-4 py-2 text-sm font-medium mb-8">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>We&apos;re always meeting great people</span>
          </div>

          <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-extrabold tracking-tight mb-6 leading-none">
            Build the{' '}
            <span className="bg-gradient-to-r from-orange-400 via-primary to-red-500 bg-clip-text text-transparent">
              future of shopping.
            </span>
          </h1>

          <p className="text-lg md:text-xl text-slate-300 max-w-2xl mx-auto leading-relaxed mb-10">
            Cartzii is a small team with an outsized mission — to make online shopping feel personal, trusted, and joyful.
            If that sounds like something you want to work on, we&apos;d love to hear from you.
          </p>

          <div className="flex flex-wrap justify-center gap-4">
            <a
              href={mailtoHref}
              className="inline-flex items-center gap-2 bg-primary hover:bg-primary-dark text-white font-semibold px-8 py-4 rounded-2xl transition-all duration-300 hover:scale-105 shadow-lg shadow-primary/30"
            >
              <Mail className="w-5 h-5" />
              {CAREERS_EMAIL}
            </a>
            <Link
              href="/about"
              className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/20 text-white font-semibold px-8 py-4 rounded-2xl transition-all duration-300"
            >
              Learn about Cartzii <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 80" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none" className="w-full h-16 md:h-20">
            <path d="M0 80L60 70C120 60 240 40 360 35C480 30 600 40 720 45C840 50 960 50 1080 45C1200 40 1320 30 1380 25L1440 20V80H0Z" fill="#F0F2F2" />
          </svg>
        </div>
      </section>

      {/* ─── OPEN ROLES CALLOUT ───────────────────────────────── */}
      <section className="bg-[#F0F2F2]">
        <div className="max-w-[var(--container-max)] mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-24">
          <div className="max-w-3xl mx-auto bg-white rounded-3xl p-8 md:p-12 shadow-lg border border-slate-100">
            <div className="flex flex-col md:flex-row gap-8 items-start">
              <div className="flex-shrink-0 w-16 h-16 bg-gradient-to-br from-primary to-orange-600 rounded-2xl flex items-center justify-center shadow-lg shadow-primary/30">
                <Briefcase className="w-8 h-8 text-white" />
              </div>
              <div className="flex-1">
                <div className="inline-flex items-center gap-2 text-primary font-semibold text-sm uppercase tracking-widest mb-3">
                  Open Opportunities
                </div>
                <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 mb-4">
                  No public listings right now — but always looking for great people.
                </h2>
                <p className="text-slate-600 text-base md:text-lg leading-relaxed mb-6">
                  We don&apos;t post every role publicly. If you&apos;re excited about what Cartzii is building
                  and think you can help, send us a note. Tell us who you are, what you&apos;ve built, and where you
                  think you could make a dent.
                </p>
                <a
                  href={mailtoHref}
                  className="inline-flex items-center gap-2 bg-primary hover:bg-primary-dark text-white font-semibold px-6 py-3 rounded-xl transition-all duration-300 shadow-md shadow-primary/20"
                >
                  <Mail className="w-5 h-5" />
                  Email {CAREERS_EMAIL}
                </a>
                <p className="mt-4 text-sm text-slate-500">
                  We read every message, and we reply to the ones that spark a conversation.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── VALUES ───────────────────────────────────────────── */}
      <section className="bg-white">
        <div className="max-w-[var(--container-max)] mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 text-primary font-semibold text-sm uppercase tracking-widest mb-4">
              <Heart className="w-4 h-4" /> How We Work
            </div>
            <h2 className="text-4xl md:text-5xl font-extrabold text-slate-900 mb-4">What we look for.</h2>
            <p className="text-slate-500 text-lg max-w-xl mx-auto">
              Skills matter. So does how you show up. These are the traits we hire for — and hire on.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {values.map((value) => (
              <div
                key={value.title}
                className="group bg-[#F0F2F2] rounded-3xl p-8 border border-slate-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
              >
                <div className={`w-14 h-14 bg-gradient-to-br ${value.gradient} rounded-2xl flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                  <value.icon className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">{value.title}</h3>
                <p className="text-slate-600 leading-relaxed">{value.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── AREAS OF WORK ────────────────────────────────────── */}
      <section className="bg-[#F0F2F2]">
        <div className="max-w-[var(--container-max)] mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 text-primary font-semibold text-sm uppercase tracking-widest mb-4">
              <Briefcase className="w-4 h-4" /> Where You Might Fit
            </div>
            <h2 className="text-4xl md:text-5xl font-extrabold text-slate-900 mb-4">Areas we grow into.</h2>
            <p className="text-slate-500 text-lg max-w-xl mx-auto">
              Even without an open listing, these are the teams we&apos;re steadily expanding.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {areas.map((area) => (
              <div
                key={area.title}
                className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm hover:shadow-lg transition-all duration-300"
              >
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-4">
                  <area.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">{area.title}</h3>
                <p className="text-sm text-slate-600 leading-relaxed">{area.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── PERKS ────────────────────────────────────────────── */}
      <section className="bg-white">
        <div className="max-w-[var(--container-max)] mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28">
          <div className="grid lg:grid-cols-2 gap-16 items-start">
            <div>
              <div className="inline-flex items-center gap-2 text-primary font-semibold text-sm uppercase tracking-widest mb-4">
                <Award className="w-4 h-4" /> Life at Cartzii
              </div>
              <h2 className="text-4xl md:text-5xl font-extrabold text-slate-900 leading-tight mb-6">
                A place to do the <span className="text-primary">best work</span> of your career.
              </h2>
              <p className="text-slate-600 text-lg leading-relaxed mb-6">
                We&apos;re not a giant company yet — and that&apos;s the point. You&apos;ll ship things that
                real customers use, work directly with the founders, and have room to shape not just the
                product, but the culture around it.
              </p>
              <p className="text-slate-600 text-lg leading-relaxed">
                We keep our team small, our standards high, and our meetings short. If that sounds like the
                environment you thrive in, let&apos;s talk.
              </p>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              {perks.map((perk) => (
                <div
                  key={perk.title}
                  className="bg-[#F0F2F2] rounded-2xl p-6 border border-slate-100"
                >
                  <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center mb-3 shadow-sm">
                    <perk.icon className="w-5 h-5 text-primary" />
                  </div>
                  <h3 className="text-base font-bold text-slate-900 mb-1">{perk.title}</h3>
                  <p className="text-sm text-slate-600 leading-relaxed">{perk.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ─── HIRING PROCESS ───────────────────────────────────── */}
      <section className="bg-[#F0F2F2]">
        <div className="max-w-[var(--container-max)] mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 text-primary font-semibold text-sm uppercase tracking-widest mb-4">
              <CheckCircle2 className="w-4 h-4" /> What to Expect
            </div>
            <h2 className="text-4xl md:text-5xl font-extrabold text-slate-900 mb-4">Our hiring process.</h2>
            <p className="text-slate-500 text-lg max-w-xl mx-auto">
              Straightforward, respectful of your time, and focused on the work — not the theatre.
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-6 max-w-5xl mx-auto">
            {[
              { step: '01', title: 'Say hello', description: `Email us at ${CAREERS_EMAIL} with a short note about who you are.` },
              { step: '02', title: 'Intro chat', description: 'A 30-minute conversation to understand your interests and share ours.' },
              { step: '03', title: 'Real work', description: 'A practical exercise close to what you\'d actually do here — never a pop quiz.' },
              { step: '04', title: 'Meet the team', description: 'Meet the people you\'d work with. Ask us anything. We\'ll do the same.' },
            ].map((item) => (
              <div key={item.step} className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm">
                <div className="text-4xl font-extrabold text-primary/20 mb-3">{item.step}</div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">{item.title}</h3>
                <p className="text-sm text-slate-600 leading-relaxed">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── FINAL CTA ────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-gradient-to-r from-slate-900 via-primary/90 to-slate-900">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-primary/30 via-transparent to-transparent pointer-events-none" />
        <div className="relative max-w-[var(--container-max)] mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28 text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-4 py-2 text-white/80 text-sm font-medium mb-6">
            <Mail className="w-4 h-4" /> Get in touch
          </div>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-white mb-6 leading-tight">
            Don&apos;t see the role? <br className="hidden md:block" />
            <span className="text-orange-300">Write to us anyway.</span>
          </h2>
          <p className="text-lg text-white/80 max-w-2xl mx-auto leading-relaxed mb-10">
            The best hires we&apos;ve made didn&apos;t come from job boards. They came from an email that
            started with &ldquo;I saw what you&apos;re building and I want in.&rdquo;
          </p>
          <a
            href={mailtoHref}
            className="inline-flex items-center gap-3 bg-white hover:bg-slate-100 text-slate-900 font-semibold px-8 py-4 rounded-2xl transition-all duration-300 hover:scale-105 shadow-xl"
          >
            <Mail className="w-5 h-5" />
            {CAREERS_EMAIL}
          </a>
        </div>
      </section>
    </div>
  );
}

'use client';

import { Link } from '@/i18n/navigation';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { buildPath } from '@/config/countries';
import { CountrySelector } from './CountrySelector';

export function Footer() {
  const t = useTranslations('Footer');

  const sections = [
    {
      title: t('company'),
      links: [
        { label: t('aboutUs'), href: buildPath('/about') },
        { label: t('careers'), href: '#' },
        { label: t('press'), href: '#' },
        { label: t('blog'), href: '#' },
      ],
    },
    {
      title: t('shop'),
      links: [
        { label: t('allProducts'), href: buildPath('/products') },
        { label: t('newArrivals'), href: buildPath('/products') },
        { label: t('bestSellers'), href: buildPath('/products') },
        { label: t('deals'), href: buildPath('/deals') },
      ],
    },
    {
      title: t('support'),
      links: [
        { label: t('helpCenter'), href: '#' },
        { label: t('contactUs'), href: '#' },
        { label: t('shippingInfo'), href: '#' },
        { label: t('returnsPolicy'), href: '#' },
        { label: t('faq'), href: '#' },
      ],
    },
    {
      title: t('legal'),
      links: [
        { label: t('termsOfService'), href: '#' },
        { label: t('privacyPolicy'), href: '#' },
        { label: t('cookiePolicy'), href: '#' },
      ],
    },
  ];

  return (
    <footer role="contentinfo" className="bg-slate-900 text-slate-300">
      <div className="max-w-[var(--container-max)] mx-auto px-4 sm:px-6 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-8">
          {/* Brand column */}
          <div className="col-span-2 md:col-span-4 lg:col-span-1 mb-4 lg:mb-0">
            <Image src="/assets/cartzii-logo.png" alt="Cartzii" width={150} height={40} className="object-contain brightness-0 invert" />
            <p className="mt-3 text-sm text-slate-400 max-w-xs">
              Discover products you&apos;ll love from trusted sellers worldwide.
            </p>
            <div className="mt-4">
              <CountrySelector />
            </div>
          </div>

          {/* Link columns */}
          {sections.map((section) => (
            <div key={section.title}>
              <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">
                {section.title}
              </h3>
              <ul className="space-y-2.5">
                {section.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-slate-400 hover:text-white transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="border-t border-slate-800 mt-10 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-slate-500">
            {t('copyright', { year: new Date().getFullYear() })}
          </p>
          <p className="text-sm text-slate-500">{t('madeWith')}</p>
        </div>
      </div>
    </footer>
  );
}

import { NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import {
  buildCountryPath,
  allLocales,
} from "@/config/countries";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { SkipLink } from "@/components/accessibility/SkipLink";
import { LoginModal } from "@/components/auth/LoginModal";
import { CartDrawer } from "@/components/cart/CartDrawer";

type Props = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Metadata" });
  const baseUrl = "https://cartzii.com";

  const languages: Record<string, string> = {
    "x-default": `${baseUrl}${buildCountryPath("en-US", "")}`,
  };
  for (const loc of allLocales) {
    languages[loc.toLowerCase()] = `${baseUrl}${buildCountryPath(loc, "")}`;
  }

  return {
    title: {
      template: "%s | Cartziio",
      default: t("title"),
    },
    description: t("description"),
    alternates: {
      canonical: `${baseUrl}${buildCountryPath(locale, "")}`,
      languages,
    },
    openGraph: {
      title: t("title"),
      description: t("description"),
      url: `${baseUrl}${buildCountryPath(locale, "")}`,
      siteName: "Cartziio",
      locale: locale.replace("-", "_"),
      type: "website",
    },
  };
}

export default async function LocaleLayout({ children, params }: Props) {
  const { locale } = await params;

  if (!routing.locales.includes(locale as (typeof routing.locales)[number])) {
    notFound();
  }

  const messages = await getMessages();
  const lang = locale.split("-")[0];
  const dir = ["ar", "he", "fa", "ur"].includes(lang) ? "rtl" : "ltr";

  return (
    <div dir={dir} lang={locale} className="overflow-x-hidden">
      <NextIntlClientProvider messages={messages}>
        <SkipLink />
        <Header />
        <LoginModal />
        <CartDrawer />
        <main id="main-content" role="main" className="flex-1">
          {children}
        </main>
        <Footer />
      </NextIntlClientProvider>
    </div>
  );
}

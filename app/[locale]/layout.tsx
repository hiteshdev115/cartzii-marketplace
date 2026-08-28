import { NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import { generateAlternates } from "@/lib/seo";
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
  // Read from the environment, not hardcoded: this layout is built for both
  // cartzii.ca and cartzii.com, and a fixed .com here would have the Canadian
  // site declare the US one as its canonical home page.
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://cartzii.com";

  // One builder for canonical and hreflang, so the home page cannot drift
  // from every other page's tags.
  const alternates = await generateAlternates(baseUrl, "/");

  return {
    title: {
      template: "%s | Cartzii",
      default: t("title"),
    },
    description: t("description"),
    alternates,
    openGraph: {
      title: t("title"),
      description: t("description"),
      url: alternates.canonical,
      siteName: "Cartzii",
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

import type { Metadata } from "next";
import { getLocale } from "next-intl/server";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Cartzii Marketplace",
  description: "Discover products you'll love on Cartzii Marketplace",
  icons: { icon: "/cartzii-fevicon.png" },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // The real locale, not a hardcoded "en". This is the element screen readers
  // and translation tools read, so a French page announcing itself as English
  // is wrong for both — and it is the <html> tag, so the inner div's lang on
  // the locale layout cannot correct it.
  const locale = await getLocale();

  return (
    <html lang={locale} className={`${inter.className} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-[var(--color-bg-site)] text-slate-900 overflow-x-hidden">
        {children}
      </body>
    </html>
  );
}

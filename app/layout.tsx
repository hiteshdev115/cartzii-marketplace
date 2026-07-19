import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Cartziio Marketplace",
  description: "Discover products you'll love on Cartziio Marketplace",
  icons: { icon: "/cartzii-fevicon.png" },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.className} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-[var(--color-bg-site)] text-slate-900 overflow-x-hidden">
        {children}
      </body>
    </html>
  );
}

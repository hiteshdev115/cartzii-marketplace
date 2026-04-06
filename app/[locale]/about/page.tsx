import { getTranslations } from 'next-intl/server';
import { Breadcrumb } from '@/components/layout/Breadcrumb';
import { ShieldCheck, Truck, HeartHandshake, Globe, Users, Award } from 'lucide-react';
import { generateAlternates } from '@/lib/seo';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const alternates = generateAlternates(process.env.NEXT_PUBLIC_BASE_URL || 'https://cartzii.com', '/about', locale);
  return {
    title: 'About Us - Cartzii',
    description: 'Learn about Cartzii - your trusted marketplace for quality products.',
    alternates,
  };
}

export default async function AboutPage() {
  const t = await getTranslations('Common');

  const values = [
    { icon: ShieldCheck, title: 'Quality First', description: 'We curate only the best products from trusted brands and sellers.' },
    { icon: Truck, title: 'Fast Delivery', description: 'Free shipping on orders over $50, with reliable tracking every step of the way.' },
    { icon: HeartHandshake, title: 'Customer Care', description: '24/7 support team dedicated to making your shopping experience exceptional.' },
    { icon: Globe, title: 'Global Reach', description: 'Serving customers across North America with localized shopping experiences.' },
    { icon: Users, title: 'Community', description: 'Join thousands of happy customers who trust Cartzii for their everyday needs.' },
    { icon: Award, title: 'Best Prices', description: 'Competitive pricing with exclusive deals and seasonal promotions.' },
  ];

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Breadcrumb items={[{ label: 'About Us' }]} />

      {/* Hero */}
      <section className="text-center py-16 md:py-24">
        <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4">
          About <span className="text-primary">Cartzii</span>
        </h1>
        <p className="text-lg text-slate-600 max-w-2xl mx-auto">
          Your trusted marketplace for discovering quality products at great prices.
          We connect buyers with curated sellers to create a seamless shopping experience.
        </p>
      </section>

      {/* Values */}
      <section className="py-12">
        <h2 className="text-2xl font-bold text-slate-900 text-center mb-12">Our Values</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {values.map((value) => (
            <div key={value.title} className="card-base p-6 text-center">
              <value.icon className="w-12 h-12 text-primary mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-slate-900 mb-2">{value.title}</h3>
              <p className="text-sm text-slate-600">{value.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Stats */}
      <section className="py-12 bg-gradient-to-r from-primary to-orange-600 rounded-3xl px-8 text-center text-white">
        <h2 className="text-2xl font-bold mb-8">Cartzii by the Numbers</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8">
          {[
            { value: '50K+', label: 'Products' },
            { value: '100K+', label: 'Happy Customers' },
            { value: '2', label: 'Countries' },
            { value: '99%', label: 'Satisfaction Rate' },
          ].map((stat) => (
            <div key={stat.label}>
              <p className="text-3xl md:text-4xl font-bold">{stat.value}</p>
              <p className="text-white/80 text-sm mt-1">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Mission */}
      <section className="py-16 text-center">
        <h2 className="text-2xl font-bold text-slate-900 mb-4">Our Mission</h2>
        <p className="text-slate-600 max-w-3xl mx-auto text-lg leading-relaxed">
          At Cartzii, we believe shopping should be simple, secure, and satisfying.
          Our mission is to provide a marketplace where quality meets convenience,
          offering customers the products they love with the service they deserve.
          From electronics to fashion, home goods to wellness — we've got you covered.
        </p>
      </section>
    </main>
  );
}

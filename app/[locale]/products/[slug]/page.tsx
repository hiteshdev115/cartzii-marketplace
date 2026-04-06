import { getTranslations } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { getProductBySlug, allProducts, getProductReviews } from '@/lib/mockData';
import { ProductGallery } from '@/components/products/ProductGallery';
import { ProductInfo } from '@/components/products/ProductInfo';
import { ProductTabs } from '@/components/products/ProductTabs';
import { RelatedProducts } from '@/components/products/RelatedProducts';
import { ReviewForm } from '@/components/products/ReviewForm';
import { Breadcrumb } from '@/components/layout/Breadcrumb';
import { generateProductJsonLd, generateAlternates } from '@/lib/seo';
import { buildCountryPath, getCountryConfig } from '@/config/countries';

export async function generateMetadata({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { locale, slug } = await params;
  const product = getProductBySlug(slug);
  if (!product) return {};
  const alternates = generateAlternates(process.env.NEXT_PUBLIC_BASE_URL || 'https://cartzii.com', `/products/${slug}`, locale);
  return {
    // TODO: Use country-specific SEO from API: countrySeo?.metatitle || product.name
    title: product.name,
    // TODO: Use country-specific SEO from API: countrySeo?.metadescription || product.shortDescription
    description: product.shortDescription,
    alternates,
    openGraph: {
      title: product.name,
      description: product.shortDescription,
      images: product.images,
    },
  };
}

export default async function ProductDetailPage({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { locale, slug } = await params;
  const product = getProductBySlug(slug);
  if (!product) notFound();

  const t = await getTranslations({ locale, namespace: 'Products' });
  const reviews = getProductReviews(product.id);
  const related = allProducts.filter((p) => p.category === product.category && p.id !== product.id).slice(0, 4);

  const jsonLd = generateProductJsonLd({
    name: product.name,
    description: product.description,
    image: product.images[0],
    sku: product.sku,
    price: product.salePrice || product.price,
    currency: getCountryConfig(locale).currency,
    availability: product.inStock ? 'InStock' : 'OutOfStock',
    rating: product.rating,
    reviewCount: product.reviewCount,
    url: `${process.env.NEXT_PUBLIC_BASE_URL || 'https://cartzii.com'}${buildCountryPath(locale, `/products/${product.slug}`)}`,
  });

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <Breadcrumb
        items={[
          { label: t('allProducts'), href: buildCountryPath(locale, '/products') },
          { label: product.name },
        ]}
      />
      <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 mt-6">
        <ProductGallery images={product.images} productName={product.name} />
        <ProductInfo product={product} />
      </div>
      <div className="mt-12">
        <ProductTabs product={product} reviews={reviews} />
        <ReviewForm productId={product.id} />
      </div>
      <RelatedProducts products={related} />
    </main>
  );
}

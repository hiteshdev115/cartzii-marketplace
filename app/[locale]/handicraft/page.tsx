import { generateAlternates } from '@/lib/seo';
import { currentCountry } from '@/config/countries';
import { fetchHandicraftFacets } from '@/lib/api/handicraft';
import { HandicraftPageClient } from './HandicraftPageClient';

/**
 * Metadata built from what is ACTUALLY listed.
 *
 * The previous version guessed at handicraft categories by keyword-matching
 * the general category tree ("craft", "wood", "paper", …), which advertised
 * whatever happened to contain those letters. Now that products declare their
 * own type, the description names the real techniques and origins.
 */
export async function generateMetadata() {
  const facets = await fetchHandicraftFacets();

  const techniques = facets.techniques.slice(0, 4).map((t) => t.technique).filter(Boolean);
  const countryCount = facets.countries.length;

  const description =
    techniques.length > 0
      ? `Handmade pieces from artisans${countryCount > 0 ? ` in ${countryCount} ${countryCount === 1 ? 'country' : 'countries'}` : ''}. ${techniques.join(', ')} and more — each item made by hand, with the maker's story.`
      : 'Handmade pieces from artisans around the world. Every item made by hand, with the story of the maker who made it.';

  const alternates = await generateAlternates(
    process.env.NEXT_PUBLIC_BASE_URL || 'https://cartzii.com',
    '/handicraft',
  );

  return {
    title: 'Handicraft — Handmade & Artisan Goods | Cartzii',
    description,
    keywords: [
      'handmade', 'handicraft', 'artisan', 'craft', 'one of a kind',
      ...techniques.map((t) => t.toLowerCase()),
    ],
    alternates,
    openGraph: {
      title: 'Handicraft — Handmade & Artisan Goods | Cartzii',
      description,
      type: 'website',
    },
  };
}

export default async function HandicraftPage() {
  // A CollectionPage node, so the section is understood as a curated
  // collection rather than a loose set of product pages.
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'Handicraft',
    description: 'Handmade and artisan goods from makers around the world.',
    url: `${process.env.NEXT_PUBLIC_BASE_URL || 'https://cartzii.com'}/handicraft`,
    inLanguage: currentCountry === 'ca' ? 'en-CA' : 'en-US',
  };

  return (
    <>
      <script
        type="application/ld+json"
        // Serialised server-side from values this app controls; no user input
        // reaches it.
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <HandicraftPageClient />
    </>
  );
}

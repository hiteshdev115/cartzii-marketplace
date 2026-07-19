import { generateAlternates } from '@/lib/seo';
import { fetchCategoryTree } from '@/lib/api';
import { HandicraftPageClient } from './HandicraftPageClient';
import type { Category } from '@/types';

/** Keywords that identify handicraft-related categories from the API */
const HANDICRAFT_KEYWORDS = [
  'craft', 'handicraft', 'handmade', 'artisan', 'art', 'knit', 'sew', 'stitch',
  'embroid', 'weav', 'crochet', 'pottery', 'ceramic', 'paint', 'sculpt', 'wood',
  'carv', 'jewel', 'bead', 'macram', 'quilt', 'origami', 'calligraph', 'print',
  'stamp', 'diy', 'fabric', 'yarn', 'thread', 'canvas', 'sketch', 'draw',
  'leatherwork', 'leather', 'glass', 'mosaic', 'textile', 'lace', 'tassel',
  'home decor', 'stationery', 'paper', 'scrapbook', 'candle', 'soap', 'resin',
];

function isHandicraftCategory(cat: Category): boolean {
  const hay = `${cat.slug} ${cat.name} ${cat.description}`.toLowerCase();
  return HANDICRAFT_KEYWORDS.some((kw) => hay.includes(kw));
}

/** Recursively collect handicraft categories from the full tree */
function collectHandicraftCategories(cats: Category[]): Category[] {
  const result: Category[] = [];
  for (const cat of cats) {
    if (isHandicraftCategory(cat)) {
      result.push(cat);
    } else if (cat.subcategories?.length) {
      result.push(...collectHandicraftCategories(cat.subcategories));
    }
  }
  return result;
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const alternates = generateAlternates(
    process.env.NEXT_PUBLIC_BASE_URL || 'https://cartzii.com',
    '/handicraft',
    locale,
  );
  return {
    title: 'Handicraft — Artisan & Handmade | Cartziio',
    description:
      'Explore handmade, artisan, and craft categories on Cartziio. Discover knitting, pottery, woodwork, jewelry making, sewing, and more. Shop unique handcrafted products or find supplies for your next project.',
    keywords: [
      'handicraft', 'handmade', 'artisan', 'crafts', 'DIY', 'knitting', 'pottery',
      'sewing', 'jewelry making', 'woodwork', 'crochet', 'embroidery',
    ],
    alternates,
    openGraph: {
      title: 'Handicraft — Artisan & Handmade | Cartziio',
      description: 'Shop handcrafted and artisan products across all craft categories.',
      type: 'website',
    },
  };
}

export default async function HandicraftPage({ params }: { params: Promise<{ locale: string }> }) {
  await params; // consume params (locale used in metadata)

  let handicraftCategories: Category[] = [];
  let allCategories: Category[] = [];

  try {
    const tree = await fetchCategoryTree();
    allCategories = tree;
    handicraftCategories = collectHandicraftCategories(tree);
  } catch {
    // fall through — client will attempt its own fetch
  }

  return (
    <HandicraftPageClient
      initialHandicraftCategories={handicraftCategories}
      initialAllCategories={allCategories}
    />
  );
}

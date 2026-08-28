import { api } from './client';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://staging-api.cartzii.com';
const BANNER_CDN = `${API_BASE}/assets/upload/bannerImages`;

/** A hero slide, as configured in the super admin panel. */
export interface HomeBanner {
  bannerid: number;
  imageUrl: string;
  title: string | null;
  subtitle: string | null;
  ctaText: string | null;
  ctaHref: string | null;
  heightPx: number;
  sortOrder: number;
}

export interface HomeBannerFeed {
  banners: HomeBanner[];
  /**
   * The single height the carousel renders at, decided server-side as the
   * tallest live banner.
   *
   * One number for the whole rotation, not one per slide: a section that
   * re-heights on every auto-advance shoves everything below it up and down
   * the page, which is exactly what this replaced.
   */
  carouselHeight: number;
}

interface APIBanner {
  bannerid: number;
  imageurl: string;
  title: string | null;
  subtitle: string | null;
  ctatext: string | null;
  ctahref: string | null;
  heightpx: number;
  sortorder: number;
}

function buildBannerImageUrl(url: string | undefined): string {
  if (!url) return '';
  if (url.startsWith('http')) return url;
  return `${BANNER_CDN}/${url}`;
}

/**
 * The banners a shopper should see now.
 *
 * Returns an empty list on failure rather than throwing: the hero is the first
 * thing on the page, and a banner service having a bad moment must not be what
 * stops the home page rendering.
 */
export async function fetchHomeBanners(): Promise<HomeBannerFeed> {
  const empty: HomeBannerFeed = { banners: [], carouselHeight: 480 };

  try {
    const res = await api.get<unknown>('/api/v1/banners');
    const raw = res as { data?: { banners?: APIBanner[]; carouselHeight?: number } };
    const payload = raw?.data;
    if (!payload || !Array.isArray(payload.banners)) return empty;

    return {
      banners: payload.banners.map((b) => ({
        bannerid: b.bannerid,
        imageUrl: buildBannerImageUrl(b.imageurl),
        title: b.title,
        subtitle: b.subtitle,
        ctaText: b.ctatext,
        ctaHref: b.ctahref,
        heightPx: b.heightpx,
        sortOrder: b.sortorder,
      })),
      carouselHeight: Number(payload.carouselHeight) || empty.carouselHeight,
    };
  } catch {
    return empty;
  }
}

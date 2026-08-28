import { api } from './client';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://staging-api.cartzii.com';
const BANNER_CDN = `${API_BASE}/assets/upload/bannerImages`;

/** CSS object-fit. 'fill' stretches and will distort the image. */
export type BannerImageFit = 'cover' | 'contain' | 'fill' | 'scale-down' | 'none';

/** Which side the copy sits on. */
export type BannerContentAlign = 'left' | 'center' | 'right';

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
  /** 'cover' crops the overflow; 'contain' shows the whole image. */
  imageFit: BannerImageFit;
  /** CSS object-position keyword — which part survives a crop. */
  focalPoint: string;
  contentAlign: BannerContentAlign;
  /** Behind the letterboxing that 'contain' produces. */
  backdropColor: string;
}

/**
 * The shape every slide is drawn in — one frame for the whole rotation.
 *
 * 'auto' means the frame takes the artwork's own proportions, so the image
 * shows whole with neither a crop nor bars. `heightPx` is the cap in that mode
 * (a square image would otherwise be as tall as the viewport is wide) and the
 * height outright in 'fixed'.
 */
export interface CarouselFrame {
  mode: 'fixed' | 'auto';
  heightPx: number;
  aspectRatio: number | null;
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
  /** How to shape the frame. Decided server-side, never per slide. */
  frame: CarouselFrame;
}

/**
 * Only trust a frame that is internally coherent.
 *
 * 'auto' without a usable ratio would render a section with no height at all —
 * a blank strip where the hero should be — so it falls back to the fixed
 * height rather than to nothing.
 */
function safeFrame(frame: CarouselFrame | undefined, fallbackHeight: number): CarouselFrame {
  const heightPx = Number(frame?.heightPx) || fallbackHeight;
  const ratio = Number(frame?.aspectRatio);

  if (frame?.mode === 'auto' && Number.isFinite(ratio) && ratio > 0) {
    return { mode: 'auto', heightPx, aspectRatio: ratio };
  }
  return { mode: 'fixed', heightPx, aspectRatio: null };
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
  imagefit?: string;
  heightmode?: string;
  focalpoint?: string;
  contentalign?: string;
  backdropcolor?: string;
}

/**
 * The nine focal points the admin can choose, and the two fits.
 *
 * Re-checked here even though the database constrains the column: these values
 * are written straight into an inline style, and a storefront that trusted
 * whatever arrived would put an unvalidated string into the page's CSS if the
 * API were ever misconfigured or swapped.
 */
const IMAGE_FITS = new Set(['cover', 'contain', 'fill', 'scale-down', 'none']);

const FOCAL_POINTS = new Set([
  'left top', 'center top', 'right top',
  'left center', 'center', 'right center',
  'left bottom', 'center bottom', 'right bottom',
]);

function safeFit(value: string | undefined): BannerImageFit {
  return value && IMAGE_FITS.has(value) ? (value as BannerImageFit) : 'cover';
}

function safeFocalPoint(value: string | undefined): string {
  return value && FOCAL_POINTS.has(value) ? value : 'center';
}

function safeAlign(value: string | undefined): BannerContentAlign {
  return value === 'center' || value === 'right' ? value : 'left';
}

function safeColor(value: string | undefined): string {
  return value && /^#[0-9a-f]{6}([0-9a-f]{2})?$/i.test(value) ? value : '#0f172a';
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
  const empty: HomeBannerFeed = {
    banners: [],
    carouselHeight: 480,
    frame: { mode: 'fixed', heightPx: 480, aspectRatio: null },
  };

  try {
    const res = await api.get<unknown>('/api/v1/banners');
    const raw = res as {
      data?: { banners?: APIBanner[]; carouselHeight?: number; carouselFrame?: CarouselFrame };
    };
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
        imageFit: safeFit(b.imagefit),
        focalPoint: safeFocalPoint(b.focalpoint),
        contentAlign: safeAlign(b.contentalign),
        backdropColor: safeColor(b.backdropcolor),
      })),
      carouselHeight: Number(payload.carouselHeight) || empty.carouselHeight,
      frame: safeFrame(payload.carouselFrame, Number(payload.carouselHeight) || empty.carouselHeight),
    };
  } catch {
    return empty;
  }
}

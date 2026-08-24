import { api, ApiError } from './client';

// ---- API response shapes --------------------------------------------------

export interface ReviewMedia {
  mediaid: number;
  reviewid: number;
  mediaurl: string;
  mediatype: 'image' | 'video';
  sortorder: number;
  createdat: string;
}

export interface ReviewUser {
  userid: number;
  firstname: string;
  lastname: string;
}

export interface ReviewAPIItem {
  reviewid: number;
  productid: number;
  userid: number;
  rating: number;
  reviewtitle: string;
  reviewtext: string;
  reviewdate: string;
  status: string;
  createdat: string;
  updatedat: string;
  media: ReviewMedia[];
  users: ReviewUser;
  /** Product info — present only in getUserReviews response */
  products?: {
    productid: number;
    productname: string;
    slug: string;
    shortdescription?: string;
    productimages?: { imageid: number; imageurl: string; imagetype: string }[];
  };
}

export interface RatingDistribution {
  rating: number;
  count: number;
}

export interface ReviewStats {
  averageRating: number;
  totalReviews: number;
  ratingDistribution: RatingDistribution[];
}

export interface ProductReviewsResponse {
  reviews: ReviewAPIItem[];
  stats: ReviewStats;
}

// ---- Fetch product reviews ------------------------------------------------

export async function fetchProductReviews(
  productId: number,
): Promise<ProductReviewsResponse> {
  const res = await api.get<{
    success: boolean;
    data: ReviewAPIItem[];
    stats: ReviewStats;
  }>(`/api/v1/getProductReviews/${productId}`);

  return {
    reviews: res.data ?? [],
    stats: res.stats ?? { averageRating: 0, totalReviews: 0, ratingDistribution: [] },
  };
}

// ---- Fetch user's own reviews (auth required) ----------------------------

export async function fetchUserReviews(userId: string | number): Promise<ReviewAPIItem[]> {
  const res = await api.get<{
    success: boolean;
    data: ReviewAPIItem[];
    totalReviews: number;
  }>(`/api/v1/getUserReviews/${userId}`);
  return res.data ?? [];
}

// ---- Post a review (multipart/form-data) ----------------------------------

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || 'https://staging-api.cartzii.com';

function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem('cartzii-auth');
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed?.state?.token ?? null;
  } catch {
    return null;
  }
}

/** API error code for "this customer already reviewed this product". */
export const REVIEW_ALREADY_EXISTS = 1059;

/** Thrown when the customer has already reviewed the product. */
export class AlreadyReviewedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AlreadyReviewedError';
  }
}

/**
 * Posts a review. ONE PER CUSTOMER PER PRODUCT, and final once posted.
 *
 * There is no update or delete counterpart, by design — see the API's Review
 * model. A second attempt on the same product is refused with 409, which the
 * form surfaces as a plain explanation rather than a failure the customer would
 * try again.
 */
export async function postReview(formData: FormData): Promise<ReviewAPIItem> {
  const token = getAuthToken();
  if (!token) {
    throw new ApiError(401, 'Unauthorized', { message: 'Login required to post a review' });
  }

  const res = await fetch(`${API_BASE_URL}/api/v1/postReview`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      // Do NOT set Content-Type — the browser sets it with the correct boundary for FormData
    },
    body: formData,
  });

  if (!res.ok) {
    let errorBody: unknown;
    try {
      errorBody = await res.json();
    } catch {
      errorBody = await res.text().catch(() => null);
    }

    // Distinguished from every other failure because it is the one the customer
    // must NOT retry — the review they are looking at is already theirs.
    if (res.status === 409) {
      const body = errorBody as { message?: string } | null;
      throw new AlreadyReviewedError(
        body?.message ?? 'You have already reviewed this product.',
      );
    }

    throw new ApiError(res.status, res.statusText, errorBody);
  }

  const json = await res.json();

  // API returns { error: 1022, message: "..." } on validation errors
  if (json.error) {
    if (json.error === REVIEW_ALREADY_EXISTS) {
      throw new AlreadyReviewedError(
        json.message ?? 'You have already reviewed this product.',
      );
    }
    throw new ApiError(400, 'Validation Error', json);
  }

  return json.data;
}

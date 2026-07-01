import { api } from './client';

// ---- API response shapes --------------------------------------------------

export interface WishlistAPIImage {
  imageid: number;
  productid: number;
  imageurl: string;
  imagetype: string;
  imagealttext: string;
  isprimary: boolean;
  isactive: boolean;
}

export interface WishlistAPIProduct {
  productid: number;
  productname: string;
  slug: string;
  shortdescription: string;
  productdescription: string;
  sku: string;
  stockquantity: number;
  status: string;
  tags: string;
  category: {
    categoryid: number;
    categoryname: string;
    categoryslug: string;
    categoryimage: string;
  } | null;
  images: WishlistAPIImage[];
  pricing: {
    price: string;
    discountprice: string | null;
    discount: string | null;
    currencycode: string;
    countrycode: string;
  } | null;
}

export interface WishlistAPIItem {
  wishlistid: number;
  userid: number;
  added_at: string;
  product: WishlistAPIProduct;
}

interface WishlistSuccessResponse {
  success: number;
  message: string;
}

interface WishlistErrorResponse {
  errorCode: number;
  message: string;
  // Legacy format used by some endpoints
  error?: number;
}

// ---- API functions --------------------------------------------------------

const IMAGE_CDN_URL =
  process.env.NEXT_PUBLIC_IMAGE_CDN_URL ||
  'https://staging-api.cartzii.com/assets/upload/productImages';

export function buildWishlistImageUrl(url: string | undefined): string {
  if (!url) return '/assets/placeholder-product.png';
  if (url.startsWith('http')) return url;
  return `${IMAGE_CDN_URL}/${url}`;
}

export async function fetchWishlistItems(
  userId: string,
): Promise<WishlistAPIItem[]> {
  const res = await api.get<WishlistAPIItem[] | WishlistErrorResponse>(
    `/api/v1/getWisheListItems/${userId}`,
  );
  if (Array.isArray(res)) return res;
  if (res && typeof res === 'object') {
    const errCode = ('errorCode' in res ? res.errorCode : 0) || ('error' in res ? res.error : 0);
    // 1009 = invalid token → surface as error so callers know to re-login
    if (errCode === 1009) throw new Error('Invalid auth token');
    // other errors (1003 = empty wishlist) → treat as empty
    return [];
  }
  return [];
}

export async function addToWishlistAPI(
  userId: string,
  productId: number,
): Promise<{ success: boolean; alreadyExists?: boolean }> {
  const res = await api.post<WishlistSuccessResponse | WishlistErrorResponse>(
    '/api/v1/addWishListProd',
    { userid: Number(userId), productid: productId },
  );
  if ('success' in res) return { success: true };
  if ('error' in res && (res.error === 1023) ||
      'errorCode' in res && (res.errorCode === 1023)) return { success: true, alreadyExists: true };
  return { success: false };
}

export async function removeFromWishlistAPI(
  userId: string,
  productId: number,
): Promise<boolean> {
  const res = await api.delete<WishlistSuccessResponse | WishlistErrorResponse>(
    `/api/v1/removeWishListProd/${userId}/${productId}`,
  );
  if ('success' in res) return true;
  return false;
}

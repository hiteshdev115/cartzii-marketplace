import { api } from './client';

// ---- API response shapes --------------------------------------------------

export interface CartAPIProduct {
  productid: number;
  productname: string;
  slug: string;
  sku: string;
  shortdescription: string;
  stockquantity: number;
  status: string;
  category: {
    categoryid: number;
    categoryname: string;
    categoryslug: string;
  } | null;
  image: string | null;
}

export interface CartAPIVariantAttribute {
  attributeid?: number;
  attributename: string;
  valueid?: number;
  valuename: string;
}

export interface CartAPIVariant {
  variantid: number;
  sku: string;
  stockquantity: number;
  attributes: CartAPIVariantAttribute[];
}

export interface CartAPIItem {
  cartid: number;
  userid: number;
  productid: number;
  variantid: number | null;
  quantity: number;
  price: string;
  countrycode: string | null;
  currencycode: string | null;
  subtotal?: string;
  isactive?: boolean;
  addedat: string;
  updatedat: string;
  product: CartAPIProduct;
  variant: CartAPIVariant | null;
}

export interface CartAPISummary {
  totalItems: number;
  totalAmount: string;
  currencycode: string;
}

interface CartGetResponse {
  success?: number;
  error?: number;
  message: string;
  data: {
    cart: CartAPIItem[];
    summary: CartAPISummary;
  };
}

interface CartMutateResponse {
  success?: number;
  error?: number;
  message: string;
  data?: CartAPIItem;
}

interface CartDeleteResponse {
  success?: number;
  error?: number;
  message: string;
}

interface CartCountResponse {
  success?: number;
  error?: number;
  message: string;
  data?: {
    userid: number;
    itemCount: number;
  };
}

// ---- CDN helper -----------------------------------------------------------

const IMAGE_CDN_URL =
  process.env.NEXT_PUBLIC_IMAGE_CDN_URL ||
  'https://staging-api.cartzii.com/assets/upload/productImages';

export function buildCartImageUrl(url: string | null | undefined): string {
  if (!url) return '/assets/placeholder-product.png';
  if (url.startsWith('http')) return url;
  return `${IMAGE_CDN_URL}/${url}`;
}

// ---- API functions --------------------------------------------------------

export interface AddCartItemParams {
  userid: number;
  productid: number;
  variantid?: number;
  quantity: number;
  price: string;
  countrycode?: string;
  currencycode?: string;
  selectedAttributes?: Record<string, string>;
  name?: string;
  image?: string;
}

const CART_CONFIG = { skipGuestToken: true };

export async function addCartItemAPI(
  params: AddCartItemParams,
): Promise<CartAPIItem | null> {
  const res = await api.post<CartMutateResponse>('/api/v1/cart/add', params, CART_CONFIG);
  if ('success' in res && res.data) return res.data;
  return null;
}

const EMPTY_CART_RESULT = {
  cart: [] as CartAPIItem[],
  summary: { totalItems: 0, totalAmount: '0.00', currencycode: 'USD' } as CartAPISummary,
};

export async function fetchCartItemsAPI(
  userId: string,
): Promise<{ cart: CartAPIItem[]; summary: CartAPISummary }> {
  try {
    const res = await api.get<CartGetResponse>(`/api/v1/cart/${userId}`, CART_CONFIG);
    // Success path: data field present
    if (res.data?.cart) return res.data;
    // Server returned 200 but with an error code body (e.g. { error: 1002/1003 }) — treat as empty
    return EMPTY_CART_RESULT;
  } catch {
    // Server 4xx / 5xx (including 500 "Internal server error" for empty carts) — treat as empty
    return EMPTY_CART_RESULT;
  }
}

export interface UpdateCartItemParams {
  cartid: number;
  quantity: number;
  price?: string;
}

export async function updateCartItemAPI(
  params: UpdateCartItemParams,
): Promise<CartAPIItem | null> {
  const res = await api.put<CartMutateResponse>('/api/v1/cart/update', params, CART_CONFIG);
  if ('success' in res && res.data) return res.data;
  return null;
}

export async function removeCartItemAPI(
  cartId: number,
  userId: string,
): Promise<boolean> {
  const res = await api.delete<CartDeleteResponse>(
    `/api/v1/cart/remove/${cartId}/${userId}`,
    CART_CONFIG,
  );
  return 'success' in res && !!res.success;
}

export async function clearCartAPI(userId: string): Promise<boolean> {
  const res = await api.delete<CartDeleteResponse>(
    `/api/v1/cart/clear/${userId}`,
    CART_CONFIG,
  );
  return 'success' in res && !!res.success;
}

export async function getCartCountAPI(userId: string): Promise<number> {
  const res = await api.get<CartCountResponse>(`/api/v1/cart/count/${userId}`, CART_CONFIG);
  return res.data?.itemCount ?? 0;
}

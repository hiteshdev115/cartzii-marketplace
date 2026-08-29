/**
 * The artisan detail behind a handicraft listing, exactly as the API nests it.
 *
 * Its PRESENCE is what makes a product a handicraft — there is no separate
 * flag to fall out of step with it.
 */
export interface HandicraftDetails {
  artisan_name: string;
  craft_origin_country: string;
  craft_origin_region: string | null;
  craft_technique: string | null;
  material_used: string[];
  is_handmade: boolean;
  is_one_of_a_kind: boolean;
  certifications: string[];
  production_lead_time_days: number | null;
  is_made_to_order: boolean;
  artisan_story: string | null;
  /** A listed material carries an import/export caution. */
  has_restricted_material: boolean;
}

/** Seller badges shown beside a handicraft listing. */
export interface ProductSellerBadges {
  sellerid: number;
  is_international_seller: boolean;
  seller_country: string | null;
  artisan_verified: boolean;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  shortDescription: string;
  price: number;
  salePrice?: number;
  discount?: number;
  currency: string;
  images: string[];
  category: string;
  categorySlug: string;
  subcategory?: string;
  brand: string;
  rating: number;
  reviewCount: number;
  sku: string;
  inStock: boolean;
  stockCount: number;
  colors?: ProductVariant[];
  sizes?: string[];
  tags: string[];
  isNew: boolean;
  onSale: boolean;
  isFeatured: boolean;
  isBestSeller: boolean;
  specifications: Record<string, string>;
  /**
   * Product-level attributes, keyed by attribute name ("Age Group", "Brand",
   * "Screen Size"). Every filter beyond price/rating/discount reads from here,
   * which is what lets a category page offer Fashion's attributes without any
   * of them being hardcoded in the frontend.
   */
  attributes: Record<string, string[]>;
  createdAt: string;
  /** Present only on a handicraft listing. */
  handicraft?: HandicraftDetails | null;
  /** Seller badges, when the feed supplies them. */
  sellerBadges?: ProductSellerBadges | null;
  /**
   * The flash deal behind this product's price, when one is running.
   *
   * Present only while the window is open — the API attaches it to the price
   * row it discounted, so its absence means the price is the ordinary one.
   */
  deal?: {
    dealId: number;
    discountPercent: number;
    startsAt: string;
    endsAt: string;
  };
  /** Full variant details – populated on detail page only */
  detailVariants?: DetailVariant[];
  /**
   * Seller that owns this product. Required for grouping cart items when
   * calling `/api/v1/shipping/rates`. Optional for backward compatibility
   * with legacy persisted carts and fixture data.
   */
  sellerId?: number;
  sellerName?: string | null;
  // ---- Optional shipping measurements (from `/getProductBySlug` etc.) ------
  /** Product weight (nullable — only shown when present). */
  weight?: number | null;
  /** Weight unit as returned by the API (e.g. `kg`, `lb`). */
  weightUnit?: string | null;
  length?: number | null;
  width?: number | null;
  height?: number | null;
  /** Dimension unit as returned by the API (e.g. `cm`, `in`). */
  dimensionUnit?: string | null;
  /**
   * Return & exchange terms for this product, resolved server-side from the
   * seller's own window falling back to the Cartzii platform default.
   *
   * Optional because legacy persisted carts and fixture data predate it — the
   * UI must hide the badge rather than render "undefined days".
   */
  returnPolicy?: ProductReturnPolicy;
  /**
   * When true, the seller absorbs the shipping charge and the storefront
   * shows a "Free Delivery" badge. Optional because legacy persisted carts
   * and mock fixtures predate the flag; treat `undefined` as false.
   */
  isFreeDelivery?: boolean;
}

/** Resolved return terms as returned by the product detail API. */
export interface ProductReturnPolicy {
  returnWindowDays: number;
  exchangeAllowed: boolean;
  /** Pre-formatted by the API so every surface shows identical wording. */
  summary: string;
}

export interface ProductVariant {
  name: string;
  value: string;
  hex?: string;
  image?: string;
}

/** Full variant data used on the product detail page */
export interface DetailVariant {
  variantId: string;
  sku: string;
  color?: string;
  colorHex?: string;
  size?: string;
  images: string[];
  price: number;
  salePrice?: number;
  discount?: number;
  stockCount: number;
  inStock: boolean;
  // ---- Optional shipping measurements (per-variant override) --------------
  weight?: number | null;
  weightUnit?: string | null;
  length?: number | null;
  width?: number | null;
  height?: number | null;
  dimensionUnit?: string | null;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  image: string;
  icon: string;
  productCount: number;
  subcategories?: Category[];
}

export interface CartItem {
  product: Product;
  quantity: number;
  selectedColor?: string;
  selectedSize?: string;
  /** All variant attributes from server (e.g. Color, Size, Material) */
  variantAttributes?: Array<{ name: string; value: string }>;
  /** Server-side cart ID (present when user is authenticated) */
  cartId?: number;
  /** Server-side variant ID */
  variantId?: number;
  /** Price string as stored on the server */
  price?: string;
  countryCode?: string;
  currencyCode?: string;
}

export interface WishlistItem {
  product: Product;
  addedAt: string;
}

export interface Review {
  id: string;
  productId: string;
  author: string;
  avatar: string;
  rating: number;
  title: string;
  comment: string;
  date: string;
  helpful: number;
  verified: boolean;
}

export interface Order {
  id: string;
  orderNumber: string;
  items: CartItem[];
  subtotal: number;
  shipping: number;
  tax: number;
  discount: number;
  total: number;
  status: OrderStatus;
  shippingAddress: Address;
  paymentMethod: string;
  createdAt: string;
  estimatedDelivery: string;
}

export type OrderStatus = 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'returned';

export interface Address {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  addressLine2?: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

/** Address record returned by the Address Management API */
export interface ApiAddress {
  id: number;
  userid: number;
  street: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  is_primary: boolean;
  is_shipping: boolean;
  is_billing: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

/** Payload for creating a new address */
export interface CreateAddressPayload {
  userid: number;
  street: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  is_primary?: boolean;
  is_shipping?: boolean;
  is_billing?: boolean;
}

/** Payload for updating an existing address (all fields optional) */
export interface UpdateAddressPayload {
  street?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  country?: string;
  is_primary?: boolean;
  is_shipping?: boolean;
  is_billing?: boolean;
  is_active?: boolean;
}

export interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
  joinDate: string;
  addresses: (Address & { isDefault?: boolean })[];
}

/** Profile data returned by the user update API */
export interface UserProfile {
  userid: number;
  roleid: number;
  userstatusid: number;
  firstname: string;
  lastname: string;
  email: string;
  phonenumber: string;
  addressid: number;
  profilepicture: string;
  createdat: string;
  updatedat: string;
  lastloginat: string;
  isverified: boolean;
  dateofbirth: string;
  gender: string;
  accounttype: string;
}

/** Fields that can be sent to PUT /api/v1/users/:id */
export interface UpdateProfilePayload {
  firstname?: string;
  lastname?: string;
  email?: string;
  password?: string;
  phonenumber?: string;
  gender?: string;
  dateofbirth?: string;
  profilepicture?: File;
}

export interface Testimonial {
  id: string;
  author: string;
  avatar: string;
  rating: number;
  quote: string;
  location: string;
}

export interface Deal {
  id: string;
  product: Product;
  originalPrice: number;
  dealPrice: number;
  discountPercent: number;
  endsAt: string;
  type: 'flash' | 'daily' | 'limited';
}

export interface FilterState {
  categories: string[];
  /**
   * Inclusive price bounds; `null` means unbounded on that side. Modelled as
   * nullable rather than defaulting to something like [0, 500], because a
   * numeric default is indistinguishable from a deliberate choice — the old
   * bar defaulted to 500 and then tested `< 1000`, so it reported a price
   * filter as active before the user had touched anything.
   */
  priceRange: [number | null, number | null];
  brands: string[];
  ratings: number[];
  colors: string[];
  sizes: string[];
  availability: 'all' | 'inStock' | 'outOfStock' | 'onSale';
  sortBy: SortOption;
  searchQuery: string;
  /** Show only products with a live discount. */
  onSaleOnly: boolean;
  /** Percent off, inclusive: [0, 80] means "no discount filter applied". */
  discountRange: [number, number];
  /**
   * Selected values for any attribute, keyed by attribute name. Age Group is
   * just another entry here — it is a global attribute like Brand or Gender,
   * so giving it a dedicated field would mean two code paths for one concept.
   */
  attributes: Record<string, string[]>;
}

export type SortOption = 'relevance' | 'price-low' | 'price-high' | 'newest' | 'best-selling' | 'top-rated';

export type ViewMode = 'grid' | 'list';

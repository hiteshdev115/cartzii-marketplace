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
  createdAt: string;
  /** Full variant details – populated on detail page only */
  detailVariants?: DetailVariant[];
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

export interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
  joinDate: string;
  addresses: (Address & { isDefault?: boolean })[];
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
  priceRange: [number, number];
  brands: string[];
  ratings: number[];
  colors: string[];
  sizes: string[];
  availability: 'all' | 'inStock' | 'outOfStock' | 'onSale';
  sortBy: SortOption;
  searchQuery: string;
}

export type SortOption = 'relevance' | 'price-low' | 'price-high' | 'newest' | 'best-selling' | 'top-rated';

export type ViewMode = 'grid' | 'list';

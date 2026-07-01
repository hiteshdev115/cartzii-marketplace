// Barrel export — import from '@/lib/api' keeps working everywhere
export { api, ApiError } from './client';
export type { RequestConfig } from './client';
export {
  fetchCategories,
  fetchCategoryTree,
  fetchRootCategories,
  fetchSubcategories,
  fetchCategoryById,
  fetchCategoryBreadcrumb,
  fetchCategoryProductsBySlug,
} from './categories';
export type { APIBreadcrumbItem, CategoryProduct, CategoryProductCountry, CategoryVariantPricing, CategoryProductVariant, CategoryProductsResult } from './categories';
export { fetchAllProducts, fetchProductBySlug } from './products';
export { placeOrder, getOrderByNumber, getTaxEstimate, fetchMyOrders } from './orders';
export {
  fetchUserAddresses,
  fetchAddress,
  createAddress,
  updateAddress,
  deleteAddress,
} from './addresses';
export { fetchAllCountries, fetchStatesByCountry } from './geo';
export type { CountryOption, StateOption } from './geo';
export { fetchUserProfile, updateUserProfile } from './users';
export { searchProductsAPI } from './search';
export type { SearchProductResult, SearchPagination, SearchParams } from './search';
export {
  fetchWishlistItems,
  addToWishlistAPI,
  removeFromWishlistAPI,
  buildWishlistImageUrl,
} from './wishlist';
export type { WishlistAPIItem, WishlistAPIProduct } from './wishlist';
export { fetchProductReviews, fetchUserReviews, postReview } from './reviews';
export type {
  ReviewAPIItem,
  ReviewMedia,
  ReviewUser,
  ReviewStats,
  RatingDistribution,
  ProductReviewsResponse,
} from './reviews';
export {
  addCartItemAPI,
  fetchCartItemsAPI,
  updateCartItemAPI,
  removeCartItemAPI,
  clearCartAPI,
  getCartCountAPI,
  buildCartImageUrl,
} from './cart';
export type {
  CartAPIItem,
  CartAPIProduct,
  CartAPIVariant,
  CartAPISummary,
  AddCartItemParams,
  UpdateCartItemParams,
} from './cart';

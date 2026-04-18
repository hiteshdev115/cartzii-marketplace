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
} from './categories';
export type { APIBreadcrumbItem } from './categories';
export { fetchAllProducts, fetchProductBySlug } from './products';
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

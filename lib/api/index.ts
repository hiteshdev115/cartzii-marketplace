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

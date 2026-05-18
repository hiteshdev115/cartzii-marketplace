/**
 * Maps category slugs / names to a Lucide icon component + gradient style.
 * Used as a fallback when a category has no image in the database.
 */

import {
  Smartphone,
  Laptop,
  Tv,
  Headphones,
  Camera,
  Watch,
  Gamepad2,
  Shirt,
  ShoppingBag,
  Baby,
  Footprints,
  Gem,
  Sofa,
  UtensilsCrossed,
  Lightbulb,
  Bath,
  BedDouble,
  Hammer,
  Dumbbell,
  Bike,
  Tent,
  Flower2,
  Leaf,
  Pill,
  Scissors,
  BookOpen,
  Music,
  Film,
  Car,
  Truck,
  PawPrint,
  Apple,
  ShoppingCart,
  Tag,
  type LucideIcon,
} from 'lucide-react';

interface CategoryIconConfig {
  icon: LucideIcon;
  /** Tailwind gradient classes for the icon container */
  gradient: string;
  /** Tailwind text-color for the icon itself */
  iconColor: string;
}

/** Token list: each entry defines slug keywords to match */
const ICON_MAP: Array<{ keywords: string[]; config: CategoryIconConfig }> = [
  // ── Electronics / Tech ─────────────────────────────────────────────
  {
    keywords: ['phone', 'mobile', 'smartphone', 'iphone', 'android'],
    config: { icon: Smartphone, gradient: 'from-blue-500 to-indigo-600', iconColor: 'text-white' },
  },
  {
    keywords: ['laptop', 'computer', 'pc', 'notebook', 'mac'],
    config: { icon: Laptop, gradient: 'from-slate-600 to-slate-800', iconColor: 'text-white' },
  },
  {
    keywords: ['tv', 'television', 'monitor', 'display', 'screen'],
    config: { icon: Tv, gradient: 'from-sky-500 to-blue-600', iconColor: 'text-white' },
  },
  {
    keywords: ['audio', 'headphone', 'speaker', 'earphone', 'earbuds', 'sound'],
    config: { icon: Headphones, gradient: 'from-violet-500 to-purple-600', iconColor: 'text-white' },
  },
  {
    keywords: ['camera', 'photo', 'photography', 'lens', 'video'],
    config: { icon: Camera, gradient: 'from-rose-500 to-pink-600', iconColor: 'text-white' },
  },
  {
    keywords: ['watch', 'smartwatch', 'wearable', 'wrist'],
    config: { icon: Watch, gradient: 'from-amber-500 to-orange-600', iconColor: 'text-white' },
  },
  {
    keywords: ['gaming', 'game', 'console', 'playstation', 'xbox', 'nintendo', 'video-game'],
    config: { icon: Gamepad2, gradient: 'from-green-500 to-emerald-600', iconColor: 'text-white' },
  },
  {
    keywords: ['electronics', 'gadget', 'tech', 'device', 'appliance'],
    config: { icon: Smartphone, gradient: 'from-blue-500 to-indigo-600', iconColor: 'text-white' },
  },

  // ── Fashion / Apparel ────────────────────────────────────────────────
  {
    keywords: ['men', 'mens', "men's", 'male', 'him'],
    config: { icon: Shirt, gradient: 'from-sky-600 to-blue-700', iconColor: 'text-white' },
  },
  {
    keywords: ['women', 'womens', "women's", 'female', 'her', 'ladies'],
    config: { icon: ShoppingBag, gradient: 'from-pink-500 to-rose-600', iconColor: 'text-white' },
  },
  {
    keywords: ['kids', 'children', 'baby', 'infant', 'toddler', 'child'],
    config: { icon: Baby, gradient: 'from-yellow-400 to-amber-500', iconColor: 'text-white' },
  },
  {
    keywords: ['shoe', 'shoes', 'sneaker', 'boot', 'footwear', 'sandal'],
    config: { icon: Footprints, gradient: 'from-orange-500 to-red-500', iconColor: 'text-white' },
  },
  {
    keywords: ['jewelry', 'jewellery', 'gem', 'ring', 'necklace', 'bracelet', 'diamond'],
    config: { icon: Gem, gradient: 'from-fuchsia-500 to-purple-600', iconColor: 'text-white' },
  },
  {
    keywords: ['bag', 'handbag', 'purse', 'backpack', 'luggage', 'travel-bag'],
    config: { icon: ShoppingBag, gradient: 'from-rose-500 to-pink-600', iconColor: 'text-white' },
  },
  {
    keywords: ['clothing', 'cloth', 'apparel', 'fashion', 'wear', 'outfit', 'dress'],
    config: { icon: Shirt, gradient: 'from-indigo-500 to-violet-600', iconColor: 'text-white' },
  },
  {
    keywords: ['accessory', 'accessories', 'sunglasses', 'belt', 'hat', 'cap'],
    config: { icon: Tag, gradient: 'from-teal-500 to-cyan-600', iconColor: 'text-white' },
  },

  // ── Home & Living ────────────────────────────────────────────────────
  {
    keywords: ['furniture', 'sofa', 'chair', 'table', 'desk', 'couch'],
    config: { icon: Sofa, gradient: 'from-amber-500 to-yellow-600', iconColor: 'text-white' },
  },
  {
    keywords: ['kitchen', 'cooking', 'cookware', 'bakeware', 'utensil', 'food'],
    config: { icon: UtensilsCrossed, gradient: 'from-orange-500 to-amber-600', iconColor: 'text-white' },
  },
  {
    keywords: ['light', 'lighting', 'lamp', 'bulb', 'illumination'],
    config: { icon: Lightbulb, gradient: 'from-yellow-400 to-orange-500', iconColor: 'text-white' },
  },
  {
    keywords: ['bath', 'bathroom', 'shower', 'towel', 'sanitary'],
    config: { icon: Bath, gradient: 'from-cyan-500 to-sky-600', iconColor: 'text-white' },
  },
  {
    keywords: ['bedroom', 'bed', 'mattress', 'pillow', 'bedding', 'linen'],
    config: { icon: BedDouble, gradient: 'from-indigo-400 to-blue-500', iconColor: 'text-white' },
  },
  {
    keywords: ['tool', 'tools', 'hardware', 'repair', 'diy', 'drill', 'hammer'],
    config: { icon: Hammer, gradient: 'from-slate-500 to-slate-700', iconColor: 'text-white' },
  },
  {
    keywords: ['home', 'house', 'decor', 'decoration', 'living', 'interior'],
    config: { icon: Sofa, gradient: 'from-teal-500 to-emerald-600', iconColor: 'text-white' },
  },

  // ── Sports & Outdoors ────────────────────────────────────────────────
  {
    keywords: ['gym', 'fitness', 'sport', 'exercise', 'workout', 'dumbbell', 'weight'],
    config: { icon: Dumbbell, gradient: 'from-red-500 to-rose-600', iconColor: 'text-white' },
  },
  {
    keywords: ['bicycle', 'bike', 'cycling', 'cycle'],
    config: { icon: Bike, gradient: 'from-green-500 to-teal-600', iconColor: 'text-white' },
  },
  {
    keywords: ['outdoor', 'camping', 'hiking', 'tent', 'adventure', 'travel'],
    config: { icon: Tent, gradient: 'from-emerald-600 to-green-700', iconColor: 'text-white' },
  },

  // ── Beauty & Health ──────────────────────────────────────────────────
  {
    keywords: ['beauty', 'makeup', 'cosmetic', 'lipstick', 'skincare', 'skin'],
    config: { icon: Flower2, gradient: 'from-pink-400 to-rose-500', iconColor: 'text-white' },
  },
  {
    keywords: ['health', 'wellness', 'vitamin', 'supplement', 'medicine', 'pharmacy'],
    config: { icon: Pill, gradient: 'from-emerald-500 to-green-600', iconColor: 'text-white' },
  },
  {
    keywords: ['hair', 'barber', 'salon', 'grooming', 'shaving', 'razor'],
    config: { icon: Scissors, gradient: 'from-violet-500 to-fuchsia-600', iconColor: 'text-white' },
  },
  {
    keywords: ['organic', 'natural', 'eco', 'green', 'vegan', 'sustainable'],
    config: { icon: Leaf, gradient: 'from-green-500 to-lime-600', iconColor: 'text-white' },
  },

  // ── Books / Media / Entertainment ────────────────────────────────────
  {
    keywords: ['book', 'books', 'novel', 'magazine', 'reading', 'education'],
    config: { icon: BookOpen, gradient: 'from-amber-600 to-yellow-700', iconColor: 'text-white' },
  },
  {
    keywords: ['music', 'instrument', 'guitar', 'piano', 'drum'],
    config: { icon: Music, gradient: 'from-fuchsia-500 to-violet-600', iconColor: 'text-white' },
  },
  {
    keywords: ['movie', 'film', 'dvd', 'cinema', 'streaming'],
    config: { icon: Film, gradient: 'from-slate-700 to-slate-900', iconColor: 'text-white' },
  },

  // ── Automotive ────────────────────────────────────────────────────────
  {
    keywords: ['car', 'auto', 'vehicle', 'automotive', 'motor'],
    config: { icon: Car, gradient: 'from-slate-600 to-gray-700', iconColor: 'text-white' },
  },
  {
    keywords: ['truck', 'van', 'shipping', 'delivery', 'freight'],
    config: { icon: Truck, gradient: 'from-zinc-600 to-slate-700', iconColor: 'text-white' },
  },

  // ── Grocery & Food ────────────────────────────────────────────────────
  {
    keywords: ['grocery', 'fruit', 'vegetable', 'food', 'snack', 'beverage', 'drink'],
    config: { icon: Apple, gradient: 'from-green-500 to-emerald-600', iconColor: 'text-white' },
  },

  // ── Pets ─────────────────────────────────────────────────────────────
  {
    keywords: ['pet', 'dog', 'cat', 'animal', 'veterinary', 'paw'],
    config: { icon: PawPrint, gradient: 'from-amber-500 to-orange-600', iconColor: 'text-white' },
  },
];

/** Default fallback when no keyword matches */
const DEFAULT_CONFIG: CategoryIconConfig = {
  icon: ShoppingCart,
  gradient: 'from-primary to-orange-600',
  iconColor: 'text-white',
};

/**
 * Returns the icon config for a category based on slug + name matching.
 * Slug is checked first; if no match, the lowercased name tokens are checked.
 */
export function getCategoryIconConfig(slug: string, name: string): CategoryIconConfig {
  const haystack = `${slug} ${name}`.toLowerCase();

  for (const entry of ICON_MAP) {
    if (entry.keywords.some((kw) => haystack.includes(kw))) {
      return entry.config;
    }
  }

  return DEFAULT_CONFIG;
}

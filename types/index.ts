import type { LucideIcon } from 'lucide-react'

/**
 * Shared, app-wide type definitions.
 *
 * These are intentionally generic so that every future module
 * (Shopping, Food, Travel, Coupons, Cashback, AI Assistant, ...) can
 * reuse the same primitives instead of redefining their own shapes.
 */

/** A canonical identifier for a top-level product module. */
export type ModuleId =
  | 'shopping'
  | 'food'
  | 'grocery'
  | 'travel'
  | 'flights'
  | 'hotels'
  | 'trains'
  | 'bus'
  | 'cab'
  | 'movies'
  | 'coupons'
  | 'cashback'
  | 'ai-assistant'

/** A single navigation entry used by the navbar and mobile menu. */
export interface NavItem {
  /** Stable key for React lists and analytics. */
  id: string
  /** Human readable label. */
  label: string
  /** Destination route. */
  href: string
  /** Optional icon rendered alongside the label. */
  icon?: LucideIcon
  /** Marks the item as external so it opens in a new tab. */
  external?: boolean
  /** Optional short description for future mega-menu support. */
  description?: string
}

/** A quick-access category card shown on the landing page grid. */
export interface Category {
  id: ModuleId | string
  label: string
  href: string
  icon: LucideIcon
  /** Short supporting copy shown under the label. */
  description?: string
  /** Optional badge, e.g. "New" or "Beta". */
  badge?: string
}

/** A popular search suggestion chip shown under the hero search bar. */
export interface SearchSuggestion {
  id: string
  label: string
  /** Optional query used when the chip is activated. */
  query?: string
}

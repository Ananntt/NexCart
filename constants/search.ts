import type { SearchSuggestion } from '@/types'

/**
 * Rotating placeholder terms for the AI search bar.
 * The component cycles through these to hint at NexCart's breadth.
 */
export const searchPlaceholders: string[] = [
  'Search iPhone 15 Pro...',
  'Search Pizza near me...',
  'Search Flights to Goa...',
  'Search on Blinkit...',
  'Search an Uber ride...',
  'Search Hotels in Dubai...',
  'Search running shoes...',
]

/** Popular search chips shown beneath the hero search bar. */
export const popularSearches: SearchSuggestion[] = [
  { id: 'iphone', label: 'iPhone 15', query: 'iPhone 15' },
  { id: 'flights-goa', label: 'Flights to Goa', query: 'flights to Goa' },
  { id: 'pizza', label: 'Pizza deals', query: 'pizza deals' },
  { id: 'nike', label: 'Nike shoes', query: 'Nike shoes' },
  { id: 'grocery', label: 'Grocery under ₹500', query: 'grocery under 500' },
  { id: 'hotels', label: 'Weekend hotels', query: 'weekend hotels' },
]

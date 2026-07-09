import {
  Car,
  Carrot,
  Clapperboard,
  Hotel,
  Plane,
  ShoppingBag,
  Ticket,
  UtensilsCrossed,
} from 'lucide-react'
import type { Category } from '@/types'

/**
 * Quick-access categories rendered in the landing page grid.
 * This is the canonical list of consumer-facing modules.
 */
export const quickCategories: Category[] = [
  {
    id: 'shopping',
    label: 'Shopping',
    href: '/shopping',
    icon: ShoppingBag,
    description: 'Compare across stores',
  },
  {
    id: 'food',
    label: 'Food',
    href: '/food',
    icon: UtensilsCrossed,
    description: 'Delivery deals',
  },
  {
    id: 'travel',
    label: 'Travel',
    href: '/travel',
    icon: Plane,
    description: 'Flights & more',
  },
  {
    id: 'grocery',
    label: 'Grocery',
    href: '/grocery',
    icon: Carrot,
    description: 'Fresh & fast',
  },
  {
    id: 'cab',
    label: 'Cab',
    href: '/cab',
    icon: Car,
    description: 'Cheapest rides',
  },
  {
    id: 'movies',
    label: 'Movies',
    href: '/movies',
    icon: Clapperboard,
    description: 'Tickets & offers',
  },
  {
    id: 'hotels',
    label: 'Hotels',
    href: '/hotels',
    icon: Hotel,
    description: 'Best stays',
  },
  {
    id: 'coupons',
    label: 'Coupons',
    href: '/coupons',
    icon: Ticket,
    description: 'Verified savings',
  },
]

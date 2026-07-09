import {
  Bot,
  GitCompareArrows,
  Plane,
  ShoppingBag,
  Ticket,
  UtensilsCrossed,
  Carrot,
} from 'lucide-react'
import type { NavItem } from '@/types'

/**
 * Primary navigation shown in the navbar (desktop) and mobile drawer.
 * Add future modules here — every consumer stays in sync automatically.
 */
export const primaryNav: NavItem[] = [
  {
    id: 'shopping',
    label: 'Shopping',
    href: '/shopping',
    icon: ShoppingBag,
    description: 'Compare prices across every store',
  },
  {
    id: 'food',
    label: 'Food',
    href: '/food',
    icon: UtensilsCrossed,
    description: 'Best deals across food delivery apps',
  },
  {
    id: 'travel',
    label: 'Travel',
    href: '/travel',
    icon: Plane,
    description: 'Flights, hotels, trains, bus & cabs',
  },
  {
    id: 'grocery',
    label: 'Grocery',
    href: '/grocery',
    icon: Carrot,
    description: 'Fresh picks from grocery platforms',
  },
  {
    id: 'coupons',
    label: 'Coupons',
    href: '/coupons',
    icon: Ticket,
    description: 'Verified coupons & cashback',
  },
  {
    id: 'compare',
    label: 'Compare',
    href: '/compare',
    icon: GitCompareArrows,
    description: 'Side-by-side platform comparison',
  },
  {
    id: 'ai-assistant',
    label: 'AI Assistant',
    href: '/assistant',
    icon: Bot,
    description: 'Your personal savings copilot',
  },
]

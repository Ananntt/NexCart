'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { NavItem } from '@/types'
import { cn } from '@/lib/utils'

interface NavLinksProps {
  items: NavItem[]
  className?: string
  /** Layout orientation. Horizontal for desktop, vertical for the drawer. */
  orientation?: 'horizontal' | 'vertical'
  /** Called after a link is activated (e.g. to close the mobile drawer). */
  onNavigate?: () => void
}

/** Renders the primary navigation links with active-route awareness. */
export function NavLinks({
  items,
  className,
  orientation = 'horizontal',
  onNavigate,
}: NavLinksProps) {
  const pathname = usePathname()

  return (
    <ul
      className={cn(
        'flex',
        orientation === 'horizontal'
          ? 'flex-row items-center gap-1'
          : 'flex-col gap-1',
        className,
      )}
    >
      {items.map((item) => {
        const isActive =
          pathname === item.href || pathname.startsWith(`${item.href}/`)
        const Icon = item.icon

        return (
          <li key={item.id}>
            <Link
              href={item.href}
              onClick={onNavigate}
              aria-current={isActive ? 'page' : undefined}
              className={cn(
                'flex items-center gap-2 rounded-lg text-sm font-medium transition-colors outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40',
                orientation === 'horizontal'
                  ? 'px-3 py-2'
                  : 'px-3 py-2.5 text-base',
                isActive
                  ? 'bg-muted text-foreground'
                  : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground',
              )}
            >
              {Icon && (
                <Icon
                  className={cn(
                    orientation === 'vertical' ? 'size-5' : 'size-4',
                  )}
                  aria-hidden="true"
                />
              )}
              {item.label}
            </Link>
          </li>
        )
      })}
    </ul>
  )
}

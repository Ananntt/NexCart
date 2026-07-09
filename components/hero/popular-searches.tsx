'use client'

import { TrendingUp } from 'lucide-react'
import type { SearchSuggestion } from '@/types'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface PopularSearchesProps {
  items: SearchSuggestion[]
  className?: string
  onSelect?: (suggestion: SearchSuggestion) => void
}

/** Row of tappable "popular search" chips shown beneath the hero search. */
export function PopularSearches({
  items,
  className,
  onSelect,
}: PopularSearchesProps) {
  if (items.length === 0) return null

  return (
    <div className={cn('flex flex-wrap items-center gap-2', className)}>
      <span className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground">
        <TrendingUp className="size-4" aria-hidden="true" />
        Popular
      </span>
      {items.map((item) => (
        <button
          key={item.id}
          type="button"
          onClick={() => onSelect?.(item)}
          className="rounded-full outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40"
        >
          <Badge
            variant="outline"
            className="cursor-pointer px-3 py-1.5 text-sm transition-colors hover:border-primary/40 hover:bg-primary/5 hover:text-primary"
          >
            {item.label}
          </Badge>
        </button>
      ))}
    </div>
  )
}

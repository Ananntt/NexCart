import Link from 'next/link'
import { ArrowUpRight } from 'lucide-react'
import type { Category } from '@/types'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface CategoryCardProps {
  category: Category
  className?: string
}

/** A single tappable category tile linking into a product module. */
export function CategoryCard({ category, className }: CategoryCardProps) {
  const Icon = category.icon

  return (
    <Link
      href={category.href}
      aria-label={category.label}
      className={cn(
        'group block rounded-2xl outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40',
        className,
      )}
    >
      <Card
        variant="interactive"
        padding="md"
        className="flex h-full flex-col justify-between gap-6"
      >
        <div className="flex items-start justify-between">
          <span className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
            <Icon className="size-5" aria-hidden="true" />
          </span>
          {category.badge ? (
            <Badge variant="soft" size="sm">
              {category.badge}
            </Badge>
          ) : (
            <ArrowUpRight className="size-4 text-muted-foreground/50 transition-all group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-primary" />
          )}
        </div>

        <div>
          <p className="font-semibold text-foreground">{category.label}</p>
          {category.description && (
            <p className="mt-1 text-sm text-muted-foreground">
              {category.description}
            </p>
          )}
        </div>
      </Card>
    </Link>
  )
}

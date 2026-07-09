import Link from 'next/link'
import { Sparkles } from 'lucide-react'
import { siteConfig } from '@/constants/site'
import { cn } from '@/lib/utils'

interface LogoProps {
  className?: string
  /** Hide the wordmark and show only the mark (useful on tight layouts). */
  markOnly?: boolean
}

/** NexCart brand lockup. Reusable across navbar, footer and auth screens. */
export function Logo({ className, markOnly = false }: LogoProps) {
  return (
    <Link
      href="/"
      aria-label={`${siteConfig.name} home`}
      className={cn(
        'group inline-flex items-center gap-2 rounded-lg outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40',
        className,
      )}
    >
      <span className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm transition-transform group-hover:scale-105">
        <Sparkles className="size-5" aria-hidden="true" />
      </span>
      {!markOnly && (
        <span className="text-lg font-semibold tracking-tight text-foreground">
          {siteConfig.name}
        </span>
      )}
    </Link>
  )
}

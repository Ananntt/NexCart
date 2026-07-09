'use client'

import { useState, type FormEvent } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowRight, Search, Sparkles } from 'lucide-react'
import { searchPlaceholders } from '@/constants/search'
import { useRotatingValue } from '@/hooks/use-rotating-value'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface AiSearchProps {
  className?: string
  /** Rotating placeholder terms. Defaults to the shared search list. */
  placeholders?: string[]
  /** Controlled value (optional). */
  value?: string
  /** Fired on every keystroke when used as a controlled input. */
  onValueChange?: (value: string) => void
  /** Fired when the user submits a query. Frontend-only for now. */
  onSearch?: (query: string) => void
}

/**
 * Large, premium AI search bar with a rotating placeholder.
 * Purely presentational — no backend calls are made.
 */
export function AiSearch({
  className,
  placeholders = searchPlaceholders,
  value: controlledValue,
  onValueChange,
  onSearch,
}: AiSearchProps) {
  const [internalValue, setInternalValue] = useState('')
  const [focused, setFocused] = useState(false)

  const value = controlledValue ?? internalValue
  const isControlled = controlledValue !== undefined

  const { value: placeholder, index } = useRotatingValue(placeholders, {
    paused: focused || value.length > 0,
  })

  function handleChange(next: string) {
    if (isControlled) {
      onValueChange?.(next)
    } else {
      setInternalValue(next)
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const query = value.trim()
    if (!query) return
    onSearch?.(query)
  }

  return (
    <form
      onSubmit={handleSubmit}
      role="search"
      className={cn(
        'group relative flex w-full items-center rounded-2xl border bg-card pl-4 pr-2 shadow-lg shadow-black/[0.03] transition-all duration-300',
        focused
          ? 'border-primary/40 ring-4 ring-ring/15'
          : 'border-border hover:border-border/80',
        className,
      )}
    >
      <span className="pointer-events-none flex items-center text-primary">
        <Sparkles className="size-5" aria-hidden="true" />
      </span>

      <div className="relative flex-1">
        <input
          type="search"
          value={value}
          onChange={(e) => handleChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          aria-label="Search across every store and service"
          enterKeyHint="search"
          className="peer h-14 w-full bg-transparent px-3 text-base text-foreground outline-none sm:h-16 sm:text-lg"
        />

        {/* Animated placeholder shown only when the field is empty. */}
        {value.length === 0 && (
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 flex items-center px-3 text-base text-muted-foreground sm:text-lg"
          >
            <AnimatePresence mode="wait">
              <motion.span
                key={index}
                initial={{ y: 12, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -12, opacity: 0 }}
                transition={{ duration: 0.35, ease: 'easeOut' }}
                className="truncate"
              >
                {placeholder}
              </motion.span>
            </AnimatePresence>
          </div>
        )}
      </div>

      <Button
        type="submit"
        size="lg"
        aria-label="Search"
        className="h-11 gap-2 rounded-xl px-4 sm:px-5"
      >
        <Search className="size-4 sm:hidden" />
        <span className="hidden sm:inline">Search</span>
        <ArrowRight className="hidden size-4 sm:inline" />
      </Button>
    </form>
  )
}

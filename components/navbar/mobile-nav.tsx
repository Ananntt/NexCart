'use client'

import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Menu, X } from 'lucide-react'
import type { NavItem } from '@/types'
import { Button } from '@/components/ui/button'
import { Logo } from './logo'
import { NavLinks } from './nav-links'

interface MobileNavProps {
  items: NavItem[]
}

/** Slide-in navigation drawer for tablet and mobile viewports. */
export function MobileNav({ items }: MobileNavProps) {
  const [open, setOpen] = useState(false)

  // Lock body scroll while the drawer is open.
  useEffect(() => {
    if (!open) return
    const original = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = original
    }
  }, [open])

  // Close on Escape for accessibility.
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        aria-label="Open menu"
        aria-expanded={open}
        onClick={() => setOpen(true)}
      >
        <Menu className="size-5" />
      </Button>

      <AnimatePresence>
        {open && (
          <motion.div
            className="fixed inset-0 z-50 lg:hidden"
            initial="hidden"
            animate="visible"
            exit="hidden"
          >
            <motion.div
              className="absolute inset-0 bg-foreground/20 backdrop-blur-sm"
              variants={{ hidden: { opacity: 0 }, visible: { opacity: 1 } }}
              transition={{ duration: 0.2 }}
              onClick={() => setOpen(false)}
              aria-hidden="true"
            />

            <motion.div
              role="dialog"
              aria-modal="true"
              aria-label="Navigation menu"
              className="absolute inset-y-0 right-0 flex w-full max-w-sm flex-col bg-background shadow-2xl"
              variants={{
                hidden: { x: '100%' },
                visible: { x: 0 },
              }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            >
              <div className="flex items-center justify-between border-b border-border px-4 py-4">
                <Logo />
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Close menu"
                  onClick={() => setOpen(false)}
                >
                  <X className="size-5" />
                </Button>
              </div>

              <nav className="flex-1 overflow-y-auto px-3 py-4">
                <NavLinks
                  items={items}
                  orientation="vertical"
                  onNavigate={() => setOpen(false)}
                />
              </nav>

              <div className="border-t border-border p-4">
                <Button
                  size="lg"
                  nativeButton={false}
                  className="h-11 w-full"
                  render={<a href="/login" />}
                >
                  Log in
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

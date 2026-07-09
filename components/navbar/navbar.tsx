'use client'

import { useEffect, useState } from 'react'
import { Search } from 'lucide-react'
import { primaryNav } from '@/constants/navigation'
import { Button } from '@/components/ui/button'
import { Container } from '@/components/ui/container'
import { cn } from '@/lib/utils'
import { Logo } from './logo'
import { MobileNav } from './mobile-nav'
import { NavLinks } from './nav-links'

/** Sticky, minimal top navigation. Elevates subtly once the page scrolls. */
export function Navbar() {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header
      className={cn(
        'sticky top-0 z-40 w-full border-b transition-colors duration-300',
        scrolled
          ? 'border-border bg-background/80 backdrop-blur-md'
          : 'border-transparent bg-background',
      )}
    >
      <Container>
        <div className="flex h-16 items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Logo />
          </div>

          <nav
            aria-label="Primary"
            className="hidden lg:flex lg:items-center lg:justify-center"
          >
            <NavLinks items={primaryNav} />
          </nav>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              aria-label="Search"
              className="hidden sm:inline-flex lg:hidden"
            >
              <Search className="size-5" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              nativeButton={false}
              className="hidden lg:inline-flex"
              render={<a href="/login" />}
            >
              Log in
            </Button>
            <Button
              size="sm"
              nativeButton={false}
              className="hidden lg:inline-flex"
              render={<a href="/signup" />}
            >
              Get started
            </Button>
            <div className="lg:hidden">
              <MobileNav items={primaryNav} />
            </div>
          </div>
        </div>
      </Container>
    </header>
  )
}

'use client'

import { useEffect, useState } from 'react'

/**
 * Subscribes to a CSS media query and returns whether it currently matches.
 * SSR-safe: returns `false` until mounted on the client.
 *
 * @example
 * const isDesktop = useMediaQuery('(min-width: 1024px)')
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false)

  useEffect(() => {
    const mql = window.matchMedia(query)
    const onChange = () => setMatches(mql.matches)

    onChange()
    mql.addEventListener('change', onChange)

    return () => mql.removeEventListener('change', onChange)
  }, [query])

  return matches
}

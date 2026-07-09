'use client'

import { useEffect, useRef, useState } from 'react'

interface UseRotatingValueOptions {
  /** Milliseconds between rotations. Defaults to 2800ms. */
  interval?: number
  /** Pause rotation (e.g. while the input is focused). */
  paused?: boolean
}

/**
 * Cycles through a list of values on a timer and returns the active
 * value plus its index. Generic so it can drive rotating placeholders,
 * taglines, testimonials, etc.
 */
export function useRotatingValue<T>(
  values: readonly T[],
  { interval = 2800, paused = false }: UseRotatingValueOptions = {},
) {
  const [index, setIndex] = useState(0)
  const lengthRef = useRef(values.length)
  lengthRef.current = values.length

  useEffect(() => {
    if (paused || lengthRef.current <= 1) return

    const id = window.setInterval(() => {
      setIndex((current) => (current + 1) % lengthRef.current)
    }, interval)

    return () => window.clearInterval(id)
  }, [interval, paused])

  return {
    index,
    value: values[index],
  }
}

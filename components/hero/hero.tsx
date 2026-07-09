'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import type { SearchSuggestion } from '@/types'
import { popularSearches } from '@/constants/search'
import { Badge } from '@/components/ui/badge'
import { Container } from '@/components/ui/container'
import { Heading, Text } from '@/components/ui/heading'
import { Section } from '@/components/ui/section'
import { AiSearch } from '@/components/search/ai-search'
import { PopularSearches } from './popular-searches'

const container = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.08, delayChildren: 0.05 },
  },
}

const item = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] as const },
  },
}

/** Landing hero: headline, description, AI search and popular chips. */
export function Hero() {
  const [query, setQuery] = useState('')

  function handleSelect(suggestion: SearchSuggestion) {
    setQuery(suggestion.query ?? suggestion.label)
  }

  return (
    <Section spacing="lg" className="relative overflow-hidden">
      {/* Subtle, non-flashy radial wash anchored behind the hero. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[420px] bg-[radial-gradient(60%_100%_at_50%_0%,color-mix(in_oklch,var(--primary)_12%,transparent),transparent)]"
      />

      <Container size="lg">
        <motion.div
          variants={container}
          initial="hidden"
          animate="visible"
          className="flex flex-col items-center text-center"
        >
          <motion.div variants={item}>
            <Badge variant="soft" size="lg" className="mb-6">
              AI-powered savings across every platform
            </Badge>
          </motion.div>

          <motion.div variants={item}>
            <Heading as="h1" size="display" className="max-w-4xl">
              One Search. Every Store.
              <br className="hidden sm:block" />
              <span className="text-primary"> Smarter Savings.</span>
            </Heading>
          </motion.div>

          <motion.div variants={item}>
            <Text
              size="xl"
              className="mt-6 max-w-2xl text-muted-foreground"
            >
              Compare prices and discover the best deals across shopping, food,
              grocery, travel, cabs and movies — all from a single, intelligent
              search.
            </Text>
          </motion.div>

          <motion.div variants={item} className="mt-10 w-full max-w-2xl">
            <AiSearch value={query} onValueChange={setQuery} onSearch={() => {}} />
          </motion.div>

          <motion.div variants={item} className="mt-6 w-full max-w-2xl">
            <PopularSearches
              items={popularSearches}
              onSelect={handleSelect}
              className="justify-center"
            />
          </motion.div>
        </motion.div>
      </Container>
    </Section>
  )
}

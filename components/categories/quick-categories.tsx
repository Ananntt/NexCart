'use client'

import { motion } from 'framer-motion'
import type { Category } from '@/types'
import { quickCategories } from '@/constants/categories'
import { Container } from '@/components/ui/container'
import { Heading, Text } from '@/components/ui/heading'
import { Section } from '@/components/ui/section'
import { CategoryCard } from './category-card'

interface QuickCategoriesProps {
  /** Category list. Defaults to the shared config. */
  items?: Category[]
  title?: string
  description?: string
}

const gridVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.06 },
  },
}

const cellVariants = {
  hidden: { opacity: 0, y: 18 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] as const },
  },
}

/** Responsive grid of quick-access category tiles. */
export function QuickCategories({
  items = quickCategories,
  title = 'Everything you shop, in one place',
  description = 'Jump straight into a category to compare prices and unlock the best deals.',
}: QuickCategoriesProps) {
  return (
    <Section spacing="md" tone="muted">
      <Container>
        <div className="max-w-2xl">
          <Heading as="h2" size="h2">
            {title}
          </Heading>
          <Text size="lg" className="mt-3">
            {description}
          </Text>
        </div>

        <motion.ul
          variants={gridVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-80px' }}
          className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4"
        >
          {items.map((category) => (
            <motion.li key={category.id} variants={cellVariants}>
              <CategoryCard category={category} className="h-full" />
            </motion.li>
          ))}
        </motion.ul>
      </Container>
    </Section>
  )
}

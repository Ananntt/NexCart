/**
 * Global, single-source-of-truth site metadata.
 * Keep copy and brand details here so they never get hardcoded in components.
 */
export const siteConfig = {
  name: 'NexCart',
  tagline: 'One Search. Every Store.',
  description:
    'NexCart is an AI-powered commerce platform to compare prices and discover the best deals across shopping, food, grocery, travel, cabs, movies and more — all from one place.',
  url: 'https://nexcart.app',
} as const

export type SiteConfig = typeof siteConfig

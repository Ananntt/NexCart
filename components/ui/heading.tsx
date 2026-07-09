import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

type HeadingElement = 'h1' | 'h2' | 'h3' | 'h4'

const headingVariants = cva(
  'font-sans font-semibold tracking-tight text-balance text-foreground',
  {
    variants: {
      size: {
        display:
          'text-4xl leading-[1.05] sm:text-5xl md:text-6xl lg:text-7xl font-bold',
        h1: 'text-3xl leading-tight sm:text-4xl md:text-5xl',
        h2: 'text-2xl leading-tight sm:text-3xl md:text-4xl',
        h3: 'text-xl leading-snug sm:text-2xl',
        h4: 'text-lg leading-snug sm:text-xl',
      },
    },
    defaultVariants: {
      size: 'h2',
    },
  },
)

interface HeadingProps
  extends Omit<React.ComponentProps<'h2'>, 'color'>,
    VariantProps<typeof headingVariants> {
  as?: HeadingElement
}

/** Themed heading with a fluid, responsive type scale. */
function Heading({ as = 'h2', size, className, ...props }: HeadingProps) {
  const Comp = as
  return (
    <Comp
      data-slot="heading"
      className={cn(headingVariants({ size }), className)}
      {...props}
    />
  )
}

const textVariants = cva('font-sans text-pretty', {
  variants: {
    size: {
      sm: 'text-sm leading-6',
      base: 'text-base leading-7',
      lg: 'text-lg leading-8',
      xl: 'text-lg leading-8 sm:text-xl',
    },
    tone: {
      default: 'text-foreground',
      muted: 'text-muted-foreground',
    },
  },
  defaultVariants: {
    size: 'base',
    tone: 'muted',
  },
})

interface TextProps
  extends Omit<React.ComponentProps<'p'>, 'color'>,
    VariantProps<typeof textVariants> {}

/** Themed body copy with sensible line-height and color tokens. */
function Text({ size, tone, className, ...props }: TextProps) {
  return (
    <p
      data-slot="text"
      className={cn(textVariants({ size, tone }), className)}
      {...props}
    />
  )
}

export { Heading, headingVariants, Text, textVariants }

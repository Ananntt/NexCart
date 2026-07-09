import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const sectionVariants = cva('w-full', {
  variants: {
    spacing: {
      none: 'py-0',
      sm: 'py-10 sm:py-12',
      md: 'py-14 sm:py-20',
      lg: 'py-20 sm:py-28',
      xl: 'py-24 sm:py-36',
    },
    tone: {
      default: 'bg-background text-foreground',
      muted: 'bg-muted/40 text-foreground',
      contrast: 'bg-primary text-primary-foreground',
    },
  },
  defaultVariants: {
    spacing: 'md',
    tone: 'default',
  },
})

interface SectionProps
  extends React.ComponentProps<'section'>,
    VariantProps<typeof sectionVariants> {}

/** A semantic vertical rhythm block with consistent spacing + tone. */
function Section({ className, spacing, tone, ...props }: SectionProps) {
  return (
    <section
      data-slot="section"
      className={cn(sectionVariants({ spacing, tone }), className)}
      {...props}
    />
  )
}

export { Section, sectionVariants }

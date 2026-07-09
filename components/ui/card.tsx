import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const cardVariants = cva('rounded-2xl border bg-card text-card-foreground', {
  variants: {
    variant: {
      default: 'border-border shadow-xs',
      outline: 'border-border shadow-none',
      elevated: 'border-border/70 shadow-lg shadow-black/[0.04]',
      interactive:
        'border-border shadow-xs transition-all duration-300 hover:-translate-y-1 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5',
    },
    padding: {
      none: 'p-0',
      sm: 'p-4',
      md: 'p-6',
      lg: 'p-8',
    },
  },
  defaultVariants: {
    variant: 'default',
    padding: 'md',
  },
})

interface CardProps
  extends React.ComponentProps<'div'>,
    VariantProps<typeof cardVariants> {}

/** Surface container with themed elevation + optional hover interaction. */
function Card({ className, variant, padding, ...props }: CardProps) {
  return (
    <div
      data-slot="card"
      className={cn(cardVariants({ variant, padding }), className)}
      {...props}
    />
  )
}

export { Card, cardVariants }

import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const inputVariants = cva(
  'flex w-full rounded-lg border border-input bg-background text-foreground shadow-xs transition-[color,box-shadow,border-color] outline-none placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/40 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-destructive/20',
  {
    variants: {
      inputSize: {
        sm: 'h-9 px-3 text-sm',
        md: 'h-10 px-3.5 text-sm',
        lg: 'h-11 px-4 text-base',
      },
    },
    defaultVariants: {
      inputSize: 'md',
    },
  },
)

interface InputProps
  extends Omit<React.ComponentProps<'input'>, 'size'>,
    VariantProps<typeof inputVariants> {}

/** Themed text input primitive. */
function Input({ className, inputSize, type = 'text', ...props }: InputProps) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(inputVariants({ inputSize }), className)}
      {...props}
    />
  )
}

export { Input, inputVariants }

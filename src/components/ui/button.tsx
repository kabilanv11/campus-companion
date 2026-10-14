import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

// shadcn/ui Button restyled to design.md: every tappable control is a pill, no borders or shadows.
const buttonVariants = cva(
  'inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-full font-medium leading-none transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:pointer-events-none',
  {
    variants: {
      variant: {
        primary: 'bg-brand text-btn-ink',
        secondary: 'bg-sand text-ink',
        island: 'bg-island-pill text-island-ink',
        text: 'bg-transparent text-ink',
        link: 'bg-transparent text-link',
      },
      size: {
        sm: 'px-[9px] py-[5px] text-caption',
        md: 'px-4 py-2 text-[13px]',
        lg: 'px-7 py-[11px] text-[13px]',
      },
    },
    defaultVariants: { variant: 'primary', size: 'md' },
  },
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button'
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
  },
)
Button.displayName = 'Button'

export { Button, buttonVariants }

import * as React from 'react'
import * as DialogPrimitive from '@radix-ui/react-dialog'
import { cn } from '@/lib/utils'

// shadcn/ui Sheet, bottom side only, restyled to design.md's Capture Sheet:
// Card background, 18px top corners, 12px 20px padding, over a dimmed page.

const Sheet = DialogPrimitive.Root
const SheetTrigger = DialogPrimitive.Trigger
const SheetClose = DialogPrimitive.Close
const SheetTitle = DialogPrimitive.Title
const SheetDescription = DialogPrimitive.Description

const SheetOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn('cc-fade fixed inset-0 z-40 bg-scrim', className)}
    {...props}
  />
))
SheetOverlay.displayName = DialogPrimitive.Overlay.displayName

const SheetContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>
>(({ className, children, ...props }, ref) => (
  <DialogPrimitive.Portal>
    <SheetOverlay />
    <DialogPrimitive.Content
      ref={ref}
      className={cn(
        'cc-rise fixed inset-x-0 bottom-0 z-50 mx-auto flex max-w-[480px] flex-col gap-[22px] rounded-t-sheet bg-card px-5 pt-3 pb-[max(20px,env(safe-area-inset-bottom))] text-ink outline-none',
        className,
      )}
      {...props}
    >
      <div aria-hidden className="mx-auto h-1 w-9 rounded-full bg-line" />
      {children}
    </DialogPrimitive.Content>
  </DialogPrimitive.Portal>
))
SheetContent.displayName = DialogPrimitive.Content.displayName

export { Sheet, SheetTrigger, SheetClose, SheetContent, SheetTitle, SheetDescription }

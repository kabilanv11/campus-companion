import { Toaster as Sonner, type ToasterProps } from 'sonner'

// shadcn/ui Sonner, restyled to design.md's Toast: an Ink pill floating above the bottom bar.
// Toasts are rendered with toast.custom(), so Sonner only handles placement and timing.
export function Toaster(props: ToasterProps) {
  return (
    <Sonner
      position="bottom-center"
      offset={{ bottom: 'calc(84px + env(safe-area-inset-bottom))' }}
      mobileOffset={{ bottom: 'calc(84px + env(safe-area-inset-bottom))' }}
      gap={8}
      toastOptions={{ unstyled: true }}
      {...props}
    />
  )
}

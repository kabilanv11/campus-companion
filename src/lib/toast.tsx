import { toast } from 'sonner'
import type { Undo } from '@/db/actions'
import { ToastPill } from '@/ui/Toast'

/** The design's Undo toast, for 5 seconds. */
export function undoToast(message: string, undo: Undo) {
  toast.custom(
    (id) => (
      <ToastPill
        message={message}
        action="Undo"
        onAction={() => {
          toast.dismiss(id)
          void undo()
        }}
      />
    ),
    { id: 'undo', duration: 5000 },
  )
}

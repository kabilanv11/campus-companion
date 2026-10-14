import { useEffect, useState } from 'react'
import { Sheet, SheetContent, SheetTitle, SheetDescription } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'

// design.md Capture Sheet. The parser, parsed rows and type pills arrive in build step 5.
export function CaptureSheet({ open, initialText = '', onOpenChange }: { open: boolean; initialText?: string; onOpenChange: (open: boolean) => void }) {
  const [text, setText] = useState(initialText)
  useEffect(() => {
    if (open) setText(initialText)
  }, [open, initialText])

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent aria-describedby={undefined}>
        <SheetTitle className="sr-only">Add</SheetTitle>
        <SheetDescription className="sr-only">Type one line, like "mac assignment 2 due fri 11pm".</SheetDescription>
        <input
          autoFocus
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="mac assignment 2 due fri 11pm"
          className="w-full border-b-2 border-brand bg-transparent pb-2 text-[16px] text-ink outline-none placeholder:text-ink-3"
        />
        <div className="flex items-center justify-between">
          <Button variant="text" className="px-0" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}

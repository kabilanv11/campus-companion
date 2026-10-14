import { useState } from 'react'
import type { SessionStatus } from '@/db/schema'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'

const LABEL: Record<SessionStatus, string> = { present: 'Present', absent: 'Absent', cancelled: 'Cancelled' }

/** design.md Status Value + Pop-up: shows only the current value; tapping opens the list in place. */
export function StatusPicker({ value, onChange, label }: { value?: SessionStatus; onChange: (s: SessionStatus) => void; label: string }) {
  const [open, setOpen] = useState(false)
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        aria-label={`${label}: ${value ? LABEL[value] : 'Unmarked'}`}
        className={cn(
          'inline-flex items-center gap-1 rounded-full py-[3px] pr-1.5 pl-2.5 text-[13.5px] font-semibold',
          value === 'absent' ? 'text-urgent' : value === 'cancelled' ? 'text-ink-2' : value ? 'text-ink' : 'text-ink-3',
          open && 'bg-fill',
        )}
      >
        {value ? LABEL[value] : 'Unmarked'}
        <i aria-hidden className="text-[10px] text-ink-3 not-italic">▾</i>
      </PopoverTrigger>
      <PopoverContent role="listbox" aria-label={label}>
        {(['present', 'absent', 'cancelled'] as const).map((s) => (
          <button
            key={s}
            type="button"
            role="option"
            aria-selected={value === s}
            onClick={() => {
              onChange(s)
              setOpen(false)
            }}
            className={cn('flex w-full justify-between px-3 py-2 text-left text-[13.5px]', value === s ? 'font-bold' : 'font-medium')}
          >
            {LABEL[s]}
            {value === s && <span className="text-brand">✓</span>}
          </button>
        ))}
      </PopoverContent>
    </Popover>
  )
}

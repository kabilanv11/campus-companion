import type { CalEntry } from '@/domain/calendarList'
import { rangeLabel } from '@/lib/format'
import { cn } from '@/lib/utils'

const MARKER: Record<CalEntry['kind'], string> = {
  noClass: 'border-l-amber',
  exam: 'border-l-urgent',
  course: '',
  plain: 'border-l-transparent',
}

/** A calendar line: 3px left marker (amber no-class, red exams, the course's colour), dates, label. */
export function CalendarRow({ entry, past, withMonth }: { entry: CalEntry; past?: boolean; withMonth?: boolean }) {
  return (
    <div
      data-testid="cal-entry"
      data-kind={entry.kind}
      className={cn('grid grid-cols-[116px_1fr] gap-2 border-t border-l-[3px] border-t-line py-2 pl-2.5 text-body', MARKER[entry.kind], past && 'opacity-40')}
      style={entry.kind === 'course' ? { borderLeftColor: `var(--${entry.course}, var(--ink-3))` } : undefined}
    >
      <span className="text-time text-ink-2 tnum">{rangeLabel(entry.from, entry.to, withMonth)}</span>
      <span className={cn(entry.kind === 'exam' && 'font-semibold')}>{entry.label}</span>
    </div>
  )
}

import type { CanMissDisplay } from '@/domain/attendance'
import type { FoodMark } from '@/domain/food'
import { cn } from '@/lib/utils'

/** 9px course dot in the course's fixed colour. */
export function CourseDot({ code, className }: { code: string; className?: string }) {
  return <i aria-hidden className={cn('inline-block size-[9px] shrink-0 rounded-full', className)} style={{ background: `var(--${code}, var(--ink-3))` }} />
}

/** Square club marker. */
export function ClubSquare({ code }: { code: string }) {
  return <i aria-hidden className="inline-block size-[9px] shrink-0 rounded-[2px]" style={{ background: `var(--${code}, var(--ink-3))` }} />
}

/** "Course code" in 13.5px bold with its dot. */
export function CourseCode({ code }: { code: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-code font-bold">
      <CourseDot code={code} />
      {code}
    </span>
  )
}

/** Indian food-label marks: green square with a dot (veg), brown square with a triangle (non-veg). */
export function FoodMarkIcon({ mark }: { mark: FoodMark }) {
  const nonveg = mark === 'nonveg'
  return (
    <span
      role="img"
      aria-label={nonveg ? 'Non-veg' : 'Veg'}
      className={cn('relative inline-flex size-[14px] shrink-0 items-center justify-center rounded-[3px] border-[1.5px]', nonveg ? 'border-nonveg' : 'border-veg')}
    >
      {nonveg ? (
        <i className="block h-0 w-0 border-x-[3.5px] border-b-[6px] border-x-transparent border-b-nonveg" />
      ) : (
        <i className="block size-[6px] rounded-full bg-veg" />
      )}
    </span>
  )
}

/** The can-miss column: a number, or "Can't miss" / "Short by N" in red. */
export function CanMiss({ value }: { value?: CanMissDisplay }) {
  if (!value) return <span />
  if (value.kind === 'number')
    return <b className={cn('text-right text-num font-bold tnum', value.urgent && 'text-urgent')}>{value.value}</b>
  return (
    <b className="max-w-[44px] pt-0.5 text-right text-[11.5px] leading-[1.15] font-semibold text-urgent">
      {value.kind === 'cantMiss' ? 'Can’t miss' : `Short by ${value.by}`}
    </b>
  )
}

/** Red text on a 13% red tint: Overdue, due times, Quiz tags, clashes. */
export function UrgentPill({ children, className }: { children: React.ReactNode; className?: string }) {
  return <span className={cn('rounded-full bg-urgent/13 px-[9px] py-[3px] text-caption font-semibold text-urgent', className)}>{children}</span>
}

export function Checkbox({ checked, urgent, onChange, label }: { checked?: boolean; urgent?: boolean; onChange: () => void; label: string }) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={!!checked}
      aria-label={label}
      onClick={onChange}
      className={cn(
        'flex size-4 shrink-0 items-center justify-center rounded-check border-[1.5px] text-[11px] leading-none',
        checked ? 'border-brand bg-brand text-btn-ink' : urgent ? 'border-urgent' : 'border-ink-3',
      )}
    >
      {checked ? '✓' : null}
    </button>
  )
}

import { useMemo, useState } from 'react'
import { courseInfo, referenceData } from '@/data'
import { markSessions } from '@/db/actions'
import { useUserData } from '@/db/hooks'
import { buildAttendance, type CourseCard } from '@/domain/attendanceScreen'
import type { Session } from '@/domain/sessions'
import { istDate } from '@/domain/time'
import { Button } from '@/components/ui/button'
import { dayLabel, dayNum, dayShort, monthShort } from '@/lib/format'
import { undoToast } from '@/lib/toast'
import { useNow } from '@/lib/useNow'
import { cn } from '@/lib/utils'
import { CanMiss, CourseCode } from '@/ui/marks'
import { Page, PageTitle } from '@/ui/Page'
import { StatusPicker } from '@/ui/StatusPicker'

/** Unmarked days listed one by one; older ones are covered by Mark all present. */
const SHOWN_DAYS = 3
const WORDS = ['no', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten']
const KIND: Record<Session['kind'], string | null> = { regular: null, makeup: 'Makeup', extra: 'Extra', guest: 'Guest lecture' }

export function Attendance({ onAdd }: { onAdd: (text: string) => void }) {
  const now = useNow()
  const user = useUserData()
  const [expanded, setExpanded] = useState<string | null>(null)
  const model = useMemo(() => user && buildAttendance(now, referenceData, user.sessions, user.overrides), [now, user])
  if (!model) return <Page>{null}</Page>
  const today = istDate(now)

  const allPresent = async (sessions: Session[], message: string) => {
    const undo = await markSessions(sessions, 'present')
    undoToast(message, undo)
  }
  const days = model.unmarkedGroups.length

  return (
    <Page>
      <PageTitle>Attendance</PageTitle>

      {days > 0 && (
        <section aria-label="Unmarked" className="mt-5 rounded-card bg-needs px-3.5 py-3 shadow-[inset_0_0_0_1px_var(--needs-ring)]">
          <h2 className="pb-1 text-label font-semibold text-urgent">Unmarked</h2>
          {model.unmarkedGroups.slice(-SHOWN_DAYS).map((g, i) => (
            <div key={g.date} className={cn('flex flex-wrap items-center gap-2.5 py-2.5', i > 0 && 'border-t border-line')}>
              <span className="min-w-16 text-[13px] text-ink-2">{dayLabel(g.date, today)}</span>
              <span className="flex flex-1 flex-wrap gap-x-2.5 gap-y-1">
                {g.sessions.map((s) => (
                  <CourseCode key={s.id} code={s.course} />
                ))}
              </span>
              <Button size="sm" className="ml-auto px-3 py-1.5 text-[12.5px]" onClick={() => allPresent(g.sessions, `${dayLabel(g.date, today)} marked present`)}>
                All present
              </Button>
            </div>
          ))}
          {days > 1 && (
            <div className="flex items-center justify-between gap-2.5 border-t border-line pt-2.5 pb-0.5">
              <span className="text-[12.5px] text-ink-3">
                {model.unmarkedCount} classes across {WORDS[days] ?? days} days
              </span>
              <Button size="sm" className="px-3 py-1.5 text-[12.5px]" onClick={() => allPresent(model.unmarkedGroups.flatMap((g) => g.sessions), `${model.unmarkedCount} classes marked present`)}>
                Mark all present
              </Button>
            </div>
          )}
        </section>
      )}

      <div className="mt-5 mb-1 text-right text-caption text-ink-3">can miss</div>
      <ul>
        {model.courses.map((c, i) => (
          <CourseRow
            key={c.attendance.course}
            card={c}
            first={i === 0}
            open={expanded === c.attendance.course}
            onToggle={() => setExpanded((x) => (x === c.attendance.course ? null : c.attendance.course))}
            onAdd={onAdd}
          />
        ))}
      </ul>
    </Page>
  )
}

function CourseRow({ card, first, open, onToggle, onAdd }: { card: CourseCard; first: boolean; open: boolean; onToggle: () => void; onAdd: (text: string) => void }) {
  const a = card.attendance
  const code = a.course
  return (
    <li className={cn('py-3', !first && 'border-t border-line')} data-testid={`course-${code}`}>
      <button type="button" onClick={onToggle} aria-expanded={open} className="grid w-full grid-cols-[1fr_auto] items-start gap-x-3 gap-y-1.5 text-left">
        <span className="flex min-w-0 flex-wrap items-baseline gap-x-2">
          <CourseCode code={code} />
          <span className="text-name text-ink-2">{courseInfo(code)?.name}</span>
        </span>
        <CanMiss value={a.display} />
        <Cells card={card} />
        <span className="col-span-2 text-caption text-ink-2 tnum">
          {a.attended}/{a.held} attended · {a.left} left
        </span>
      </button>

      {open && (
        <div className="mt-2">
          {card.sessions.map((s) => (
            <div key={s.id} className="flex items-center justify-between border-t border-line py-1.5 text-[13.5px]">
              <span>
                {dayShort(s.date)} {dayNum(s.date)} {monthShort(s.date)}
                {KIND[s.kind] && <em className="ml-1.5 text-[11px] font-semibold text-ink-3 not-italic">{KIND[s.kind]}</em>}
              </span>
              <StatusPicker value={s.status} label={`${code} ${s.date}`} onChange={(st) => markSessions([s], st)} />
            </div>
          ))}
          <div className="flex gap-2 pt-2">
            <Button variant="secondary" size="sm" className="px-3 py-1.5 text-[12.5px]" onClick={() => onAdd(`${code.toLowerCase()} extra class `)}>
              + Extra class
            </Button>
            <Button variant="secondary" size="sm" className="px-3 py-1.5 text-[12.5px]" onClick={() => onAdd(`${code.toLowerCase()} guest lecture `)}>
              + Guest lecture
            </Button>
          </div>
        </div>
      )}
    </li>
  )
}

/** One cell per session in the term: course colour attended, red absent, empty to come; a tick at the 80% line. */
function Cells({ card }: { card: CourseCard }) {
  const a = card.attendance
  const cells = Array.from({ length: a.total }, (_, i) => (i < a.attended ? 'a' : i < a.held ? 'x' : ''))
  const min = a.total - a.allowed
  return (
    <span aria-hidden className="relative col-span-2 grid gap-0.5" style={{ gridTemplateColumns: `repeat(${a.total}, 1fr)` }}>
      {cells.map((c, i) => (
        <i key={i} className={cn('h-2 rounded-[1px]', c === 'x' ? 'bg-urgent' : c === 'a' ? '' : 'bg-fill')} style={c === 'a' ? { background: `var(--${a.course}, var(--ink-3))` } : undefined} />
      ))}
      <em className="absolute -top-[3px] -bottom-[3px] -ml-px w-0.5 bg-ink" style={{ left: `${(min / a.total) * 100}%` }} />
    </span>
  )
}

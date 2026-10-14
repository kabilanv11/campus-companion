import { useMemo, useState } from 'react'
import { courseInfo, menuFor, referenceData, termFor, timetableFor } from '@/data'
import { useUserData } from '@/db/hooks'
import { noClassReason } from '@/domain/calendar'
import { MEAL_LABEL, mealsForDate } from '@/domain/meals'
import { sessionsForDate, type Session } from '@/domain/sessions'
import { addDays, istDate, shortTime, weekStart } from '@/domain/time'
import { dayNum, dayShort, monthLong } from '@/lib/format'
import { useNow } from '@/lib/useNow'
import { cn } from '@/lib/utils'
import { CourseCode } from '@/ui/marks'
import { BackLink, Page, PageTitle, SectionLabel } from '@/ui/Page'
import { Dishes } from '@/ui/today/Timeline'

const KIND_LABEL: Record<Session['kind'], string | null> = { regular: null, makeup: 'Makeup', extra: 'Extra class', guest: 'Guest lecture' }

/** No regular classes for a calendar reason (holiday, exams, break); Sundays and days outside a term aren't struck. */
function isOff(date: string): string | null {
  const r = noClassReason(date, referenceData.calendar)
  return r && r.kind !== 'outside-term' ? r.label : null
}

export function Schedule({ onBack }: { onBack: () => void }) {
  const today = istDate(useNow())
  const [picked, setPicked] = useState<string | null>(null)
  const date = picked ?? today
  const user = useUserData()
  const thisWeek = weekStart(today)

  const sessions = useMemo(
    () => (user ? sessionsForDate(date, { data: referenceData, stored: user.sessions, overrides: user.overrides }) : []),
    [date, user],
  )
  const meals = useMemo(() => mealsForDate(date, referenceData), [date])
  const off = isOff(date)
  const term = termFor(date, referenceData)
  const noTimetable = term && !timetableFor(date, referenceData)

  return (
    <Page>
      <BackLink label="More" onClick={onBack} />
      <PageTitle>Daily schedule</PageTitle>
      <div className="mt-4">
        <WeekStrip start={thisWeek} selected={date} onPick={setPicked} label="This week" />
      </div>

      <section className="mt-6">
        <SectionLabel>Classes</SectionLabel>
        {sessions.length > 0 ? (
          sessions.map((s, i) => <ClassRow key={s.id} session={s} first={i === 0} />)
        ) : (
          <p className="py-2 text-body text-ink-2">
            {noTimetable ? `Timetable for Term ${term.id} not added yet` : off ? `No classes · ${off}` : 'No classes'}
          </p>
        )}
      </section>

      <section className="mt-6">
        <SectionLabel>Mess</SectionLabel>
        {!menuFor(date, referenceData) ? (
          <p className="py-2 text-body text-ink-2">Menu for {monthLong(date)} not added yet</p>
        ) : (
          meals.map((m) => (
            <div key={m.meal} data-testid={`schedule-meal-${m.meal}`} className="mt-3.5 first-of-type:mt-1">
              <b className="block text-[17px] leading-[1.3] font-bold">{MEAL_LABEL[m.meal]}</b>
              <Dishes meal={m} />
            </div>
          ))
        )}
      </section>

      <section className="mt-6">
        <SectionLabel>Next week</SectionLabel>
        <WeekStrip start={addDays(thisWeek, 7)} selected={date} onPick={setPicked} label="Next week" />
      </section>
    </Page>
  )
}

function WeekStrip({ start, selected, onPick, label }: { start: string; selected: string; onPick: (d: string) => void; label: string }) {
  const days = Array.from({ length: 7 }, (_, i) => addDays(start, i))
  return (
    <div role="group" aria-label={label} className="grid grid-cols-7 gap-0.5">
      {days.map((d) => {
        const on = d === selected
        const off = !!isOff(d)
        return (
          <button
            key={d}
            type="button"
            aria-pressed={on}
            aria-label={`${dayShort(d)} ${dayNum(d)}${off ? ', no classes' : ''}`}
            onClick={() => onPick(d)}
            className={cn('grid justify-items-center rounded-full py-1.5 text-[11px]', on ? 'bg-brand text-btn-ink' : 'text-ink-3')}
          >
            {dayShort(d)}
            <b className={cn('text-[15px] font-semibold tnum', on ? 'text-btn-ink' : off ? 'text-ink-3 line-through' : 'text-ink')}>{dayNum(d)}</b>
          </button>
        )
      })}
    </div>
  )
}

function ClassRow({ session: s, first }: { session: Session; first: boolean }) {
  const kind = KIND_LABEL[s.kind]
  const cancelled = s.status === 'cancelled'
  return (
    <div data-testid={`schedule-class-${s.course}`} className={cn('grid grid-cols-[42px_1fr] items-start gap-2 py-2.5', !first && 'border-t border-line')}>
      <span className="pt-px text-time text-ink-2 tnum">{shortTime(s.start)}</span>
      <div className="grid min-w-0 gap-1">
        <span className="flex flex-wrap items-baseline gap-x-2">
          <CourseCode code={s.course} />
          <span className={cn('text-name text-ink-2', cancelled && 'line-through')}>{courseInfo(s.course)?.name}</span>
        </span>
        <span className="text-meta text-ink-2">
          {s.professor && `${s.professor} · `}
          {kind ? (
            <span className="font-semibold text-link">
              {kind}, {s.room}
            </span>
          ) : (
            <span className={cn(s.roomChanged && 'font-semibold text-link')}>{s.room}</span>
          )}
          {cancelled && ' · Cancelled'}
        </span>
      </div>
    </div>
  )
}

import { Fragment, useMemo, useState } from 'react'
import { referenceData } from '@/data'
import { byMonth, calendarSections, dayMark, isPastEntry, type CalEntry, type CalSection } from '@/domain/calendarList'
import { addDays, istDate, weekday } from '@/domain/time'
import { dayNum, monthLong, monthShort } from '@/lib/format'
import { useNow } from '@/lib/useNow'
import { cn } from '@/lib/utils'
import { CalendarRow } from '@/ui/CalendarRow'
import { BackLink, Page, PageTitle } from '@/ui/Page'
import { Segmented } from '@/ui/Segmented'

type View = 'list' | 'month'

const MONTH_LABEL = 'mb-1 text-caption font-bold uppercase tracking-[.06em] text-ink-3'

export function Calendar({ onBack }: { onBack: () => void }) {
  const today = istDate(useNow())
  const [view, setView] = useState<View>('list')
  const sections = useMemo(() => calendarSections(today, referenceData), [today])

  return (
    <Page>
      <BackLink label="More" onClick={onBack} />
      <PageTitle>Academic calendar</PageTitle>
      <div className="mt-4">
        <Segmented
          label="Calendar view"
          options={[
            { id: 'list', label: 'List' },
            { id: 'month', label: 'Month' },
          ]}
          value={view}
          onChange={setView}
        />
      </div>
      {view === 'list' && <Legend />}
      {view === 'list' ? <ListView sections={sections} today={today} /> : <MonthView sections={sections} today={today} />}
    </Page>
  )
}

function Legend() {
  const key = (color: string, label: string) => (
    <span className="inline-flex items-center gap-1.5">
      <i aria-hidden className={cn('inline-block h-3 w-[3px]', color)} />
      {label}
    </span>
  )
  return (
    <div className="mt-4 flex gap-3.5 text-caption text-ink-2">
      {key('bg-amber', 'No classes')}
      {key('bg-urgent', 'Exams')}
      <span className="inline-flex items-center gap-1.5">
        <i aria-hidden className="inline-block h-3 w-[3px]" style={{ background: 'var(--WEC)' }} />
        Course
      </span>
    </div>
  )
}

function ListView({ sections, today }: { sections: CalSection[]; today: string }) {
  // The TODAY line sits above the first entry that hasn't ended.
  const firstUpcoming = sections.flatMap((s) => s.entries).find((e) => !isPastEntry(e, today))
  return (
    <div className="mt-5 grid gap-7">
      {sections.map((s) => (
        <section key={s.title} data-testid="cal-term" className={cn('grid gap-3', s.past && 'opacity-45')}>
          <div className={cn('flex items-baseline justify-between pb-1', s.current ? 'border-b-2 border-ink' : 'border-b border-ink')}>
            <h2 className="text-[17px] font-bold">{s.title}</h2>
            {s.range && <span className="text-meta text-ink-2 tnum">{`${dayNum(s.range.from)} ${monthShort(s.range.from)} – ${dayNum(s.range.to)} ${monthShort(s.range.to)}`}</span>}
          </div>
          {byMonth(s.entries).map((g) => (
            <div key={g.month}>
              <h3 className={MONTH_LABEL}>{monthLong(`${g.month}-01`)}</h3>
              {g.entries.map((e, i) => (
                <Fragment key={i}>
                  {e === firstUpcoming && <TodayLine />}
                  <CalendarRow entry={e} past={!s.past && isPastEntry(e, today)} />
                </Fragment>
              ))}
            </div>
          ))}
        </section>
      ))}
    </div>
  )
}

function TodayLine() {
  return (
    <div data-testid="today-line" className="relative my-0.5 h-0 border-t-2 border-brand">
      <span className="absolute -top-[9px] right-0 bg-canvas pl-1.5 text-[10.5px] font-bold uppercase tracking-[.06em] text-brand">Today</span>
    </div>
  )
}

const WEEKDAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S']

function MonthView({ sections, today }: { sections: CalSection[]; today: string }) {
  const entries = sections.flatMap((s) => s.entries)
  const groups = byMonth([...entries].sort((a, b) => a.from.slice(0, 7).localeCompare(b.from.slice(0, 7))))
  const last = entries.reduce((m, e) => ((e.to ?? e.from) > m ? (e.to ?? e.from) : m), today).slice(0, 7)
  const months: string[] = []
  for (let m = today.slice(0, 7); m <= last; m = addDays(`${m}-28`, 7).slice(0, 7)) months.push(m)
  return (
    <div className="mt-5 grid gap-6">
      {months.map((m) => (
        <section key={m} data-testid="cal-month">
          <h2 className={MONTH_LABEL}>
            {monthLong(`${m}-01`)} {m.slice(0, 4)}
          </h2>
          <MonthGrid month={m} today={today} />
          {groups
            .filter((g) => g.month === m)
            .flatMap((g) => g.entries)
            .map((e: CalEntry, i) => (
              <CalendarRow key={i} entry={e} past={isPastEntry(e, today)} />
            ))}
        </section>
      ))}
    </div>
  )
}

function MonthGrid({ month, today }: { month: string; today: string }) {
  const first = `${month}-01`
  const lead = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'].indexOf(weekday(first))
  const days: string[] = []
  for (let d = first; d.slice(0, 7) === month; d = addDays(d, 1)) days.push(d)
  return (
    <div className="mb-1.5 grid grid-cols-7 gap-0.5 text-center">
      {WEEKDAYS.map((w, i) => (
        <span key={i} className="py-0.5 text-[11px] font-bold text-ink-3">
          {w}
        </span>
      ))}
      {Array.from({ length: lead }, (_, i) => (
        <span key={`b${i}`} />
      ))}
      {days.map((d) => {
        const mark = dayMark(d, referenceData.calendar)
        const wd = weekday(d)
        const isToday = d === today
        return (
          <span
            key={d}
            data-date={d}
            data-mark={mark ?? undefined}
            className={cn(
              'rounded-[4px] py-[7px] text-[13.5px] tnum',
              (wd === 'sat' || wd === 'sun') && 'text-ink-3',
              mark === 'noClass' && 'bg-amber/20 text-ink',
              mark === 'exam' && 'bg-urgent/16 font-bold text-urgent',
              isToday && 'rounded-full bg-brand font-bold text-btn-ink',
              d < today && 'opacity-40',
            )}
          >
            {dayNum(d)}
          </span>
        )
      })}
    </div>
  )
}

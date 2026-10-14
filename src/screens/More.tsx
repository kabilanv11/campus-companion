import { useMemo } from 'react'
import { referenceData } from '@/data'
import { nextEntries } from '@/domain/calendarList'
import { istDate } from '@/domain/time'
import type { Pushed } from '@/lib/router'
import { useNow } from '@/lib/useNow'
import { CalendarRow } from '@/ui/CalendarRow'
import { Page, PageTitle, SectionLabel } from '@/ui/Page'

const LINKS: { id: Pushed; label: string; sub: string }[] = [
  { id: 'schedule', label: 'Daily schedule', sub: 'Classes, professors and full mess menu, day by day' },
  { id: 'calendar', label: 'Academic calendar', sub: '2026–27, all terms' },
  { id: 'settings', label: 'Settings', sub: 'Theme, rooms and professors, and your clubs' },
]

export function More({ onOpen }: { onOpen: (screen: Pushed) => void }) {
  const today = istDate(useNow())
  const next = useMemo(() => nextEntries(today, referenceData), [today])
  return (
    <Page>
      <PageTitle>More</PageTitle>
      <ul className="mt-4">
        {LINKS.map((l, i) => (
          <li key={l.id} className={i > 0 ? 'border-t border-line' : ''}>
            <button type="button" onClick={() => onOpen(l.id)} className="grid w-full grid-cols-[1fr_auto] items-center py-3 text-left">
              <span className="grid">
                <b className="text-[15px] font-semibold">{l.label}</b>
                <span className="text-meta text-ink-2">{l.sub}</span>
              </span>
              <span aria-hidden className="text-[20px] text-ink-3">›</span>
            </button>
          </li>
        ))}
      </ul>
      {next.length > 0 && (
        <section className="mt-6">
          <SectionLabel>Next on the calendar</SectionLabel>
          {next.map((e, i) => (
            <CalendarRow key={i} entry={e} withMonth={e.from.slice(0, 7) !== today.slice(0, 7) || (!!e.to && e.to.slice(0, 7) !== today.slice(0, 7))} />
          ))}
        </section>
      )}
    </Page>
  )
}

import type { ReferenceData } from '@/data'
import type { AcademicCalendar, CalendarEvent, Term } from '@/data/types'
import { addDays, inRange, weekday } from './time'

// The Academic calendar screen's rows, built from calendar.json and the timetables.

/** noClass: amber. exam: red. course: the course's colour (a half-term course ending). plain: no marker. */
export type CalKind = 'noClass' | 'exam' | 'course' | 'plain'

export interface CalEntry {
  /** 'YYYY-MM-DD', or 'YYYY-MM' when only the month is known. */
  from: string
  to?: string
  label: string
  kind: CalKind
  /** The course code for a course entry, for its colour. */
  course?: string
}

export interface CalSection {
  title: string
  range?: { from: string; to: string }
  entries: CalEntry[]
  /** The term containing today (or the next one, between terms). */
  current: boolean
  past: boolean
}

/** Sort key: month-only entries go first in their month. */
const key = (e: CalEntry) => (e.from.length === 7 ? `${e.from}-00` : e.from)
const endOf = (e: CalEntry) => (e.from.length === 7 ? `${e.from}-31` : (e.to ?? e.from))

export const isPastEntry = (e: CalEntry, today: string) => endOf(e) < today

const event = (e: CalendarEvent): CalEntry => ({ from: e.date, to: e.to, label: e.label, kind: 'plain' })

/** The last day before the mid-term exams that isn't a Sunday: when half-term courses end. */
function halfTermEnd(term: Term): string {
  let d = addDays(term.midterm_exams.from, -1)
  while (weekday(d) === 'sun') d = addDays(d, -1)
  return d
}

function termEntries(term: Term, cal: AcademicCalendar, data: ReferenceData, nextStart?: string): CalEntry[] {
  const exams = [
    { ...term.midterm_exams, label: 'Mid-term exams' },
    { ...term.endterm_exams, label: 'End-term exams' },
  ]
  const isExam = (r: { from: string; to: string; label: string }) =>
    /exam/i.test(r.label) || exams.some((x) => x.from === r.from && x.to === r.to)
  const out: CalEntry[] = [{ from: term.start, label: `Term ${term.id} begins`, kind: 'plain' }]
  for (const x of exams) {
    if (!term.no_class_days.some((n) => n.from === x.from && n.to === x.to)) out.push({ from: x.from, to: x.to, label: x.label, kind: 'exam' })
  }
  for (const n of term.no_class_days) {
    out.push({ from: n.from, to: n.to === n.from ? undefined : n.to, label: n.label, kind: isExam(n) ? 'exam' : 'noClass' })
  }
  out.push({ from: term.classes_resume, label: 'Classes resume', kind: 'plain' })
  for (const e of term.events) out.push(event(e))
  const timetable = data.timetables.find((t) => t.term === term.id)
  for (const c of timetable?.courses ?? []) {
    if (c.length === 'half' && (c.runs ?? 'pre_midterm') === 'pre_midterm') out.push({ from: halfTermEnd(term), label: `${c.code} ends`, kind: 'course', course: c.code })
  }
  // Breaks that start after this term and before the next one are listed with it (Winter break under Term II).
  for (const b of cal.breaks) {
    if (b.from >= term.start && (!nextStart || b.from < nextStart)) out.push({ from: b.from, to: b.to, label: b.label, kind: 'noClass' })
  }
  // Stable sort: on the same day, no-class rows stay ahead of course rows, as inserted.
  return out.map((e, i) => ({ e, i })).sort((a, b) => key(a.e).localeCompare(key(b.e)) || a.i - b.i).map((x) => x.e)
}

export function calendarSections(today: string, data: ReferenceData): CalSection[] {
  const cal = data.calendar
  const terms = [...cal.terms].sort((a, b) => a.start.localeCompare(b.start))
  const currentId = (terms.find((t) => today <= t.end) ?? terms[terms.length - 1])?.id
  const sections: CalSection[] = terms.map((t, i) => ({
    title: `Term ${t.id}`,
    range: { from: t.start, to: t.end },
    entries: termEntries(t, cal, data, terms[i + 1]?.start),
    current: t.id === currentId,
    past: t.end < today,
  }))
  const after = (cal.after_terms ?? []).map(event)
  if (after.length > 0 && terms.length > 0) {
    sections.push({
      title: `After Term ${terms[terms.length - 1]!.id}`,
      entries: after.sort((a, b) => key(a).localeCompare(key(b))),
      current: false,
      past: after.every((e) => isPastEntry(e, today)),
    })
  }
  return sections
}

/** Entries grouped by month ('YYYY-MM'), in order. */
export function byMonth(entries: CalEntry[]): { month: string; entries: CalEntry[] }[] {
  const groups: { month: string; entries: CalEntry[] }[] = []
  for (const e of entries) {
    const m = e.from.slice(0, 7)
    const last = groups[groups.length - 1]
    if (last?.month === m) last.entries.push(e)
    else groups.push({ month: m, entries: [e] })
  }
  return groups
}

/** The next few entries that haven't ended, for More's "Next on the calendar". */
export function nextEntries(today: string, data: ReferenceData, count = 3): CalEntry[] {
  return calendarSections(today, data)
    .flatMap((s) => s.entries)
    .filter((e) => !isPastEntry(e, today))
    .slice(0, count)
}

export type DayMark = 'noClass' | 'exam' | null

/** How a day is tinted in the Month grid. */
export function dayMark(date: string, cal: AcademicCalendar): DayMark {
  for (const t of cal.terms) {
    if (inRange(date, t.midterm_exams) || inRange(date, t.endterm_exams)) return 'exam'
    const n = t.no_class_days.find((x) => inRange(date, x))
    if (n) return /exam/i.test(n.label) ? 'exam' : 'noClass'
  }
  return cal.breaks.some((b) => inRange(date, b)) ? 'noClass' : null
}

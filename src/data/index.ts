// The single loader for bundled reference data. New files dropped into data/timetables/ or
// data/menus/ are picked up automatically; nothing else needs editing.
import type { AcademicCalendar, Menu, Term, Timetable } from './types'
import calendarJson from '@data/calendar.json'

const timetableFiles = import.meta.glob<Timetable>('/data/timetables/*.json', { eager: true, import: 'default' })
const menuFiles = import.meta.glob<Menu>('/data/menus/*.json', { eager: true, import: 'default' })

export const calendar = calendarJson as AcademicCalendar
export const timetables: Timetable[] = Object.values(timetableFiles)
export const menus: Menu[] = Object.values(menuFiles)
export const rawFiles = { timetables: timetableFiles, menus: menuFiles }

export interface ReferenceData {
  calendar: AcademicCalendar
  timetables: Timetable[]
  menus: Menu[]
}

export const referenceData: ReferenceData = { calendar, timetables, menus }

/** The term whose start–end contains the date. */
export function termFor(date: string, data: ReferenceData = referenceData): Term | undefined {
  return data.calendar.terms.find((t) => date >= t.start && date <= t.end)
}

/** The timetable for the term containing the date. */
export function timetableFor(date: string, data: ReferenceData = referenceData): Timetable | undefined {
  const term = termFor(date, data)
  return term && data.timetables.find((t) => t.term === term.id)
}

/** The menu whose valid_from–valid_to contains the date. */
export function menuFor(date: string, data: ReferenceData = referenceData): Menu | undefined {
  return data.menus.find((m) => date >= m.valid_from && date <= m.valid_to)
}

/** Course details by code, from whichever term's timetable lists it (the latest term wins). */
export function courseInfo(code: string, data: ReferenceData = referenceData) {
  for (let i = data.timetables.length - 1; i >= 0; i--) {
    const c = data.timetables[i]!.courses.find((x) => x.code === code)
    if (c) return c
  }
  return undefined
}

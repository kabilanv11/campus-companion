import { describe, expect, it } from 'vitest'
import { calendar, menuFor, rawFiles, termFor, timetableFor } from '@/data'
import { validateCalendar, validateMenu, validateTimetable } from '@/data/validate'

describe('bundled data files', () => {
  it.each(Object.entries(rawFiles.timetables))('%s matches the timetable schema', (_path, file) => {
    expect(validateTimetable(file)).toEqual([])
  })
  it.each(Object.entries(rawFiles.menus))('%s matches the menu schema', (_path, file) => {
    expect(validateMenu(file)).toEqual([])
  })
  it('calendar.json matches the calendar schema', () => {
    expect(validateCalendar(calendar)).toEqual([])
  })
  it('every timetable belongs to a term in the calendar', () => {
    for (const t of Object.values(rawFiles.timetables)) expect(calendar.terms.map((x) => x.id)).toContain(t.term)
  })
  it('the validator catches a broken file', () => {
    expect(validateMenu({ schema_version: 1, valid_from: '2026-11-01' })).not.toEqual([])
    expect(validateTimetable({ schema_version: 1, weekly: [{ day: 'mon', slot: 'IX', course: 'ZZZ' }] }).length).toBeGreaterThan(0)
  })
})

describe('loader picks files by date', () => {
  it('finds Term II and the October menu', () => {
    expect(termFor('2026-10-14')?.id).toBe('II')
    expect(timetableFor('2026-10-14')?.term).toBe('II')
    expect(menuFor('2026-10-14')?.valid_from).toBe('2026-10-01')
  })
  it('returns nothing where no file covers the date yet', () => {
    expect(menuFor('2026-11-03')).toBeUndefined()
    expect(timetableFor('2027-01-05')).toBeUndefined() // Term III timetable not added yet
    expect(termFor('2027-01-05')?.id).toBe('III')
  })
})

import 'fake-indexeddb/auto'
import { describe, expect, it } from 'vitest'
import { referenceData } from '@/data'
import { addClub, setCourseField } from '@/db/actions'
import { CampusDB } from '@/db/schema'
import { byMonth, calendarSections, dayMark, nextEntries } from '@/domain/calendarList'
import { courseOn, sessionsForDate } from '@/domain/sessions'
import { rangeLabel } from '@/lib/format'
import { ctx } from './helpers'

describe('academic calendar list', () => {
  const sections = calendarSections('2026-10-14', referenceData)

  it('has Terms I to III and After Term III, with Term II current and Term I past', () => {
    expect(sections.map((s) => s.title)).toEqual(['Term I', 'Term II', 'Term III', 'After Term III'])
    expect(sections.map((s) => [s.current, s.past])).toEqual([[false, true], [true, false], [false, false], [false, false]])
  })

  it('lists Term II October as in the mockup, with WEC ending after Urban Illumina', () => {
    const oct = byMonth(sections[1]!.entries).find((g) => g.month === '2026-10')!
    expect(oct.entries.map((e) => `${rangeLabel(e.from, e.to)} ${e.label} ${e.kind}`)).toEqual([
      'Fri 2 Gandhi Jayanti noClass',
      'Tue 20 Dussehra noClass',
      'Mon 26 Term I results plain',
      'Sat 31 Urban Illumina noClass',
      'Sat 31 WEC ends course',
    ])
  })

  it('marks exams red, puts the winter break under Term II and month-only lines first in their month', () => {
    const t2 = sections[1]!.entries
    expect(t2.find((e) => e.label === 'Mid-term exams')?.kind).toBe('exam')
    expect(t2.at(-1)).toMatchObject({ label: 'Winter break', kind: 'noClass' })
    expect(rangeLabel(t2.at(-1)!.from, t2.at(-1)!.to)).toBe('Fri 25 – Sun 3 Jan')
    const feb = byMonth(sections[2]!.entries).find((g) => g.month === '2027-02')!
    expect(feb.entries[0]).toMatchObject({ label: 'Electives announced' })
    expect(rangeLabel(feb.entries[0]!.from)).toBe('Feb')
  })

  it('next on the calendar starts after today', () => {
    expect(nextEntries('2026-10-14', referenceData).map((e) => e.label)).toEqual(['Dussehra', 'Term I results', 'Urban Illumina'])
    expect(rangeLabel('2026-11-02', '2026-11-06', true)).toBe('Mon 2 – Fri 6 Nov')
  })

  it('tints the month grid: exams red, holidays and breaks amber', () => {
    expect(dayMark('2026-11-04', referenceData.calendar)).toBe('exam')
    expect(dayMark('2026-10-20', referenceData.calendar)).toBe('noClass')
    expect(dayMark('2026-12-30', referenceData.calendar)).toBe('noClass')
    expect(dayMark('2026-10-21', referenceData.calendar)).toBeNull()
  })
})

describe('course overrides from Settings', () => {
  it('setting MSM to LR-5 from today changes today and later, not past sessions', async () => {
    const db = new CampusDB(`t-${crypto.randomUUID()}`)
    await setCourseField('MSM', 'room', 'LR-5', '2026-10-14', db)
    const overrides = await db.courseOverrides.toArray()
    const room = (date: string) => sessionsForDate(date, ctx([], overrides)).find((s) => s.course === 'MSM')
    expect(room('2026-10-14')).toMatchObject({ room: 'LR-5', roomChanged: true })
    expect(room('2026-10-21')?.room).toBe('LR-5')
    expect(room('2026-10-07')).toMatchObject({ room: 'G-6', roomChanged: false })
  })

  it('stores only the changed field, merging same-day edits', async () => {
    const db = new CampusDB(`t-${crypto.randomUUID()}`)
    await setCourseField('MEP', 'room', 'LR-2', '2026-10-14', db)
    await setCourseField('MEP', 'room', 'LR-3', '2026-10-14', db)
    const rows = await db.courseOverrides.toArray()
    expect(rows).toHaveLength(1)
    expect(rows[0]).toMatchObject({ course: 'MEP', room: 'LR-3', effectiveFrom: '2026-10-14' })
    expect(rows[0]!.professor).toBeUndefined()
    // The timetable's post-midterm professor still applies.
    expect(courseOn('MEP', '2026-11-16', ctx([], rows))).toMatchObject({ professor: 'Rohit Prasad', room: 'LR-3', defaultRoom: 'G-6' })
  })
})

describe('clubs', () => {
  it('adds a club with a unique code safe for CSS', async () => {
    const db = new CampusDB(`t-${crypto.randomUUID()}`)
    await db.open()
    expect(await addClub('  Finance Club ', db)).toBe('FinanceClub')
    expect(await addClub('Finance club', db)).toBe('Financeclub2')
    expect(await addClub('   ', db)).toBeNull()
    expect((await db.clubs.toArray()).map((c) => c.name)).toEqual(expect.arrayContaining(['Samaritans', 'TEDx', 'Finance Club']))
  })
})

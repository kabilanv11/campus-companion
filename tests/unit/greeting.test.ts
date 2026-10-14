import { describe, expect, it } from 'vitest'
import { calendar } from '@/data'
import { CONTEXT_POOLS, POOLS, bucketOf, dayRead, greeting, isFirstDayAfterBreak } from '@/domain/greeting'
import { at } from './helpers'

const g = (date: string, time: string) => greeting(at(date, time), 'Kabilan', calendar)

describe('greeting (6.6)', () => {
  it('each time-of-day pool has at least 15 full-form lines with the name', () => {
    for (const pool of Object.values(POOLS)) {
      expect(pool.length).toBeGreaterThanOrEqual(15)
      for (const line of pool) {
        expect(line).toContain('{name}')
        expect(line).not.toMatch(/^(Morning|Afternoon|Evening|Night)\b/)
      }
    }
    for (const pool of Object.values(CONTEXT_POOLS)) for (const line of pool) expect(line).toContain('{name}')
  })

  it('buckets: morning 05–12, afternoon 12–17, evening 17–21, night 21–05', () => {
    expect([4 * 60 + 59, 5 * 60, 11 * 60 + 59, 12 * 60, 16 * 60 + 59, 17 * 60, 20 * 60 + 59, 21 * 60].map(bucketOf)).toEqual([
      'night', 'morning', 'morning', 'afternoon', 'afternoon', 'evening', 'evening', 'night',
    ])
  })

  it('stays the same across reopens within a bucket, and uses the name', () => {
    const a = g('2026-10-14', '08:00')
    expect(g('2026-10-14', '11:30')).toEqual(a)
    expect(a.source).toBe('morning')
    expect(a.text).toMatch(/, Kabilan$/)
  })

  it('varies across days', () => {
    const lines = new Set(['2026-10-12', '2026-10-13', '2026-10-14', '2026-10-15', '2026-10-16', '2026-10-19', '2026-10-21'].map((d) => g(d, '09:00').text))
    expect(lines.size).toBeGreaterThan(2)
  })

  it('context lines win', () => {
    expect(g('2026-10-20', '09:00').text).toBe('Happy Dussehra, Kabilan')
    expect(g('2026-10-02', '09:00').text).toBe('Happy Gandhi Jayanti, Kabilan')
    expect(g('2026-10-31', '09:00').source).toBe('dayOff') // Urban Illumina, not a festival
    expect(g('2026-11-03', '09:00').source).toBe('exams')
    expect(g('2026-11-09', '09:00').source).toBe('breakDay')
    expect(g('2026-11-12', '09:00').source).toBe('afterBreak')
    expect(g('2026-10-16', '18:30').source).toBe('fridayEvening')
    expect(g('2026-10-16', '10:00').source).toBe('morning') // Friday morning is ordinary
    expect(g('2026-10-14', '23:45').source).toBe('lateNight')
    expect(g('2026-10-15', '01:00').source).toBe('lateNight')
  })

  it('first day after a break, not after an ordinary weekend', () => {
    expect(isFirstDayAfterBreak('2026-11-12', calendar)).toBe(true)
    expect(isFirstDayAfterBreak('2026-10-19', calendar)).toBe(false)
    expect(isFirstDayAfterBreak('2027-01-04', calendar)).toBe(true)
  })
})

describe('day-read', () => {
  const base = { mode: 'today' as const, date: '2026-10-14', classes: 4, classesToGo: 4, quizzes: 1, due: 2 }
  it('morning of a full day', () => {
    expect(dayRead(base)).toBe('Packed Wednesday: four classes and a quiz')
  })
  it('mid-day counts what is left', () => {
    expect(dayRead({ ...base, classesToGo: 2 })).toBe('Two classes to go')
    expect(dayRead({ ...base, classesToGo: 1 })).toBe('One class to go')
  })
  it('evening reads tomorrow', () => {
    expect(dayRead({ ...base, mode: 'tomorrow', date: '2026-10-15', classes: 2, classesToGo: 2, quizzes: 0 })).toBe('Light Thursday tomorrow, just two classes')
  })
  it('no-class days', () => {
    expect(dayRead({ ...base, classes: 0, classesToGo: 0, noClass: { label: 'Dussehra', festival: true } })).toBe('No classes today')
    expect(dayRead({ ...base, classes: 0, classesToGo: 0, noClass: { label: 'Urban Illumina' } })).toBe('No classes · Urban Illumina')
  })
  it('hidden when nothing is worth saying', () => {
    expect(dayRead({ ...base, classesToGo: 0, due: 1 })).toBeNull()
    expect(dayRead({ ...base, classesToGo: 0, due: 0 })).toBe('Nothing due today')
  })
})

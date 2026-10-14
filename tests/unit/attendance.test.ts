import { describe, expect, it } from 'vitest'
import { attendanceByCourse, canMissDisplay, courseAttendance, unmarked } from '@/domain/attendance'
import { sessionsForDate, type Session } from '@/domain/sessions'
import { at, ctx, mark } from './helpers'

const s = (status: Session['status'], kind: Session['kind'] = 'regular'): Session => ({
  id: Math.random().toString(), date: '2026-10-01', start: '10:15', end: '11:45', course: 'OM', kind, professor: '', room: 'G-6', roomChanged: false, status,
})
const om = { code: 'OM', total_sessions: 20 }

describe('attendance (6.2)', () => {
  it('a cancelled session does not change held (acceptance)', () => {
    const base = courseAttendance(om, [s('present'), s('absent')])
    const withCancelled = courseAttendance(om, [s('present'), s('absent'), s('cancelled')])
    expect(withCancelled.held).toBe(base.held)
    expect(withCancelled).toMatchObject({ held: 2, attended: 1, absences: 1, left: 18, allowed: 4, canMiss: 3 })
  })

  it('makeup, extra and guest sessions count as held', () => {
    expect(courseAttendance(om, [s('present', 'makeup'), s('absent', 'guest'), s('present', 'extra')]).held).toBe(3)
  })

  it('4 absences in a full course is "Can\'t miss"; 5 is "Short by 1" (acceptance)', () => {
    expect(courseAttendance(om, Array.from({ length: 4 }, () => s('absent'))).display).toEqual({ kind: 'cantMiss' })
    expect(courseAttendance(om, Array.from({ length: 5 }, () => s('absent'))).display).toEqual({ kind: 'short', by: 1 })
  })

  it('half-term courses allow 2', () => {
    expect(courseAttendance({ code: 'OM', total_sessions: 10 }, [s('absent')])).toMatchObject({ allowed: 2, canMiss: 1 })
  })

  it('display: ≥2 plain, 1 urgent', () => {
    expect(canMissDisplay(4)).toEqual({ kind: 'number', value: 4, urgent: false })
    expect(canMissDisplay(1)).toEqual({ kind: 'number', value: 1, urgent: true })
  })

  it('counts stored marks across the term per course', () => {
    const c = ctx([mark('2026-10-12_III_OM', 'absent'), mark('2026-10-14_III_OM', 'present'), mark('2026-10-07_III_OM', 'cancelled')])
    expect(attendanceByCourse('2026-10-14', c).get('OM')).toMatchObject({ held: 2, absences: 1, canMiss: 3 })
    expect(attendanceByCourse('2026-10-14', c).get('WEC')).toMatchObject({ total: 10, allowed: 2 })
  })

  it('unmarked = started and no status', () => {
    const c = ctx([mark('2026-10-14_II_MPI', 'present')])
    const today = sessionsForDate('2026-10-14', c)
    expect(unmarked(today, at('2026-10-14', '13:00')).map((x) => x.course)).toEqual(['OM'])
    expect(unmarked(today, at('2026-10-14', '09:00'))).toEqual([])
  })
})

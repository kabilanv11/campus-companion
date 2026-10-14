import { describe, expect, it } from 'vitest'
import { referenceData } from '@/data'
import { buildAttendance } from '@/domain/attendanceScreen'
import { at, mark } from './helpers'

describe('Attendance screen model', () => {
  it('groups unmarked classes by day and sorts courses by can-miss', () => {
    const stored = [
      mark('2026-10-12_III_OM', 'absent'),
      mark('2026-10-05_III_OM', 'absent'),
      mark('2026-10-07_III_OM', 'absent'),
    ]
    const m = buildAttendance(at('2026-10-14', '13:00'), referenceData, stored, [])
    expect(m.courses[0]?.attendance.course).toBe('OM')
    expect(m.courses[0]?.attendance.canMiss).toBe(1)
    const last = m.unmarkedGroups.at(-1)!
    expect(last.date).toBe('2026-10-14')
    expect(last.sessions.map((s) => s.course)).toEqual(['MPI', 'OM'])
    expect(m.unmarkedCount).toBe(m.unmarkedGroups.reduce((n, g) => n + g.sessions.length, 0))
  })
})

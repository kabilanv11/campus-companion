import { describe, expect, it } from 'vitest'
import { sessionsForDate } from '@/domain/sessions'
import { ctx } from './helpers'

const codes = (date: string, c = ctx()) => sessionsForDate(date, c).map((s) => s.course)

describe('sessions for a date (6.1)', () => {
  it('Wednesday 14 Oct has MPI, OM, MSM, MEP in order; Office Hours stay off', () => {
    const s = sessionsForDate('2026-10-14', ctx())
    expect(s.map((x) => `${x.start} ${x.course}`)).toEqual(['10:15 MPI', '12:00 OM', '14:15 MSM', '16:00 MEP'])
    expect(s.every((x) => x.room === 'G-6' && !x.roomChanged)).toBe(true)
    expect(s.find((x) => x.course === 'MEP')?.professor).toBe('Rahul Kumar')
  })

  it('no classes on Saturday, Sunday, a holiday, exams, breaks or after the last class day', () => {
    expect(codes('2026-10-17')).toEqual([]) // Saturday
    expect(codes('2026-10-18')).toEqual([]) // Sunday
    expect(codes('2026-10-20')).toEqual([]) // Dussehra
    expect(codes('2026-11-04')).toEqual([]) // mid-term exams
    expect(codes('2026-11-09')).toEqual([]) // Deepawali break
    expect(codes('2026-12-21')).toEqual([]) // end-term exams
    expect(codes('2026-12-28')).toEqual([]) // winter break
  })

  it('WEC (half term) stops after the mid-term, and MEP switches professor', () => {
    expect(codes('2026-10-15')).toContain('WEC') // Thursday before the mid-term
    expect(codes('2026-11-12')).not.toContain('WEC') // first Thursday after classes resume
    const mep = sessionsForDate('2026-11-16', ctx()).find((s) => s.course === 'MEP')
    expect(mep?.professor).toBe('Rohit Prasad')
  })

  it('adds stored guest lectures and makeups, even on a Saturday', () => {
    const c = ctx([
      { id: 'g1', date: '2026-10-14', start: '16:00', course: 'MEP', kind: 'guest', venue: 'Auditorium' },
      { id: 'm1', date: '2026-10-17', start: '10:15', course: 'MAC', kind: 'makeup' },
    ])
    const wed = sessionsForDate('2026-10-14', c)
    const guest = wed.find((s) => s.id === 'g1')
    expect(guest).toMatchObject({ end: '17:30', room: 'Auditorium', roomChanged: true, kind: 'guest' })
    expect(sessionsForDate('2026-10-17', c).map((s) => s.course)).toEqual(['MAC'])
  })

  it('applies stored status and venue to regular sessions', () => {
    const c = ctx([{ id: '2026-10-14_III_OM', date: '2026-10-14', start: '12:00', course: 'OM', kind: 'regular', status: 'present', venue: 'Tagore Hall' }])
    const om = sessionsForDate('2026-10-14', c).find((s) => s.course === 'OM')
    expect(om).toMatchObject({ status: 'present', room: 'Tagore Hall', roomChanged: true })
  })

  it('a room override from today changes today and later, not the past (acceptance)', () => {
    const c = ctx([], [{ id: 'o1', course: 'MSM', room: 'LR-5', effectiveFrom: '2026-10-14' }])
    const room = (d: string) => sessionsForDate(d, c).find((s) => s.course === 'MSM')?.room
    expect(room('2026-10-09')).toBe('G-6')
    expect(room('2026-10-14')).toBe('LR-5')
    expect(room('2026-10-16')).toBe('LR-5')
  })

  it('the newest override in force wins, field by field', () => {
    const c = ctx([], [
      { id: 'a', course: 'OM', room: 'LR-1', effectiveFrom: '2026-10-01' },
      { id: 'b', course: 'OM', professor: 'Someone Else', effectiveFrom: '2026-10-10' },
      { id: 'c', course: 'OM', room: 'Tagore Hall', effectiveFrom: '2026-10-20' },
    ])
    const om = (d: string) => sessionsForDate(d, c).find((s) => s.course === 'OM')
    expect(om('2026-10-14')).toMatchObject({ room: 'LR-1', professor: 'Someone Else' })
    expect(om('2026-10-21')).toMatchObject({ room: 'Tagore Hall', professor: 'Someone Else' })
  })
})

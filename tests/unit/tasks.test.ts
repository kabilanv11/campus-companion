import { describe, expect, it } from 'vitest'
import { groupTasks, needsYou, showsFrom } from '@/domain/tasks'
import { task } from './helpers'

describe('lead days and Needs you (6.4)', () => {
  it('"mac assignment 2 due fri 11pm" shows from Tuesday (acceptance)', () => {
    expect(showsFrom({ due: '2026-10-16', type: 'assignment' })).toBe('2026-10-13')
  })
  it('reading 1, quiz 2, assignment 3, exam 7, other 1', () => {
    const due = '2026-10-23'
    expect(showsFrom({ due, type: 'reading' })).toBe('2026-10-22')
    expect(showsFrom({ due, type: 'quiz' })).toBe('2026-10-21')
    expect(showsFrom({ due, type: 'assignment' })).toBe('2026-10-20')
    expect(showsFrom({ due, type: 'exam' })).toBe('2026-10-16')
    expect(showsFrom({ due, type: 'other' })).toBe('2026-10-22')
  })
  it('includes overdue and in-window tasks, overdue first then by due time', () => {
    const today = '2026-10-14'
    const quiz = task({ title: 'MSM quiz', type: 'quiz', due: today, dueTime: '14:15' })
    const reading = task({ title: 'MPI reading', type: 'reading', due: today, dueTime: '10:15' })
    const overdue = task({ title: 'MAC case', type: 'assignment', due: '2026-10-12' })
    const later = task({ title: 'OM exam', type: 'exam', due: '2026-11-02' })
    const done = task({ title: 'done', type: 'quiz', due: today, doneAt: '2026-10-13T10:00:00.000Z' })
    expect(needsYou([quiz, reading, overdue, later, done], today).map((t) => t.title)).toEqual(['MAC case', 'MPI reading', 'MSM quiz'])
  })
})

describe('Tasks screen groups', () => {
  it('Overdue, Today, This week (to Sunday), Later, Done this week', () => {
    const today = '2026-10-14' // Wednesday
    const g = groupTasks(
      [
        task({ title: 'od', type: 'assignment', due: '2026-10-12' }),
        task({ title: 'td', type: 'quiz', due: today }),
        task({ title: 'thu', type: 'reading', due: '2026-10-15' }),
        task({ title: 'sun', type: 'other', due: '2026-10-18' }),
        task({ title: 'mon', type: 'assignment', due: '2026-10-19' }),
        task({ title: 'done-mon', type: 'other', due: '2026-10-12', doneAt: '2026-10-12T05:00:00.000Z' }),
        task({ title: 'done-lastweek', type: 'other', due: '2026-10-09', doneAt: '2026-10-09T05:00:00.000Z' }),
      ],
      today,
    )
    const t = (xs: { title: string }[]) => xs.map((x) => x.title)
    expect(t(g.overdue)).toEqual(['od'])
    expect(t(g.today)).toEqual(['td'])
    expect(t(g.thisWeek)).toEqual(['thu', 'sun'])
    expect(t(g.later)).toEqual(['mon'])
    expect(t(g.doneThisWeek)).toEqual(['done-mon'])
  })
})

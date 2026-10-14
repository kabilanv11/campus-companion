import { describe, expect, it } from 'vitest'
import { referenceData } from '@/data'
import { parse, type Draft } from '@/domain/parse'
import { parseContext } from '@/domain/parseContext'
import { at } from './helpers'

// docs/quick-add-rules.md section 12. Reference now: Tue 13 Oct 2026, 11:00 IST.
const now = at('2026-10-13', '11:00')
const ctx = parseContext(referenceData, [], [], [
  { code: 'SAM', name: 'Samaritans' },
  { code: 'TEDx', name: 'TEDx' },
])
const p = (text: string) => parse(text, now, ctx)

type Case = [number, string, Partial<Draft>]
const CASES: Case[] = [
  [1, 'OB reading fri', { type: 'reading', course: undefined, due: { date: '2026-10-16', time: undefined }, title: 'OB reading' }],
  [2, 'MAC reading fri', { type: 'reading', course: 'MAC', due: { date: '2026-10-16', time: '12:00' }, title: 'Reading' }],
  [3, 'mac assignment 2 due fri 11pm', { type: 'assignment', course: 'MAC', due: { date: '2026-10-16', time: '23:00' }, title: 'Assignment 2' }],
  [4, 'msm quiz', { type: 'quiz', course: 'MSM', due: { date: '2026-10-14', time: '14:15' }, title: 'Quiz' }],
  [5, 'ODC case writeup thu', { type: 'assignment', course: 'ODC', due: { date: '2026-10-15', time: undefined }, title: 'Case writeup' }],
  [6, 'Marketing case for wed', { type: 'reading', course: 'MPI', due: { date: '2026-10-14', time: '10:15' }, title: 'Case' }],
  [7, 'accountng quiz tmrw', { type: 'quiz', course: 'MAC', due: { date: '2026-10-14', time: undefined }, title: 'Quiz' }],
  [8, 'OM ch 4 mon', { type: 'reading', course: 'OM', due: { date: '2026-10-19', time: '12:00' }, title: 'Ch 4' }],
  [9, 'MEP quiz wed 4', { type: 'quiz', course: 'MEP', due: { date: '2026-10-14', time: '16:00' }, title: 'Quiz' }],
  [10, 'MSM model submission next fri', { type: 'assignment', course: 'MSM', due: { date: '2026-10-23', time: undefined }, title: 'Model submission' }],
  [11, 'MEP midterm', { type: 'exam', course: 'MEP', due: { date: '2026-11-02', time: undefined }, title: 'Midterm' }],
  [12, 'Assignment 3 MAC MSM fri', { type: 'assignment', course: 'MAC', due: { date: '2026-10-16', time: undefined }, title: 'Assignment 3 MSM' }],
  [13, 'pay hostel fees by 20/10', { type: 'other', course: undefined, due: { date: '2026-10-20', time: undefined }, title: 'Pay hostel fees' }],
  [14, 'MPI group meeting thu 6pm', { type: 'other', course: 'MPI', due: { date: '2026-10-15', time: '18:00' }, title: 'Group meeting' }],
  [15, 'makeup MAC sat 2:15', { type: 'extra', course: 'MAC', when: { date: '2026-10-17', start: '14:15', end: '15:45' }, venue: 'G-6', title: 'Extra class', makeup: true }],
  [16, 'guest lecture MPI thu 4pm aud', { type: 'guest', course: 'MPI', when: { date: '2026-10-15', start: '16:00', end: '17:30' }, venue: 'Auditorium', title: 'Guest lecture' }],
  [17, 'guest lecture thu 4pm', { type: 'guest', course: undefined, when: { date: '2026-10-15', start: '16:00', end: '17:30' }, title: 'Guest lecture' }],
  [18, 'TEDx speaker call wed 4pm', { type: 'club', club: 'TEDx', when: { date: '2026-10-14', start: '16:00', end: '17:00' }, title: 'Speaker call' }],
  [19, 'sams food drive sat 10am @ main gate', { type: 'club', club: 'SAM', when: { date: '2026-10-17', start: '10:00', end: '11:00' }, venue: 'Main gate', title: 'Food drive' }],
  [20, 'MSM class sat 4pm', { type: 'extra', course: 'MSM', when: { date: '2026-10-17', start: '16:00', end: '17:30' }, title: 'Class' }],
  [21, 'samaritans meet', { type: 'club', club: 'SAM', when: { date: undefined, start: undefined, end: undefined }, title: 'Meet' }],
  [22, 'wec', { type: 'other', course: 'WEC', title: 'Other' }],
]

describe('quick-add parser: worked examples', () => {
  it.each(CASES)('#%i %s', (_n, text, want) => {
    expect(p(text)).toMatchObject(want)
  })
})

describe('quick-add parser: rules', () => {
  it('an undated task has no due date', () => {
    expect(p('wec').due).toBeUndefined()
  })
  it('course codes never match inside words', () => {
    expect(p('tomorrow room booking').course).toBeUndefined()
  })
  it('section suffixes are ignored', () => {
    expect(p('MAC(D) quiz fri').course).toBe('MAC')
    expect(p('macd quiz fri').course).toBe('MAC')
  })
  it('first keyword wins', () => {
    expect(p('read for quiz tue').type).toBe('reading')
    expect(p('quiz on ch 3').type).toBe('quiz')
  })
  it('a typo on a long keyword still matches', () => {
    expect(p('mac assignmnet fri').type).toBe('assignment')
  })
  it('a weekday that is today means today only if still ahead', () => {
    expect(p('MAC reading tue').due).toEqual({ date: '2026-10-13', time: '16:00' }) // MAC meets Tue 16:00
    // Today's 10:15 ODC has passed, so next Tuesday; that's Dussehra, with no class, so all-day.
    expect(p('ODC reading tue').due).toEqual({ date: '2026-10-20', time: undefined })
  })
  it('a time alone is today if ahead, else tomorrow', () => {
    expect(p('call home 9pm').due).toEqual({ date: '2026-10-13', time: '21:00' })
    expect(p('call home 9am').due).toEqual({ date: '2026-10-14', time: '09:00' })
  })
  it('shorthand: eod is end of day', () => {
    expect(p('mac memo eod').due).toEqual({ date: '2026-10-13', time: '23:59' })
  })
  it('a task keyword beats a club', () => {
    expect(p('TEDx report fri')).toMatchObject({ type: 'assignment', club: undefined, title: 'TEDx report' })
  })
})

describe('quick-add parser: forced type', () => {
  it('a tapped pill re-applies that type\'s defaults', () => {
    const d = parse('msm quiz', now, ctx, { type: 'assignment' })
    expect(d.type).toBe('assignment')
    expect(d.due).toBeUndefined() // assignments don't take the next class
    expect(parse('mac fri 4pm', now, ctx, { type: 'extra' })).toMatchObject({ type: 'extra', course: 'MAC', when: { date: '2026-10-16', start: '16:00', end: '17:30' }, venue: 'G-6' })
  })
})

describe('cancelled classes', () => {
  it('"mpi class cancelled tomorrow" points at Wednesday\'s MPI', () => {
    expect(p('mpi class cancelled tomorrow')).toMatchObject({ type: 'cancel', course: 'MPI', when: { date: '2026-10-14', start: '10:15' } })
  })
  it('with no day, it is the course\'s next class', () => {
    const d = p('mpi cancelled')
    expect(d).toMatchObject({ type: 'cancel', course: 'MPI' })
    expect(d.when!.date! >= '2026-10-13').toBe(true)
    expect(ctx.classStarts('MPI', d.when!.date!)).toContain(d.when!.start)
  })
  it('a cancellation wins over other keywords', () => {
    expect(p('mep guest lecture cancelled').type).toBe('cancel')
    expect(p('no class msm fri')).toMatchObject({ type: 'cancel', course: 'MSM', when: { date: '2026-10-16', start: '14:15' } })
  })
  it('without a course it still needs one', () => {
    expect(p('class cancelled tomorrow')).toMatchObject({ type: 'cancel', course: undefined })
  })
})

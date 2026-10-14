import { describe, expect, it } from 'vitest'
import { todayView, type TimelineItem } from '@/domain/timeline'
import { mealsForDate } from '@/domain/meals'
import { referenceData } from '@/data'
import { at, ctx, loader, mark } from './helpers'

const label = (i: TimelineItem) => (i.type === 'class' ? i.session.course : i.type === 'meal' ? i.meal.meal : i.event.title)
const states = (items: TimelineItem[]) => items.map((i) => `${label(i)}:${i.state}`)

describe('Today at fixed clocks (acceptance)', () => {
  it('Wed 14 Oct 08:00: breakfast open, MPI is the island', () => {
    const v = todayView(at('2026-10-14', '08:00'), loader())
    expect(v.mode).toBe('today')
    expect(states(v.items)).toEqual([
      'breakfast:nextMeal', 'MPI:island', 'OM:later', 'lunch:later', 'MSM:later', 'MEP:later', 'snacks:later', 'dinner:later',
    ])
  })

  it('Wed 14 Oct 13:00: OM is the island with marking, lunch open below, breakfast faded', () => {
    const v = todayView(at('2026-10-14', '13:00'), loader())
    expect(states(v.items)).toEqual([
      'breakfast:past', 'MPI:past', 'OM:island', 'lunch:nextMeal', 'MSM:later', 'MEP:later', 'snacks:later', 'dinner:later',
    ])
    const om = v.items.find((i) => i.type === 'class' && i.session.course === 'OM')
    expect(om?.type === 'class' && om.canMark).toBe(true)
    const mpi = v.items.find((i) => i.type === 'class' && i.session.course === 'MPI')
    expect(mpi?.type === 'class' && mpi.canMark).toBe(true) // started, still unmarked
  })

  it('marking a class hides its buttons', () => {
    const v = todayView(at('2026-10-14', '13:00'), loader(ctx([mark('2026-10-14_II_MPI', 'present')])))
    const mpi = v.items.find((i) => i.type === 'class' && i.session.course === 'MPI')
    expect(mpi?.type === 'class' && mpi.canMark).toBe(false)
  })

  it('Wed 14 Oct 19:30: Tomorrow (Thursday) with tonight\'s dinner first', () => {
    const v = todayView(at('2026-10-14', '19:30'), loader())
    expect(v.mode).toBe('tomorrow')
    expect(v.date).toBe('2026-10-15')
    expect(v.tonight?.meal).toBe('dinner')
    expect(v.tonight?.date).toBe('2026-10-14')
    expect(states(v.items)).toEqual(['breakfast:later', 'ODC:island', 'WEC:later', 'lunch:later', 'snacks:later', 'dinner:later'])
  })

  it('after 21:30 the open meal is tomorrow\'s breakfast', () => {
    const v = todayView(at('2026-10-14', '22:00'), loader())
    expect(v.tonight).toBeUndefined()
    expect(states(v.items)[0]).toBe('breakfast:nextMeal')
  })

  it('Tue 20 Oct (Dussehra): meals only', () => {
    const v = todayView(at('2026-10-20', '09:00'), loader())
    expect(v.items.every((i) => i.type === 'meal')).toBe(true)
    expect(states(v.items)[0]).toBe('breakfast:nextMeal')
  })

  it('between meals, the next meal to start is open', () => {
    const v = todayView(at('2026-10-14', '15:00'), loader())
    expect(v.items.find((i) => i.state === 'nextMeal')?.key).toBe('meal-snacks')
    expect(v.items.find((i) => i.state === 'island')?.key).toBe('class-2026-10-14_IV_MSM')
  })

  it('after the last class there is no island', () => {
    const v = todayView(at('2026-10-14', '17:45'), loader())
    expect(v.items.some((i) => i.state === 'island')).toBe(false)
  })

  it('a cancelled class is never the island', () => {
    const v = todayView(at('2026-10-14', '09:00'), loader(ctx([mark('2026-10-14_II_MPI', 'cancelled')])))
    expect(v.items.find((i) => i.state === 'island')?.key).toBe('class-2026-10-14_III_OM')
  })

  it('a club event over a class shows the clash with that course\'s can-miss', () => {
    const ev = { id: 'e1', club: 'SAM', title: 'Weekly meeting', date: '2026-10-14', start: '16:00', end: '17:00', venue: 'LR-3' }
    const v = todayView(at('2026-10-14', '08:00'), loader(ctx([mark('2026-10-12_V_MEP', 'absent'), mark('2026-10-07_V_MEP', 'absent')]), [ev]))
    const club = v.items.find((i) => i.type === 'club')
    expect(club?.type === 'club' && club.clash).toEqual({ course: 'MEP', canMiss: { kind: 'number', value: 2, urgent: false } })
    // At the same minute the class comes before the club event.
    const keys = v.items.map((i) => i.key)
    expect(keys.indexOf('club-e1')).toBe(keys.indexOf('class-2026-10-14_V_MEP') + 1)
  })
})

describe('meals', () => {
  it('Wednesday breakfast with veg / non-veg marks', () => {
    const b = mealsForDate('2026-10-14', referenceData)[0]!
    expect(b.items?.map((i) => `${i.name}:${i.mark}`)).toEqual([
      'Moong Dal Chilla:veg', 'Peanut Garlic Chutney:veg', 'Curd:veg', 'Boiled Eggs:nonveg', 'Fruits:veg',
    ])
  })
  it('sweets and mixed dishes', () => {
    const dinner = mealsForDate('2026-10-14', referenceData)[3]!
    const marks = Object.fromEntries(dinner.items!.map((i) => [i.name, i.mark]))
    expect(marks['Butter Chicken / Mutton Roganjosh']).toBe('nonveg')
    expect(marks['Moong Dal Halwa']).toBe('sweet')
    expect(marks['Shahi Paneer']).toBe('veg')
  })
  it('no menu file: meal times stay, dishes are null', () => {
    const m = mealsForDate('2026-11-16', referenceData)
    expect(m.map((x) => x.start)).toEqual(['08:00', '13:00', '17:00', '20:00'])
    expect(m.every((x) => x.items === null)).toBe(true)
  })
})

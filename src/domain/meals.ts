import { menuFor, type ReferenceData } from '@/data'
import { MEALS, type MealName } from '@/data/types'
import { foodMark, type FoodMark } from './food'
import { weekday } from './time'

/** Mess hours (confirmed 2026-10-12). Used when no menu file covers the date. */
export const DEFAULT_MEAL_TIMES: Record<MealName, { start: string; end: string }> = {
  breakfast: { start: '08:00', end: '10:00' },
  lunch: { start: '13:00', end: '14:30' },
  snacks: { start: '17:00', end: '18:00' },
  dinner: { start: '20:00', end: '21:30' },
}

export const MEAL_LABEL: Record<MealName, string> = {
  breakfast: 'Breakfast',
  lunch: 'Lunch',
  snacks: 'Snacks',
  dinner: 'Dinner',
}

export interface Meal {
  meal: MealName
  date: string
  start: string
  end: string
  /** The day's dishes; null when no menu file covers the date. */
  items: { name: string; mark: FoodMark }[] | null
  /** Served every day (tea, cornflakes...); not shown on Today. */
  always: string[]
}

export function mealsForDate(date: string, data: ReferenceData): Meal[] {
  const menu = menuFor(date, data)
  const day = weekday(date)
  return MEALS.map((meal) => {
    const times = menu?.meal_times[meal] ?? DEFAULT_MEAL_TIMES[meal]
    return {
      meal,
      date,
      start: times.start,
      end: times.end,
      items: menu ? menu.days[day][meal].map((name) => ({ name, mark: foodMark(name) })) : null,
      always: menu?.always_included[meal] ?? [],
    }
  })
}

// Schemas of the bundled reference data in /data. New terms and menus must follow these.
import type { Weekday } from '@/domain/time'

export type FacultyApplies = 'all' | 'pre_midterm' | 'post_midterm'

export interface Course {
  code: string
  name: string
  credits: number
  length: 'full' | 'half'
  total_sessions: number
  runs?: 'pre_midterm' | 'post_midterm'
  faculty: { abbr: string; name: string; applies: FacultyApplies }[]
}

export interface Slot {
  id: string
  start: string
  end: string
}

export interface Timetable {
  schema_version: 1
  term: string
  section: string
  location: { building: string; room: string }
  session_length_minutes: number
  slots: Slot[]
  courses: Course[]
  weekly: { day: Weekday; slot: string; course: string }[]
}

export type MealName = 'breakfast' | 'lunch' | 'snacks' | 'dinner'
export const MEALS: MealName[] = ['breakfast', 'lunch', 'snacks', 'dinner']

export interface Menu {
  schema_version: 1
  valid_from: string
  valid_to: string
  repeats: 'weekly'
  meal_times: Record<MealName, { start: string; end: string }>
  always_included: Record<MealName, string[]>
  days: Record<Weekday, Record<MealName, string[]>>
}

export interface DateRange {
  from: string
  to: string
}

export interface Term {
  id: string
  start: string
  end: string
  last_class_day?: string
  midterm_exams: DateRange
  classes_resume: string
  endterm_exams: DateRange
  no_class_days: (DateRange & { label: string })[]
  events: { date: string; label: string }[]
}

export interface AcademicCalendar {
  schema_version: 1
  terms: Term[]
  breaks: (DateRange & { label: string })[]
}

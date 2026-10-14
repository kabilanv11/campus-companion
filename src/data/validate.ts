// Structural checks for data files, run in unit tests so a bad conversion fails CI, not the app.
import { MEALS } from './types'

const DATE = /^\d{4}-\d{2}-\d{2}$/
const TIME = /^\d{2}:\d{2}$/
const DAYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']

type Obj = Record<string, unknown>
const isObj = (v: unknown): v is Obj => typeof v === 'object' && v !== null && !Array.isArray(v)

function check(errors: string[], cond: boolean, msg: string) {
  if (!cond) errors.push(msg)
}

function checkRange(errors: string[], v: unknown, where: string) {
  check(errors, isObj(v) && DATE.test(String(v.from)) && DATE.test(String(v.to)) && String(v.from) <= String(v.to), `${where}: bad date range`)
}

const DATE_OR_MONTH = /^\d{4}-\d{2}(-\d{2})?$/

function checkEvent(errors: string[], v: unknown, where: string) {
  const ok = isObj(v) && typeof v.label === 'string' && DATE_OR_MONTH.test(String(v.date)) && (v.to === undefined || (DATE.test(String(v.to)) && String(v.to) >= String(v.date)))
  check(errors, ok, `${where}: bad event ${JSON.stringify(v)}`)
}

export function validateTimetable(t: unknown): string[] {
  const e: string[] = []
  if (!isObj(t)) return ['not an object']
  check(e, t.schema_version === 1, 'schema_version must be 1')
  check(e, typeof t.term === 'string', 'term missing')
  check(e, isObj(t.location) && typeof t.location.room === 'string', 'location.room missing')
  check(e, typeof t.session_length_minutes === 'number', 'session_length_minutes missing')
  const slots = Array.isArray(t.slots) ? t.slots : []
  check(e, slots.length > 0, 'slots missing')
  for (const s of slots) check(e, isObj(s) && typeof s.id === 'string' && TIME.test(String(s.start)) && TIME.test(String(s.end)), `bad slot ${JSON.stringify(s)}`)
  const courses = Array.isArray(t.courses) ? t.courses : []
  check(e, courses.length > 0, 'courses missing')
  for (const c of courses) {
    const ok =
      isObj(c) &&
      typeof c.code === 'string' &&
      typeof c.name === 'string' &&
      (c.length === 'full' || c.length === 'half') &&
      typeof c.total_sessions === 'number' &&
      Array.isArray(c.faculty) &&
      c.faculty.every((f) => isObj(f) && typeof f.name === 'string' && ['all', 'pre_midterm', 'post_midterm'].includes(String(f.applies)))
    check(e, ok, `bad course ${isObj(c) ? String(c.code) : '?'}`)
  }
  const codes = new Set(courses.map((c) => (isObj(c) ? c.code : null)))
  const slotIds = new Set(slots.map((s) => (isObj(s) ? s.id : null)))
  for (const w of Array.isArray(t.weekly) ? t.weekly : []) {
    check(e, isObj(w) && DAYS.includes(String(w.day)) && slotIds.has(w.slot) && codes.has(w.course), `bad weekly entry ${JSON.stringify(w)}`)
  }
  check(e, Array.isArray(t.weekly) && t.weekly.length > 0, 'weekly missing')
  return e
}

export function validateMenu(m: unknown): string[] {
  const e: string[] = []
  if (!isObj(m)) return ['not an object']
  check(e, m.schema_version === 1, 'schema_version must be 1')
  check(e, DATE.test(String(m.valid_from)) && DATE.test(String(m.valid_to)), 'valid_from/valid_to must be dates')
  check(e, isObj(m.meal_times) && MEALS.every((k) => isObj((m.meal_times as Obj)[k]) && TIME.test(String(((m.meal_times as Obj)[k] as Obj).start))), 'meal_times incomplete')
  check(e, isObj(m.always_included) && MEALS.every((k) => Array.isArray((m.always_included as Obj)[k])), 'always_included incomplete')
  check(e, isObj(m.days), 'days missing')
  if (isObj(m.days)) {
    for (const d of DAYS) {
      const day = m.days[d]
      check(e, isObj(day) && MEALS.every((k) => Array.isArray(day[k]) && (day[k] as unknown[]).every((x) => typeof x === 'string')), `days.${d} incomplete`)
    }
  }
  return e
}

export function validateCalendar(c: unknown): string[] {
  const e: string[] = []
  if (!isObj(c)) return ['not an object']
  check(e, c.schema_version === 1, 'schema_version must be 1')
  const terms = Array.isArray(c.terms) ? c.terms : []
  check(e, terms.length > 0, 'terms missing')
  for (const t of terms) {
    if (!isObj(t)) { e.push('bad term'); continue }
    const id = String(t.id)
    check(e, DATE.test(String(t.start)) && DATE.test(String(t.end)), `term ${id}: start/end`)
    checkRange(e, t.midterm_exams, `term ${id} midterm_exams`)
    checkRange(e, t.endterm_exams, `term ${id} endterm_exams`)
    check(e, DATE.test(String(t.classes_resume)), `term ${id}: classes_resume`)
    for (const n of Array.isArray(t.no_class_days) ? t.no_class_days : []) checkRange(e, n, `term ${id} no_class_days`)
    check(e, Array.isArray(t.events), `term ${id}: events missing`)
    for (const ev of Array.isArray(t.events) ? t.events : []) checkEvent(e, ev, `term ${id} events`)
  }
  for (const ev of Array.isArray(c.after_terms) ? c.after_terms : []) checkEvent(e, ev, 'after_terms')
  for (const b of Array.isArray(c.breaks) ? c.breaks : []) checkRange(e, b, 'breaks')
  return e
}

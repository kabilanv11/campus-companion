// The + line parser: one typed line becomes a draft task, class or club event.
// Rules and the test table live in docs/quick-add-rules.md; this file follows its sections.
// Keep it behind parse(text, now, ctx) so an AI parser can replace it in v2.
import * as chrono from 'chrono-node'
import type { TaskType } from '@/db/schema'
import { addDays, fromMinutes, istDate, istMinutes, toMinutes, weekStart, weekday } from './time'

export type EventType = 'extra' | 'guest' | 'club'
/** 'cancel' marks an existing class as cancelled instead of adding anything. */
export type DraftType = TaskType | EventType | 'cancel'

export const TYPE_LABEL: Record<DraftType, string> = {
  assignment: 'Assignment',
  quiz: 'Quiz',
  reading: 'Reading',
  exam: 'Exam',
  extra: 'Extra class',
  guest: 'Guest lecture',
  club: 'Club event',
  cancel: 'Cancelled',
  other: 'Other',
}
export const TYPE_ORDER: DraftType[] = ['assignment', 'quiz', 'reading', 'exam', 'extra', 'guest', 'club', 'cancel', 'other']
export const isEventType = (t: DraftType): t is EventType => t === 'extra' || t === 'guest' || t === 'club'

export interface Draft {
  type: DraftType
  course?: string
  club?: string
  title: string
  due?: { date: string; time?: string }
  when?: { date?: string; start?: string; end?: string }
  venue?: string
  /** Extra class typed as "makeup" is stored as a makeup session. */
  makeup?: boolean
}

export interface ParseContext {
  courses: { code: string; name: string }[]
  courseAliases: Record<string, string[]>
  clubs: { code: string; name: string }[]
  clubAliases: Record<string, string[]>
  places: Record<string, string>
  /** Start times of a course's sessions (not cancelled) on a date. */
  classStarts: (course: string, date: string) => string[]
  /** The course's room in force on a date. */
  roomFor: (course: string, date: string) => string
  /** First day of the mid-term / end-term exam window of the term containing the date. */
  examWindow: (kind: 'midterm' | 'endterm', date: string) => string | undefined
}

// ── 2. Tokens ───────────────────────────────────────────────────────────────

interface Token {
  raw: string // as typed, for the title
  norm: string // lowercase matching copy, after shorthand expansion
  used?: 'type' | 'keyword' | 'course' | 'club' | 'date' | 'venue' // 'type' stays in the title, the rest don't
  protectedNum?: boolean
}

const SHORTHAND: Record<string, string> = {
  tmrw: 'tomorrow', tmr: 'tomorrow', tmrow: 'tomorrow', '2mrw': 'tomorrow', tom: 'tomorrow',
  tdy: 'today', nxt: 'next', eod: '11:59pm', tonight: '11:59pm', midnight: '11:59pm',
}

function tokenize(text: string): Token[] {
  return text
    .split(/\s+/)
    .map((raw) => raw.replace(/^[,.;!]+|[,.;!]+$/g, ''))
    .filter(Boolean)
    .map((raw) => {
      const lower = raw.toLowerCase()
      return { raw, norm: SHORTHAND[lower] ?? lower }
    })
}

const NUMBERING = new Set(['ch', 'chapter', 'assignment', 'asgn', 'quiz', 'case', 'module', 'unit', 'part', 'no.', 'no', '#', 'q', 'set'])

function protectNumbering(toks: Token[]) {
  toks.forEach((t, i) => {
    const prev = toks[i - 1]
    if (prev && NUMBERING.has(prev.norm) && /^\d+[a-z]?$/.test(t.norm)) t.protectedNum = true
  })
}

const free = (t?: Token) => !!t && !t.used && !t.protectedNum

/** Finds a phrase (space-separated words) on consecutive free tokens; returns the start index. */
function findPhrase(toks: Token[], phrase: string, match: (tok: string, word: string) => boolean = (a, b) => a === b): number {
  const words = phrase.split(' ')
  for (let i = 0; i + words.length <= toks.length; i++) {
    if (words.every((w, j) => free(toks[i + j]) && match(toks[i + j]!.norm, w))) return i
  }
  return -1
}

// ── Edit distance (Damerau-Levenshtein, optimal string alignment) ───────────

export function editDistance(a: string, b: string): number {
  const d = Array.from({ length: a.length + 1 }, (_, i) => Array.from({ length: b.length + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0)))
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1
      let v = Math.min(d[i - 1]![j]! + 1, d[i]![j - 1]! + 1, d[i - 1]![j - 1]! + cost)
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) v = Math.min(v, d[i - 2]![j - 2]! + 1)
      d[i]![j] = v
    }
  }
  return d[a.length]![b.length]!
}

const plural = (tok: string, word: string) => tok === word || tok === `${word}s` || tok === `${word}es`

// ── 4. Type keywords ────────────────────────────────────────────────────────

const KEYWORDS: [DraftType, string[]][] = [
  ['assignment', ['case analysis', 'case writeup', 'case write-up', 'assignment', 'assgn', 'asgn', 'assn', 'hw', 'homework', 'submission', 'submit', 'deliverable', 'write-up', 'writeup', 'report', 'memo', 'essay', 'project', 'ppt', 'deck', 'presentation']],
  ['quiz', ['class test', 'quiz', 'quizz', 'qz', 'test', 'viva']],
  ['reading', ['pre-read', 'preread', 'reading', 'read', 'chapter', 'ch', 'article', 'case']],
  ['exam', ['mid term', 'end term', 'midterm', 'mid-term', 'mt', 'endterm', 'end-term', 'et', 'final', 'exam']],
  ['extra', ['extra class', 'extra session', 'comp class', 'rescheduled class', 'make up', 'makeup', 'make-up', 'compensatory']],
  ['guest', ['guest lecture', 'guest session', 'guest talk', 'guest', 'gl']],
]
// A cancellation wins over any other keyword: "mep guest lecture cancelled" cancels that lecture.
const CANCEL_WORDS = ['no class', 'called off', 'cancelled', 'canceled', 'cancel', 'cancellation']
const DELIVERABLE = new Set(['writeup', 'write-up', 'analysis', 'report', 'memo', 'deck'])
const MIDTERM = new Set(['mid term', 'midterm', 'mid-term', 'mt'])
const ENDTERM = new Set(['end term', 'endterm', 'end-term', 'et', 'final'])
const MAKEUP = new Set(['make up', 'makeup', 'make-up', 'compensatory', 'rescheduled class', 'comp class'])

interface TypeHit {
  type: DraftType
  index: number
  length: number
  keyword: string
}

function findType(toks: Token[]): TypeHit | undefined {
  let best: TypeHit | undefined
  for (const [type, words] of KEYWORDS) {
    for (const kw of words) {
      const n = kw.split(' ').length
      const fuzzy = n === 1 && kw.length >= 6
      const i = findPhrase(toks, kw, (tok, w) => plural(tok, w) || (fuzzy && editDistance(tok, w) <= 1))
      if (i < 0) continue
      // Earliest keyword wins; at the same token, the longer phrase.
      if (!best || i < best.index || (i === best.index && n > best.length)) best = { type, index: i, length: n, keyword: kw }
    }
  }
  for (const kw of CANCEL_WORDS) {
    const i = findPhrase(toks, kw, (tok, w) => tok === w)
    if (i >= 0) return { type: 'cancel', index: i, length: kw.split(' ').length, keyword: kw }
  }
  if (!best) return undefined
  // "case" with a deliverable word in the line is an assignment, not case prep.
  if (best.keyword === 'case' && toks.some((t, i) => i !== best!.index && DELIVERABLE.has(t.norm))) best = { ...best, type: 'assignment' }
  return best
}

// ── 3. Courses ──────────────────────────────────────────────────────────────

const clean = (s: string) => s.toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9 ]+/g, ' ').replace(/\s+/g, ' ').trim()

interface Hit {
  code: string
  index: number
  length: number
}

function findCourse(toks: Token[], ctx: ParseContext): Hit | undefined {
  const hits: Hit[] = []
  for (const c of ctx.courses) {
    const code = c.code.toLowerCase()
    // Section suffixes are ignored: MAC(D), mac-d, macd.
    const variants = [code, `${code}(d)`, `${code}-d`, `${code}d`]
    toks.forEach((t, i) => free(t) && variants.includes(t.norm) && hits.push({ code: c.code, index: i, length: 1 }))
    const phrases = [...(ctx.courseAliases[c.code] ?? []), clean(c.name)].sort((a, b) => b.split(' ').length - a.split(' ').length)
    for (const p of phrases) {
      const i = findPhrase(toks, p, (tok, w) => clean(tok) === w)
      if (i >= 0) hits.push({ code: c.code, index: i, length: p.split(' ').length })
    }
  }
  // Typos: single-word aliases of 5+ letters, one edit (two at 9+), only when one course is in range.
  toks.forEach((t, i) => {
    if (!free(t) || t.norm.length < 5) return
    const near = new Set<string>()
    for (const c of ctx.courses) {
      for (const a of ctx.courseAliases[c.code] ?? []) {
        if (a.includes(' ') || a.length < 5) continue
        const max = a.length >= 9 ? 2 : 1
        if (editDistance(t.norm, a) <= max) near.add(c.code)
      }
    }
    if (near.size === 1) hits.push({ code: [...near][0]!, index: i, length: 1 })
  })
  return hits.sort((a, b) => a.index - b.index || b.length - a.length)[0]
}

// ── 5. Clubs ────────────────────────────────────────────────────────────────

function findClub(toks: Token[], ctx: ParseContext): Hit | undefined {
  const hits: Hit[] = []
  for (const c of ctx.clubs) {
    const names = new Set([...(ctx.clubAliases[c.code] ?? []), clean(c.name), clean(c.name).replace(/ /g, ''), c.code.toLowerCase()])
    for (const n of [...names].sort((a, b) => b.split(' ').length - a.split(' ').length)) {
      const i = findPhrase(toks, n, (tok, w) => clean(tok) === w)
      if (i >= 0) hits.push({ code: c.code, index: i, length: n.split(' ').length })
    }
  }
  return hits.sort((a, b) => a.index - b.index || b.length - a.length)[0]
}

// ── 7. Dates and times ──────────────────────────────────────────────────────

interface DateHit {
  date?: string
  /** A weekday with no date: resolved after defaults (today only if still ahead). */
  weekday?: number
  nextWeek?: boolean
  time?: string
  end?: string
}

const WEEKDAY_NUM = { sun: 0, mon: 1, tue: 2, wed: 3, thu: 4, fri: 5, sat: 6 } as const

function bareHour(h: number): number {
  if (h >= 1 && h <= 7) return h + 12
  return h // 8–11 morning, 12 noon
}

function findDate(toks: Token[], now: Date): DateHit | undefined {
  // Build chrono's input from free tokens only; remember where each token sits.
  const starts: number[] = []
  let text = ''
  toks.forEach((t) => {
    starts.push(text.length)
    text += (free(t) ? t.norm : ' '.repeat(t.norm.length)) + ' '
  })
  const ref = { instant: now, timezone: 330 }
  const results = chrono.en.GB.parse(text, ref, { forwardDate: true }).filter((r) => {
    const s = r.start
    const hasDateWord = s.isCertain('day') || s.isCertain('weekday') || s.isCertain('month')
    // A bare number is never a date or time on its own.
    return hasDateWord || s.isCertain('meridiem') || /:/.test(r.text) || !/^\d+$/.test(r.text.trim())
  })
  const r = results[0]
  if (!r) return undefined

  const covered = (i: number) => starts[i]! < r.index + r.text.length && starts[i]! + toks[i]!.norm.length > r.index
  let lastIdx = -1
  toks.forEach((t, i) => {
    if (free(t) && covered(i)) {
      t.used = 'date'
      lastIdx = i
    }
  })

  const s = r.start
  const hit: DateHit = {}
  if (s.isCertain('day')) {
    hit.date = istDate(s.date())
  } else if (s.isCertain('weekday')) {
    hit.weekday = s.get('weekday') ?? undefined
    hit.nextWeek = /\bnext\b/.test(r.text)
  }
  const fixTime = (c: typeof s) => {
    let h = c.get('hour') ?? 0
    if (!c.isCertain('meridiem') && h <= 12) h = bareHour(h)
    return fromMinutes(h * 60 + (c.get('minute') ?? 0))
  }
  if (s.isCertain('hour')) hit.time = fixTime(s)
  if (r.end?.isCertain('hour')) {
    hit.end = fixTime(r.end)
    // "4-6pm": chrono may leave the start without a meridiem; keep it before the end.
    if (hit.time && hit.end && hit.time > hit.end) hit.time = fromMinutes(toMinutes(hit.time) - 12 * 60)
  }

  // "wed 4": a bare hour right after a date word.
  const after = toks[lastIdx + 1]
  if (!hit.time && (hit.date || hit.weekday !== undefined) && free(after) && /^\d{1,2}$/.test(after!.norm)) {
    const h = Number(after!.norm)
    if (h >= 1 && h <= 12) {
      hit.time = fromMinutes(bareHour(h) * 60)
      after!.used = 'date'
    }
  }
  return hit.date || hit.weekday !== undefined || hit.time ? hit : undefined
}

/** Resolves a weekday to a date. `ahead(date)` says whether the item would still be ahead on that date. */
function resolveWeekday(hit: DateHit, today: string, ahead: (date: string) => boolean): string {
  const wd = hit.weekday!
  const todayNum = WEEKDAY_NUM[weekday(today)]
  if (hit.nextWeek) return addDays(weekStart(today), 7 + ((wd + 6) % 7))
  if (wd === todayNum) return ahead(today) ? today : addDays(today, 7)
  return addDays(today, (wd - todayNum + 7) % 7)
}

// ── 8. Venue ────────────────────────────────────────────────────────────────

const ROOM = /^[a-z]{1,3}-?\d{1,3}$/
const titleCase = (s: string) =>
  s
    .split(' ')
    .map((w, i) => (ROOM.test(w.toLowerCase()) ? w.toUpperCase() : i === 0 ? w.charAt(0).toUpperCase() + w.slice(1) : w))
    .join(' ')

function findVenue(toks: Token[], ctx: ParseContext): string | undefined {
  // Text after in / at / @, up to the next used span.
  const k = toks.findIndex((t) => free(t) && ['in', 'at', '@'].includes(t.norm))
  if (k >= 0) {
    const parts: Token[] = []
    for (let i = k + 1; i < toks.length && free(toks[i]); i++) parts.push(toks[i]!)
    if (parts.length) {
      toks[k]!.used = 'venue'
      parts.forEach((p) => (p.used = 'venue'))
      const joined = parts.map((p) => p.norm).join(' ')
      return ctx.places[joined] ?? titleCase(parts.map((p) => p.raw.toLowerCase()).join(' '))
    }
  }
  // Known places (longest first), then a room-like token.
  for (const name of Object.keys(ctx.places).sort((a, b) => b.split(' ').length - a.split(' ').length)) {
    const i = findPhrase(toks, name)
    if (i >= 0) {
      for (let j = 0; j < name.split(' ').length; j++) toks[i + j]!.used = 'venue'
      // "tagore hall": also swallow a trailing "hall".
      if (toks[i + 1]?.norm === 'hall' && free(toks[i + 1])) toks[i + 1]!.used = 'venue'
      return ctx.places[name]
    }
  }
  const room = toks.find((t) => free(t) && ROOM.test(t.norm))
  if (room) {
    room.used = 'venue'
    return room.raw.toUpperCase()
  }
  return undefined
}

// ── 6. Title ────────────────────────────────────────────────────────────────

const CONNECTORS = new Set(['due', 'by', 'on', 'before', 'till', 'until', 'for', 'at', '@', 'in', 'the', '-', ':'])

function buildTitle(toks: Token[]): string {
  const keep = toks.map((t) => !t.used || t.used === 'type')
  let changed = true
  while (changed) {
    changed = false
    for (let i = 0; i < toks.length; i++) {
      if (!keep[i] || !CONNECTORS.has(toks[i]!.norm) || toks[i]!.used === 'type') continue
      const prevKept = keep.slice(0, i).lastIndexOf(true)
      const nextKept = keep.indexOf(true, i + 1)
      const nextToRemoved = (i > 0 && !keep[i - 1]) || (i < toks.length - 1 && !keep[i + 1])
      if (nextToRemoved || prevKept < 0 || nextKept < 0) {
        keep[i] = false
        changed = true
      }
    }
  }
  const words = toks.filter((_, i) => keep[i]).map((t) => t.raw)
  const title = words.join(' ').trim()
  return title.charAt(0).toUpperCase() + title.slice(1)
}

// ── Pipeline ────────────────────────────────────────────────────────────────

/** `opts.type` forces the type (a tapped pill); defaults are then applied for that type. */
export function parse(text: string, now: Date, ctx: ParseContext, opts: { type?: DraftType } = {}): Draft {
  const today = istDate(now)
  const nowMin = istMinutes(now)
  const toks = tokenize(text)
  protectNumbering(toks)

  // 4. Type keyword. Keyword tokens stay in the title.
  const typeHit = findType(toks)
  // Task keywords stay in the title ("Assignment 2"); class keywords don't ("makeup" → "Extra class").
  if (typeHit) for (let j = 0; j < typeHit.length; j++) toks[typeHit.index + j]!.used = isEventType(typeHit.type) || typeHit.type === 'cancel' ? 'keyword' : 'type'

  // 3. Course, then 5. club (only when no course).
  const courseHit = findCourse(toks, ctx)
  if (courseHit) for (let j = 0; j < courseHit.length; j++) toks[courseHit.index + j]!.used = 'course'
  const taskKeyword = typeHit && !isEventType(typeHit.type)
  let clubHit = !courseHit && !taskKeyword && typeHit?.type !== 'extra' && typeHit?.type !== 'guest' ? findClub(toks, ctx) : undefined
  if (clubHit) for (let j = 0; j < clubHit.length; j++) toks[clubHit.index + j]!.used = 'club'

  let type: DraftType | undefined = typeHit?.type ?? (clubHit ? 'club' : undefined)
  const meetingIdx = toks.findIndex((t) => free(t) && ['meeting', 'meet', 'event'].includes(t.norm))
  if (!type && !courseHit && meetingIdx >= 0) {
    type = 'club'
    toks[meetingIdx]!.used = 'type'
  }

  // 7. Date and time.
  const dt = findDate(toks, now)

  if (!type && courseHit && dt?.time && toks.some((t) => ['class', 'session', 'lecture'].includes(t.norm))) type = 'extra'
  type ??= 'other'
  if (opts.type) type = opts.type
  if (type !== 'club') clubHit = undefined

  // 8. Venue, events only.
  const venue = isEventType(type) ? findVenue(toks, ctx) : undefined

  const course = courseHit?.code
  const club = clubHit?.code
  const draft: Draft = { type, course, club, title: buildTitle(toks) || (type === 'club' && club ? clubName(club, ctx) : TYPE_LABEL[type]) }
  if (type === 'extra' && typeHit && MAKEUP.has(typeHit.keyword)) draft.makeup = true

  // 9. Defaults.
  if (type === 'cancel') {
    draft.title = TYPE_LABEL.cancel
    draft.when = cancelTarget(course, dt, today, nowMin, ctx)
    return draft
  }
  if (isEventType(type)) {
    const ahead = (date: string) => date > today || (!!dt?.time && toMinutes(dt.time) > nowMin) || !dt?.time
    let date = dt?.date ?? (dt?.weekday !== undefined ? resolveWeekday(dt, today, ahead) : undefined)
    if (!date && dt?.time) date = toMinutes(dt.time) > nowMin ? today : addDays(today, 1)
    const length = type === 'club' ? 60 : 90
    const start = dt?.time
    const end = start ? (type === 'club' && dt?.end ? dt.end : fromMinutes(toMinutes(start) + length)) : undefined
    draft.when = { date, start, end }
    draft.venue = venue ?? (type !== 'club' && course && date ? ctx.roomFor(course, date) : undefined)
    return draft
  }

  const classOn = (date: string) => (course ? ctx.classStarts(course, date)[0] : undefined)
  const takesClassTime = type === 'reading' || type === 'quiz'
  const timeFor = (date: string) => dt?.time ?? (takesClassTime ? classOn(date) : undefined)
  // All-day items stay ahead for the rest of the day.
  const aheadOn = (date: string) => {
    const t = timeFor(date)
    return date > today || !t || toMinutes(t) > nowMin
  }

  let date = dt?.date ?? (dt?.weekday !== undefined ? resolveWeekday(dt, today, aheadOn) : undefined)
  if (!date && dt?.time) date = toMinutes(dt.time) > nowMin ? today : addDays(today, 1)

  if (!date && takesClassTime && course) {
    // The next class of that course after now.
    for (let d = today, n = 0; n < 60; n++, d = addDays(d, 1)) {
      const start = ctx.classStarts(course, d).find((s) => d > today || toMinutes(s) > nowMin)
      if (start) {
        draft.due = { date: d, time: start }
        return draft
      }
    }
  }
  if (!date && type === 'exam' && typeHit) {
    const kind = MIDTERM.has(typeHit.keyword) ? 'midterm' : ENDTERM.has(typeHit.keyword) ? 'endterm' : undefined
    const from = kind && ctx.examWindow(kind, today)
    if (from) date = from
  }
  if (date) draft.due = { date, time: timeFor(date) }
  return draft
}

/** The class a cancellation points at: the named day (and time, if it matches), else the course's next class still to finish. */
function cancelTarget(course: string | undefined, dt: DateHit | undefined, today: string, nowMin: number, ctx: ParseContext): Draft['when'] {
  if (!course) return dt?.date ? { date: dt.date } : undefined
  const pick = (date: string) => {
    const starts = ctx.classStarts(course, date)
    return (dt?.time && starts.find((s) => s === dt.time)) || starts[0]
  }
  const date = dt?.date ?? (dt?.weekday !== undefined ? resolveWeekday(dt, today, (d) => ctx.classStarts(course, d).some((s) => toMinutes(s) + 90 > nowMin)) : undefined)
  if (date) return { date, start: pick(date) }
  for (let d = today, n = 0; n < 60; n++, d = addDays(d, 1)) {
    const start = ctx.classStarts(course, d).find((s) => d > today || toMinutes(s) + 90 > nowMin)
    if (start) return { date: d, start }
  }
  return undefined
}

function clubName(code: string, ctx: ParseContext) {
  return ctx.clubs.find((c) => c.code === code)?.name ?? code
}

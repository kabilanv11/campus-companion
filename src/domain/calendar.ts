import type { AcademicCalendar, Term } from '@/data/types'
import { inRange } from './time'

export type NoClassReason =
  | { kind: 'holiday'; label: string } // a no_class_days entry that isn't an exam
  | { kind: 'exams'; label: string }
  | { kind: 'break'; label: string } // winter break, Deepawali break, between mid-terms and classes_resume
  | { kind: 'outside-term' } // before the term, after the last class day, or no term at all

export function termOf(date: string, cal: AcademicCalendar): Term | undefined {
  return cal.terms.find((t) => date >= t.start && date <= t.end)
}

/** Why there are no regular classes on a date, or null when classes run. Sundays aren't covered here. */
export function noClassReason(date: string, cal: AcademicCalendar): NoClassReason | null {
  const brk = cal.breaks.find((b) => inRange(date, b))
  if (brk) return { kind: 'break', label: brk.label }

  const term = termOf(date, cal)
  if (!term) return { kind: 'outside-term' }

  if (inRange(date, term.midterm_exams)) return { kind: 'exams', label: 'Mid-term exams' }
  if (inRange(date, term.endterm_exams)) return { kind: 'exams', label: 'End-term exams' }

  const listed = term.no_class_days.find((n) => inRange(date, n))
  if (listed) {
    return /exam/i.test(listed.label) ? { kind: 'exams', label: listed.label } : { kind: /break/i.test(listed.label) ? 'break' : 'holiday', label: listed.label }
  }

  if (date > term.midterm_exams.to && date < term.classes_resume) return { kind: 'break', label: 'Mid-term break' }
  if (term.last_class_day && date > term.last_class_day) return { kind: 'outside-term' }
  return null
}

/** True from the mid-term exams onward: post-midterm faculty apply and half-term courses have ended. */
export function isPostMidterm(date: string, term: Term): boolean {
  return date >= term.midterm_exams.from
}

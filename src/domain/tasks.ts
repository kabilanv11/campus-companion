import type { Task, TaskType } from '@/db/schema'
import { addDays, istDate, weekEnd, weekStart } from './time'

/** Days before the due date that a task moves into Needs you (confirmed 2026-10-12). */
export const LEAD_DAYS: Record<TaskType, number> = {
  reading: 1,
  quiz: 2,
  assignment: 3,
  exam: 7,
  other: 1,
}

/** The date a task starts showing in Needs you. */
export function showsFrom(task: Pick<Task, 'due' | 'type'>): string | undefined {
  return task.due && addDays(task.due, -LEAD_DAYS[task.type])
}

export function isOverdue(task: Pick<Task, 'due' | 'doneAt'>, today: string): boolean {
  return !task.doneAt && !!task.due && task.due < today
}

export function inNeedsYou(task: Pick<Task, 'due' | 'type' | 'doneAt'>, today: string): boolean {
  const from = showsFrom(task)
  return !task.doneAt && !!from && from <= today
}

/** Overdue first, then by due date and time; all-day tasks sort after timed ones on the same day. */
export function byUrgency(today: string) {
  return (a: Task, b: Task) => {
    const ao = isOverdue(a, today) ? 0 : 1
    const bo = isOverdue(b, today) ? 0 : 1
    return ao - bo || (a.due ?? '9999').localeCompare(b.due ?? '9999') || (a.dueTime ?? '24:00').localeCompare(b.dueTime ?? '24:00') || a.createdAt.localeCompare(b.createdAt)
  }
}

export function needsYou(tasks: Task[], today: string): Task[] {
  return tasks.filter((t) => inNeedsYou(t, today)).sort(byUrgency(today))
}

export interface TaskGroups {
  overdue: Task[]
  today: Task[]
  thisWeek: Task[]
  later: Task[]
  doneThisWeek: Task[]
}

/** Build spec 6.4: the Tasks screen's sections. */
export function groupTasks(tasks: Task[], today: string): TaskGroups {
  const sunday = weekEnd(today)
  const monday = weekStart(today)
  const sort = byUrgency(today)
  const open = tasks.filter((t) => !t.doneAt).sort(sort)
  return {
    overdue: open.filter((t) => t.due && t.due < today),
    today: open.filter((t) => t.due === today),
    thisWeek: open.filter((t) => t.due && t.due > today && t.due <= sunday),
    later: open.filter((t) => !t.due || t.due > sunday),
    doneThisWeek: tasks
      .filter((t) => t.doneAt && istDate(new Date(t.doneAt)) >= monday)
      .sort((a, b) => (b.doneAt ?? '').localeCompare(a.doneAt ?? '')),
  }
}

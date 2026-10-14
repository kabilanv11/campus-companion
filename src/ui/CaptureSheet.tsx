import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { courseInfo, referenceData, termFor, timetableFor } from '@/data'
import { deleteTask, missingField, saveDraft } from '@/db/actions'
import { useUserData } from '@/db/hooks'
import type { Task } from '@/db/schema'
import { attendanceByCourse, canMissDisplay } from '@/domain/attendance'
import { parse, TYPE_LABEL, TYPE_ORDER, isEventType, type Draft, type DraftType } from '@/domain/parse'
import { parseContext } from '@/domain/parseContext'
import { sessionsForDate } from '@/domain/sessions'
import { showsFrom } from '@/domain/tasks'
import { istDate, shortTime } from '@/domain/time'
import { Sheet, SheetContent, SheetDescription, SheetTitle } from '@/components/ui/sheet'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { now as clockNow } from '@/lib/clock'
import { clockLabel, dayLabel, dayNum, dayShort, monthShort } from '@/lib/format'
import { undoToast } from '@/lib/toast'
import { cn } from '@/lib/utils'
import { ClubSquare, CourseDot, UrgentPill } from '@/ui/marks'

export interface CaptureRequest {
  text?: string
  /** Editing a saved task: every saved field starts locked. */
  task?: Task
}

/** Fields he has set by hand. They stick while he keeps typing (quick-add rules 10). */
type Locks = Partial<Pick<Draft, 'type' | 'course' | 'club' | 'due' | 'when' | 'venue'>>

const fullDate = (date: string) => `${dayShort(date)} ${dayNum(date)} ${monthShort(date)}`

function locksFromTask(t: Task): Locks {
  return { type: t.type, course: t.course, due: t.due ? { date: t.due, time: t.dueTime } : undefined }
}

// design.md Capture Sheet: one line, parsed rows live underneath, every type one tap away.
export function CaptureSheet({ open, request, onOpenChange }: { open: boolean; request: CaptureRequest; onOpenChange: (open: boolean) => void }) {
  const user = useUserData()
  const [text, setText] = useState('')
  const [locks, setLocks] = useState<Locks>({})
  const [openField, setOpenField] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!open) return
    setText(request.task?.title ?? request.text ?? '')
    setLocks(request.task ? locksFromTask(request.task) : {})
    setOpenField(null)
  }, [open, request])

  const now = clockNow()
  const today = istDate(now)
  const ctx = useMemo(() => user && parseContext(referenceData, user.sessions, user.overrides, user.clubs), [user])

  const draft: Draft | null = useMemo(() => {
    if (!ctx) return null
    const parsed = parse(text, now, ctx, { type: locks.type })
    const d: Draft = { ...parsed, ...locks }
    if ('course' in locks && !locks.course) delete d.course
    return d
    // `now` only matters to the minute; re-parsing on text and locks is enough.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text, locks, ctx])

  if (!draft || !user || !ctx) return null

  const lock = (patch: Locks) => {
    setLocks((l) => ({ ...l, ...patch }))
    setOpenField(null)
  }

  const add = async () => {
    const missing = missingField(draft)
    if (missing) {
      setOpenField(missing)
      return
    }
    if (!text.trim() && !request.task) return
    await saveDraft(draft, request.task?.id)
    onOpenChange(false)
  }

  const remove = async () => {
    if (!request.task) return
    const undo = await deleteTask(request.task.id)
    onOpenChange(false)
    undoToast('Task deleted', undo)
  }

  const event = isEventType(draft.type)
  // The picker lists courses running now; typing still matches any term's course.
  const term = termFor(today)
  const runningCourses = (timetableFor(today)?.courses ?? []).filter((c) => c.length !== 'half' || !term || today < term.midterm_exams.from)
  const types = [draft.type, ...TYPE_ORDER.filter((t) => t !== draft.type)]

  // Clash: an event over a class that day shows that course's live can-miss.
  let clash: { course: string; text: string } | undefined
  if (event && draft.when?.date && draft.when.start) {
    const end = draft.when.end ?? draft.when.start
    const sessions = sessionsForDate(draft.when.date, { data: referenceData, stored: user.sessions, overrides: user.overrides })
    const hit = sessions.find((s) => s.status !== 'cancelled' && s.course !== draft.course && s.start < end && draft.when!.start! < s.end)
    if (hit) {
      const a = attendanceByCourse(draft.when.date, { data: referenceData, stored: user.sessions, overrides: user.overrides }).get(hit.course)
      const c = a && canMissDisplay(a.canMiss)
      const t = !c ? '' : c.kind === 'number' ? ` · can miss ${c.value}` : c.kind === 'cantMiss' ? ' · can’t miss' : ` · short by ${c.by}`
      clash = { course: hit.course, text: `Clashes with ${hit.course}${t}` }
    }
  }

  const from = !event && draft.due ? showsFrom({ due: draft.due.date, type: draft.type as Task['type'] }) : undefined

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent aria-describedby={undefined} onOpenAutoFocus={(e) => (e.preventDefault(), inputRef.current?.focus())}>
        <SheetTitle className="sr-only">{request.task ? 'Edit task' : 'Add'}</SheetTitle>
        <SheetDescription className="sr-only">Type one line, like “mac assignment 2 due fri 11pm”.</SheetDescription>
        <input
          ref={inputRef}
          aria-label="What to add"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && add()}
          placeholder="mac assignment 2 due fri 11pm"
          enterKeyHint="done"
          className="w-full border-b-2 border-brand bg-transparent pt-2.5 pb-3 text-[16px] text-ink outline-none placeholder:text-ink-3"
        />

        <dl className="grid gap-3.5">
          {draft.type === 'club' ? (
            <Row label="Club">
              <Choice
                id="club"
                openField={openField}
                setOpenField={setOpenField}
                value={draft.club ? <span className="inline-flex items-center gap-2"><ClubSquare code={draft.club} />{user.clubs.find((c) => c.code === draft.club)?.name ?? draft.club}</span> : null}
                options={user.clubs.map((c) => ({ key: c.code, label: c.name, onPick: () => lock({ club: c.code }) }))}
              />
            </Row>
          ) : (
            <Row label="Course">
              <Choice
                id="course"
                openField={openField}
                setOpenField={setOpenField}
                required={draft.type === 'extra' || draft.type === 'guest'}
                value={
                  draft.course ? (
                    <span className="grid gap-1">
                      <span className="inline-flex items-center gap-2 font-medium"><CourseDot code={draft.course} />{draft.course}</span>
                      <span className="text-name">{courseInfo(draft.course)?.name}</span>
                    </span>
                  ) : null
                }
                options={[
                  ...runningCourses.map((c) => ({ key: c.code, label: `${c.code} · ${c.name}`, onPick: () => lock({ course: c.code }) })),
                  ...(event ? [] : [{ key: 'none', label: 'No course', onPick: () => lock({ course: undefined }) }]),
                ]}
              />
            </Row>
          )}

          {event ? (
            <>
              <Row label="When">
                <DateTimeChoice
                  id="when"
                  openField={openField}
                  setOpenField={setOpenField}
                  date={draft.when?.date}
                  time={draft.when?.start}
                  required
                  label={draft.when?.date ? `${fullDate(draft.when.date)}${draft.when.start ? `, ${shortTime(draft.when.start)} – ${shortTime(draft.when.end ?? draft.when.start)}` : ''}` : null}
                  onPick={(date, time) => {
                    const length = draft.type === 'club' ? 60 : 90
                    const end = time ? `${String(Math.floor((toMin(time) + length) / 60)).padStart(2, '0')}:${String((toMin(time) + length) % 60).padStart(2, '0')}` : undefined
                    lock({ when: { date, start: time, end } })
                  }}
                />
              </Row>
              <Row label="Venue">
                <input
                  aria-label="Venue"
                  value={draft.venue ?? ''}
                  placeholder="Choose"
                  onChange={(e) => setLocks((l) => ({ ...l, venue: e.target.value || undefined }))}
                  className="w-full bg-transparent text-ink outline-none placeholder:text-link"
                />
              </Row>
              {draft.type !== 'club' && draft.course && <Row label="Attendance">Counts toward {draft.course}</Row>}
              {clash && (
                <Row label="Clash">
                  <UrgentPill className="text-meta">{clash.text}</UrgentPill>
                </Row>
              )}
            </>
          ) : (
            <>
              <Row label="Due">
                <DateTimeChoice
                  id="due"
                  openField={openField}
                  setOpenField={setOpenField}
                  date={draft.due?.date}
                  time={draft.due?.time}
                  label={draft.due ? `${fullDate(draft.due.date)}${draft.due.time ? `, ${clockLabel(draft.due.time)}` : ''}` : null}
                  onPick={(date, time) => lock({ due: date ? { date, time } : undefined })}
                />
              </Row>
              {from && <Row label="Shows from">{from <= today ? 'Today' : dayLabel(from, today)}</Row>}
            </>
          )}
        </dl>

        <div role="radiogroup" aria-label="Type" className="flex flex-wrap gap-[5px]">
          {types.map((t) => (
            <Button
              key={t}
              role="radio"
              aria-checked={t === draft.type}
              variant={t === draft.type ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => setLocks((l) => ({ ...l, type: t as DraftType, due: undefined, when: undefined }))}
            >
              {TYPE_LABEL[t]}
            </Button>
          ))}
        </div>

        <div className="flex items-center justify-between pt-1 pb-1.5">
          <div className="flex gap-4">
            <Button variant="text" className="px-0 text-[14px] font-medium" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            {request.task && (
              <Button variant="text" className="px-0 text-[14px] font-medium text-urgent" onClick={remove}>
                Delete
              </Button>
            )}
          </div>
          <Button size="lg" onClick={add}>
            {request.task ? 'Save' : 'Add'}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}

const toMin = (t: string) => Number(t.slice(0, 2)) * 60 + Number(t.slice(3, 5))

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid grid-cols-[92px_1fr] items-baseline text-[13.5px]">
      <dt className="text-[13px] text-ink-2">{label}</dt>
      <dd className="min-w-0 text-ink">{children}</dd>
    </div>
  )
}

/** A value that opens a pick list; "Choose" in link colour (red when required) when empty. */
function Choice({
  id,
  value,
  options,
  required,
  openField,
  setOpenField,
}: {
  id: string
  value: ReactNode | null
  options: { key: string; label: string; onPick: () => void }[]
  required?: boolean
  openField: string | null
  setOpenField: (f: string | null) => void
}) {
  return (
    <Popover open={openField === id} onOpenChange={(o) => setOpenField(o ? id : null)}>
      <PopoverTrigger aria-label={`Change ${id}`} className={cn('text-left', !value && (required ? 'font-medium text-urgent' : 'font-medium text-link'))}>
        {value ?? 'Choose'}
      </PopoverTrigger>
      <PopoverContent align="start" className="max-h-72 overflow-y-auto">
        {options.map((o) => (
          <button key={o.key} type="button" onClick={o.onPick} className="block w-full px-3 py-2 text-left text-[13.5px] font-medium">
            {o.label}
          </button>
        ))}
      </PopoverContent>
    </Popover>
  )
}

/** Date and optional time, picked with the phone's own date and time pickers. */
function DateTimeChoice({
  id,
  date,
  time,
  label,
  required,
  onPick,
  openField,
  setOpenField,
}: {
  id: string
  date?: string
  time?: string
  label: string | null
  required?: boolean
  onPick: (date: string | undefined, time: string | undefined) => void
  openField: string | null
  setOpenField: (f: string | null) => void
}) {
  const [d, setD] = useState(date ?? '')
  const [t, setT] = useState(time ?? '')
  useEffect(() => {
    setD(date ?? '')
    setT(time ?? '')
  }, [date, time, openField])
  const field = 'w-full rounded-field bg-card px-3 py-2.5 text-[14px] text-ink shadow-[inset_0_0_0_1px_var(--line)] outline-none focus:shadow-[inset_0_0_0_1.5px_var(--brand)]'
  return (
    <Popover open={openField === id} onOpenChange={(o) => setOpenField(o ? id : null)}>
      <PopoverTrigger aria-label={`Change ${id}`} className={cn('text-left tnum', !label && (required ? 'font-medium text-urgent' : 'font-medium text-link'))}>
        {label ?? 'Choose'}
      </PopoverTrigger>
      <PopoverContent align="start" className="grid w-64 gap-2 p-3">
        <input aria-label="Date" type="date" value={d} onChange={(e) => setD(e.target.value)} className={field} />
        <input aria-label="Time" type="time" value={t} onChange={(e) => setT(e.target.value)} className={field} />
        <div className="flex justify-between pt-1">
          <Button variant="text" size="sm" className="px-0" onClick={() => onPick(d || undefined, undefined)}>
            {required ? 'Clear time' : 'All-day'}
          </Button>
          <Button size="sm" className="px-4 py-2" onClick={() => onPick(d || undefined, t || undefined)}>
            Done
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}

import { useState } from 'react'
import { courseInfo } from '@/data'
import type { CanMissDisplay } from '@/domain/attendance'
import { MEAL_LABEL, type Meal } from '@/domain/meals'
import type { Session } from '@/domain/sessions'
import type { TimelineItem } from '@/domain/timeline'
import { shortTime } from '@/domain/time'
import type { SessionStatus } from '@/db/schema'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { monthLong } from '@/lib/format'
import { CanMiss, ClubSquare, CourseCode, FoodMarkIcon, UrgentPill } from '@/ui/marks'

type Tags = Map<string, { label: string; urgent: boolean }[]>

const ROW = 'relative grid grid-cols-[42px_1fr_minmax(28px,auto)] items-start gap-2 py-2.5'
const KIND_LABEL: Record<Session['kind'], string | null> = { regular: null, makeup: 'Makeup', extra: 'Extra class', guest: 'Guest lecture' }

function canMissText(c?: CanMissDisplay) {
  if (!c) return ''
  if (c.kind === 'number') return `can miss ${c.value}`
  return c.kind === 'cantMiss' ? 'can’t miss' : `short by ${c.by}`
}

export function Timeline({
  items,
  tags,
  clubNames,
  onMark,
}: {
  items: TimelineItem[]
  tags: Tags
  clubNames: Map<string, string>
  onMark: (s: Session, status: SessionStatus) => void
}) {
  return (
    <div className="relative">
      {/* The thin line joining the time column. */}
      <div aria-hidden className="absolute top-3.5 bottom-3.5 left-[20px] w-px bg-line" />
      {items.map((item, i) => {
        const prev = items[i - 1]
        const next = items[i + 1]
        const raised = (x?: TimelineItem) => !!x && (x.state === 'island' || x.state === 'nextMeal')
        const joinTop = raised(item) && raised(prev)
        const joinBottom = raised(item) && raised(next)
        const noBorder = i === 0 || raised(item) || raised(prev)
        const shape = cn(noBorder ? '' : 'border-t border-line', joinTop && 'rounded-t-none', joinBottom && 'rounded-b-none')
        if (item.type === 'class') return <ClassRow key={item.key} item={item} tags={tags.get(item.session.id)} onMark={onMark} className={shape} />
        if (item.type === 'club') return <ClubRow key={item.key} item={item} name={clubNames.get(item.event.club) ?? item.event.club} className={shape} />
        return <MealRow key={item.key} meal={item.meal} open={item.state === 'nextMeal'} past={item.state === 'past'} className={shape} />
      })}
    </div>
  )
}

function ClassRow({
  item,
  tags,
  onMark,
  className,
}: {
  item: Extract<TimelineItem, { type: 'class' }>
  tags?: { label: string; urgent: boolean }[]
  onMark: (s: Session, status: SessionStatus) => void
  className?: string
}) {
  const s = item.session
  const island = item.state === 'island'
  const kind = KIND_LABEL[s.kind]
  const cancelled = s.status === 'cancelled'
  return (
    <div
      data-testid={`class-${s.course}`}
      data-state={item.state}
      className={cn(
        ROW,
        className,
        item.state === 'past' && !item.canMark && 'opacity-40',
        island && 'cc-island z-[1] -mx-2.5 rounded-card px-2.5',
      )}
    >
      <span className="relative pt-px text-time text-ink-2 tnum">
        <span className={cn('relative px-0.5', !island && 'bg-canvas')}>{shortTime(s.start)}</span>
      </span>
      <div className="grid min-w-0 gap-1">
        <span className="flex flex-wrap items-baseline gap-x-2">
          <CourseCode code={s.course} />
          <span className={cn('text-name text-ink-2', cancelled && 'line-through')}>{courseInfo(s.course)?.name}</span>
        </span>
        <span className="text-meta text-ink-2">
          {[
            s.professor && <span key="p">{s.professor}</span>,
            kind ? (
              <span key="k" className={cn('font-semibold', island ? 'underline underline-offset-2' : 'text-link')}>
                {kind}, {s.room}
              </span>
            ) : (
              <span key="r" className={cn(s.roomChanged && (island ? 'underline underline-offset-2' : 'font-semibold text-link'))}>
                {s.room}
              </span>
            ),
            cancelled && <span key="c">Cancelled</span>,
            ...(tags ?? []).map((t) =>
              t.urgent ? (
                <UrgentPill key={t.label} className="px-2 py-px text-meta">
                  {t.label}
                </UrgentPill>
              ) : (
                <span key={t.label}>{t.label}</span>
              ),
            ),
          ]
            .filter(Boolean)
            .map((el, i) => (
              <span key={i}>
                {i > 0 && ' · '}
                {el}
              </span>
            ))}
        </span>
        {item.canMark && (
          <div className="flex gap-1.5 pt-1" role="group" aria-label={`Mark ${s.course}`}>
            {(['present', 'absent', 'cancelled'] as const).map((st) => (
              <Button key={st} variant="secondary" size="sm" className="flex-1 py-[7px] text-[12.5px]" onClick={() => onMark(s, st)}>
                {st === 'present' ? 'Present' : st === 'absent' ? 'Absent' : 'Cancelled'}
              </Button>
            ))}
          </div>
        )}
      </div>
      <CanMiss value={cancelled ? undefined : item.canMiss} />
    </div>
  )
}

function ClubRow({ item, name, className }: { item: Extract<TimelineItem, { type: 'club' }>; name: string; className?: string }) {
  const e = item.event
  return (
    <div data-testid={`club-${e.id}`} className={cn(ROW, className, item.state === 'past' && 'opacity-40')}>
      <span className="pt-px text-time text-ink-2 tnum">
        <span className="relative bg-canvas px-0.5">{shortTime(e.start)}</span>
      </span>
      <div className="grid min-w-0 gap-1">
        <span className="flex flex-wrap items-baseline gap-x-2">
          <span className="inline-flex items-center gap-1.5 text-code font-bold">
            <ClubSquare code={e.club} />
            {name}
          </span>
          <span className="text-name text-ink-2">{e.title}</span>
        </span>
        {(e.venue || item.clash) && (
          <span className="text-meta text-ink-2">
            {e.venue}
            {e.venue && item.clash && ' · '}
            {item.clash && (
              <UrgentPill className="px-2 py-px text-meta">
                Clashes with {item.clash.course}
                {item.clash.canMiss && ` · ${canMissText(item.clash.canMiss)}`}
              </UrgentPill>
            )}
          </span>
        )}
      </div>
      <span />
    </div>
  )
}

export function MealRow({ meal, open, past, className }: { meal: Meal; open: boolean; past?: boolean; className?: string }) {
  const [expanded, setExpanded] = useState(false)
  const showDishes = open || expanded
  return (
    <div
      data-testid={`meal-${meal.meal}`}
      data-state={open ? 'nextMeal' : past ? 'past' : 'later'}
      className={cn(ROW, className, past && !expanded && 'opacity-40', open && 'cc-meal z-[1] -mx-2.5 rounded-card px-2.5')}
    >
      <span className={cn('flex justify-center pt-1.5', open ? '' : 'text-ink-3')}>
        <i aria-hidden className={cn('cc-bowl', !open && 'bg-canvas')} />
      </span>
      <div className="min-w-0">
        {open ? (
          <b className="block text-meal font-semibold text-meal-ink">{MEAL_LABEL[meal.meal]}</b>
        ) : (
          <button type="button" onClick={() => setExpanded((x) => !x)} aria-expanded={expanded} className="w-full text-left text-[14px] font-medium text-ink-2">
            {MEAL_LABEL[meal.meal]}
          </button>
        )}
        {showDishes && <Dishes meal={meal} />}
      </div>
      {open ? <span /> : (
        <button type="button" aria-hidden tabIndex={-1} onClick={() => setExpanded((x) => !x)} className="text-right text-[18px] leading-none text-ink-3">
          {expanded ? '⌄' : '›'}
        </button>
      )}
    </div>
  )
}

function Dishes({ meal }: { meal: Meal }) {
  if (!meal.items) return <p className="mt-1 text-meta text-ink-2">Menu for {monthLong(meal.date)} not added yet</p>
  return (
    <ul className="mt-1">
      {meal.items.map((d) => (
        <li key={d.name} className={cn('flex items-center gap-2.5 border-t border-dashed border-line py-1.5 text-body', d.mark === 'sweet' && 'text-mpi')}>
          <FoodMarkIcon mark={d.mark === 'nonveg' ? 'nonveg' : 'veg'} />
          {d.name}
        </li>
      ))}
    </ul>
  )
}

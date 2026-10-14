import { Button } from '@/components/ui/button'

/** design.md: segments are separate pills with a 6px gap, never a joined bar. */
export function Segmented<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string
  options: { id: T; label: string }[]
  value: T
  onChange: (v: T) => void
}) {
  return (
    <div role="radiogroup" aria-label={label} className="flex max-w-[240px] gap-1.5">
      {options.map((o) => (
        <Button
          key={o.id}
          role="radio"
          aria-checked={value === o.id}
          variant={value === o.id ? 'primary' : 'secondary'}
          className="flex-1"
          onClick={() => onChange(o.id)}
        >
          {o.label}
        </Button>
      ))}
    </div>
  )
}

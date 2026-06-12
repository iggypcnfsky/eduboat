export function Segmented<T extends string | number>({
  options,
  value,
  onChange,
  format = String,
}: {
  options: readonly T[]
  value: T
  onChange: (v: T) => void
  format?: (v: T) => string
}) {
  return (
    <div className="pill" role="radiogroup">
      {options.map((opt) => (
        <button
          key={String(opt)}
          type="button"
          role="radio"
          aria-checked={opt === value}
          className={`pill__option ${opt === value ? 'is-active' : ''}`}
          onClick={() => onChange(opt)}
        >
          {format(opt)}
        </button>
      ))}
    </div>
  )
}

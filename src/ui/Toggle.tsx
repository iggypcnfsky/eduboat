export function Toggle({
  on,
  onChange,
  locked = false,
  label,
}: {
  on: boolean
  onChange?: (on: boolean) => void
  locked?: boolean
  label?: string
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      className={`toggle ${on ? 'is-on' : ''} ${locked ? 'is-locked' : ''}`}
      onClick={() => {
        if (!locked) onChange?.(!on)
      }}
    />
  )
}

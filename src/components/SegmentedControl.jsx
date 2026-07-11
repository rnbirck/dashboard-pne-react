export function SegmentedControl({
  ariaLabel,
  className,
  optionClassName,
  options,
  selectedKey,
  onSelect,
}) {
  return (
    <div className={className} role="group" aria-label={ariaLabel}>
      {options.map((option) => {
        const isActive = option.key === selectedKey

        return (
          <button
            aria-pressed={isActive}
            className={`${optionClassName}${isActive ? ' is-active' : ''}`}
            key={option.key}
            onClick={() => onSelect(option.key)}
            type="button"
          >
            {option.label}
          </button>
        )
      })}
    </div>
  )
}

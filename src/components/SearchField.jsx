import { useRef } from 'react'

export function SearchField({ ariaLabel, className, clearLabel = 'Limpar busca', disabled = false, onChange, onClear, placeholder, value }) {
  const inputRef = useRef(null)
  const resolvedClassName = [
    className,
    value ? 'is-filled' : '',
    disabled ? 'is-disabled' : '',
  ].filter(Boolean).join(' ')

  function handleClear() {
    onClear?.()
    requestAnimationFrame(() => inputRef.current?.focus())
  }

  return (
    <div className={resolvedClassName} data-filled={value ? 'true' : 'false'}>
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="11" cy="11" r="6.5" />
        <path d="m16 16 4 4" />
      </svg>
      <input
        ref={inputRef}
        type="search"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        aria-label={ariaLabel}
        disabled={disabled}
      />
      {value && onClear && !disabled ? (
        <button className="platform-search-field__clear" type="button" aria-label={clearLabel} onClick={handleClear}>
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="m7 7 10 10M17 7 7 17" />
          </svg>
        </button>
      ) : null}
    </div>
  )
}

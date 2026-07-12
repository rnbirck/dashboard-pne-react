import { useRef } from 'react'

export function SearchField({ ariaLabel, className, clearLabel = 'Limpar busca', onChange, onClear, placeholder, value }) {
  const inputRef = useRef(null)

  function handleClear() {
    onClear?.()
    requestAnimationFrame(() => inputRef.current?.focus())
  }

  return (
    <div className={className}>
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
      />
      {value && onClear ? (
        <button className="platform-search-field__clear" type="button" aria-label={clearLabel} onClick={handleClear}>
          <span aria-hidden="true">×</span>
        </button>
      ) : null}
    </div>
  )
}

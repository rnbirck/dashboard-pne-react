import { forwardRef, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react'

function normalizeText(value) {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLocaleLowerCase('pt-BR')
    .trim()
}

export const MunicipalitySelector = forwardRef(function MunicipalitySelector(
  {
    className = '',
    municipios,
    selectedMunicipio,
    value,
    onChange,
    variant = 'default',
    placeholder = 'Escolha um município',
  },
  ref,
) {
  const current = value ?? selectedMunicipio ?? ''
  const isHero = variant === 'hero'

  const [query, setQuery] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(0)

  const inputRef = useRef(null)
  const containerRef = useRef(null)

  useImperativeHandle(ref, () => ({
    focus: () => inputRef.current?.focus(),
    click: () => inputRef.current?.click(),
  }))

  const list = Array.isArray(municipios) ? municipios : []

  const filtered = useMemo(() => {
    const q = normalizeText(query)
    if (!q) return list
    return list.filter((municipio) => normalizeText(municipio).includes(q))
  }, [list, query])

  useEffect(() => {
    if (activeIndex >= filtered.length) {
      setActiveIndex(Math.max(0, filtered.length - 1))
    }
  }, [activeIndex, filtered.length])

  useEffect(() => {
    if (!isOpen) return undefined
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen])

  function commit(municipio) {
    if (!municipio) return
    onChange?.(municipio)
    setQuery('')
    setIsOpen(false)
    setActiveIndex(0)
    inputRef.current?.blur()
  }

  function handleInputChange(event) {
    setQuery(event.target.value)
    setIsOpen(true)
    setActiveIndex(0)
  }

  function handleInputFocus() {
    setIsOpen(true)
  }

  function handleChevronClick() {
    if (isOpen) {
      setIsOpen(false)
    } else {
      setIsOpen(true)
      inputRef.current?.focus()
    }
  }

  function handleKeyDown(event) {
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      if (!isOpen) setIsOpen(true)
      setActiveIndex((index) => Math.min(filtered.length - 1, index + 1))
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      setActiveIndex((index) => Math.max(0, index - 1))
    } else if (event.key === 'Enter') {
      if (isOpen && filtered.length > 0) {
        event.preventDefault()
        commit(filtered[activeIndex])
      }
    } else if (event.key === 'Escape') {
      setIsOpen(false)
    } else if (event.key === 'Backspace' && query === '' && current) {
      onChange?.(null)
    }
  }

  const displayValue = isOpen ? query : current || ''
  const showPlaceholder = !displayValue

  return (
    <label
      ref={containerRef}
      className={`municipio-selector ${isHero ? 'municipio-selector--hero' : ''} ${className} ${isOpen ? 'is-open' : ''}`}
    >
      <span className="municipio-selector__label">Município</span>
      <div className="municipio-selector__field">
        <svg className="municipio-selector__pin" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 21s7-6.3 7-12a7 7 0 1 0-14 0c0 5.7 7 12 7 12Z" />
          <circle cx="12" cy="9" r="2.4" />
        </svg>
        <input
          ref={inputRef}
          type="text"
          role="combobox"
          aria-expanded={isOpen}
          aria-autocomplete="list"
          aria-controls="municipio-selector-listbox"
          aria-activedescendant={
            isOpen && filtered[activeIndex]
              ? `municipio-option-${activeIndex}`
              : undefined
          }
          className="municipio-selector__input"
          value={displayValue}
          placeholder={showPlaceholder ? placeholder : ''}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          onKeyDown={handleKeyDown}
          autoComplete="off"
          spellCheck="false"
        />
        {current && !isOpen && (
          <button
            type="button"
            className="municipio-selector__clear"
            aria-label="Limpar seleção"
            onClick={(event) => {
              event.stopPropagation()
              onChange?.(null)
              setQuery('')
              inputRef.current?.focus()
            }}
          >
            ×
          </button>
        )}
        <button
          type="button"
          className="municipio-selector__chevron-btn"
          aria-label="Abrir lista de municípios"
          tabIndex={-1}
          onClick={handleChevronClick}
        >
          <svg className="municipio-selector__chevron" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="m6 9 6 6 6-6" />
          </svg>
        </button>
        {isOpen && (
          <ul
            id="municipio-selector-listbox"
            role="listbox"
            className="municipio-selector__listbox"
          >
            {filtered.length === 0 ? (
              <li className="municipio-selector__empty">Nenhum município encontrado.</li>
            ) : (
              filtered.map((municipio, index) => (
                <li
                  key={municipio}
                  id={`municipio-option-${index}`}
                  role="option"
                  aria-selected={index === activeIndex}
                  className={
                    index === activeIndex
                      ? 'municipio-selector__option is-active'
                      : 'municipio-selector__option'
                  }
                  onMouseDown={(event) => {
                    event.preventDefault()
                    commit(municipio)
                  }}
                  onMouseEnter={() => setActiveIndex(index)}
                >
                  {highlightMatch(municipio, query)}
                </li>
              ))
            )}
          </ul>
        )}
      </div>
    </label>
  )
})

function highlightMatch(text, query) {
  const q = normalizeText(query)
  if (!q) return text
  const normalizedText = String(text).normalize('NFD').replace(/\p{Diacritic}/gu, '')
  const lowerText = normalizedText.toLocaleLowerCase('pt-BR')
  const matchIndex = lowerText.indexOf(q)
  if (matchIndex < 0) return text
  return (
    <>
      {text.slice(0, matchIndex)}
      <mark className="municipio-selector__match">{text.slice(matchIndex, matchIndex + q.length)}</mark>
      {text.slice(matchIndex + q.length)}
    </>
  )
}

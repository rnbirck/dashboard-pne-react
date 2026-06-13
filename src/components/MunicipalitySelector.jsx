import { forwardRef } from 'react'

export const MunicipalitySelector = forwardRef(function MunicipalitySelector(
  { className = '', municipios, selectedMunicipio, value, onChange, variant = 'default', placeholder = 'Escolha um município' },
  ref,
) {
  const current = value ?? selectedMunicipio ?? ''
  const isHero = variant === 'hero'

  return (
    <label className={`municipio-selector ${isHero ? 'municipio-selector--hero' : ''} ${className}`}>
      <span className="municipio-selector__label">Município</span>
      <div className="municipio-selector__field">
        <svg className="municipio-selector__pin" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 21s7-6.3 7-12a7 7 0 1 0-14 0c0 5.7 7 12 7 12Z" />
          <circle cx="12" cy="9" r="2.4" />
        </svg>
        <select
          ref={ref}
          value={current}
          onChange={(event) => onChange(event.target.value || null)}
          aria-label="Selecionar município"
        >
          <option value="">{placeholder}</option>
          {municipios.map((municipio) => (
            <option key={municipio} value={municipio}>
              {municipio}
            </option>
          ))}
        </select>
        <svg className="municipio-selector__chevron" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="m6 9 6 6 6-6" />
        </svg>
      </div>
    </label>
  )
})

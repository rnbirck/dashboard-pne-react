import { forwardRef } from 'react'

export const MunicipioSelect = forwardRef(function MunicipioSelect(
  { className = '', municipios, selectedMunicipio, value, onChange },
  ref,
) {
  const current = value ?? selectedMunicipio ?? ''

  return (
    <label className={`municipio-select ${className}`}>
      <span>Município</span>
      <select
        ref={ref}
        value={current}
        onChange={(event) => onChange(event.target.value || null)}
        aria-label="Selecionar município"
      >
        <option value="">Escolha um município</option>
        {municipios.map((municipio) => (
          <option key={municipio} value={municipio}>
            {municipio}
          </option>
        ))}
      </select>
    </label>
  )
})

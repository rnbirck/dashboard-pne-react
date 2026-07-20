const GROUP_LABELS = {
  urban: 'Urbano',
  rural: 'Rural',
}

const STATUS_COPY = {
  missing: 'Dado municipal não disponível para este recorte.',
  not_applicable: 'Não há matrículas elegíveis neste recorte.',
  methodology_incompatible: 'O recorte disponível não usa a mesma fórmula e o mesmo universo.',
}

export function InequalityPilotSection({ loading = false, pilot }) {
  if (loading) {
    return (
      <section className="inequality-pilot" aria-labelledby="inequality-pilot-title">
        <header className="inequality-pilot__heading">
          <div>
            <span>Recorte experimental</span>
            <h3 id="inequality-pilot-title">Oferta em tempo integral por localização</h3>
          </div>
        </header>
        <p className="inequality-pilot__state" role="status">Carregando recorte urbano e rural...</p>
      </section>
    )
  }

  if (!pilot || pilot.indicatorId !== 'basico_integral' || pilot.dimension !== 'urban_rural') {
    return null
  }

  const groups = pilot.groups ?? []
  const difference = Number(pilot.observedDifferencePercentagePoints)
  const hasDifference = groups.length === 2
    && groups.every((group) => group.status === 'available')
    && Number.isFinite(difference)

  return (
    <section className="inequality-pilot" aria-labelledby="inequality-pilot-title">
      <header className="inequality-pilot__heading">
        <div>
          <span>Recorte experimental · rede pública</span>
          <h3 id="inequality-pilot-title">Oferta em tempo integral por localização</h3>
        </div>
        {Number.isFinite(Number(pilot.year)) ? <strong>{pilot.year}</strong> : null}
      </header>

      <div className="inequality-pilot__groups">
        {groups.map((group) => <InequalityGroup group={group} key={group.groupCode} />)}
      </div>

      {hasDifference ? (
        <p className="inequality-pilot__difference">
          <strong>Diferença observada:</strong> {formatDifference(difference)}
        </p>
      ) : null}
      <p className="inequality-pilot__note">
        Este recorte descreve diferenças na oferta observada. Não demonstra, sozinho, causa, qualidade ou igualdade de acesso dos estudantes residentes.
      </p>
    </section>
  )
}

function InequalityGroup({ group }) {
  const label = GROUP_LABELS[group.groupCode] ?? group.groupCode
  const percentage = Number(group.percentage)
  const isAvailable = group.status === 'available'
    && Number.isFinite(percentage)
    && Number.isFinite(Number(group.numerator))
    && Number.isFinite(Number(group.denominator))

  return (
    <article className={`inequality-pilot__group inequality-pilot__group--${group.status}`}>
      <div className="inequality-pilot__group-heading">
        <span>Resultado {label.toLocaleLowerCase('pt-BR')}</span>
        <small>{publicationLabel(group.status)}</small>
      </div>
      {isAvailable ? (
        <>
          <strong className="inequality-pilot__value">{formatPercentage(percentage)}</strong>
          <p>
            {formatCount(group.numerator)} matrículas em jornada integral de{' '}
            {formatCount(group.denominator)} elegíveis.
          </p>
          <div className="inequality-pilot__bar" aria-hidden="true">
            <span style={{ '--inequality-bar-width': `${Math.max(0, Math.min(100, percentage))}%` }} />
          </div>
          <small>Ano {group.year} · cobertura municipal da rede pública</small>
        </>
      ) : group.status === 'suppressed_small_cell' ? (
        <p className="inequality-pilot__suppressed">
          Resultado não exibido devido ao pequeno número de matrículas.
        </p>
      ) : (
        <p className="inequality-pilot__state">{STATUS_COPY[group.status] ?? 'Recorte indisponível.'}</p>
      )}
    </article>
  )
}

function formatDifference(value) {
  const amount = `${Math.abs(value).toLocaleString('pt-BR', { maximumFractionDigits: 1 })} p.p.`
  if (Math.abs(value) < 0.05) {
    return 'resultado urbano e resultado rural estão no mesmo patamar arredondado.'
  }
  return value > 0
    ? `resultado urbano ${amount} acima do resultado rural.`
    : `resultado rural ${amount} acima do resultado urbano.`
}

function formatPercentage(value) {
  return `${value.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%`
}

function formatCount(value) {
  return Number(value).toLocaleString('pt-BR', { maximumFractionDigits: 0 })
}

function publicationLabel(status) {
  return {
    available: 'Publicado',
    suppressed_small_cell: 'Suprimido',
    missing: 'Ausente',
    not_applicable: 'Não aplicável',
    methodology_incompatible: 'Incompatível',
  }[status] ?? 'Indisponível'
}

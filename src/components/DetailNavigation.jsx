export function DetailNavigation({
  activeIndex,
  className = '',
  isBottom = false,
  itemLabel = 'Indicador',
  itemPlural = 'indicadores',
  nextLabel,
  nextItem,
  onBack,
  onNext,
  onPrevious,
  previousItem,
  total,
}) {
  return (
    <div
      className={`cycle-detail-nav detail-navigation platform-detail-navigation${isBottom ? ' cycle-detail-nav--bottom detail-navigation--bottom' : ''}${className ? ` ${className}` : ''}`}
    >
      <button className="cycle-back-button platform-navigation-button" type="button" onClick={onBack}>
        <span aria-hidden="true">&larr;</span>
        Voltar aos indicadores
      </button>
      <div
        className="cycle-detail-nav__sequence platform-detail-navigation__sequence"
        aria-label={`Navegar entre ${itemPlural} filtrados`}
      >
        <button
          className="cycle-step-button platform-navigation-button"
          type="button"
          onClick={() => previousItem && onPrevious(previousItem.key)}
          disabled={!previousItem}
        >
          <span aria-hidden="true">&lsaquo;</span>
          {itemLabel} anterior
        </button>
        <span className="cycle-detail-nav__position">
          {activeIndex + 1} de {total}
        </span>
        <button
          className="cycle-step-button platform-navigation-button"
          type="button"
          onClick={() => nextItem && onNext(nextItem.key)}
          disabled={!nextItem}
        >
          {nextLabel ?? `Próximo ${itemLabel.toLocaleLowerCase('pt-BR')}`}
          <span aria-hidden="true">&rsaquo;</span>
        </button>
      </div>
    </div>
  )
}

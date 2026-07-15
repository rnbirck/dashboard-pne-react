import { ContentState } from './ContentState'

export function LoadingState({ message = 'Carregando dados...', variant = 'panel' }) {
  return (
    <ContentState kind="loading" className={`state-box state-box--loading state-box--loading-${variant}`}>
      <span className="state-box__loading-heading">
        <span className="state-spinner" aria-hidden="true" />
        <strong>{message}</strong>
      </span>
      <span className="state-skeleton" aria-hidden="true">
        <span />
        <span />
        <span />
      </span>
    </ContentState>
  )
}

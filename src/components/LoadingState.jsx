import { ContentState } from './ContentState'

export function LoadingState({ message = 'Carregando dados...' }) {
  return (
    <ContentState kind="loading" className="state-box state-box--loading">
      <span className="state-spinner" aria-hidden="true" />
      <strong>{message}</strong>
    </ContentState>
  )
}

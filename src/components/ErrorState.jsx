import { ContentState } from './ContentState'

export function ErrorState({ title = 'Não foi possível carregar os dados.', message, variant = 'panel' }) {
  return (
    <ContentState kind="error" className={`state-box state-box--error state-box--error-${variant}`}>
      <strong>{title}</strong>
      {message && <span>{message}</span>}
    </ContentState>
  )
}

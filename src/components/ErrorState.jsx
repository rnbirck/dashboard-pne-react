import { ContentState } from './ContentState'

export function ErrorState({ title = 'Não foi possível carregar os dados.', message }) {
  return (
    <ContentState kind="error" className="state-box state-box--error">
      <strong>{title}</strong>
      {message && <span>{message}</span>}
    </ContentState>
  )
}

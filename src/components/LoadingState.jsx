export function LoadingState({ message = 'Carregando dados...' }) {
  return (
    <div className="state-box state-box--loading">
      <span className="state-spinner" aria-hidden="true" />
      <strong>{message}</strong>
    </div>
  )
}

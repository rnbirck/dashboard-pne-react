export function ErrorState({ title = 'Não foi possível carregar os dados.', message }) {
  return (
    <div className="state-box state-box--error">
      <strong>{title}</strong>
      {message && <span>{message}</span>}
    </div>
  )
}

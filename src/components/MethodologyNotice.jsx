export function MethodologyNotice({ avisos }) {
  if (!avisos || avisos.length === 0) return null
  return (
    <div className="education-notice">
      {avisos.map((aviso, i) => (
        <p key={i}>{aviso}</p>
      ))}
    </div>
  )
}

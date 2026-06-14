export function StatusBadge({ className = '', displayStatus, status, title, tone }) {
  const classes = ['status-badge']
  if (className) {
    classes.push(className)
  }
  if (tone) {
    classes.push(`status-badge--${tone}`)
  } else {
    const normalizedStatus = String(status).toLocaleLowerCase('pt-BR')
    const inferred =
      normalizedStatus.includes('atingida') && !normalizedStatus.includes('não') && !normalizedStatus.includes('nao')
        ? 'success'
        : normalizedStatus.includes('visualiza')
          ? 'info'
          : normalizedStatus.includes('não') ||
              normalizedStatus.includes('nao') ||
              normalizedStatus.includes('aten') ||
              normalizedStatus.includes('warning') ||
              normalizedStatus.includes('attention')
            ? 'warning'
            : normalizedStatus.includes('indispon') ||
                normalizedStatus.includes('sem dados') ||
                normalizedStatus.includes('muted')
              ? 'muted'
              : 'default'
    classes.push(`status-badge--${inferred}`)
  }
  return (
    <span className={classes.join(' ')} title={title ?? status}>
      {displayStatus ?? status}
    </span>
  )
}

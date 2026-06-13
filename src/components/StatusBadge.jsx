export function StatusBadge({ status, tone }) {
  const classes = ['status-badge']
  if (tone) {
    classes.push(`status-badge--${tone}`)
  } else {
    const inferred =
      status === 'Meta atingida' || status === 'Atingida' || status === 'Concluído' || status === 'ok'
        ? 'success'
        : status === 'Meta não atingida' || status === 'Atenção' || status === 'warning' || status === 'attention'
          ? 'warning'
          : status === 'Indisponível' || status === 'muted'
            ? 'muted'
            : 'default'
    classes.push(`status-badge--${inferred}`)
  }
  return <span className={classes.join(' ')}>{status}</span>
}

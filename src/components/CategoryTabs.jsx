export function CategoryTabs({ categories, selectedCategory, onSelectCategory, ariaLabel = 'Categorias' }) {
  return (
    <div className="category-tabs" role="tablist" aria-label={ariaLabel}>
      {categories.map((category) => {
        const visibleLabel = category.shortLabel ?? category.label
        const hasFullLabel = Boolean(category.shortLabel && category.shortLabel !== category.label)

        return (
          <button
            className={
              category.key === selectedCategory ? 'category-tab is-active' : 'category-tab'
            }
            key={category.key}
            type="button"
            title={category.label}
            onClick={() => onSelectCategory(category.key)}
          >
            <span aria-hidden={hasFullLabel ? 'true' : undefined}>{visibleLabel}</span>
            {hasFullLabel ? <span className="u-sr-only">{category.label}</span> : null}
            <span className="category-tab__count">{category.count ?? category.items?.length ?? 0}</span>
          </button>
        )
      })}
    </div>
  )
}

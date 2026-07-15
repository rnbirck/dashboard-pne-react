export function CategoryTabs({ categories, selectedCategory, onSelectCategory, ariaLabel = 'Categorias' }) {
  return (
    <div className="category-tabs platform-category-tabs platform-filter-list" role="group" aria-label={ariaLabel}>
      {categories.map((category) => {
        const visibleLabel = category.shortLabel ?? category.label
        const hasFullLabel = Boolean(category.shortLabel && category.shortLabel !== category.label)

        return (
          <button
            className={
              category.key === selectedCategory
                ? 'category-tab platform-filter-option is-active'
                : 'category-tab platform-filter-option'
            }
            disabled={category.disabled}
            key={category.key}
            type="button"
            title={category.label}
            aria-pressed={category.key === selectedCategory}
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

export function CategoryTabs({ categories, selectedCategory, onSelectCategory, ariaLabel = 'Categorias' }) {
  return (
    <div className="category-tabs" role="tablist" aria-label={ariaLabel}>
      {categories.map((category) => (
        <button
          className={
            category.key === selectedCategory ? 'category-tab is-active' : 'category-tab'
          }
          key={category.key}
          type="button"
          title={category.label}
          onClick={() => onSelectCategory(category.key)}
        >
          <span>{category.shortLabel ?? category.label}</span>
          <span className="category-tab__count">{category.count ?? category.items?.length ?? 0}</span>
        </button>
      ))}
    </div>
  )
}

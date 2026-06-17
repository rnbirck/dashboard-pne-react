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
          onClick={() => onSelectCategory(category.key)}
        >
          {category.label}
        </button>
      ))}
    </div>
  )
}

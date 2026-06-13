export function CategoryTabs({ categories, selectedCategory, onSelectCategory }) {
  return (
    <div className="category-tabs" role="tablist" aria-label="Categorias">
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

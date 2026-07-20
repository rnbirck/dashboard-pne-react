import { FINANCIAL_NAV_ITEMS, FINANCIAL_PAGE_COPY } from '../data/financialModules'
import { setHashContext } from '../utils/hashNavigation'

export function FinancialCompactModuleSelector({ activePageKey }) {
  return (
    <div className="financial-compact-module">
      <label htmlFor="financial-module-selector">{FINANCIAL_PAGE_COPY.module.compactSelectorLabel}</label>
      <select
        aria-label={FINANCIAL_PAGE_COPY.module.compactSelectorLabel}
        id="financial-module-selector"
        value={activePageKey}
        onChange={(event) => setHashContext(event.target.value)}
      >
        <option disabled value="">{FINANCIAL_PAGE_COPY.module.compactSelectorPrompt}</option>
        {FINANCIAL_NAV_ITEMS.map((item) => (
          <option key={item.pageKey} value={item.pageKey}>{item.label}</option>
        ))}
      </select>
    </div>
  )
}

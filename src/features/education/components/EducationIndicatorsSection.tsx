import type { ChangeEvent, RefObject } from 'react'
import { ContentState } from '../../../components/ContentState.jsx'
import { DetailNavigation } from '../../../components/DetailNavigation.jsx'
import { EducationIndicatorCard } from '../../../components/EducationIndicatorCard.jsx'
import { SearchField } from '../../../components/SearchField.jsx'
import { SistemaSPanel } from '../../../components/SistemaSPanel.jsx'
import {
  EDUCATION_SECTION_GROUPS,
  EDUCATION_SECTION_KEYS,
} from '../../../data/educationIndicatorCatalog.js'
import { selectEducationVisibleGroups } from '../educationSelectors'
import { formatIndicatorCount } from '../educationFormatters'
import { EducationIndicatorDetailView } from './EducationIndicatorDetailView'
import type {
  EducationIndicatorKey,
  EducationIndicatorResult,
  EducationSection,
  EducationSectionKey,
} from '../educationTypes'

interface EducationDetailNavigationController {
  detailViewRef: RefObject<HTMLDivElement | null>
  registerCard: (itemKey: string, node: HTMLButtonElement | null) => void
}

interface EducationIndicatorsSectionActions {
  onAdjacentIndicator: (indicatorKey: EducationIndicatorKey) => void
  onBackToIndicators: () => void
  onIndicatorCardSelect: (indicatorKey: EducationIndicatorKey) => void
  onSearchChange: (value: string) => void
}

interface EducationIndicatorsSectionViewModel {
  activeIndicator: EducationIndicatorResult | null
  activeIndicatorIndex: number
  blocos: unknown
  detailNavigation: EducationDetailNavigationController
  filteredItems: EducationIndicatorResult[]
  hasSistemaS: boolean
  isDetailOpen: boolean
  isShowingIndicatorDetail: boolean
  isSistemaSTheme: boolean
  nextIndicator: EducationIndicatorResult | null
  previousIndicator: EducationIndicatorResult | null
  searchQuery: string
  section?: EducationSection
  selectedIndicatorKey: EducationIndicatorKey
  selectedSectionKey: EducationSectionKey
}

interface EducationIndicatorsSectionProps {
  actions: EducationIndicatorsSectionActions
  viewModel: EducationIndicatorsSectionViewModel
}

interface EducationDetailNavigationProps {
  activeIndex: number
  isBottom?: boolean
  nextIndicator: EducationIndicatorResult | null
  onBack: () => void
  onNext: (key: EducationIndicatorKey) => void
  onPrevious: (key: EducationIndicatorKey) => void
  previousIndicator: EducationIndicatorResult | null
  total: number
}

export function EducationIndicatorsSection({ actions, viewModel }: EducationIndicatorsSectionProps) {
  const {
    activeIndicator,
    activeIndicatorIndex,
    blocos,
    detailNavigation,
    filteredItems,
    hasSistemaS,
    isDetailOpen,
    isShowingIndicatorDetail,
    isSistemaSTheme,
    nextIndicator,
    previousIndicator,
    searchQuery,
    section,
    selectedIndicatorKey,
    selectedSectionKey,
  } = viewModel
  const {
    onAdjacentIndicator,
    onBackToIndicators,
    onIndicatorCardSelect,
    onSearchChange,
  } = actions
  const groups = EDUCATION_SECTION_GROUPS[selectedSectionKey] ?? []
  const normalizedSearchQuery = searchQuery.trim().toLocaleLowerCase('pt-BR')
  const visibleGroups = selectEducationVisibleGroups(groups, filteredItems)
  const showSistemaSGroup =
    selectedSectionKey === EDUCATION_SECTION_KEYS.modalities &&
    hasSistemaS &&
    (!normalizedSearchQuery || 'sistema s oferta profissional'.includes(normalizedSearchQuery))

  if (isSistemaSTheme) {
    return (
      <>
        <section className="page-card education-thematic-heading" aria-labelledby="education-thematic-title">
          <span className="eyebrow">{'Seção de indicadores'}</span>
          <h2 id="education-thematic-title">{section?.label}</h2>
          <p>{section?.description}</p>
        </section>
        <section className="education-special-group" aria-labelledby="education-special-group-title">
          <div className="education-indicator-group__heading">
            <div>
              <span className="eyebrow">{section?.label}</span>
              <h3 id="education-special-group-title">Sistema S</h3>
            </div>
          </div>
          <SistemaSPanel blocos={blocos} />
        </section>
      </>
    )
  }

  if (isShowingIndicatorDetail) {
    return (
      <div className="education-detail-view" ref={detailNavigation.detailViewRef}>
        <EducationDetailNavigation
          activeIndex={activeIndicatorIndex}
          nextIndicator={nextIndicator}
          onBack={onBackToIndicators}
          onNext={onAdjacentIndicator}
          onPrevious={onAdjacentIndicator}
          previousIndicator={previousIndicator}
          total={filteredItems.length}
        />
        <EducationIndicatorDetailView indicator={activeIndicator} blocos={blocos} />
        <EducationDetailNavigation
          activeIndex={activeIndicatorIndex}
          isBottom
          nextIndicator={nextIndicator}
          onBack={onBackToIndicators}
          onNext={onAdjacentIndicator}
          onPrevious={onAdjacentIndicator}
          previousIndicator={previousIndicator}
          total={filteredItems.length}
        />
      </div>
    )
  }

  return (
    <>
      <section className="cycle-filter-panel educacao-filter-panel platform-filter-panel education-section-filter-panel" aria-labelledby="education-thematic-title">
        <div className="education-section-filter-panel__identity">
          <span className="eyebrow">{'Seção de indicadores'}</span>
          <h2 id="education-thematic-title">{section?.label}</h2>
          <p>{section?.description}</p>
        </div>
        <div className="cycle-filter-panel__heading">
          <div>
            <span className="eyebrow">{'Indicadores da seção'}</span>
            <strong className="education-section-filter-count">{formatIndicatorCount(filteredItems.length)}</strong>
          </div>
          <SearchField
            ariaLabel="Buscar indicador"
            className="cycle-search platform-search-field"
            onChange={(event: ChangeEvent<HTMLInputElement>) => onSearchChange(event.target.value)}
            onClear={() => onSearchChange('')}
            placeholder="Buscar indicador..."
            value={searchQuery}
          />
        </div>
      </section>

      {filteredItems.length === 0 && !showSistemaSGroup ? (
        <div className="meta-grid-empty education-indicator-grid-empty">
          <ContentState as="p" kind="noResults">
            {searchQuery.trim()
              ? `Nenhum indicador encontrado para “${searchQuery.trim()}” nesta seção.`
              : 'Nenhum indicador disponível para esta seção.'}
          </ContentState>
        </div>
      ) : (
        <div className="education-indicator-groups">
          {visibleGroups.map((group) => (
            <section className="education-indicator-group" key={group.key} aria-labelledby={`education-group-${group.key}`}>
              <div className="education-indicator-group__heading">
                <div>
                  <span className="eyebrow">Indicadores relacionados</span>
                  <h3 id={`education-group-${group.key}`}>{group.label}</h3>
                </div>
                <span>{formatIndicatorCount(group.items.length)}</span>
              </div>
              <p className="education-indicator-group__description">{group.description}</p>
              <div className="education-indicator-card-grid">
                {group.items.map((item) => (
                  <EducationIndicatorCard
                    buttonRef={(node: HTMLButtonElement | null) => detailNavigation.registerCard(item.key, node)}
                    indicator={item}
                    isSelected={isDetailOpen && item.key === selectedIndicatorKey}
                    key={item.key}
                    onSelect={() => onIndicatorCardSelect(item.key)}
                  />
                ))}
              </div>
            </section>
          ))}
          {showSistemaSGroup ? (
            <section className="education-special-group" aria-labelledby="education-section-sistema-s-title">
              <div className="education-indicator-group__heading">
                <div>
                  <span className="eyebrow">{section?.label}</span>
                  <h3 id="education-section-sistema-s-title">Sistema S</h3>
                </div>
              </div>
              <SistemaSPanel blocos={blocos} />
            </section>
          ) : null}
        </div>
      )}
    </>
  )
}

function EducationDetailNavigation({
  activeIndex,
  isBottom = false,
  nextIndicator,
  onBack,
  onNext,
  onPrevious,
  previousIndicator,
  total,
}: EducationDetailNavigationProps) {
  return (
    <DetailNavigation
      activeIndex={activeIndex}
      className={`education-detail-nav${isBottom ? ' education-detail-nav--bottom' : ''}`}
      isBottom={isBottom}
      nextLabel={undefined}
      nextItem={nextIndicator}
      onBack={onBack}
      onNext={onNext}
      onPrevious={onPrevious}
      previousItem={previousIndicator}
      total={total}
    />
  )
}

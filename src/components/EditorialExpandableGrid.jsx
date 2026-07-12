import { useState } from 'react'

function EditorialExpandableCard({ isOpen, item, onToggle, pairIndex }) {
  return (
    <details className="pne-expandable" data-pair={pairIndex} open={isOpen}>
      <summary aria-expanded={isOpen} onClick={onToggle}>
        <span className="pne-expandable__summary">
          <span>{item.title}</span>
          {item.reference ? <small>{item.reference}</small> : null}
        </span>
        <span className="pne-expandable__marker" aria-hidden="true" />
      </summary>
      <div className="pne-expandable__body">
        <p>{item.summary}</p>
        {item.municipalUse ? (
          <p className="pne-expandable__note">
            <strong>No município:</strong> {item.municipalUse}
          </p>
        ) : null}
        {item.panelUse ? (
          <p className="pne-expandable__note">
            <strong>No painel:</strong> {item.panelUse}
          </p>
        ) : null}
      </div>
    </details>
  )
}

export function EditorialExpandableGrid({ className = '', items }) {
  const [openPairs, setOpenPairs] = useState(() => new Set())

  function togglePair(pairIndex) {
    setOpenPairs((currentOpenPairs) => {
      const nextOpenPairs = new Set(currentOpenPairs)

      if (nextOpenPairs.has(pairIndex)) {
        nextOpenPairs.delete(pairIndex)
      } else {
        nextOpenPairs.add(pairIndex)
      }

      return nextOpenPairs
    })
  }

  return (
    <div className={['pne-expandable-grid', className].filter(Boolean).join(' ')}>
      {items.map((item, index) => {
        const pairIndex = Math.floor(index / 2)

        return (
          <EditorialExpandableCard
            isOpen={openPairs.has(pairIndex)}
            item={item}
            key={item.title}
            onToggle={(event) => {
              event.preventDefault()
              togglePair(pairIndex)
            }}
            pairIndex={pairIndex}
          />
        )
      })}
    </div>
  )
}

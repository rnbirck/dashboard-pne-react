import { FundebPanel } from '../components/FundebPanel'

export function FundebPage({ municipioData, selectedMunicipio }) {
  return (
    <FundebPanel
      municipioData={municipioData}
      selectedMunicipio={selectedMunicipio}
      embedded={false}
    />
  )
}

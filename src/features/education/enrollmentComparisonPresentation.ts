import type { EnrollmentComparisonValue } from './municipalEducationOverviewTypes'

export function hasRelevantNetworkComparison(value: EnrollmentComparisonValue): boolean {
  return !isConfirmedZero(value.value2015) || !isConfirmedZero(value.value2025)
}

function isConfirmedZero(value: EnrollmentComparisonValue['value2015']): boolean {
  return (value.state === 'observed' || value.state === 'derived_zero') && value.value === 0
}

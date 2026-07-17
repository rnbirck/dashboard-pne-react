import assert from 'node:assert/strict'
import test from 'node:test'
import { buildPopulationCoverageSeries } from '../../src/utils/populationCoverageChart.js'

const calculation = {
  denominator_label: 'População de 0 a 3 anos',
  numerator_label: 'Matrículas em creche',
}

test('builds the stacked population coverage series for the requested cycle and period', () => {
  const series = buildPopulationCoverageSeries({
    cycle: 'pne_2026_2036',
    details: {
      calculation,
      series_components_by_cycle: {
        pne_2026_2036: [
          { ano: 2014, denominador: 120, numerador: 36, percentual: 30 },
          { ano: 2015, denominador: 100, numerador: 40, percentual: 40 },
          { ano: 2016, denominador: 90, numerador: 45, percentual: 50 },
        ],
      },
    },
    endYear: 2016,
    startYear: 2015,
  })

  assert.deepEqual(series, [
    { enrolled: 40, percent: 40, population: 100, unattended: 60, year: 2015 },
    { enrolled: 45, percent: 50, population: 90, unattended: 45, year: 2016 },
  ])
})

test('keeps the current chart for ratios without an explicit enrollment-to-population relationship', () => {
  const series = buildPopulationCoverageSeries({
    cycle: 'pne_2026_2036',
    details: {
      calculation: {
        denominator_label: 'Total de docentes',
        numerator_label: 'Docentes com pós-graduação',
      },
      series_components: [
        { ano: 2024, denominador: 80, numerador: 40, percentual: 50 },
        { ano: 2025, denominador: 100, numerador: 60, percentual: 60 },
      ],
    },
    endYear: 2025,
    startYear: 2024,
  })

  assert.deepEqual(series, [])
})

test('does not turn an over-100 proxy into a misleading population partition', () => {
  const series = buildPopulationCoverageSeries({
    cycle: 'pne_2014_2024',
    details: {
      calculation,
      series_components: [
        { ano: 2023, denominador: 100, numerador: 90, percentual: 90 },
        { ano: 2024, denominador: 100, numerador: 104, percentual: 104 },
      ],
    },
    endYear: 2024,
    startYear: 2023,
  })

  assert.deepEqual(series, [])
})


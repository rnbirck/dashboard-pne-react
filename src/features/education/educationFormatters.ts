// Education-only labels and metadata formatting extracted without changing
// the shared numeric formatters used by other domains.
import { normalizeYearSeries } from '../../utils/educationFormatters.js'
import type { EducationIndicatorResult } from './educationTypes'

export function normalizeMethodologyId(value: string): string {
  return String(value).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('pt-BR').replace(/[^a-z0-9]+/g, '-')
}

export function getIndicatorYears(item?: EducationIndicatorResult): number[] {
  const series = Array.isArray(item?.series) ? item.series : []
  return normalizeYearSeries(series)
    .map((point) => Number(point.ano))
    .filter((year) => Number.isFinite(year))
}

export function formatSourceYears(years: number[]): string {
  if (!years.length) return 'Não disponível para o município'
  if (years.length === 1) return String(years[0])
  return `${years[0]}–${years[years.length - 1]}`
}

export function formatIndicatorCount(count: number): string {
  return `${count} ${count === 1 ? 'indicador' : 'indicadores'}`
}

export function normalizeEducationIndicatorLabel(label: unknown): string {
  const normalized = String(label ?? '')
    .replace(/^Alunos por turma - /, 'Alunos por turma — ')
    .replace(/^Docentes - /, 'Docentes — ')

  const replacements: Record<string, string> = {
    'EJA': 'Educação de Jovens e Adultos',
    'Docentes — EJA': 'Docentes — Educação de Jovens e Adultos',
    'Docentes — Educação Profissional': 'Docentes — Educação Profissional e Tecnológica',
    'Matrículas na EJA': 'Matrículas na Educação de Jovens e Adultos',
    'Matrículas na educação profissional — Censo Escolar': 'Matrículas na Educação Profissional e Tecnológica — Censo Escolar',
    'Matrículas técnicas — Sinopse Estatística': 'Matrículas técnicas — Sinopse Estatística do Censo Escolar',
    'SAEB Língua Portuguesa': 'SAEB — Língua Portuguesa',
    'SAEB Matemática': 'SAEB — Matemática',
    'Educação Profissional': 'Educação Profissional e Tecnológica',
  }

  return replacements[normalized] ?? normalized
}

const fs = require('fs');
const path = require('path');

const data = JSON.parse(fs.readFileSync(path.join(__dirname, 'public/data/indicadores.json'), 'utf-8'));

const issues = [];

for (const [cycleName, cycle] of Object.entries(data.cycles)) {
  for (const category of cycle.categories) {
    for (const item of category.items) {
      const desc = (item.desc || '').toLocaleLowerCase('pt-BR')
      const label = (item.label || '').toLocaleLowerCase('pt-BR')
      const vm = item.value_mode

      if (!vm) {
        issues.push(`[MISSING_VM] ${cycleName}/${category.key}/${item.key}: value_mode ausente`)
        continue
      }

      // Checagens de coerência
      if (desc.startsWith('percentual') && vm !== 'percent') {
        issues.push(`[COHERENCE] ${cycleName}/${category.key}/${item.key}: desc inicia com "Percentual" mas value_mode="${vm}"`)
      }

      if (desc.startsWith('número absoluto') && vm !== 'count') {
        issues.push(`[COHERENCE] ${cycleName}/${category.key}/${item.key}: desc inicia com "Número absoluto" mas value_mode="${vm}"`)
      }

      if (label.includes('ideb') && vm !== 'index') {
        issues.push(`[COHERENCE] ${cycleName}/${category.key}/${item.key}: label contém "IDEB" mas value_mode="${vm}"`)
      }

      if (desc.includes('anos de estudo') && vm !== 'years') {
        issues.push(`[COHERENCE] ${cycleName}/${category.key}/${item.key}: desc contém "anos de estudo" mas value_mode="${vm}"`)
      }

      if (!['percent', 'count', 'index', 'years'].includes(vm)) {
        issues.push(`[UNKNOWN_VM] ${cycleName}/${category.key}/${item.key}: value_mode="${vm}" não é padrão`)
      }
    }
  }
}

if (issues.length === 0) {
  console.log('Nenhuma inconsistência encontrada.')
} else {
  console.log(`${issues.length} inconsistência(s) encontrada(s):`)
  issues.forEach((i) => console.log('  ' + i))
  process.exit(1)
}

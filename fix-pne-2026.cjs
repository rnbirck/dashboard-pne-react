const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'public/data/indicadores.json');
const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

// PNE 2026-2036 - Atendimento Escolar
const cycle = data.cycles.pne_2026_2036;
const atendimento = cycle.categories.find((c) => c.key === 'atendimento');

for (const item of atendimento.items) {
  if (item.key === 'eja integrada_educacao_profissional' && item.value_mode === 'percent') {
    // No PNE 2026-2036, a descrição começa com "Número de matrículas" => count
    item.value_mode = 'count';
    console.log('Fixed: eja integrada_educacao_profissional -> count');
  }
  if (item.key === 'medio_tecnico' && item.value_mode === 'count') {
    // No PNE 2026-2036, a descrição começa com "Percentual" => percent
    item.value_mode = 'percent';
    console.log('Fixed: medio_tecnico -> percent');
  }
}

fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n', 'utf-8');
console.log('Done.');

const fs = require('fs');
const path = require('path');

const REPO_ROOT = path.resolve(__dirname, '../..');
const data = JSON.parse(fs.readFileSync(path.join(REPO_ROOT, 'public/data/indicadores.json'), 'utf-8'));

for (const [cycleName, cycle] of Object.entries(data.cycles)) {
  console.log(`=== CYCLE: ${cycleName} ===`);
  for (const category of cycle.categories) {
    console.log(`  CATEGORY: ${category.label} (${category.key})`);
    for (const item of category.items) {
      const vm = item.value_mode || 'MISSING';
      const desc = (item.desc || '').substring(0, 60);
      console.log(`    ${item.key}: value_mode=${vm} | ${desc}`);
    }
  }
}

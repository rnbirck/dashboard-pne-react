const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'public/data/indicadores.json');
const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

// Mapeamento de value_mode por chave de indicador
// base: percampos descritivos, conforme a classificação esperada do usuário
const VALUE_MODE_MAP = {
  // PNE 2014-2024 - Atendimento Escolar
  creche: 'percent',
  pre_escola: 'percent',
  basico_6_17: 'percent',
  basico_15_17: 'percent',
  'basico_integral': 'percent',
  'escolas_integral': 'percent',
  eja_integrada_educacao_profissional: 'percent',
  medio_tecnico_total: 'count',
  medio_tecnico_participacao_publica: 'percent',
  medio_tecnico: 'count',
  // PNE 2014-2024 - Rendimento Escolar
  alfabetizacao: 'percent',
  ideb_anos_iniciais: 'index',
  ideb_anos_finais: 'index',
  ideb_ensino_medio: 'index',
  // PNE 2014-2024 - Corpo Docente
  adequacao_ai: 'percent',
  adequacao_af: 'percent',
  adequacao_em: 'percent',
  pos_graduacao: 'percent',
  rendimento_magisterio: 'percent',
  // PNE 2014-2024 - Escolaridade da População
  alfabetizacao_pop_15_mais: 'percent',
  ensino_medio_ou_basica_completa_pop_15_17: 'percent',
  ensino_fundamental_ou_completo_pop_6_14: 'percent',
  escolaridade_media_18_29: 'years',
  razao_escolaridade_racial_18_29: 'percent',
  // PNE 2026-2036 - Atendimento Escolar
  // creche, pre_escola, basico_6_17, basico_15_17, basico_integral, escolas_integral já mapeados
  aee: 'percent',
  // eja_integrada_educacao_profissional já mapeado (count no PNE 2026-2036)
  // medio_tecnico: NOTE: no PNE 2014-2024 é count, no PNE 2026-2036 é percent
  // medio_tecnico_participacao_publica já mapeado
  // Para PNE 2026-2036, medio_tecnico será sobrescrito abaixo
  subsequente_expansao: 'percent',
  // PNE 2026-2036 - Rendimento Escolar
  // alfabetizacao já mapeado
  saeb_matematica_anos_iniciais: 'percent',
  saeb_matematica_anos_finais: 'percent',
  saeb_matematica_ensino_medio: 'percent',
  saeb_portugues_anos_iniciais: 'percent',
  saeb_portugues_anos_finais: 'percent',
  saeb_portugues_ensino_medio: 'percent',
  idade_regular_quinto: 'percent',
  idade_regular_nono: 'percent',
  idade_regular_medio: 'percent',
  // PNE 2026-2036 - Corpo Docente
  // adequacao_ai, adequacao_af, adequacao_em, pos_graduacao, rendimento_magisterio já mapeados
  temporarios: 'percent',
  // PNE 2026-2036 - Infraestrutura Escolar
  internet: 'percent',
  internet_alunos: 'percent',
  internet_aprendizagem: 'percent',
  internet_comunidade: 'percent',
  acesso_internet_computador: 'percent',
  acesso_internet_disp_pessoais: 'percent',
  rede_local: 'percent',
  rede_wireless: 'percent',
  banda_larga: 'percent',
  educacao_ambiental: 'percent',
  conselho_escolar: 'percent',
  proposta_pedagogica: 'percent',
  salas_climatizadas: 'percent',
  salas_acessiveis: 'percent',
  desktop_aluno: 'percent',
  comp_portatil_aluno: 'percent',
  tablet_aluno: 'percent',
  // PNE 2026-2036 - Escolaridade da População
  // alfabetizacao_pop_15_mais já mapeado
  fundamental_concluido_18_mais: 'percent',
  fundamental_concluido_15_29: 'percent',
  medio_concluido_18_mais: 'percent',
  medio_concluido_18_29: 'percent',
};

let updated = 0;
let missing = [];

for (const [cycleName, cycle] of Object.entries(data.cycles)) {
  for (const category of cycle.categories) {
    for (const item of category.items) {
      const expectedVm = VALUE_MODE_MAP[item.key];
      if (!expectedVm) {
        missing.push(`${cycleName} / ${category.key} / ${item.key}`);
        continue;
      }
      if (item.value_mode !== expectedVm) {
        item.value_mode = expectedVm;
        updated++;
      }
    }
  }
}

if (missing.length > 0) {
  console.log('Indicators not mapped (need manual review):');
  missing.forEach((m) => console.log('  - ' + m));
}

console.log(`Updated ${updated} indicators.`);
fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n', 'utf-8');
console.log('File written.');

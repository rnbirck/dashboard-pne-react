import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const dataDir = join(repoRoot, 'docs', 'data');
const jsonNames = [
  'financeiro_agudo_exemplo.json',
  'financeiro_nova_santa_rita_exemplo.json',
  'financeiro_porto_alegre_exemplo.json',
  'financeiro_andre_da_rocha_exemplo.json',
  'financeiro_amaral_ferrador_exemplo.json',
  'financeiro_santa_cruz_do_sul_exemplo.json',
];
const requiredArtifacts = [
  'docs/DIAGNOSTICO_FINANCEIRO_MUNICIPAL_AUDITORIA.md',
  'docs/DIAGNOSTICO_FINANCEIRO_MUNICIPAL_METODOLOGIA.md',
  'docs/DIAGNOSTICO_FINANCEIRO_MUNICIPAL_FONTES.md',
  'docs/DIAGNOSTICO_FINANCEIRO_MUNICIPAL_PROTOTIPO.md',
  'docs/data/diagnostico_financeiro_disponibilidade.csv',
  'docs/data/diagnostico_financeiro_amostra.csv',
  'src/features/diagnostic/municipalFinanceTypes.ts',
  ...jsonNames.map((name) => `docs/data/${name}`),
];
const examples = jsonNames.map((name) => JSON.parse(readFileSync(join(dataDir, name), 'utf8')));

const allowedStages = new Set([
  'forecast',
  'authorized',
  'committed',
  'transferred',
  'received',
  'budgeted',
  'empenhado',
  'liquidado',
  'paid',
  'balance',
  'not_applicable',
]);
const allowedNatures = new Set([
  'official_estimate',
  'confirmed',
  'municipal_declared',
  'panel_displayed',
  'local_calculation',
]);
const allowedProgramStatuses = new Set([
  'confirmed_beneficiary',
  'confirmed_non_beneficiary',
  'eligible',
  'not_eligible',
  'under_analysis',
  'selected',
  'agreement_signed',
  'transferred',
  'balance_available',
  'not_verified',
]);
const favorableStatuses = new Set([
  'confirmed_beneficiary',
  'eligible',
  'selected',
  'agreement_signed',
  'transferred',
  'balance_available',
]);

function walkFiles(root, predicate = () => true) {
  if (!existsSync(root)) return [];
  return readdirSync(root, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = join(root, entry.name);
    if (entry.isDirectory()) return walkFiles(fullPath, predicate);
    return predicate(fullPath) ? [fullPath] : [];
  });
}

function collectFinancialValues(value, path = '$', result = []) {
  if (!value || typeof value !== 'object') return result;
  if (
    Object.prototype.hasOwnProperty.call(value, 'value') &&
    Object.prototype.hasOwnProperty.call(value, 'unit') &&
    Object.prototype.hasOwnProperty.call(value, 'referenceYear')
  ) {
    result.push({ path, value });
  }
  if (Array.isArray(value)) {
    value.forEach((item, index) => collectFinancialValues(item, `${path}[${index}]`, result));
  } else {
    Object.entries(value).forEach(([key, child]) => collectFinancialValues(child, `${path}.${key}`, result));
  }
  return result;
}

test('1. todos os artefatos P5-A existem e os JSONs serializam', () => {
  requiredArtifacts.forEach((path) => assert.equal(existsSync(join(repoRoot, path)), true, path));
  examples.forEach((document) => assert.deepEqual(JSON.parse(JSON.stringify(document)), document));
});

test('2. cada exemplo implementa a estrutura municipal-finance-v1', () => {
  examples.forEach((document) => {
    assert.equal(document.schemaVersion, 'municipal-finance-v1');
    assert.equal(document.methodologyVersion, 'municipal-finance-p5a-v1');
    ['municipality', 'referencePeriod', 'dataQuality', 'summary', 'transfers', 'programStatuses', 'execution', 'reconciliation', 'perStudent', 'educationLinks', 'educationalScoreIsolation', 'sources', 'generationMetadata']
      .forEach((key) => assert.ok(document[key], `${document.municipality.name}: ${key}`));
  });
});

test('3. a amostra cobre os perfis municipais exigidos sem duplicar IBGE', () => {
  const codes = examples.map((document) => document.municipality.ibgeCode);
  const roles = examples.flatMap((document) => document.municipality.sampleRoles).join(' ').toLowerCase();
  assert.equal(new Set(codes).size, examples.length);
  assert.match(roles, /capital/);
  assert.match(roles, /pequeno porte/);
  assert.match(roles, /médio porte/);
  assert.match(roles, /rural/);
  assert.match(roles, /beneficiário vaar confirmado/);
  assert.match(roles, /informação financeira insuficiente/);
});

test('4. exercício fechado e período corrente permanecem separados', () => {
  examples.forEach((document) => {
    assert.equal(document.referencePeriod.primaryFiscalYear, 2024);
    assert.equal(document.referencePeriod.currentPartialYear, 2026);
    assert.equal(document.referencePeriod.mixesPeriodsInTotals, false);
    assert.equal(document.summary.confirmedTransfersPrimaryYear.referenceYear, 2024);
    assert.equal(document.summary.officialForecastsCurrentPartialYear.referenceYear, 2026);
  });
});

test('5. todos os estágios financeiros pertencem ao vocabulário controlado', () => {
  examples.forEach((document) => {
    document.transfers.forEach((transfer) => assert.ok(allowedStages.has(transfer.financialStage)));
    collectFinancialValues(document).forEach(({ path, value }) => {
      if (value.financialStage) assert.ok(allowedStages.has(value.financialStage), path);
    });
  });
});

test('6. toda natureza de valor pertence ao vocabulário controlado', () => {
  examples.forEach((document) => {
    document.transfers.forEach((transfer) => assert.ok(allowedNatures.has(transfer.amountNature)));
    collectFinancialValues(document).forEach(({ path, value }) => {
      if (value.amountNature) assert.ok(allowedNatures.has(value.amountNature), path);
    });
  });
});

test('7. previsões oficiais não são tratadas ou somadas como confirmadas', () => {
  examples.forEach((document) => {
    const forecasts = document.transfers.filter((transfer) => transfer.financialStage === 'forecast');
    assert.ok(forecasts.length > 0);
    forecasts.forEach((transfer) => {
      assert.equal(transfer.amountNature, 'official_estimate');
      assert.equal(transfer.canBeSummedWithConfirmedTransfers, false);
      assert.notEqual(transfer.evidenceStatus, 'unavailable');
    });
  });
});

test('8. fontes possuem procedência e chave municipal explícitas', () => {
  examples.forEach((document) => {
    assert.match(document.municipality.ibgeCode, /^43\d{5}$/);
    document.programStatuses.forEach(({ evidence }) => {
      assert.match(evidence.sourceUrl, /^https:\/\//);
      assert.ok(evidence.publisher);
      assert.ok(evidence.accessedAt);
      assert.equal(evidence.municipalityKey, 'ibge_code');
    });
    assert.equal(document.execution.evidence.municipalityKey, 'ibge_code');
  });
});

test('9. status de programa são válidos e favoráveis só usam fonte nominal oficial', () => {
  examples.forEach((document) => document.programStatuses.forEach((program) => {
    assert.ok(allowedProgramStatuses.has(program.status));
    if (favorableStatuses.has(program.status)) {
      assert.equal(program.evidence.evidenceStatus, 'official_nominal');
      assert.equal(program.evidence.municipalityKey, 'ibge_code');
    }
  }));
});

test('10. cada valor financeiro nulo possui motivo estruturado', () => {
  examples.forEach((document) => collectFinancialValues(document).forEach(({ path, value }) => {
    if (value.value === null) {
      assert.ok(value.nullReason && typeof value.nullReason === 'object', path);
      assert.ok(value.nullReason.code, path);
      assert.ok(value.nullReason.category, path);
      assert.ok(value.nullReason.message, path);
      assert.ok(Array.isArray(value.nullReason.sourceIds), path);
    }
  }));
});

test('11. ausência não é convertida silenciosamente em zero', () => {
  const andre = examples.find((document) => document.municipality.ibgeCode === '4300661');
  assert.equal(andre.execution.outstandingNonProcessed.value, null);
  assert.equal(andre.execution.outstandingNonProcessed.nullReason.code, 'not_published');
  examples.forEach((document) => collectFinancialValues(document).forEach(({ path, value }) => {
    if (value.value === 0) assert.ok(value.amountNature, `${path}: zero sem natureza`);
  }));
});

test('12. transferências registram programa, valor, fonte, evidência, período e parcialidade', () => {
  examples.forEach((document) => document.transfers.forEach((transfer) => {
    assert.ok(transfer.transferId);
    assert.ok(transfer.programId);
    assert.equal(typeof transfer.amount.value, 'number');
    assert.ok(transfer.sourceId);
    assert.ok(transfer.evidenceStatus);
    assert.equal(transfer.referenceYear, transfer.amount.referenceYear);
    assert.equal(typeof transfer.isPartialPeriod, 'boolean');
  }));
});

test('13. SIOPE e SICONFI não aparecem como recurso ou transferência', () => {
  examples.forEach((document) => {
    document.transfers.forEach((transfer) => {
      assert.doesNotMatch(transfer.programId, /siope|siconfi/i);
      assert.doesNotMatch(transfer.sourceId, /siope|siconfi/i);
    });
    const accountingSources = document.sources.filter((source) => /siope|siconfi/i.test(source.sourceId));
    accountingSources.forEach((source) => assert.ok(['execution', 'context_only'].includes(source.use)));
  });
});

test('14. execução mantém empenhado, liquidado, pago, restos e lacunas de natureza separados', () => {
  examples.forEach((document) => {
    const execution = document.execution;
    assert.ok(execution.committed.value >= execution.liquidated.value);
    assert.ok(execution.liquidated.value >= execution.paid.value);
    assert.equal(execution.committed.financialStage, 'empenhado');
    assert.equal(execution.liquidated.financialStage, 'liquidado');
    assert.equal(execution.paid.financialStage, 'paid');
    assert.equal(execution.currentExpense.value, null);
    assert.equal(execution.capitalExpense.value, null);
    assert.equal(execution.currentExpense.nullReason.code, 'different_grain');
  });
});

test('15. divergências SIOPE × SICONFI exigem reconciliação explícita', () => {
  examples.forEach((document) => {
    assert.equal(document.reconciliation.status, 'reconciliation_required');
    assert.deepEqual(document.reconciliation.comparedSourceIds, ['siconfi_dca_function_2024', 'siope_municipal_reports']);
    assert.equal(document.reconciliation.absoluteDifference.value, null);
    assert.equal(document.reconciliation.absoluteDifference.nullReason.code, 'reconciliation_pending');
    assert.ok(document.reconciliation.nextAction);
  });
});

test('16. valores por aluno não misturam anos nem calculam sem denominador', () => {
  examples.forEach((document) => document.perStudent.forEach((metric) => {
    assert.equal(metric.referenceYear, metric.numerator.referenceYear);
    assert.equal(metric.referenceYear, metric.denominator.referenceYear);
    assert.equal(metric.sameReferenceYear, true);
    if (metric.denominator.value === null) {
      assert.equal(metric.calculationAllowed, false);
      assert.equal(metric.value.value, null);
    }
  }));
});

test('17. vínculos educacionais distinguem confirmado de potencial e não afetam escores', () => {
  examples.forEach((document) => document.educationLinks.forEach((link) => {
    assert.equal(link.affectsEducationalScores, false);
    if (link.confirmedAmount.value !== null) assert.equal(link.confirmedAmount.amountNature, 'confirmed');
    if (link.potentialAmount.value !== null) {
      assert.equal(link.potentialAmount.amountNature, 'official_estimate');
      assert.equal(link.evidenceStatus, 'official_nominal');
    }
  }));
});

test('18. escores, síntese e interface permanecem isolados do contrato financeiro', () => {
  examples.forEach((document) => {
    const isolation = document.educationalScoreIsolation;
    ['needScore', 'actionabilityScore', 'confidenceScore', 'priorityScore']
      .forEach((score) => {
        assert.equal(isolation[score], null);
        assert.equal(isolation.nullReasons[score].code, 'score_isolation_required');
      });
    assert.equal(isolation.changesDecisionSummary, false);
    assert.equal(isolation.changesAttentionOrder, false);
    assert.equal(document.generationMetadata.interfacePublished, false);
  });

  const typePath = join(repoRoot, 'src', 'features', 'diagnostic', 'municipalFinanceTypes.ts');
  const loaderPath = join(repoRoot, 'src', 'data', 'municipalFinance.ts');
  const sourceFiles = walkFiles(
    join(repoRoot, 'src'),
    (path) => /\.(?:js|jsx|ts|tsx)$/.test(path) && path !== typePath && path !== loaderPath,
  );
  sourceFiles.forEach((path) => {
    const content = readFileSync(path, 'utf8');
    assert.doesNotMatch(content, /municipalFinanceTypes|municipal-finance-v1|financeiro\.json/, relative(repoRoot, path));
  });
});

test('19. fixtures P5-A permanecem protótipos e o P5-B1 não entra em index.json', () => {
  examples.forEach((document) => {
    assert.equal(document.generationMetadata.publicDataRegenerated, false);
    assert.equal(document.generationMetadata.prototypeOnly, true);
  });
  const municipalityIndex = JSON.parse(
    readFileSync(join(repoRoot, 'public', 'data', 'municipios_index.json'), 'utf8'),
  );
  assert.equal(municipalityIndex.municipios.length, 497);
  municipalityIndex.municipios.forEach((municipality) => {
    const index = JSON.parse(
      readFileSync(join(repoRoot, 'public', 'data', 'municipios', municipality.slug, 'index.json'), 'utf8'),
    );
    assert.equal(Object.hasOwn(index, 'financeiro'), false, municipality.slug);
  });
});

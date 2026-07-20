# Diagnóstico financeiro municipal — implementação P5-B1

## Resultado

A P5-B1 industrializa o contrato `municipal-finance-v1` para os 497 municípios do Rio Grande do Sul. A geração usa exclusivamente fontes oficiais nominais classificadas como prontas na P5-A, produz um contrato lógico por município e publica aliases byte a byte idênticos por slug e código IBGE.

Na P5-B1 não foi criada interface financeira. Os arquivos `index.json`, a síntese educacional P3-C, o piloto P4-B, os escores e a ordenação decisória permanecem independentes.

**Atualização P5-C1:** o contrato agora possui consumidor público próprio na rota
lazy `#financeiros-panorama`, documentado em
[DIAGNOSTICO_FINANCEIRO_MUNICIPAL_INTERFACE_P5C1.md](DIAGNOSTICO_FINANCEIRO_MUNICIPAL_INTERFACE_P5C1.md).
A interface não altera nem regenera os contratos P5-B1.

## Fontes integradas

| Fonte | Ano | Cobertura municipal | Uso |
| --- | ---: | ---: | --- |
| Fundeb — receita total prevista | 2026 | 497/497 | total anual e condição VAAF |
| Fundeb — VAAT e complementação | 2026 | 497/497; 14 com complementação | valor previsto, separado da habilitação para cálculo |
| Fundeb — habilitação para cálculo VAAT | 2026 | 497/497 | status técnico; não equivale a benefício |
| Fundeb — status nominal VAAR | 2026 | 497/497; 274 beneficiários | beneficiário ou não beneficiário confirmado |
| Fundeb — previsão nominal VAAR | 2026 | 274/497 | previsão somente para beneficiários publicados |
| QSE distribuída/realizada | 2024 | 497/497 | valor distribuído, matrículas e coeficiente |
| QSE estimada | 2026 | 497/497 | estimativa anual e coeficiente |
| SICONFI DCA, função 12 | 2024 | 497/497 nos três estágios centrais | empenhado, liquidado, pago e restos publicados |

Os arquivos do FNDE são baixados e validados por cabeçalho e código IBGE. A DCA é consultada pela API oficial do Tesouro. O snapshot normalizado guarda hashes SHA-256 das fontes, ano, data de acesso, métricas de chave e os registros usados na geração.

## Fontes mantidas fora

Transferências efetivas do Fundeb, SIOPE corrente, PNAE, PNATE, PEATE/RS, PDDE, PAR/Novo PAR, Novo PAC, Escola em Tempo Integral e Caminho da Escola não entram nos contratos. Permanecem somente no catálogo global com status `manual`, `blocked` ou `needs_hardening`. Nenhum zero é imputado por ausência dessas fontes.

## Execução reproduzível

Atualização das fontes e geração completa:

```powershell
python data_pipeline/scripts/generate_municipal_finance.py --refresh-sources --sync-public --write-reports --validate --check-determinism
```

Regeneração offline a partir do snapshot versionado:

```powershell
python data_pipeline/scripts/generate_municipal_finance.py --sync-public --write-reports --validate --check-determinism
```

O script escreve primeiro em `data_pipeline/export/data_partitioned` e, quando `--sync-public` é informado, sincroniza somente os artefatos financeiros em `public/data`. A escrita compara bytes, é idempotente e fixa versão, corte e timestamp metodológico.

## Arquitetura dos artefatos

```text
public/data/
  financeiro/
    catalogos.json
    cobertura.json
    manifest.json
  municipios/
    <slug>/financeiro.json
    <codigo-ibge>/financeiro.json
```

Existem 497 contratos lógicos e 994 arquivos municipais por causa dos aliases. `financeiro.json` não é incorporado a `index.json`. URLs, mensagens completas e descrições permanecem em `financeiro/catalogos.json`; o contrato municipal usa apenas códigos compactos.

## Campos renomeados e compatibilidade

| P5-A | P5-B1 | Regra |
| --- | --- | --- |
| `confirmedTransfersPrimaryYear` | `confirmedTransfersCoveredBySources` | soma somente confirmado, transferido, mesmo exercício, não sobreposto e autorizado |
| `officialForecastsCurrentPartialYear` | `officialAnnualForecastsCurrentYear` | previsão anual não é execução parcial |
| `educationCommittedPrimaryYear` | `dcaEducationCommitted` | explicita DCA, função Educação, declaração municipal e ano |

As interfaces detalhadas e os seis exemplos P5-A permanecem como `MunicipalFinancePrototypeDocumentV1`, marcado como legado. Novos consumidores e o loader usam `MunicipalFinanceDocumentV1`.

## Cobertura por dimensão

Cada contrato publica `coverageByDimension` para transferências confirmadas, previsões, status, execução, aplicação constitucional, indicadores por aluno e reconciliação. A taxa geral opaca foi removida do artefato industrializado.

- Fundeb total, status VAAR, QSE distribuída/estimada e estágios DCA centrais: 497/497.
- VAAF: nenhum município do RS tem valor previsto na publicação usada; os 497 recebem status nominal de não beneficiário para esse exercício.
- VAAT: 14 municípios têm complementação prevista; os outros 483 permanecem sem valor e como não beneficiários. Todos estão habilitados para cálculo, condição que não é tratada como benefício.
- VAAR: 274 beneficiários com previsão e 223 não beneficiários sem valor potencial.
- Restos não processados: 357/497 com valor publicado; 140 nulos com razão.
- Restos processados: 400/497 com valor publicado; 97 nulos com razão.
- RREO: `mapping_pending` em 497/497.
- Reconciliação: `pending_source` em 497/497 pela ausência de SIOPE corrente reproduzível.

`dataQuality.level` é derivado das dimensões. Resultaram 336 contratos `medium` e 161 `insufficient`, estes últimos por ausência de ao menos um estágio esperado da DCA, sempre acompanhada de razões. O nível mede cobertura da evidência, não desempenho financeiro.

## Soma e dupla contagem do Fundeb

O total anual do Fundeb é apresentado isoladamente. VAAF, VAAT e VAAR guardam `includedInFundebTotal`, `compositionStatus`, `doubleCountingRisk` e `summationAllowed`.

- Complementação reconciliada com a coluna do total: `included_in_total` e `summationAllowed: false`.
- Composição não comprovada: `composition_not_reconciled` e `summationAllowed: false`.
- Benefício não equivale a recebimento; todas as parcelas de 2026 permanecem `official_estimate`/`forecast`.

## QSE e indicador por matrícula

QSE distribuída de 2024 e estimativa de 2026 são registros distintos e não são somados. O valor distribuído usa estágio `transferred`, não saldo disponível. `qseDistributedPerEnrollment` só é calculado com valor e matrículas do mesmo arquivo, município e ano. A memória de cálculo registra fórmula, referências, fonte e exercício; denominador zero produz nulo estruturado.

## DCA e indicadores derivados

A função `12 - Educação` publica empenhado, liquidado, pago e restos a pagar. São calculadas apenas:

- `liquidatedToCommittedRate`;
- `paidToCommittedRate`;
- `paidToLiquidatedRate`;
- `outstandingToCommittedRate`.

As taxas usam a mesma fonte, ano e função e não recebem interpretação de eficiência, capacidade financeira ou caixa. `budgeted`, corrente e capital permanecem nulos porque o Anexo I-E não oferece o mapeamento necessário.

## RREO e reconciliação

A especificação oficial da API SICONFI não inclui `RREO-Anexo 08` no enum de anexos. A consulta de Agudo para o sexto bimestre de 2024 retorna o demonstrativo simplificado com anexos 01, 02, 03, 04, 06, 07, 09, 10, 11 e 14, sem o Anexo 08. O mapeamento legal de MDE, Fundeb e remuneração não foi provado e permanece `mapping_pending`.

Sem SIOPE corrente reproduzível, a DCA continua válida como `municipal_declared`, mas a reconciliação é `pending_source`. Diferenças absoluta e percentual ficam nulas com razão explícita.

## Amostra validada

### Agudo

- QSE distribuída 2024: R$ 1.045.009,11.
- Fundeb previsto 2026: R$ 21.730.973,67.
- VAAR: não beneficiário, sem valor potencial.
- Educação empenhada DCA 2024: R$ 25.722.214,85.
- Reconciliação: `pending_source`.

### Nova Santa Rita

- QSE distribuída 2024: R$ 2.708.177,56.
- Fundeb previsto 2026: R$ 52.320.936,15.
- VAAR: beneficiário; R$ 3.360.004,63 previstos, incluídos no total e bloqueados para nova soma.
- Educação empenhada DCA 2024: R$ 65.292.191,64.

### André da Rocha

- Qualidade: `insufficient` por dimensão incompleta.
- QSE distribuída 2024: R$ 92.723,91.
- Fundeb previsto 2026: R$ 1.557.177,37.
- Restos não processados: nulo com `not_published`, nunca zero.
- `outstandingToCommittedRate`: nulo por componente ausente.

## Medição da geração

| Medida | Resultado da execução validada |
| --- | ---: |
| geração a partir do snapshot | 10,415 s |
| carregamento local e parse dos 497 contratos | 139,428 ms |
| tamanho médio lógico | 16.770 bytes |
| maior contrato | 17.011 bytes |
| volume dos 497 contratos lógicos | 8.334.459 bytes |
| volume com aliases | 16.668.918 bytes |
| determinismo | hashes das duas gerações idênticos |

A aquisição inicial da DCA, com 497 consultas e checkpoint, levou aproximadamente 684 segundos. Na geração P5-B1 o frontend ainda não importava o loader nem os contratos. Desde a P5-C1, o loader e a apresentação pertencem a um chunk lazy próprio; os contratos continuam fora do bundle e são solicitados individualmente em `public/data` somente ao abrir o panorama.

## Critérios para P5-B2 e continuidade P5-C

P5-B2 requer um mapeamento reproduzível do RREO ou decisão formal de mantê-lo fora, trilha nominal de transferências efetivas do Fundeb, conector corrente do SIOPE e reconciliação campo a campo. A P5-C1 concluiu a primeira regra de publicação, a apresentação de cobertura e limitações e os estados do loader, sem usar a camada financeira para recalcular escores educacionais. A P5-C2 continua bloqueada pelas fontes e reconciliações acima.

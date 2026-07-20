# Plano de implementação do diagnóstico municipal aprofundado

**Status:** P0, P1/P1.2, P2, P3-A, P3-B, P3-C, P4-A, piloto P4-B, P5-A, P5-B1 e P5-C1.1 implementados até 20/07/2026; a ampliação de P4, P5-B2, P5-C2 e P6 permanece como proposta.  
**Princípio:** substituir a duplicação atual por um contrato único calculado no pipeline e apenas apresentado no React.

Detalhes, decisões, testes e migração de P0/P1: `docs/DIAGNOSTICO_MUNICIPAL_IMPLEMENTACAO_P0_P1.md`. Schema publicado: `docs/DIAGNOSTICO_MUNICIPAL_SCHEMA_V2.md`.

Referência estadual e relações potenciais de financiamento: `docs/DIAGNOSTICO_MUNICIPAL_IMPLEMENTACAO_RS_FINANCIAMENTO.md`.

Trajetória, governabilidade, exposição, pares e carregamento sob demanda: `docs/DIAGNOSTICO_MUNICIPAL_IMPLEMENTACAO_TRAJETORIA_GOVERNABILIDADE.md`.

## P0 — corrigir validade legal e impedir conclusões indevidas

**Concluído nesta etapa.** Os bloqueios, domínios, nulos auditáveis e a separação entre texto legal e operacionalização estão no contrato `municipal-diagnostic-v2`.

- [x] Atualizar a matriz legal para marcar a conferência de 73/73 metas e guardar data/fonte oficial.
- [x] Corrigir ou desabilitar distância à meta para:
   - `basico_15_17` enquanto usar meta 85% em vez da Meta 4.a vigente;
   - `alfabetizacao` enquanto omitir o marco de 80% em 2031;
   - SAEB enquanto o card principal omitir nível básico e marcos finais;
   - `medio_tecnico_articulado_percentual` enquanto o numerador principal excluir concomitantes;
   - `fundamental_concluido_18_mais` como proxy etária;
   - AEE, mantendo-o informativo até existir denominador do público elegível.
- [x] Preservar bruto e exibido nos percentuais de atendimento; aceitar valores acima de 100% quando a política metodológica declara matrículas localizadas sobre população residente e calcular a referência operacional com o valor integral.
- [x] Expor `dataStatus`, correspondência legal, operacionalização, `methodologyVersion`, fonte e flags no artefato municipal.

**Aceite:** nenhum indicador incompatível aparece como meta direta; todos os `null` mantêm razão de ausência; catálogo e resultado reconciliam 49 chaves.

## P1 — contrato canônico do diagnóstico

**Concluído nesta etapa.** O pipeline é a fonte única, `diagnostico_v2` é serializado e o React apenas apresenta o contrato. O campo legado permanece temporariamente como adaptador depreciado.

- [x] Implementar no pipeline o contrato de `src/features/diagnostic/diagnosticTypes.ts` ou equivalente Python serializável.
- [x] Mover resumo, referências atingidas, lacunas, exclusões e ordem provisória para uma única função de domínio no pipeline.
- [x] Remover a divergência entre `data_pipeline/src/views/diagnostico.py` e o recálculo privado de `src/components/DiagnosticPanel.jsx`.
- [x] Fazer o React consumir o contrato pronto; manter filtros de apresentação sem recalcular regra de negócio.
- [x] Versionar método provisório, data de geração e fontes. Pesos não foram criados porque o escore aprofundado permanece adiado para P6.

**Aceite:** dado o mesmo payload, pipeline e frontend exibem os mesmos totais, prioridades, exclusões e motivos.

## P2 — qualidade, trajetória e projeção

1. Incorporar os validadores já existentes de domínio, ano, duplicidade, reconciliação e tendência.
2. Modelar metas com múltiplos marcos e direção explícita.
3. Adotar trajetória oficial do Inep quando publicada; antes disso, usar `configured_unvalidated` e não preencher o campo oficial.
4. Consolidar os sete cenários de atendimento e os quatro cenários de manutenção sob um envelope comum, preservando método específico.
5. Remover caminhos absolutos da projeção populacional e registrar edição, URL, hash e data da fonte.
6. Adicionar intervalos de previsão ou, quando o modelo não os suportar, estado explícito `uncertainty_not_estimated`.
7. Calibrar qualidade por porte de denominador usando backtest 1/3/5 anos.

**Aceite:** cada projeção informa cenário, não promessa; bruto, limite, população, qualidade, incerteza e validação do alvo são auditáveis.

## P3 — benchmarks e governabilidade

**P3-A concluído:** `diagnostico_v2` publica Referência RS por razão de somas,
distribuição municipal do mesmo ano, diferença favorável, percentil direcional e
resumo/destaques calculados no pipeline. A comparação estadual é independente da
distância legal e não altera `attentionItems`. Pares, COREDE/CRE, dependência e
governabilidade permanecem para P3 completo.

**Estabilização concluída:** ausência ou payload desatualizado não vira mais uma
faixa de quatro zeros no React. A seção estadual exige ao menos um benchmark
comparável; quando necessário, o contrato usa o último ano comum somente com
assinatura metodológica integralmente compatível e mantém explícitos o valor e o
ano municipais efetivamente comparados. Agudo, Nova Santa Rita, Aceguá, Porto
Alegre e André da Rocha integram a auditoria dirigida.

1. Integrar ao pipeline COREDE, CRE, população, ruralidade, NSE, oferta por etapa, dependência e porte da rede, com ano e fonte.
2. Publicar para cada indicador comparável:
   - RS ponderado por razão de somas;
   - mediana, Q1, Q3 e percentil municipal;
   - coorte de 20–50 pares com lista e distâncias.
   - incluir valores acima de 100% nos indicadores de base territorial mista quando fórmula, ano, faixa e fontes forem equivalentes, sem cap antes das estatísticas.
3. Reconciliar numerador e denominador por dependência administrativa.
4. Calcular exposição municipal somente quando ambos os componentes estiverem disponíveis.
5. Classificar governabilidade em direta, compartilhada, territorial e indireta, com regra revisável.

**Aceite:** o usuário consegue reproduzir o benchmark e distinguir desempenho territorial de desempenho da rede municipal.

## P4 — desigualdades e relações entre indicadores

**P4-A concluído:** a cobertura disponível e as relações potenciais foram
auditadas sem publicar correlação como causa.

**Piloto P4-B concluído:** somente `basico_integral × urban_rural` foi publicado
em bloco separado no artefato aprofundado. O cálculo usa rede pública, último
ano comum, fórmula e universo idênticos, valores brutos, nulos auditáveis e
supressão primária e complementar de células pequenas. O React carrega o bloco
somente no detalhe do indicador, sem levá-lo ao `index.json` ou à página
principal do Diagnóstico. Método, cobertura, impacto de payload e limitações:
[DIAGNOSTICO_MUNICIPAL_PILOTO_DESIGUALDADE_P4B.md](DIAGNOSTICO_MUNICIPAL_PILOTO_DESIGUALDADE_P4B.md).

Os itens abaixo continuam sendo a proposta para ampliar P4; não foram
implementados pelo piloto:

1. Incluir recortes legalmente relevantes: raça/cor, sexo, NSE, localização, deficiência e, quando possível, território intraurbano.
2. Construir grafo versionado `insumo → atividade → processo → resultado → meta`.
3. Rotular relações como `hypothesis`, `association` ou `supported`; guardar fonte e desenho da evidência.
4. Evitar dupla contagem de indicadores altamente correlacionados no escore.
5. Gerar perguntas diagnósticas e requisitos de dados, não recomendações causais automáticas.

**Aceite do piloto:** nenhuma correlação é descrita como causa; ausência não
vira zero; célula protegida não pode ser inferida; `decisionSummary`,
financiamento, posições e scores permanecem idênticos. Uma futura ampliação
depende de fontes versionadas, cobertura suficiente, universos reconciliados,
proteção de células pequenas, revisão de linguagem e medição de payload.

## P5 — capacidade financeira e portfólio

**P5-A concluído:** a página resolve somente as relações versionadas dos
catálogos globais para os indicadores selecionados em
`decisionSummary.municipalActionItems` e `decisionSummary.coordinationItems`,
sem duplicá-los nos payloads municipais. A interface limita mecanismos
específicos, agrega fontes gerais de MDE, exclui relações sem nexo comprovado e
mantém elegibilidade como `not_verified`. `investigationItems` não alimenta a
síntese financeira. Valores, fontes nominais e portfólio permanecem para P5
completo.

**Estabilização concluída:** somente a seleção descritiva de ação municipal e
pactuação alimenta até três frentes determinísticas, com no máximo três
mecanismos por frente, prioridade `direct` → `conditioned` → `programmatic` e
deduplicação global de programas. Fundeb/QSE ficam na nota geral; SIOPE e
SICONFI/FINBRA não são tratados como recurso. A matriz completa e a ordem legada
de `attentionItems` permanecem intactas apenas para contrato e auditoria.

**P5-B1 concluído:** o pipeline publica um contrato financeiro nominal e
versionado para os 497 municípios, com Fundeb total, estados VAAF/VAAT/VAAR,
QSE realizado e estimado em séries separadas e execução da função Educação da
DCA/SICONFI. A cobertura é explicitada em sete dimensões, nulos carregam motivo
auditável e a composição do Fundeb impede somar novamente complementações já
incluídas no total. RREO permanece `mapping_pending`; SIOPE e programas sem
fonte oficial nominal automatizável não foram integrados. O novo contrato é
carregado sob demanda, não entra no `index.json`, não altera a interface e não
alimenta scores ou ranking. Implementação e contrato:
[DIAGNOSTICO_FINANCEIRO_MUNICIPAL_IMPLEMENTACAO_P5B1.md](DIAGNOSTICO_FINANCEIRO_MUNICIPAL_IMPLEMENTACAO_P5B1.md)
e
[DIAGNOSTICO_FINANCEIRO_MUNICIPAL_SCHEMA_V1.md](DIAGNOSTICO_FINANCEIRO_MUNICIPAL_SCHEMA_V1.md).

**P5-C1 concluída:** a seção existente de Financiamento possui a rota pública
`#financeiros-panorama`, carregada sob demanda e vinculada ao Diagnóstico
municipal. A página apresenta somente valores, estados, taxas, relações e
cobertura do `municipal-finance-v1`, preserva slug/IBGE e contexto de indicador
ou programa e resolve fontes pelo catálogo global. Não foi criado score,
ranking, disponibilidade, lacuna ou recomendação. Implementação:
[DIAGNOSTICO_FINANCEIRO_MUNICIPAL_INTERFACE_P5C1.md](DIAGNOSTICO_FINANCEIRO_MUNICIPAL_INTERFACE_P5C1.md).

**P5-C1.1 concluída:** a mesma página foi compactada sem alterar rota, loader,
contrato ou dados. No desktop, Execução e QSE formam a pilha esquerda e Fundeb
a pilha direita; até 1024 px a ordem é Execução, Fundeb e QSE. Fundeb usa quatro
linhas, QSE três grupos e cobertura/fontes usam disclosures fechados por padrão.
O diagnóstico educacional, seus escores e sua ordem de atenção permanecem
isolados.

1. Ingerir SIOPE e SICONFI/FINBRA com reconciliação de período e classificação.
2. Ingerir consultas nominais Fundeb/VAAF/VAAT/VAAR, QSE, PAR, PDDE, PNATE, PEATE e demais programas.
3. Modelar elegibilidade, janela, restrição de uso, contrapartida, saldo e prestação de contas.
4. Cadastrar custos de capital e recorrentes, capacidade de equipe, situação dominial e prontidão de contratação.
5. Calcular lacuna financeira somente com valores confirmados; manter recursos potenciais em cenário separado.
6. Selecionar portfólio sob orçamento, equipe, prazo e custo futuro.

**Aceite:** cada recomendação financeira cita programa, regra, situação municipal, valor confirmado/potencial e evidência; SIOPE/SICONFI nunca aparecem como fonte de recurso.

## P6 — priorização e publicação

1. Implementar necessidade, acionabilidade e confiança conforme `docs/METODOLOGIA_PRIORIZACAO_PROPOSTA.md`.
2. Aplicar cobertura mínima de 70%, reponderação explícita e `unavailableWeight`.
3. Rodar sensibilidade de pesos e estabilidade do ranking.
4. Manter trilha de auditoria por indicador e município.
5. Só então adaptar a UI existente, reutilizando o sistema visual e sem criar uma segunda regra de cálculo.

**Aceite:** prioridade possui memória de cálculo completa; itens com evidência insuficiente ficam fora da posição ordinal; mudança de peso é reproduzível.

## Dependências externas e pontos de espera

- publicação dos indicadores e projeções por ente pelo Inep;
- regulamentação do Programa Nacional de Infraestrutura Escolar;
- fontes versionadas de população municipal por idade;
- acesso público/automatizável às consultas nominais de financiamento;
- dados locais de demanda, custos, capacidade e desigualdade que não existem no repositório.

Essas dependências não bloqueiam P0 e P1. Elas bloqueiam a publicação de trajetória oficial, prioridade completa e recomendação financeira nominal.
# Etapa P3-C concluída — síntese para decisão

O pipeline agora classifica evidência em quatro faixas e produz
`decisionSummary`. A interface deixou de usar a ordem relativa legada, o
financiamento passou a consumir somente ação municipal e pactuação, e os totais
temáticos passaram a incluir ação, coordenação e investigação. O contrato
legado foi preservado. Critérios, limites e auditorias estão em
[DIAGNOSTICO_MUNICIPAL_SINTESE_DECISAO.md](DIAGNOSTICO_MUNICIPAL_SINTESE_DECISAO.md).

O fechamento visual posterior manteve ações e pactuações, recolheu a
investigação por padrão e agrupou suas limitações em quatro motivos, sem
rolagem interna. As cinco contagens de destino reconciliam o universo de 49
indicadores; resultados disponíveis no filtro são explicitamente um universo
menor. Monitoramento e preservação passaram a ocupar a mesma seção final, em
grupos separados, sem mudança nas coleções do pipeline.

## P5-B2-A — auditoria de fontes concluída

A etapa auditou separadamente Fundeb efetivo, SIOPE corrente, RREO constitucional e MSC. SIOPE OData, RREO Anexo 8 via FNDE/SIOPE e MSC/SICONFI foram classificados `ready_with_mapping` e receberam POCs fora de `public/data`. A transferência efetiva do Fundeb permanece `blocked`.

As coberturas comprovadas são: SIOPE 497/497 em 2024/P6 e 487/497 em 2025/P6; RREO 497/497 em 2024/P6 e 490/497 em 2025/P6; MSC dezembro/2024 e DCA função Educação/2025, 497/497. A reconciliação da amostra confirmou igualdade SIOPE × RREO para valor/taxa de MDE e taxa de remuneração dos profissionais, sem tratar a DCA função 12 como equivalente constitucional.

O exercício principal continua 2024. Não houve integração dos 497 contratos, mudança de interface, score, ranking, capacidade financeira ou recomendação automática. A decisão de integrar qualquer fonte depende de P5-B2-B explícita. Relatórios: [DIAGNOSTICO_FINANCEIRO_MUNICIPAL_AUDITORIA_P5B2.md](DIAGNOSTICO_FINANCEIRO_MUNICIPAL_AUDITORIA_P5B2.md) e [DIAGNOSTICO_FINANCEIRO_MUNICIPAL_RECONCILIACAO.md](DIAGNOSTICO_FINANCEIRO_MUNICIPAL_RECONCILIACAO.md).

## P5-B2-B1 — aplicação constitucional integrada

O contrato `municipal-finance-v1` passou a integrar SIOPE OData e RREO Anexo 8 do FNDE/SIOPE em 2024/P6. Os 497 municípios possuem valor e percentual de MDE, percentual de remuneração dos profissionais e receita Fundeb recebida declarada; os três campos comparáveis foram reconciliados em 497/497, sem parcialidade, fonte ausente ou divergência.

O crosswalk 6→7 dígitos é versionado e único. O RREO guarda URL, `Last-Modified`, tamanho, SHA-256, parser e layout; revisão de hash bloqueia a nova evidência até validação. A DCA função 12 permanece separada de MDE, e a receita Fundeb declarada não entra em transferências confirmadas, saldo ou capacidade financeira.

O schema não mudou; `dataVersion` e `methodologyVersion` foram atualizados. Os aliases continuam byte-idênticos e `financeiro.json` permanece fora de `index.json`. A P5-C1 conserva o mesmo resultado visual por gate explícito de P5-C2; scores, ranking e contratos educacionais não foram alterados. Detalhes: [DIAGNOSTICO_FINANCEIRO_MUNICIPAL_IMPLEMENTACAO_P5B2B1.md](DIAGNOSTICO_FINANCEIRO_MUNICIPAL_IMPLEMENTACAO_P5B2B1.md).

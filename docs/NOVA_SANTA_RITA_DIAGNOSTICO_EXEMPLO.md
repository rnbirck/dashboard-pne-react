# Exemplo de diagnóstico aprofundado — Nova Santa Rita

**Data de referência da auditoria:** 19/07/2026.  
**Dados municipais publicados pelo repositório:** majoritariamente até 2025; SAEB até 2023, rendimento do magistério até 2024 e Censo Demográfico até 2022.  
**Contrato completo:** `docs/data/nova_santa_rita_diagnostico_exemplo.json`.

> **Atualização P0/P1:** o payload municipal agora também publica `diagnostico_v2`, com 49 indicadores e ausências nulas. O React apresenta a ordem recebida do pipeline, sem ranking final. Valores acima de 100% nos indicadores de matrículas localizadas sobre população residente são válidos na definição operacional e exigem interpretação cuidadosa. `basico_15_17`, AEE e EPT articulada permanecem sem distância legal por bloqueios independentes; contratos temporários respeitam a direção `at_most`. As leituras de trajetória, pares e financiamento abaixo são contexto da auditoria e não são geradas como recomendação pelo contrato P0/P1.

> **Atualização P3-A/P5-A:** o contrato passou a publicar Referência RS,
> distribuição municipal, diferença favorável e destaques estaduais calculados
> no pipeline. `basico_15_17` mantém distância legal nula, mas recebe benchmark
> contextual do mesmo ano e fórmula. A interface relaciona somente os
> `attentionItems` aos catálogos financeiros globais; elegibilidade continua
> `not_verified` e nenhum valor financeiro é publicado.

> **Atualização P1.2/P2/P3-B:** o contrato é carregado de
> `diagnostico.json`. Creche recebe `trend_projection`; tempo integral,
> pós-graduação e temporários recebem `component_maintenance`. Escolas
> integrais possuem exposição reconciliada de 100% do numerador e 85,7% do
> denominador municipais. Pares usam coorte de 20 por porte da oferta e
> registram as variáveis demográficas ainda ausentes.

Na ordem existente de `attentionItems`, a interface mostra inicialmente EJA
articulada à EPT e rendimento do magistério relacionados ao PAR/Novo PAR;
salas acessíveis relacionadas a Infraestrutura Escolar, PAR/Novo PAR e Novo
PAC; e educação ambiental relacionada a Infraestrutura Escolar, PAR/Novo PAR
e PDDE. São relações de catálogo, não confirmações de acesso municipal.

## Síntese executiva

Nova Santa Rita tem 46 dos 49 resultados municipais disponíveis. O diagnóstico serializado fornece os indicadores analisados, as referências atingidas e os pontos de atenção; a interface apenas filtra e formata esses totais. O contrato **não publica um ranking final**. P3-A e P5-A não alteram a ordem transitória; P2, P3/P5 completos, P4 e P6 permanecem adiados.

Os sinais mais acionáveis, ainda sujeitos a validação local, são:

1. **creche:** 35,1% em 2025, abaixo do RS ponderado (42,7%) e da mediana municipal válida (48,9%); o cenário de tendência chega a 51,03% em 2036, abaixo da meta de 60%; exposição municipal aproximada de 65,5% das matrículas detalhadas;
2. **matrículas em tempo integral:** 21,0%, ante 35% em 2031; 99,6% das matrículas integrais observadas são municipais; a manutenção fica em 21,0%, e o ritmo necessário é 2,329 p.p./ano contra inclinação observada favorável de 1,286 p.p./ano;
3. **escolas com tempo integral:** 42,9%, ante 50% em 2031; 18 das 21 escolas públicas elegíveis são municipais, e 9 delas atingem o critério; a pequena contagem torna cada escola material;
4. **conclusão/formação docente:** pós-graduação está em 49,4%, abaixo do RS (56,8%), mediana (65,2%) e próximo do 10º percentil de desempenho; a tendência recente é inconclusiva e levemente negativa;
5. **15–17 anos:** o valor é 82,9%, mas a implementação compara com 85%; a lei vigente exige universalização da população de 6–17 anos até o terceiro ano. Somente 24,0% das matrículas detalhadas de 15–17 anos são municipais, exigindo ação compartilhada com a rede estadual.

O indicador de temporários está em 13,2%, melhor que o limite de 30%, embora a tendência seja inconclusiva. Pré-escola está em 97,1%, acima da referência estadual e abaixo da mediana municipal; o cenário bruto ultrapassa 100% porque matrículas e população usam bases territoriais distintas. Essa característica limita a interpretação individual, mas não invalida o índice operacional.

## Evidências selecionadas

| Indicador | Atual | Próximo marco legal | RS ponderado | Mediana municipal | Percentil de desempenho | Ritmo observado / necessário | Cenário 2036 |
|---|---:|---:|---:|---:|---:|---:|---:|
| Creche | 35,1% (2025) | 60% em 2036 | 42,7% | 48,9% | 21,8 | +4,093 / +2,264 p.p./ano | 51,03% |
| Pré-escola | 97,1% (2025) | 100% em 2028 | 94,6% | 101,8% | 33,9 | +1,878 / +0,983 | 125,31% bruto |
| 6–17 anos | 91,1% (2025) | 100% em 2029 | 95,1% | 93,3% | 37,3 | +0,075 / +2,225 | 109,74% bruto |
| 15–17 anos | 82,9% (2025) | 100% em 2029 | 89,1% | 80,8% | 55,6 | +1,574 / +4,270 | 89,94% bruto |
| Matrículas integrais | 21,0% (2025) | 35% em 2031 | 18,3% | 21,1% | 49,6 | +1,286 / +2,329 | 21,02% manutenção |
| Escolas integrais | 42,9% (2025) | 50% em 2031 | 36,1% | 37,5% | 60,2 | +0,833 / +1,190 | 42,86% manutenção |
| Pós-graduação docente | 49,4% (2025) | 70% em 2036 | 56,8% | 65,2% | 10,0 | −0,220 / +1,877 | 49,35% manutenção |
| Temporários | 13,2% (2025) | no máximo 30% em 2031 | 35,8% | 39,5% | 98,5 | meta atingida | 13,17% manutenção |

Os percentis usam a distribuição dos municípios gaúchos com mesmo indicador, ano, faixa etária, fórmula e fontes. Valores acima de 100% das quatro coberturas etárias permanecem na distribuição sem cap. Eles **não** substituem o coorte de municípios semelhantes, ainda ausente.

## Por que a lista atual precisa de revisão humana

Pelo cálculo atual `abs(distância/meta)`, os cinco maiores itens brutos de Nova Santa Rita são EJA articulada à EPT, ensino médio técnico articulado, SAEB Matemática do ensino médio, SAEB Matemática dos anos finais e rendimento do magistério.

Essa ordenação é insuficiente para decisão municipal:

- EJA/EPT e ensino médio técnico têm valor zero, mas dependência administrativa e oferta precisam ser verificadas; ausência de oferta municipal pode ser governabilidade indireta, não falha executiva direta;
- o percentual técnico usa somente matrículas integradas, embora a lei inclua integradas ou concomitantes;
- SAEB do ensino médio é predominantemente responsabilidade estadual e tem série municipal insuficiente para tendência;
- rendimento do magistério não carrega proveniência externa suficiente no contrato e não tem referência estadual comparável publicada;
- nenhum dos cinco inclui custo, elegibilidade financeira, desigualdade interna ou exposição da rede municipal.

## Leituras por prioridade operacional

### Creche

- A correspondência com a Meta 1.a é parcial: cobertura não mede demanda manifesta.
- A tendência Theil–Sen é positiva, mas inconclusiva por alternância recente.
- O cenário de 2036 permanece 8,97 p.p. abaixo da meta.
- Para planejar novas vagas, fila única e fluxos de residentes podem ser usados como informações complementares locais; não corrigem, substituem nem bloqueiam a fórmula existente do indicador.
- Fontes potenciais: Fundeb/QSE como MDE geral; PAR/Novo PAR e seleções de infraestrutura/Novo PAC quando houver janela. Nenhuma elegibilidade local foi verificada.

### Tempo integral

- A rede municipal responde por quase toda a matrícula integral observada, elevando acionabilidade.
- O cenário `last_components` é manutenção, não previsão: conserva 1.286/6.117 e 21,02% até 2036.
- Para escolas, o denominador é 21; converter uma escola altera materialmente o percentual. A intervenção deve ser planejada escola a escola.
- Fontes potenciais: Escola em Tempo Integral, Fundeb, QSE, PAR e infraestrutura; requer pactuação, matrícula comprovada e custo de operação.

### 15–17 anos e ensino médio

- O indicador usa matrícula localizada no município e população residente; essa base territorial conhecida permite valores acima de 100% e não identifica individualmente se o jovem residente estuda dentro ou fora do município.
- O alvo configurado de 85% é incompatível com a Meta 4.a vigente de 100% para 6–17 anos até o terceiro ano.
- A exposição municipal das matrículas observadas é 24,0%; a rede estadual concentra 76,0%.
- Ação recomendável depende de fluxo de residentes, busca ativa, transporte e pactuação Estado–Município, não apenas abertura municipal de vagas.

### Docentes

- Pós-graduação tem forte lacuna contextual em relação aos demais municípios, mas faltam recortes por dependência e área de atuação no contrato do diagnóstico.
- PARFOR atua na adequação inicial; ProEB e outras ações CAPES podem apoiar pós-graduação; participação depende de edital e vagas.
- Temporários já satisfazem o limite agregado, mas o detalhe mostra 43 temporários estaduais e 4 municipais em 2025. O denominador por rede não está exposto, portanto não é possível calcular a taxa temporária municipal separada.

## Dados indisponíveis no caso

- Resultados municipais: `alfabetizacao`, `medio_tecnico_participacao_publica` e `subsequente_expansao`.
- Variáveis adicionais de COREDE/CRE, população, ruralidade, NSE e capacidade fiscal no coorte de semelhantes; a versão atual usa porte da oferta.
- Desigualdade interna por raça/cor, sexo, nível socioeconômico, localização e deficiência.
- Demanda manifesta de creche.
- Exposição municipal reconciliada para a maior parte dos indicadores.
- SIOPE/SICONFI, custos, saldos, elegibilidade nominal e situação dos programas.
- Indicadores e trajetórias oficiais por ente a serem definidos pelo Inep.

## Testes de robustez de porte

- **André da Rocha:** denominador 188 no indicador integral de 2025; MAE retrospectivo do cenário de manutenção 5,914 p.p. A priorização precisa penalizar incerteza e mostrar contagens.
- **Porto Alegre:** denominador 138.494; MAE 2,049 p.p. A estabilidade agregada é maior, mas a média municipal pode esconder desigualdades intraurbanas.

Esses contrastes sustentam duas regras: não comparar apenas percentuais sem denominador e não aceitar agregado de rede grande sem recortes territoriais.
# Leitura P3-C

O exemplo passa a usar `decisionSummary`: até três oportunidades de ação
municipal, duas pactuações e uma faixa fechada de investigação. Nenhum item
`insufficient_evidence` aparece como destaque principal ou alimenta a síntese
financeira. Os totais e itens concretos deste município são regenerados no
payload documentado em `docs/data/nova_santa_rita_diagnostico_exemplo.json`.

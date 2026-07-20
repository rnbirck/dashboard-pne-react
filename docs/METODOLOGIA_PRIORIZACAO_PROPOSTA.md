# Metodologia proposta para priorização do diagnóstico municipal

**Status:** proposta técnica; não implementada na interface.  
**Versão:** `priority-methodology-proposal-v1` — 19/07/2026.  
**Premissa legal:** a Lei nº 15.388/2026 está vigente, mas, na data desta auditoria, os indicadores e as projeções por ente ainda estavam dentro do prazo legal de 180 dias para definição pelo Inep. Até a publicação oficial, trajetórias locais configuradas devem ser rotuladas como referências de planejamento, não como projeções oficiais.

## 1. O que a prioridade deve responder

A ordenação deve separar três perguntas:

1. **Necessidade:** qual problema é maior, mais urgente e mais desigual?
2. **Acionabilidade:** quanto a rede municipal consegue influenciar e executar?
3. **Confiança:** quão segura e comparável é a evidência?

O método atual responde somente a uma parte da primeira pergunta, com `abs(distância/meta)`. A proposta impede que uma lacuna grande, porém não governável ou metodologicamente frágil, seja apresentada como recomendação executiva pronta.

## 2. Contrato mínimo e estados de ausência

O contrato tipado está em `src/features/diagnostic/diagnosticTypes.ts`. Cada observação deve assumir exatamente um estado:

- `available`;
- `missing`;
- `not_applicable`;
- `pending_official_definition`;
- `methodologically_incompatible`;
- `unverifiable`.

`null` continua sendo `null`. O sistema não converte ausência em zero, não cria média estadual quando o método é incompatível e não imputa trajetória oficial inexistente.

## 3. Porta de elegibilidade

Um indicador só entra no escore de necessidade quando:

- tem valor finito, ano, unidade, direção e alvo compatíveis;
- a fórmula e o universo são comparáveis no tempo;
- a correspondência legal é `direct` ou `partial`, com limitação explícita;
- o valor respeita o domínio conceitual ou possui regra oficial para excedê-lo;
- a fonte e a versão metodológica são identificáveis;
- indicadores acumulativos com ano-base ainda sem variação observável não são interpretados como fracasso.

Proxies podem aparecer como contexto e gerar demanda de investigação, mas não recebem distância legal como se fossem medidas diretas. Indicadores informativos nunca são promovidos a meta por conveniência.

## 4. Trajetória e ritmo

### 4.1 Trajetória de referência

Para meta com marcos `(b, yb)` e `(t, yt)`, a trajetória linear auditável no ano `y` é:

```text
esperado(y) = b + (t - b) * (y - yb) / (yt - yb)
```

O ponto `b` deve vir da definição oficial do Inep ou de baseline formalmente aprovado. Não se usa o primeiro valor observado como baseline legal sem identificação. Sem baseline válido, `expectedCurrentValue = null`.

Metas com marcos intermediário e final são avaliadas em segmentos separados. Isso é obrigatório para alfabetização infantil, SAEB, tempo integral, AEE, EJA/EPT, alfabetização de adultos e conectividade.

### 4.2 Ritmo observado e necessário

- Ritmo observado: inclinação Theil–Sen na janela mais recente de até cinco anos, usando distâncias reais entre anos; mínimo de três observações conforme o método já existente no pipeline.
- Ritmo favorável: `slope` para metas `at_least` e `-slope` para `at_most`.
- Ritmo necessário: `gap_favorável / anos_restantes`.
- Fator de aceleração: `ritmo_necessário / ritmo_observado_favorável`, somente quando ambos são positivos.
- Se há lacuna e o ritmo favorável é zero ou negativo, o fator é `null` e o estado é `not_on_track`; não se publica infinito como número.

O componente de urgência de ritmo é:

```text
paceNeed = 0, se a meta já foi atingida
paceNeed = 100, se há lacuna e o ritmo favorável <= 0
paceNeed = 100 * clamp((ritmoNecessário - ritmoObservado) / ritmoNecessário, 0, 1)
```

Cenários de manutenção e tendência são contrafactuais de planejamento. Devem preservar valor bruto, limites aplicados, qualidade, aviso e, quando disponível, intervalo de previsão. Não são uma promessa de resultado.

## 5. Comparação territorial

### 5.1 Rio Grande do Sul

- Referência estadual: razão de somas (`100 * Σnumerador / Σdenominador`) para indicadores de razão; nunca média simples de percentuais municipais.
- Distribuição municipal: mediana, Q1, Q3 e percentil calculados sobre o mesmo ano, fórmula, universo e unidade.
- Valores fora do domínio não entram silenciosamente: são contados em `excludedOutOfRange` e geram flag.

### 5.2 Municípios semelhantes

O coorte deve ser reproduzível e versionado:

1. restringir a RS, mesmo ano, mesma fórmula, mesma oferta de etapa/modalidade e mesma base territorial;
2. estratificar por porte da população e porte da rede, sem criar grupos com menos de 20 observações;
3. calcular distância padronizada com população 0–17, ruralidade, nível socioeconômico, composição da rede por dependência e oferta por etapa;
4. preferir mesmo COREDE; usar CRE como camada operacional separada, nunca como substituto automático;
5. selecionar 20 a 50 vizinhos mais próximos e registrar variáveis, pesos, distância máxima e relaxamentos;
6. publicar lista dos pares, ano e cobertura. Se o mínimo não for alcançado, o componente fica ausente.

Não se recomenda clusterização opaca como primeira versão. O pareamento por regras e distância é revisável por gestores e permite explicar por que cada município foi incluído.

O componente de pares é `100 - percentil_de_desempenho`, considerando a direção da meta.

## 6. Escore de necessidade

| Componente | Peso | Regra |
|---|---:|---|
| Lacuna para a trajetória | 35% | lacuna favorável normalizada pelo percurso baseline–meta; requer baseline válido |
| Lacuna para pares semelhantes | 25% | `100 - percentil de desempenho` no coorte |
| Ritmo insuficiente | 25% | `paceNeed` |
| Desigualdade interna | 15% | maior lacuna padronizada entre grupos legalmente relevantes, com cobertura mínima |

Política de ausência:

- calcular apenas se componentes disponíveis somarem ao menos 70% do peso;
- quando o limiar for atingido, reponderar explicitamente por `Σpesos_disponíveis` e publicar `unavailableWeight`;
- abaixo de 70%, `needScore = null`;
- nunca atribuir zero a componente ausente.

## 7. Acionabilidade municipal

| Componente | Peso | Evidência necessária |
|---|---:|---|
| Governabilidade | 40% | responsabilidade legal e operacional: direta 100, compartilhada 60, territorial 30, indireta 20 |
| Exposição municipal | 25% | parcela reconciliada do numerador e denominador sob rede municipal |
| Financiamento confirmado | 20% | elegibilidade nominal, janela vigente, saldo/repasse ou ação aprovada |
| Prontidão | 15% | projeto, equipe, custo, situação dominial, contratação e operação/manutenção |

A existência de um programa no catálogo não pontua financiamento. Sem consulta nominal e evidência de acesso, o componente permanece `null`.

A mesma regra de cobertura mínima de 70% é aplicada. O exemplo de Nova Santa Rita calcula acionabilidade somente para os poucos indicadores com exposição municipal quantificável; os demais preservam `null`.

## 8. Confiança

| Dimensão | Peso máximo |
|---|---:|
| Fonte e proveniência reproduzíveis | 30 |
| Correspondência entre fórmula e meta legal | 30 |
| Atualidade, continuidade e tendência | 25 |
| Benchmark estadual comparável | 15 |

Faixas propostas: alta `>= 80`, média `60–79`, baixa `40–59`, insuficiente `< 40`. A pontuação e os flags devem ser mostrados juntos; a faixa não apaga limitações específicas.

## 9. Escore final e categorias

Somente quando necessidade, acionabilidade e confiança forem elegíveis:

```text
priorityScore = 0,60 * needScore
              + 0,25 * actionabilityScore
              + 0,15 * confidenceScore
```

Categorias iniciais, a calibrar por backtest e revisão humana:

- `>= 75`: prioridade crítica;
- `60–74,9`: prioridade alta;
- `40–59,9`: prioridade de monitoramento e ação seletiva;
- `< 40`: acompanhamento;
- qualquer porta de evidência não satisfeita: `insufficient_evidence`, sem posição ordinal.

Pesos e cortes devem passar por análise de sensibilidade. A publicação deve permitir reordenar sem o componente de confiança para verificar se a disponibilidade de dados está dominando a política.

## 10. Governabilidade e cadeia de intervenção

Cada indicador deve ser associado a uma cadeia, não a uma causa presumida:

```text
insumo -> capacidade/atividade -> cobertura/processo -> resultado -> meta legal
```

Exemplos:

- creche: demanda validada → projeto/vagas/equipe → matrículas de residentes → cobertura;
- tempo integral: infraestrutura + profissionais + desenho pedagógico → oferta de jornada → matrícula integral;
- aprendizagem: frequência + práticas pedagógicas + apoio → proficiência; infraestrutura é condição possível, não explicação suficiente;
- adequação docente: vagas de formação + liberação/adesão → conclusão na área → adequação das docências;
- transporte/alimentação: condições de permanência → frequência; não são substitutos do indicador de aprendizagem.

Relações causais só recebem status `supported` quando houver desenho e fonte apropriados. Correlação municipal é `association`, e hipótese de gestão é `hypothesis`.

## 11. Validação antes de produção

1. congelar fonte, versão e universo;
2. reconciliar numerador/denominador por dependência;
3. validar domínios, duplicidades, quebras metodológicas e anos;
4. backtest temporal por horizontes 1, 3 e 5 anos, por porte de denominador;
5. testar estabilidade do ranking a pesos, cortes e retirada de componentes;
6. revisar falsos positivos com municípios pequenos e redes grandes;
7. comparar o resultado com avaliação humana documentada, sem usar a avaliação humana como dado oculto;
8. publicar motivos de inclusão, exclusão e ausência para cada indicador.

André da Rocha (denominador 188 no cenário integral de 2025; MAE retrospectivo 5,914 p.p.) e Porto Alegre (138.494; MAE 2,049 p.p.) foram usados como testes de contraste. O erro maior no caso pequeno confirma que denominador e incerteza precisam participar da confiança, enquanto o caso grande exige desagregação intraurbana para evitar que a média esconda desigualdades.

# P5-B2-A — auditoria e reprodutibilidade das fontes financeiras municipais

Data da auditoria: **20/07/2026**. Escopo: 497 municípios do Rio Grande do Sul. Esta etapa termina na auditoria e na prova de conceito; não autoriza publicação nos contratos `municipal-finance-v1`.

## Resultado executivo

Nenhuma fonte nova atingiu `ready`. Três trilhas atingiram `ready_with_mapping`: indicadores correntes do SIOPE via OData, RREO Anexo 8 via diretório oficial do FNDE/SIOPE e MSC orçamentária via API do SICONFI. Elas são oficiais, automatizáveis, hasháveis, têm chave municipal e superam 95% de cobertura, mas ainda precisam de crosswalk, mapeamento contábil ou política de layout/retificação antes da P5-B2-B.

A transferência efetiva do Fundeb continua `blocked`: as rotas oficiais localizadas são consultas manuais ou uma API interna não documentada do Banco do Brasil que respondeu HTTP 503 de forma idêntica em duas execuções. Nenhuma previsão anual foi tratada como realizado.

| Trilha | Melhor fonte comprovada | Gate | Cobertura | Decisão de parada |
| --- | --- | --- | --- | --- |
| A. Fundeb efetivo | consultas FNDE → STN/BB | `blocked` | não aferível | bloqueada |
| B. SIOPE corrente | FNDE Olinda OData — indicadores | `ready_with_mapping` | 497/497 em 2024; 487/497 em 2025 | aprovada com mapeamento adicional |
| C. RREO constitucional | PDFs do Anexo 8 no FTP FNDE/SIOPE | `ready_with_mapping` | 497/497 em 2024; 490/497 em 2025 | aprovada com mapeamento adicional |
| D. MSC/natureza | SICONFI `msc_orcamentaria` | `ready_with_mapping` | 497/497 com entrega de dezembro/2024 | aprovada com mapeamento adicional |

O inventário completo está em [diagnostico_financeiro_fontes_p5b2.csv](data/diagnostico_financeiro_fontes_p5b2.csv).

## Gates aplicados

`ready` exige simultaneamente órgão oficial, acesso sem intervenção, chave municipal estável, exercício/período, estágio e natureza explícitos, esquema validável, cobertura mínima de 95%, duplicidades explicáveis, URL/hash/data, teste de contrato e duas execuções estáveis. A ausência de qualquer requisito impede `ready`; a cobertura não compensa semântica incompleta.

Os gates usados são os solicitados: `ready`, `ready_with_mapping`, `needs_hardening`, `manual`, `blocked`, `not_current` e `unavailable`. Um POC foi criado somente para as três fontes que chegaram a `ready_with_mapping`.

## Método e universo

1. O cadastro canônico de 497 códigos IBGE foi lido de `public/data/municipios_index.json`, sem escrita.
2. Cada fonte foi consultada no grão oficial. Códigos SIOPE/RREO de seis dígitos foram conciliados pelo prefixo do código IBGE de sete dígitos, sem aproximação por nome.
3. Respostas brutas ou normalizadas receberam SHA-256; ausência permaneceu `null`.
4. Cobertura significa presença do recorte exigido, não qualidade financeira. Na MSC, só conta entrega `MSC Agregada`, mês 12, exercício 2024. Na DCA 2025, só conta a função `12 - Educação` do Anexo I-E.
5. Duas execuções foram comparadas por bytes ou saída canônica. Alteração de esquema interrompe o adaptador.
6. A amostra contém Agudo, Nova Santa Rita, Porto Alegre, André da Rocha, Amaral Ferrador, Santa Cruz do Sul, Araricá e Barra do Quaraí. Araricá cumpre o papel de beneficiária VAAT; Nova Santa Rita, beneficiária VAAR; Agudo, não beneficiária VAAR; Barra do Quaraí documenta ausência em 2025/P6.

## A. Transferências efetivas do Fundeb

### Caminhos auditados

- [Consultas do Fundeb — FNDE](https://www.gov.br/fnde/pt-br/acesso-a-informacao/acoes-e-programas/financiamento/fundeb/consultas): página oficial que encaminha a STN, Banco do Brasil e Tesouro Transparente.
- [Consulta STN/APEX](https://sisweb.tesouro.gov.br/apex/f?p=2600:1): aplicação de consulta, sem extração oficial estável demonstrada.
- [Demonstrativos do Banco do Brasil](https://demonstrativos.apps.bb.com.br/): aplicação oficial; o bundle aponta internamente para `https://demonstrativos.api.daf.bb.com.br/v1`.
- [Transferências — Tesouro Transparente](https://www.tesourotransparente.gov.br/temas/estados-e-municipios/transferencias-a-estados-e-municipios): não foi localizada série corrente no grão município × data × rubrica × origem × ajuste/estorno.

### Prova e decisão

A rota interna `GET /v1/demonstrativo/fundeb/periodo` retornou HTTP 503, corpo de 2.503 bytes e SHA-256 `c1dabfba1a9830e73c4592259821cc7b139f1f91ccd615459ec0ba8b7e3c94e4` em duas execuções. Além de indisponível, ela não é contrato público documentado. As rotas STN e BB permanecem úteis como conferência manual, não como coletor aprovado.

Não foi obtido extrato com todos os campos requeridos: código IBGE, data/mês, rubrica, origem, valor, ajuste/estorno, estágio comprovável e publicação. Portanto:

- previsão anual: continua `forecast`/`official_estimate`;
- parcela programada: não foi convertida em transferida;
- transferência pelo concedente: não comprovada por feed estável;
- recebimento pelo ente: não comprovado;
- ajuste/estorno: não disponível em série automatizável.

Gate: `blocked`. Não há POC.

## B. SIOPE corrente

### Caminhos auditados

- [Serviço OData DADOS_ABERTOS_SIOPE](https://www.fnde.gov.br/olinda-ide/servico/DADOS_ABERTOS_SIOPE/versao/v1/odata): endpoint oficial sem autenticação.
- [Relatórios municipais](https://www.fnde.gov.br/siope/dadosInformadosMunicipio.do): consulta pública com seleção de município/período e reCAPTCHA; classificada `manual`.
- [Arquivos analíticos](https://www.gov.br/fnde/pt-br/assuntos/sistemas/siope/arquivos-dados-analiticos): publicação histórica que não acompanha o exercício corrente; `not_current`.
- [Downloads do sistema](https://www.gov.br/fnde/pt-br/assuntos/sistemas/siope/downloads): instaladores/metadados, não uma extração dos dados transmitidos.

### Resultado reproduzido

O conjunto `Indicadores_Siope(Ano_Consulta, Num_Peri, Sig_UF)` entrega JSON paginado com ano, bimestre, UF, código municipal de seis dígitos, código/nome do indicador e valor. Em 2024/P6 foram obtidos 21.320 registros totais, 497 municípios e 46 indicadores municipais. Duas coletas integrais, ordenadas pelo mesmo grão, produziram o SHA-256 normalizado `aae011101933c74e8ab7dcbd5ed59dc65bc42013d08368e422c8b1f9b5ac2869`.

Em 2025/P6, o snapshot auditado contém 13.313 registros totais e 487 municípios (97,99%). As dez ausências são Alegrete, Barra do Quaraí, Cacequi, Cerro Branco, Eldorado do Sul, General Câmara, Pinto Bandeira, Pirapó, Ponte Preta e Tunas.

O POC mapeia apenas quatro conceitos comprovados: valor aplicado em MDE, percentual de MDE, percentual do Fundeb na remuneração dos profissionais e saldo financeiro do Fundeb. Todos são `municipal_declared`; percentuais usam estágio `calculated_indicator`. O saldo não é transferência e o valor aplicado não é receita nova.

Gate: `ready_with_mapping`, porque ainda faltam homologar o crosswalk 6→7 dígitos, o catálogo de indicadores, as unidades e a relação de cada indicador com os estágios completos de receita/despesa. O endpoint OData resolve o subconjunto de indicadores; não torna o formulário com reCAPTCHA automatizável.

## C. RREO e aplicação constitucional

### Caminhos auditados

O [OpenAPI do SICONFI](https://apidatalake.tesouro.gov.br/docs/siconfi/) não oferece `RREO-Anexo 08` no enum. As [regras gerais do RREO 2025](https://siconfi.tesouro.gov.br/siconfi/pages/public/arquivo/conteudo/2025_Regras_Gerais_e_Instrucoes_de_preenchimento_RREO.pdf) registram o tratamento específico do demonstrativo educacional via SIOPE.

Foi localizada uma alternativa oficial e determinística no FNDE:

`ftp://ftp.fnde.gov.br/web/siope/RREO/RREO_Municipal_<IBGE6>_<BIMESTRE>_<ANO>.pdf`

Duas listagens completas produziram o mesmo SHA-256 normalizado `31444bbed0acfd651537f3aca38a02c7299c08c22f3f44eb9193672321896e34`. Para o sexto bimestre, há 497/497 PDFs de 2024 e 490/497 de 2025. As sete ausências de 2025 são Barra do Quaraí, Cacequi, Cerro Branco, General Câmara, Pinto Bandeira, Ponte Preta e Tunas.

### Campos comprovados

O adaptador POC lê o cabeçalho, exercício e bimestre e mapeia:

- linha 6: total das receitas do Fundeb recebidas, coluna realizada;
- linha 15: valor e percentual de remuneração dos profissionais da educação;
- linha 29: valor e percentual de aplicação constitucional em MDE;
- nota 5: no sexto bimestre, o limite usa despesa empenhada; nos cinco anteriores, liquidada.

O PDF também expõe receitas consideradas, deduções, restos, despesas pagas, despesas por área e controle de disponibilidade. Esses campos não foram todos promovidos ao POC porque o objetivo é provar o caminho e o grão, não antecipar a integração.

Retificações não podem ser contadas historicamente: o diretório publica o estado corrente de cada nome, sem cadeia de versões. A futura coleta deve comparar `Last-Modified`, tamanho e hash e conservar snapshots; uma mudança nunca pode sobrescrever silenciosamente a evidência anterior.

Gate: `ready_with_mapping`. Faltam homologar variações de layout, linhas/colunas, retificação, crosswalk e contrato por exercício.

## D. MSC e natureza da despesa

### Caminhos auditados

- [Documentação da MSC — SICONFI](https://www.siconfi.tesouro.gov.br/siconfi/pages/public/conteudo/conteudo.jsf?id=12503).
- [OpenAPI SICONFI](https://apidatalake.tesouro.gov.br/docs/siconfi/).
- `GET /extrato_entregas?id_ente=<IBGE7>&an_referencia=2024` para existência/data da entrega.
- `GET /msc_orcamentaria?id_ente=<IBGE7>&an_referencia=2024&me_referencia=12&co_tipo_matriz=MSCE&classe_conta=6&id_tv=period_change` para o POC.

A varredura encontrou entrega `MSC Agregada`, período 12/2024, em 497/497 municípios. Um HTTP 502 transitório em Estrela foi repetido e resolvido; o artefato final mantém a resposta válida. Em Agudo, duas execuções da MSC retornaram 3.287 itens, 1.561.206 bytes e SHA-256 bruto `f3a3986bb894462ca7815ad6d05fa0218f5dced66d81a8f7da11edb885341d35` nas duas rodadas.

### Separações comprovadas e limites

`natureza_despesa` permite identificar:

- primeiro dígito 3: despesa corrente;
- primeiro dígito 4: despesa de capital;
- GND 1: pessoal e encargos;
- GND 3: outras despesas correntes;
- GND 4: investimentos;
- GND 5: inversões financeiras.

O POC restringe função `12`, preserva subfunção, `poder_orgao`, fonte/destinação, natureza, conta, mês, tipo de valor e `entrada_msc`. Para provar estágio sem somas indevidas, ele aceita apenas a conta PCASP `6.2.2.1.3.05.00` como `paid` e mantém cada entrada no grão bruto. Quando essa conta não aparece no recorte, o registro de amostra é `null`, não zero.

A API não expõe unidade gestora no retorno auditado. `poder_orgao` não pode ser renomeado para unidade gestora. Também é necessário homologar o conjunto completo de contas para empenhado, liquidado, pago e restos antes de qualquer agregação. Por isso o gate é `ready_with_mapping`, não `ready`.

## Exercício principal: 2024 versus 2025

A DCA 2025 já cobre 497/497 municípios com função Educação: 366 respostas têm cinco linhas, 92 têm quatro e 39 têm três. Isso iguala a presença municipal, mas não supera o conjunto de evidências de 2024. SIOPE 2025 cobre 487/497, RREO 2025 cobre 490/497, a consolidação QSE realizada de 2025 equivalente à usada em 2024 não foi homologada e o Fundeb efetivo continua bloqueado em ambos os anos.

Não é possível quantificar retificações históricas do RREO/SIOPE porque as rotas correntes não publicam o histórico de versões. Essa limitação pesa contra a troca prematura.

Decisão: **manter 2024 como exercício principal**. Não houve alteração no contrato publicado. A matriz está em [diagnostico_financeiro_exercicio_principal.csv](data/diagnostico_financeiro_exercicio_principal.csv).

## Programas complementares

A reavaliação foi somente de disponibilidade; nenhum programa foi integrado.

| Programa | Gate | Resultado seguro |
| --- | --- | --- |
| PNAE | `not_current` | planilhas nominais abertas terminam em 2022; consulta corrente permanece manual |
| PNATE | `needs_hardening` | XLSX/ODS 2025–2026 é plano/estimativa, não transferência |
| PEATE/RS | `manual` | não foi localizado feed nominal público de parcelas por município |
| PDDE | `needs_hardening` | sistema público tem escola/UEx/EEx; agregação municipal continua proibida |
| PAR/Novo PAR | `manual` | base descrita no PDA, sem recurso aberto corrente com contrato validado |
| Novo PAC | `needs_hardening` | listas por ciclo/modalidade registram seleção, não recebimento |
| Escola em Tempo Integral | `needs_hardening` | pactuação/portaria não prova pagamento; feed municipal estável não comprovado |
| Caminho da Escola | `manual` | painel nominal útil para consulta, sem extração estável demonstrada |

Detalhes em [diagnostico_financeiro_programas_p5b2.csv](data/diagnostico_financeiro_programas_p5b2.csv). Nenhum status `selected` foi convertido em `transferred` ou `received`.

## Artefatos e reprodutibilidade

Coletores/adaptadores:

- `data_pipeline/src/municipal_finance_p5b2.py`;
- `data_pipeline/scripts/audit_municipal_finance_p5b2.py`;
- `data_pipeline/tests/test_municipal_finance_p5b2.py`.

POCs fora de `public/data`:

- `artifacts/municipal-finance-p5b2-a/fnde-siope-indicators-odata-sample.json` e `-coverage.csv`;
- `artifacts/municipal-finance-p5b2-a/fnde-siope-rreo-annex8-pdf-sample.json` e `-coverage.csv`;
- `artifacts/municipal-finance-p5b2-a/siconfi-msc-orcamentaria-sample.json` e `-coverage.csv`;
- `artifacts/municipal-finance-p5b2-a/audit-results.json`.

Cada registro de amostra contém município, IBGE, exercício, período, conceito, estágio, natureza, valor, fonte, URL, hash, publicação quando disponível, acesso, versão do adaptador e observação. O campo `publishedAt` fica `null` quando a fonte não publica data confiável.

## Critério de parada

A etapa para aqui. SIOPE, RREO e MSC estão apenas aprovados com mapeamento adicional para uma decisão futura de P5-B2-B. Fundeb efetivo permanece bloqueado. Interface, contratos públicos, `public/data`, P3-C, P4-B, scores, capacidade financeira, saldo disponível, lacuna, ranking e recomendações automáticas não foram alterados.


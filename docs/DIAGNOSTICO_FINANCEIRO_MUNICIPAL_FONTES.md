# Diagnóstico financeiro municipal — fontes P5-A

O catálogo operacional está em [diagnostico_financeiro_disponibilidade.csv](data/diagnostico_financeiro_disponibilidade.csv). Ele registra órgão, formato, anos, chave municipal, periodicidade, automação, autenticação, estabilidade, limitações e uso recomendado.

## Fontes automatizáveis agora

| Fonte | Cobertura usada | Chave | Uso seguro |
| --- | --- | --- | --- |
| [Fundeb 2026](https://www.gov.br/fnde/pt-br/acesso-a-informacao/acoes-e-programas/financiamento/fundeb/2026) | previsão total, VAAF, VAAT, VAAR e listas nominais | código IBGE | previsão e status, sempre separados de recebido |
| [Salário-educação](https://www.gov.br/fnde/pt-br/acesso-a-informacao/acoes-e-programas/financiamento/salario-educacao/consultas) | estimativas, mensal e consolidado anual | código IBGE | valor distribuído pelo FNDE e coeficiente |
| [SICONFI](https://apidatalake.tesouro.gov.br/docs/siconfi/) | DCA, RREO e MSC | código IBGE | execução declarada, reconciliação e contexto contábil |

Os arquivos do FNDE não exigem autenticação, mas a URL e o cabeçalho variam por publicação. O SICONFI não exige autenticação, usa JSON paginado e recomenda limitar a frequência das requisições. Em ambos os casos, a P5-B precisa validar esquema e exercício antes de aceitar linhas.

## Fontes automatizáveis com ressalvas

- RREO e MSC: API estável, porém exigem mapeamento contábil antes de separar corrente/capital ou confrontar MDE.
- Dados abertos históricos de PNAE e PDDE: úteis para backfill, mas os recursos de catálogo, esquemas e atualizações precisam de teste de contrato.
- Arquivos analíticos SIOPE: leitura automatizável, porém desatualizada para uso corrente; servem apenas para desenvolver o mapeamento histórico.

## Fontes manuais na primeira entrega

| Fonte | Motivo | Evidência mínima aceitável |
| --- | --- | --- |
| realizado do Fundeb | fluxo externo e reconciliação de conta | consulta nominal com município, período, rubrica e valor |
| SIOPE corrente | formulário sem API pública estável documentada | relatório municipal do mesmo exercício |
| PNAE e PNATE | painel/consulta externa corrente | extrato nominal do ente ou entidade executora |
| PEATE/RS | série nominal corrente não estruturada | termo/extrato estadual por município |
| PDDE | grão escola/executor | lista de escolas/executores conciliada com IBGE |
| PAR/Novo PAR e Caminho da Escola | termos e SIMEC | termo ou lista oficial nominal |
| Novo PAC e Escola em Tempo Integral | publicação por ciclo | lista oficial com município e status |

## Fontes que não representam recurso municipal

SIOPE e SICONFI são sistemas de informação e prestação declaratória. CAPES/Parfor/PROEB e bolsas docentes normalmente têm grão de pessoa, curso ou instituição. Esses registros podem contextualizar ações e execução, mas não entram automaticamente como receita ou saldo municipal.

## Estratégia de atualização

1. Coletar o arquivo bruto em área de ingestão, fora de `public/data`.
2. Registrar URL, data, hash, exercício e versão do adaptador.
3. Validar cabeçalho, chave IBGE, unicidade, unidade monetária e totais.
4. Rejeitar publicação se estágio, natureza ou período não puderem ser determinados.
5. Produzir contrato municipal separado somente após reconciliação e cobertura mínima.
6. Guardar a trilha manual como referência documental, sem converter ausência em zero.

## Prontidão objetiva para P5-B

- `ready`: Fundeb estruturado, QSE e DCA.
- `ready_with_mapping`: RREO.
- `needs_mapping`: MSC e agregações escola/executor.
- `needs_hardening`: catálogos históricos PNAE/PDDE.
- `blocked`: consultas atuais sem feed reproduzível.
- `not_current` ou `not_applicable_finance`: não usar como dado financeiro corrente.

## Situação após P5-B1

Foram integrados os snapshots nominais de Fundeb total, VAAT, status VAAT, status/previsão VAAR, QSE 2024/2026 e DCA 2024. Todos os adaptadores validam código IBGE, unicidade, cabeçalho e ano. Os hashes e URLs ficam no catálogo global `/data/financeiro/catalogos.json`.

O RREO permanece `mapping_pending`: a especificação da API não lista o Anexo 08 entre os valores aceitos de `no_anexo`. A [auditoria do mapeamento](data/diagnostico_financeiro_rreo_mapeamento.csv) registra conceitos, período, cobertura zero e evidência. Nenhum campo constitucional foi inferido de outro anexo.

As fontes manuais e instáveis continuam exclusivamente no catálogo global. Nenhum valor PNAE, PNATE, PEATE, PDDE, PAR, PAC ou SIOPE foi inserido nos contratos municipais.

## Situação após P5-B2-A

A auditoria de reprodutibilidade substitui, para decisão futura, a classificação preliminar da P5-A nos seguintes recortes:

- `fnde_siope_indicators_odata`: `ready_with_mapping`, com 497/497 municípios em 2024/P6, 487/497 em 2025/P6 e duas execuções integrais estáveis;
- `fnde_siope_rreo_annex8_pdf`: `ready_with_mapping`, com URL determinística no FTP oficial, 497/497 PDFs em 2024/P6 e 490/497 em 2025/P6;
- `siconfi_msc_orcamentaria`: `ready_with_mapping`, com entrega MSC de dezembro/2024 em 497/497 municípios e natureza/função/subfunção/órgão/fonte preservados;
- transferência efetiva do Fundeb: `blocked`, pois as consultas localizadas não forneceram contrato automatizável estável e a API interna do BB respondeu HTTP 503 em duas execuções.

O SIOPE corrente deixa de ser genericamente “manual” apenas para o subconjunto de indicadores exposto no OData. Os relatórios municipais com reCAPTCHA continuam `manual`; arquivos analíticos antigos continuam `not_current`.

O RREO deixa de ter cobertura zero na auditoria: a limitação era do endpoint SICONFI, não da disponibilidade oficial do Anexo 8 no FNDE/SIOPE. O mapeamento constitucional e a política de retificações ainda precisam ser homologados antes de alterar os contratos.

Detalhes, gates, hashes e POCs: [DIAGNOSTICO_FINANCEIRO_MUNICIPAL_AUDITORIA_P5B2.md](DIAGNOSTICO_FINANCEIRO_MUNICIPAL_AUDITORIA_P5B2.md). Na P5-B2-A, nenhuma dessas fontes havia sido integrada em produção.

## Situação após P5-B2-B1

Dois recortes auditados foram homologados e integrados em produção, ambos exclusivamente em 2024/P6:

- `fnde_siope_indicators_odata_2024_p6`: 497/497 municípios, com valor aplicado em MDE, taxa de MDE e taxa de remuneração dos profissionais;
- `fnde_siope_rreo_annex8_2024_p6`: 497/497 PDFs, com os mesmos três conceitos para reconciliação e a receita Fundeb recebida declarada.

O RREO usa o diretório oficial `ftp://ftp.fnde.gov.br/web/siope/RREO/`, parser `municipal-finance-rreo-p5b2b1-v1` e layout `rreo-annex8-municipal-2024-v1`. Cada PDF possui URL, `Last-Modified`, tamanho e SHA-256 no snapshot de ingestão. O SICONFI RREO permanece indisponível para Anexo 8 e não é fonte dessa integração.

A transferência efetiva do Fundeb continua `blocked`; a receita recebida declarada pelo município não a substitui. MSC e os demais programas auditados não foram integrados nesta etapa. A cobertura e a reconciliação completas estão em [diagnostico_financeiro_constitucional_cobertura.csv](data/diagnostico_financeiro_constitucional_cobertura.csv) e [diagnostico_financeiro_constitucional_reconciliacao.csv](data/diagnostico_financeiro_constitucional_reconciliacao.csv).

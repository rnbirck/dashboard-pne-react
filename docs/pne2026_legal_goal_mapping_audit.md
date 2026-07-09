# Auditoria da matriz de metas legais do PNE 2026-2036

## Escopo

Esta auditoria registra a base criada para cruzar as metas legais da Lei nº 15.388/2026 com os indicadores municipais ja existentes no dashboard.

Arquivo principal: `src/data/pne2026LegalGoalIndicatorMap.js`

Fonte oficial de referencia: https://www.planalto.gov.br/ccivil_03/_ato2023-2026/2026/lei/l15388.htm

## Validacao estrutural

- Total de metas em `PNE_2026_GOAL_TEXTS`: 73.
- IDs de metas: 73 unicos.
- Metas com `originalText`: 73.
- Validacao linha a linha contra a lei oficial: pendente.
- `validatedAgainstOfficialLaw`: `false`.

## Cobertura da matriz

- Total de metas legais na matriz: 73.
- Metas com pelo menos um indicador direto: 13.
- Metas com alguma cobertura parcial ou aproximada: 16.
- Metas sem indicador direto, mas com cobertura parcial ou aproximada: 14.
- Metas sem indicador municipal correspondente: 46.

## Metas sem indicador municipal

`1.b`, `2.a`, `2.b`, `3.b`, `3.c`, `5.c`, `5.e`, `5.f`, `7.b`, `8.a`, `9.a`, `9.b`, `9.c`, `9.d`, `9.e`, `9.f`, `9.g`, `10.a`, `10.c`, `10.d`, `11.d`, `11.e`, `12.d`, `12.e`, `12.f`, `13.a`, `13.b`, `13.c`, `14.a`, `14.b`, `14.c`, `14.d`, `15.a`, `15.b`, `15.c`, `15.d`, `16.a`, `17.c`, `17.e`, `18.a`, `18.c`, `19.a`, `19.b`, `19.d`, `19.e`, `19.f`.

## Indicadores sem correspondencia legal

Os indicadores abaixo existem no catalogo do ciclo `pne_2026_2036`, mas ficaram sem correspondencia legal na matriz por falta de justificativa metodologica clara:

- `internet_comunidade`
- `acesso_internet_computador`
- `acesso_internet_disp_pessoais`
- `proposta_pedagogica`
- `desktop_aluno`
- `comp_portatil_aluno`
- `tablet_aluno`

## Pontos para revisao humana

- Confirmar linha a linha se os 73 `originalText` em `src/data/pne2026GoalTexts.js` reproduzem exatamente o Anexo I da Lei nº 15.388/2026.
- Revisar a classificacao de `1.a`: o indicador `creche` acompanha cobertura da populacao de 0 a 3 anos, mas nao mede demanda manifesta por vaga.
- Revisar a meta `7.a`: os indicadores atuais cobrem partes da conectividade escolar, mas nao medem integralmente alta velocidade adequada para uso pedagogico.
- Revisar se algum dos indicadores pendentes de tecnologia deve ser usado apenas como contexto, sem distancia de meta.
- Revisar `8.b` e `19.c`: `salas_climatizadas` e `salas_acessiveis` sao proxies parciais de infraestrutura, conforto termico e acessibilidade.
- Revisar metas de aprendizagem SAEB (`5.a`, `5.b`, `5.d`): os indicadores por componente curricular nao cobrem sozinhos todos os requisitos legais.
- Revisar `11.b`: o indicador de 18 anos ou mais nao corresponde exatamente ao recorte legal de 15 anos ou mais.
- Revisar metas de EPT (`12.a`, `12.b`, `12.c`): os indicadores atuais nao medem qualidade, permanencia ou todos os denominadores exigidos pela lei.
- Revisar metas docentes (`17.a`, `17.b`): os indicadores atuais sao recortes por etapa ou medidas agregadas.

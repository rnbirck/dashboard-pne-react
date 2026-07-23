# Metodologia

## Princípios de publicação

- zero é um valor; ausência não deve ser convertida em zero;
- indisponível, não aplicável, inválido e não calculável têm significados distintos;
- período, unidade, fonte e recorte acompanham o resultado;
- séries não comparáveis não são concatenadas nem interpoladas silenciosamente;
- o painel não infere causalidade, elegibilidade a programas ou qualidade de gestão a partir de um indicador isolado.

As regras executáveis prevalecem nos contratos e testes do repositório. Os principais pontos de entrada são `data_pipeline/src`, `src/data`, `src/utils/dataSourceNotes.js` e os catálogos publicados em `public/data`.

## Indicadores educacionais e PNE

As fontes incluem Censo Escolar, Indicadores Educacionais, SAEB/IDEB e Sinopses do INEP, além de estimativas e Censos Demográficos do IBGE. A definição de cada indicador e seu modo de valor ficam em `public/data/indicadores.json`.

Percentuais populacionais preservam o resultado bruto. Valores acima de 100% podem ocorrer por diferença entre estimativas populacionais, mobilidade escolar e oferta localizada; a interface explica a limitação em vez de truncar o dado. Indicadores censitários não são apresentados como séries anuais.

Referências do PNE 2026–2036 são ligadas às metas legais pelo mapa `src/data/pne2026LegalGoalIndicatorMap.js`. Uma referência aproximada, proxy ou configurada sem validação legal deve ser identificada como tal. Expansões acumulativas usam a linha de base e a direção definidas no contrato; participação no estoque não substitui participação na expansão.

## Diagnóstico municipal

O diagnóstico organiza evidências em atenção, preservação, ausência e exclusão metodológica. Comparações estaduais só são publicadas quando valor, unidade, período e regra do indicador são compatíveis. O resumo não transforma posição relativa em ranking de qualidade.

Municípios semelhantes são contexto analítico, não grupo de controle. A seleção usa atributos disponíveis e comparáveis, registra indisponibilidades e não autoriza inferência causal. Sínteses decisórias devem distinguir resultado observado, interpretação técnica e decisão da gestão.

## Financiamento

As fontes atuais incluem FNDE/SIOPE, Fundeb, PNATE, QSE, Siconfi e demonstrativos RREO. Snapshots e revisões necessários para reproduzir contratos ficam em `data_pipeline/data/municipal_finance` e `data_pipeline/data/qse_annual`.

Valores financeiros preservam exercício, estágio da despesa, natureza, fonte e condição de cobertura. Empenhado, liquidado e pago não são somados entre si. Retificações substituem a versão anterior segundo a política do pipeline, mantendo a evidência da revisão. Valores nominais não são tratados como corrigidos pela inflação.

Relações entre indicador e programa financeiro são apresentadas como contexto de ação. Elas não comprovam repasse, seleção, elegibilidade ou efeito. Sistemas de informação fiscal não são descritos como fontes de transferência.

## Qualidade e validação

O pipeline testa domínio, denominadores, cobertura municipal, contratos de saída, reconciliação financeira e referências estaduais. Falhas de fonte ou de cobertura devem produzir estado explícito e nunca preenchimento inventado. Mudanças metodológicas exigem atualização conjunta de cálculo, contrato, testes e desta documentação.

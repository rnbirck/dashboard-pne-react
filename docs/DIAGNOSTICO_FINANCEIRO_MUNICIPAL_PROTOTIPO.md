# Diagnóstico financeiro municipal — protótipo P5-A

## Entrega

O protótipo materializa um contrato financeiro separado em [municipalFinanceTypes.ts](../src/features/diagnostic/municipalFinanceTypes.ts), uma tabela de disponibilidade, uma amostra comparável e seis JSONs completos. Ele é somente documental e de dados de engenharia; não está importado por componentes e não existe em `public/data`.

## Amostra

| Município | Papel | QSE distribuída 2024 | Fundeb previsto 2026 | VAAR 2026 | Educação empenhada 2024 |
| --- | --- | ---: | ---: | --- | ---: |
| Agudo | referência e pequeno porte | R$ 1.045.009,11 | R$ 21.730.973,67 | não beneficiário confirmado | R$ 25.722.214,85 |
| Nova Santa Rita | referência e beneficiário VAAR | R$ 2.708.177,56 | R$ 52.320.936,15 | beneficiário; R$ 3.360.004,63 previstos | R$ 65.292.191,64 |
| Porto Alegre | referência e capital | R$ 24.843.079,36 | R$ 704.435.923,24 | não beneficiário confirmado | R$ 1.115.925.346,24 |
| André da Rocha | pequeno porte e informação insuficiente | R$ 92.723,91 | R$ 1.557.177,37 | não beneficiário confirmado | R$ 6.461.819,76 |
| Amaral Ferrador | pequeno porte e predominantemente rural | R$ 296.290,17 | R$ 6.508.191,02 | não beneficiário confirmado | R$ 9.958.461,39 |
| Santa Cruz do Sul | médio porte e beneficiário VAAR | R$ 5.127.525,46 | R$ 127.263.051,80 | beneficiário; R$ 8.039.699,99 previstos | R$ 185.759.300,34 |

QSE está em estágio `transferred`; Fundeb e VAAR 2026 estão em `forecast`; execução SICONFI é `municipal_declared`. Os valores não são somados entre si.

## Arquivos de exemplo

- [Agudo](data/financeiro_agudo_exemplo.json)
- [Nova Santa Rita](data/financeiro_nova_santa_rita_exemplo.json)
- [Porto Alegre](data/financeiro_porto_alegre_exemplo.json)
- [André da Rocha](data/financeiro_andre_da_rocha_exemplo.json)
- [Amaral Ferrador](data/financeiro_amaral_ferrador_exemplo.json)
- [Santa Cruz do Sul](data/financeiro_santa_cruz_do_sul_exemplo.json)
- [Amostra tabular](data/diagnostico_financeiro_amostra.csv)

Cada documento contém município, recortes temporais, qualidade, resumo separado por estágio/ano, transferências, status de programa, execução, reconciliação, indicador por aluno bloqueado sem denominador, vínculos educacionais, isolamento de escores, fontes e metadados de não publicação.

## Contrato de integração futura

Rota recomendada, ainda não criada:

```text
public/data/
  municipios/
    <slug>/
      index.json
      financeiro.json  # carregamento lazy apenas ao abrir o módulo financeiro
```

O índice municipal atual não deve incorporar o objeto financeiro. A futura interface faria uma segunda requisição apenas quando a seção fosse acessada. Ausência de `financeiro.json` significaria módulo não publicado, não valor zero.

Os seis exemplos ocupam 86.466 bytes em conjunto, com média de 14.411 bytes por município (14.139 a 14.709 bytes). Uma extrapolação linear para os 497 municípios do RS resulta em aproximadamente 7,16 MB brutos. É apenas uma estimativa inferior: programas, séries e trilhas de evidência da P5-B podem multiplicar registros. A regra operacional é orçamento por arquivo municipal, compressão HTTP e carregamento lazy; nenhum pacote financeiro global deve ser anexado ao carregamento inicial.

## Regras de apresentação futura

- Exibir ano, corte, estágio, natureza e fonte ao lado do valor.
- Separar confirmado, previsto, declarado e não disponível.
- Mostrar cobertura e limitações antes de qualquer subtotal.
- Não chamar previsão de disponível, repasse de saldo ou execução de financiamento.
- Não publicar elegibilidade inferida ou estimativa de edital.
- Não alterar cartões, ordenação, síntese de decisão ou escores educacionais.

## Decisão P5-B

A P5-B pode começar pelo adaptador de Fundeb, QSE e DCA, com testes de esquema e procedência. A publicação de um diagnóstico financeiro completo permanece bloqueada até resolver recebimentos efetivos, reconciliação SIOPE/SICONFI e cobertura nominal dos programas prioritários. O protótipo é adequado como fixture e contrato de engenharia, não como conteúdo de interface.

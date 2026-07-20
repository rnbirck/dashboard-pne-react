# Payload e carregamento do Diagnóstico municipal

## Arquivos publicados

```text
/data/municipios/<slug>/index.json
/data/municipios/<slug>/diagnostico.json
/data/municipios/<codigo-ibge>/index.json
/data/municipios/<codigo-ibge>/diagnostico.json
```

O índice contém `pne_2026_2036.diagnostico_ref` com status, versões, data e
caminho. Ele não contém `diagnostico` nem `diagnostico_v2` completos.

`loadMunicipioDiagnostic` usa a mesma cache por caminho de `loadJson`. O hook
da página é importado junto da rota lazy de Diagnóstico; outras rotas não fazem
a requisição. Loading, erro HTTP e versão incompatível possuem estados próprios.
O React apenas apresenta o contrato e não recalcula distância, ritmo,
governabilidade, pares ou decisão.

Cloudflare Pages continua servindo JSON estático. O alias por código é idêntico
byte a byte ao alias por slug. O adaptador legado permanece somente no export
agregado interno durante a transição e não participa da transferência da rota.

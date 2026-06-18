# Pendencias de dados complementares

## Implementado com seguranca

Os dados complementares ja foram enriquecidos, quando havia insumos explicitos, para:

- atendimento e matriculas;
- educacao integral;
- atendimento educacional especializado (AEE);
- EPT e EJA;
- infraestrutura escolar;
- escolaridade da populacao;
- docentes:
  - `pos_graduacao`;
  - `temporarios`;
  - `adequacao_ai`;
  - `adequacao_af`;
  - `adequacao_em`.

## Regras gerais

- Nao inventar numerador ou denominador.
- Nao derivar `privada = total - publica`.
- Nao tratar percentual como contagem absoluta.
- Dados complementares explicam o indicador, mas nao alteram o calculo principal do dashboard/meta.

## Pendencias por falta de insumo seguro

### Idade regular

Indicadores pendentes:

- `idade_regular_quinto`;
- `idade_regular_nono`;
- `idade_regular_medio`.

Motivo: a query/tabela atual traz `taxa_idade_regular` derivada de `100 - taxa_distorcao`, mas nao traz numerador real de alunos em idade regular.

Para liberar implementacao futura no SENAI/DB, seria necessario disponibilizar, por ano, municipio, etapa e, se existir, dependencia administrativa:

- alunos ou matriculas em idade regular;
- total de alunos ou matriculas da serie/etapa;
- taxa final validada.

### SAEB

Grupos pendentes:

- SAEB 2014-2024;
- SAEB 2026-2036.

Motivo: ha percentuais por nivel de proficiencia e medias, mas nao ha alunos/participantes por nivel nem total avaliado.

Para liberar implementacao futura no SENAI/DB, seria necessario disponibilizar, por ano, municipio, componente curricular, etapa e, se existir, dependencia administrativa:

- alunos ou participantes por nivel de proficiencia;
- total de alunos ou participantes avaliados;
- percentual por nivel validado.

### IDEB

Indicadores pendentes:

- `ideb_anos_iniciais`;
- `ideb_anos_finais`;
- `ideb_ensino_medio`.

Motivo: ha indice IDEB e notas, mas nao ha componente de fluxo/aprovacao explicito.

Para liberar implementacao futura no SENAI/DB, seria necessario disponibilizar, por ano, municipio, etapa e dependencia administrativa:

- IDEB;
- indicador de aprendizado/proficiencia;
- indicador de fluxo/aprovacao;
- definicao validada de como os componentes compoem o indice.

### Rendimento do magisterio

Indicador pendente:

- `rendimento_magisterio`.

Motivo: fonte/tabela nao localizada com remuneracao media dos professores, comparador e razao salarial.

Para liberar implementacao futura no SENAI/DB, seria necessario disponibilizar, por ano e municipio:

- remuneracao media dos professores;
- remuneracao media do grupo comparador;
- razao salarial validada;
- fonte e recorte metodologico usados no calculo.

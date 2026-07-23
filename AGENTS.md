# Regras do repositório

## Escopo e segurança

- Faça alterações localizadas e preserve o comportamento fora do pedido.
- Não altere cálculos, contratos, URLs, conteúdo analítico, metodologia ou dados publicados sem pedido explícito.
- `public/data` é saída versionada do pipeline. Não o edite manualmente nem o percorra em tarefas visuais.
- Dados de regeneração e fontes não reproduzíveis ficam em `data_pipeline/data`; não os mova para outro repositório.
- Não reescreva o histórico Git. Não crie commit nem faça push sem pedido explícito.

## Onde começar

| Área | Diretórios e entradas iniciais |
| --- | --- |
| UI compartilhada | `src/app`, `src/components`, `src/styles`, `docs/DESIGN.md` |
| Educação | `src/features/education`, `src/data/education*`, `src/styles/education-pages.css` |
| Financeiro | `src/features/municipal-finance`, `src/pages/FinancialPage.jsx`, `src/data/financial*`, `src/styles/financial-pages.css` |
| Diagnóstico | `src/pages/Diagnostico.jsx`, `src/features/diagnostic`, `src/data/diagnostic` |
| PNE | `src/pages/CyclePage.jsx`, `src/pages/Pne*`, `src/components/Indicator*`, `src/utils/pne*` |
| Pipeline | `data_pipeline/src`, `data_pipeline/scripts`, `data_pipeline/tests`, `docs/OPERACAO.md` |

Antes de alterar a interface, consulte `docs/DESIGN.md`, reutilize os tokens e componentes atuais e mantenha exceções no CSS do domínio correspondente.

## Busca local

O `.ignore` exclui dados e artefatos volumosos das buscas comuns. Em tarefas de dados, pesquise os caminhos necessários explicitamente, por exemplo:

```powershell
rg --no-ignore "termo" public/data data_pipeline/data
```

## Validação

- Use a menor validação que cubra a alteração durante o desenvolvimento.
- Execute a suíte completa somente quando solicitada ou ao preparar um lote para entrega.
- Para mudanças de UI, valide o domínio afetado e os viewports relevantes; preserve foco, hover, estados de carregamento, erro, vazio e indisponibilidade.
- Não trate avisos do Knip como erros automaticamente: preserve entradas dinâmicas, contratos, tipos compartilhados e símbolos exercitados por testes.
- Não apague nem enfraqueça testes ou scripts de validação para fazer a suíte passar.


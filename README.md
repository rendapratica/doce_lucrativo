# Doce Lucrativo

Plataforma de receitas e gestão para pequenos negócios de doces. HTML, CSS e JavaScript puros, dados no **IndexedDB** (ficam salvos ao fechar o navegador), gráficos com **Chart.js** (incluído na pasta, sem CDN). Funciona offline depois de carregado e não precisa de servidor.

## Publicar no GitHub Pages
1. Crie um repositório e envie **todo o conteúdo desta pasta** (o `index.html` precisa ficar na raiz).
2. Em *Settings → Pages*, escolha *Deploy from a branch*, branch `main`, pasta `/ (root)`.
3. O site abre em `https://SEU-USUARIO.github.io/NOME-DO-REPO/`.

Para testar no computador, não abra o arquivo direto: rode `python3 -m http.server 8000` na pasta e acesse `http://localhost:8000`.

## Estrutura
| Arquivo | Função |
|---|---|
| `index.html` | Início |
| `dashboard.html` · `js/dashboard.js` | Painel com indicadores, período e gráficos |
| `produtos.html` · `js/produtos.js` | Cadastro de produtos (foto opcional) |
| `producao.html` · `js/producao.js` | Produção (soma ao estoque) |
| `vendas.html` · `js/vendas.js` | Vendas (baixa o estoque, bloqueia venda acima do estoque) |
| `despesas.html` · `js/despesas.js` | Despesas |
| `calculadora.html` · `js/calculadora.js` | Preço recomendado e lucros |
| `relatorios.html` · `js/relatorios.js` | Relatórios e exportação CSV |
| `receitas.html` · `js/receitas.js` · `js/recipes-data.js` | Biblioteca de receitas |
| `backup.html` · `js/backup.js` | Backup/restauração JSON, demonstração, apagar dados |
| `js/calc.js` | Cálculos e datas (funções puras, testadas) |
| `js/database.js` | IndexedDB, validações, regras de estoque, backup, demonstração |
| `js/app.js` · `js/art.js` · `js/charts.js` | Menu, diálogos, ilustrações e gráficos |
| `js/auth.js` · `docs/HOTMART.md` | Preparação para login e Hotmart |
| `tests/` | Testes automáticos |

## Como as contas fecham
- **Faturamento** = soma das vendas do período.
- **Lucro bruto** = faturamento − custo dos doces vendidos (o custo unitário é gravado no momento da venda, então mudar o custo depois não altera o histórico).
- **Lucro estimado** = faturamento − despesas lançadas no período.
- O estoque só muda por produção (+), venda (−), edição/exclusão desses registros ou ajuste manual no produto, e **nunca fica negativo**: qualquer operação que o deixaria negativo é recusada por inteiro.

## Cadastrar as suas 50 receitas
Veja o comentário no topo de `js/recipes-data.js`. As receitas embutidas aparecem para todos; as que o cliente cadastra ficam só no navegador dele e entram no backup.

## Testes
```
npm i fake-indexeddb
node tests/core.test.js
```

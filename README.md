# Calculadora de Juros Compostos

Simulador de investimentos com juros compostos feito em **HTML, CSS e JavaScript puro** — sem frameworks e sem dependências em produção.

- Valor inicial, aporte mensal (opcional), taxa ao mês ou ao ano, período em meses ou anos
- Resultados: valor total final, total investido e total em juros
- Gráfico de evolução (SVG) com tooltip
- Tabela detalhada anual ou mensal
- Responsivo (mobile-first), tema escuro automático e acessível (WCAG AA)

O plano de implementação por sprints está em [docs/PLANO.md](docs/PLANO.md).

## Como rodar

Por usar ES Modules, a página precisa ser servida por HTTP (abrir o arquivo direto não funciona):

```bash
npm start          # servidor local em http://localhost:3000
npm test           # testes unitários (node:test)
```

Ou use a extensão **Live Server** do VS Code.

## Como o cálculo funciona

A cada mês: `saldo = saldo anterior × (1 + i) + aporte`, com o aporte no final do mês.

Equivalente à fórmula fechada:

```
M = P·(1 + i)^n + A·[((1 + i)^n − 1) / i]
```

Taxa anual convertida para a mensal equivalente: `i = (1 + taxa anual)^(1/12) − 1`.
Não considera impostos, taxas ou inflação.

## Estrutura

```
index.html          página
css/style.css       estilos (tokens, mobile-first, tema escuro)
js/calculator.js    funções puras de cálculo e validação
js/format.js        formatação e leitura de números pt-BR
js/chart.js         gráfico SVG
js/table.js         tabela detalhada
js/main.js          integração com o DOM
tendencias.html     página Tendências (temas em alta + Kanban + Canvas de pautas)
js/tendencias-data.js  funções puras da página Tendências (filtros, agrupamentos)
js/tendencias.js    integração da página Tendências com o DOM
data/tendencias/    trends-latest.json, .md e .csv publicados pelo fin-trends-scraper
sitemap.xml         índice de sitemaps (envie este no Search Console)
sitemap-paginas.xml páginas fixas do site
css/noticias.css    estilos do portal de notícias
noticias/           portal de notícias, gerado pelo fin-news-publisher (não editar à mão)
data/noticias/      index.json dos artigos publicados (usado pela página Tendências)
tests/              testes unitários
docs/PLANO.md       plano de implementação
```

## Página Tendências

`tendencias.html` lê `data/tendencias/trends-latest.json`, que é gerado 3 vezes por dia pelo repositório
`nwrn/fin-trends-scraper` (GitHub Actions). Esse workflow copia o JSON, o `.md` e o `.csv` para cá quando o
secret `CALCULADORA_PUBLISH_TOKEN` está configurado lá. Os arquivos versionados aqui são o último snapshot.
O `cotacoes.html` aceita `?ticker=PETR4` para abrir já com a busca feita (usado pelos links da página).

## Licença

MIT

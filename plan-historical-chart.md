# Plan: Gráfico Histórico de Cotações (feature/historical-chart)

**Versão:** `1.1.0` → `1.2.0`
**Branch:** `feature/historical-chart`
**Dependência:** `b3-api` com endpoints `/stocks/{ticker}/history` e `/fiis/{ticker}/history`

---

## Contexto

A tela de cotações exibe apenas o preço atual. Esta feature adiciona um gráfico
de linha SVG com histórico de preços ao longo do tempo, com seletor de período —
inspirado em Yahoo Finance, Status Invest e Investidor10.

---

## UX / Layout

```
┌─────────────────────────────────────────────────────────┐
│ [Buscar ativo]   │  BBAS3  Yahoo Finance                 │
│ Ticker: [     ]  │  R$ 17,09   ▲ +2,3% (1M)             │
│ Tipo:   [Ação▼]  │                                       │
│ [Buscar cotação] │  [1M] [3M] [6M] [1A] [5A]            │
│                  │  ┌─────────────────────────────────┐  │
│                  │  │  gráfico de linha SVG           │  │
│                  │  │  tooltip ao hover               │  │
│                  │  │  linha de referência (open)     │  │
│                  │  └─────────────────────────────────┘  │
│                  │  Mín: R$ 15,20  Máx: R$ 18,90         │
└─────────────────────────────────────────────────────────┘
```

---

## Decisões

| Decisão | Escolha | Motivo |
|---|---|---|
| Biblioteca de gráfico | SVG vanilla | Consistência com `chart.js` da calculadora; zero dependências |
| Cor da linha | Verde se close ≥ open, vermelho se < | Padrão de mercado (Status Invest, Investidor10) |
| Range default | `1m` | Período mais consultado no dia a dia |
| Variação % | `(último - primeiro) / primeiro` | Referência do período selecionado, não do dia |
| Tooltip | Data + preço ao hover com linha vertical | Padrão Yahoo Finance |

---

## Tarefas

### 1. `js/chart-cotacao.js` — módulo SVG de gráfico de linha
- `renderHistoryChart(container, points)` — recebe array `{date, close}`, renderiza SVG responsivo
- Escala automática com padding 5% acima/abaixo dos extremos
- Linha de preço colorida (verde/vermelho vs. primeiro ponto)
- Área preenchida abaixo da linha (gradient sutil)
- Eixo X: datas (espaçamento automático por densidade)
- Eixo Y: preços formatados em BRL compacto
- Tooltip: linha vertical + círculo + card flutuante com data e preço
- `ResizeObserver` para responsividade

### 2. `js/cotacoes.js` — integração do gráfico
- Após `renderResult(data)`: buscar `fetchHistory(assetType, ticker, range)` e renderizar gráfico
- Seletor de range (1M / 3M / 6M / 1A / 5A) como botões segmentados sobre o gráfico
- Variação percentual do período exibida no card de preço
- Loading skeleton durante fetch do histórico
- Erro não-bloqueante: se histórico falhar, exibir aviso mas manter card de preço

### 3. `cotacoes.html` — markup do gráfico
- Adicionar `<div id="grafico-wrap">` após o card de preço com:
  - Seletor de range (botões segmentados)
  - `<div id="grafico-container">` para o SVG
  - Linha de min/max abaixo do gráfico

### 4. `css/style.css` — estilos do gráfico e range selector
- `.range-selector` — botões segmentados (reutilizar `.segmented` da calculadora)
- `.grafico-wrap` — card container do gráfico
- `.grafico-minmax` — linha de mínimo/máximo
- `.cotacao-variacao` — badge de variação % (verde/vermelho)
- `.grafico-tooltip` — tooltip flutuante

### 5. Bump versão
- `package.json`: `1.1.0` → `1.2.0`

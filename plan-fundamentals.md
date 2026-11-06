# Plan: Indicadores Fundamentalistas (feature/fundamentals)

**Versão:** `1.2.0` → `1.3.0`
**Branch:** `feature/fundamentals`
**Dependência:** `b3-api` com endpoint `GET /stocks/{ticker}/fundamentals`

---

## UX / Layout

```
┌──────────────────────────────────────────────────────────┐
│  [card de preço + variação]                              │
│  [gráfico histórico]                                     │
│                                                          │
│  ┌─ Empresa ──────────────────────────────────────────┐  │
│  │  Banco do Brasil S.A.  •  Financial Services       │  │
│  └────────────────────────────────────────────────────┘  │
│                                                          │
│  ┌─ Destaques ─────────────────────────────────────────┐  │
│  │  P/L    P/VP    DY      ROE                          │  │
│  │  7,5×   1,1×   8,0%   15,0%                         │  │
│  └─────────────────────────────────────────────────────┘  │
│                                                          │
│  [Valuation] [Rentabilidade] [Endividamento] [Crescimento]│
│  ┌─────────────────────────────────────────────────────┐  │
│  │  grid de indicadores com tooltip [?]                │  │
│  └─────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────┘
```

---

## Decisões

| Decisão | Escolha |
|---|---|
| Dados ausentes | `null` → exibe "N/D" |
| Tooltip | popover CSS puro via `[data-tooltip]` |
| Tabs | CSS radio/button sem JS extra |
| Fonte | apenas Yahoo Finance (sem fallback para FIIs) |

---

## Tarefas

1. `js/fundamentals.js` — fetch, render highlights, tabs, grid, tooltip
2. `cotacoes.html` — seção `#fundamentals-wrap`
3. `css/style.css` — estilos: highlight cards, tabs, indicator grid, tooltip, header empresa
4. `js/cotacoes.js` — chamar `loadFundamentals()` após busca bem-sucedida
5. `package.json` — versão `1.2.0` → `1.3.0`

# Plano de Implementação – Calculadora de Juros Compostos

Primeiro módulo de um site de investimentos, construído com **HTML5, CSS3 e JavaScript ES6+ puro**.
Inspirado nas calculadoras do [Investidor10](https://investidor10.com.br/calculadoras/juros-compostos/)
e do [Investidor Sardinha](https://investidorsardinha.r7.com/calculadoras/calculadora-de-juros-compostos/):
valor inicial, aporte mensal, taxa (mensal/anual), período (meses/anos), resultados, gráfico e tabela.

**Equipe:** 1 Dev Frontend (com apoio pontual de Designer). **Sprints:** 1 semana cada.
**Status:** ✅ todas as sprints concluídas nesta entrega.

| Sprint | Objetivo | Esforço | Responsável | Depende de |
|---|---|---|---|---|
| 0 | Ambiente e padrões | 1 dia | Dev | — |
| 1 | HTML semântico e CSS mobile-first | 3 dias | Dev + Designer | 0 |
| 2 | Cálculo, validação e integração com o DOM | 3 dias | Dev | 1 |
| 3 | Gráfico e tabela detalhada | 3 dias | Dev | 2 |
| 4 | Acessibilidade, testes e cross-browser | 2 dias | Dev | 3 |
| 5 | Documentação e deploy | 1 dia | Dev | 4 |

---

## Sprint 0 – Configuração do Ambiente (1 dia)

**Objetivo:** qualquer pessoa clona o repositório e roda o projeto localmente em menos de 5 minutos.

**Tarefas**
- Instalar VS Code, Git, Node.js (apenas para servidor local e testes) e a extensão Live Server.
- Criar a estrutura: `/css`, `/js`, `/assets`, `/tests`, `/docs`.
- `git init`, `.gitignore`, `.gitattributes` (LF), repositório remoto no GitHub.
- Padrões de código: `.editorconfig`, `.prettierrc`, `.vscode/extensions.json`.
- Convenção de commits (`feat:`, `fix:`, `docs:`, `test:`) e branch `main` protegida para deploy.

**Entregáveis:** repositório com estrutura e arquivos de configuração.
**Critérios de aceitação:** `npm test` e `npm start` funcionam sem instalação manual de dependências.

## Sprint 1 – Design e Estrutura HTML/CSS (3 dias)

**Objetivo:** página estática completa e responsiva, ainda sem cálculo.

**Tarefas**
- HTML semântico: `header`, `nav`, `main`, `section`, `footer`, `form` com `label` ligado a cada `input`.
- Campos: valor inicial (R$), aporte mensal (R$, opcional), taxa (% + `select` ao mês/ao ano), período (+ `select` meses/anos).
- Área de resultados com 3 cartões (valor final em destaque, total investido, total em juros).
- Espaços para gráfico e tabela; seção “Como o cálculo é feito”.
- CSS com design tokens (custom properties), mobile-first, Grid em ≥ 900px (formulário à esquerda, resultados à direita), tema escuro via `prefers-color-scheme`.
- SEO: `title`, `meta description`, Open Graph, `lang="pt-BR"`, favicon SVG.

**Entregáveis:** `index.html` e `css/style.css` estilizados.
**Critérios de aceitação:** sem rolagem horizontal em 375px; alvos de toque ≥ 44px; contraste AA.

## Sprint 2 – Lógica de Cálculo (3 dias)

**Objetivo:** cálculo correto e testado, ligado ao formulário.

**Tarefas**
- `js/calculator.js` com **funções puras** (sem DOM):
  - `annualToMonthlyRate`: taxa equivalente `i = (1 + a)^(1/12) − 1`.
  - `futureValue`: fórmula fechada `M = P(1+i)^n + A·[((1+i)^n − 1)/i]` (trata `i = 0`).
  - `simulate`: evolução mês a mês (aporte no final do mês).
  - `validate`: números finitos, não negativos, período em meses inteiros, limite de 100 anos.
- `js/format.js`: `Intl.NumberFormat('pt-BR')` e `parseNumber` aceitando `1.234,56`.
- `js/main.js`: lê o formulário, mostra erros por campo (`aria-invalid`), foca o primeiro campo inválido, atualiza resultados.
- Testes com `node:test` (sem dependências).

**Entregáveis:** cálculo funcionando ao clicar em “Calcular”.
**Critérios de aceitação:** simulação mês a mês = fórmula fechada; entradas não numéricas exibem mensagem; testes passam.

## Sprint 3 – Visualização de Dados (3 dias)

**Objetivo:** gráfico de evolução e tabela detalhada.

**Decisão técnica:** gráfico em **SVG puro** (`js/chart.js`, ~150 linhas), em vez de Chart.js (~200 KB)
— zero dependências, estilizado por CSS (tema escuro automático) e totalmente controlável.
Se no futuro forem necessários zoom/pan ou muitos gráficos, migrar para **uPlot** (~45 KB).

**Tarefas**
- Área empilhada: total investido (base) + juros acumulados (topo), com eixos e grade “redondos”.
- Tooltip com período, investido, juros e saldo (mouse e toque, via Pointer Events).
- Redesenho responsivo com `ResizeObserver`.
- `js/table.js`: tabela anual (padrão) ou mensal, cabeçalho fixo, rolagem própria.
- Texto alternativo dinâmico do gráfico (`aria-label` com o resumo).

**Entregáveis:** gráfico e tabela atualizados a cada cálculo.
**Critérios de aceitação:** soma dos juros anuais = juros totais; gráfico legível de 320px a 1440px.

## Sprint 4 – Refinamento e Testes (2 dias)

**Objetivo:** qualidade de produção.

**Tarefas**
- Acessibilidade: link “pular para o conteúdo”, `aria-live` nos resultados, foco visível, tabela com `th scope`, região rolável focável, `prefers-reduced-motion`.
- Testes manuais: valores-limite (taxa 0, só aporte, só valor inicial, 100 anos, entradas inválidas).
- Cross-browser: Chrome, Firefox, Edge, Safari (iOS) — `color-mix` e `aspect-ratio` têm suporte nos atuais.
- Lighthouse: meta ≥ 95 em Performance, Acessibilidade, Boas práticas e SEO.

**Entregáveis:** checklist de testes concluído.
**Critérios de aceitação:** nenhum erro no console; navegação completa apenas por teclado.

## Sprint 5 – Documentação e Deploy (1 dia)

**Objetivo:** site publicado e documentado.

**Tarefas**
- `README.md` com instruções, fórmulas e estrutura; JSDoc nas funções.
- Deploy estático no **GitHub Pages** (branch `main`, raiz) — sem etapa de build.

**Entregáveis:** URL pública do site.
**Critérios de aceitação:** página carrega pela URL pública com os mesmos resultados do ambiente local.

---

## Boas práticas adotadas

- Separação de responsabilidades: cálculo (puro) · formatação · gráfico · tabela · orquestração.
- ES Modules nativos, `const`/`let`, sem variáveis globais.
- Nenhuma dependência em produção; Node só para testes e servidor local.

## Riscos

| Risco | Mitigação |
|---|---|
| Diferença de resultado em relação a outros sites | Documentar convenções (taxa equivalente, aporte no fim do mês) na própria página |
| Precisão de ponto flutuante | Arredondar apenas na exibição; testes comparam com tolerância |
| Tabela mensal muito longa (1200 linhas) | Visão anual por padrão; rolagem interna |

## Próximos passos

- Novas calculadoras reaproveitando `format.js` e `chart.js`: renda fixa (CDI/IPCA), aposentadoria/FIRE, preço-teto, “quanto preciso investir por mês”.
- Ajuste por inflação e imposto de renda (tabela regressiva).
- Compartilhar a simulação via URL e exportar a tabela em CSV.

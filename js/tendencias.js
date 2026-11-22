// DOM da página Tendências. Todo texto vindo do JSON entra via textContent (nunca innerHTML).
import {
  CANVAS_BLOCKS,
  CATEGORY_LABELS,
  DATA_URL,
  KANBAN_COLUMNS,
  KANBAN_LABELS,
  filterCards,
  filterOptions,
  formatChange,
  formatScore,
  groupByCanvas,
  groupByKanban,
  parseReport,
  safeInternalUrl,
  sortByScore,
} from './tendencias-data.js';

const $ = (id) => document.getElementById(id);

function el(tag, attrs = {}, ...children) {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === 'class') node.className = v;
    else node.setAttribute(k, v);
  }
  for (const c of children) node.append(c instanceof Node ? c : document.createTextNode(String(c)));
  return node;
}

let report = null;

function currentFilters() {
  return {
    categoria: $('f-categoria').value,
    pais: $('f-pais').value,
    fonte: $('f-fonte').value,
    scoreMin: $('f-score').value,
  };
}

function fillSelect(select, values, labels = {}) {
  for (const v of values) select.append(el('option', { value: v }, labels[v] ?? v));
}

function renderMeta() {
  const when = new Date(report.generatedAt);
  $('atualizado').textContent = `Atualizado em ${when.toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}`;

  const market = $('mercado');
  market.replaceChildren();
  const names = { '^BVSP': 'Ibovespa', 'IFIX.SA': 'IFIX', 'BRL=X': 'Dólar' };
  for (const [sym, pct] of Object.entries(report.market?.dailyChangePct ?? {})) {
    market.append(
      el('li', { class: `tend-stat ${pct < 0 ? 'is-down' : 'is-up'}` }, el('span', {}, names[sym] ?? sym), el('strong', {}, formatChange(pct))),
    );
  }
  const ind = report.market?.indicators ?? {};
  if (ind.selic_meta) market.append(el('li', { class: 'tend-stat' }, el('span', {}, 'Selic'), el('strong', {}, `${ind.selic_meta}%`)));

  const degraded = report.sources.filter((s) => s.state === 'DEGRADED').map((s) => s.source);
  const aviso = $('fontes-aviso');
  aviso.hidden = degraded.length === 0;
  aviso.textContent = degraded.length ? `Fontes com falha nesta coleta: ${degraded.join(', ')}.` : '';
}

function renderRanking(cards) {
  const body = $('ranking-body');
  body.replaceChildren();
  for (const c of sortByScore(cards)) {
    const ativos = el('td');
    c.assets.forEach((a, i) => {
      if (i) ativos.append(', ');
      ativos.append(/^[A-Z]{4}\d{1,2}$/.test(a) ? el('a', { href: `cotacoes.html?ticker=${a}` }, a) : a);
    });
    body.append(
      el(
        'tr',
        {},
        el('td', { class: 'num' }, formatScore(c.score)),
        el('td', {}, el('strong', {}, c.topic), el('br'), el('small', { class: 'muted' }, c.suggestedTitle)),
        el('td', {}, CATEGORY_LABELS[c.category] ?? c.category),
        ativos,
        el('td', {}, c.sources.join(', ')),
        el('td', {}, el('span', { class: `tend-badge tend-badge--${c.priority.toLowerCase()}` }, c.priority)),
      ),
    );
  }
  $('ranking-vazio').hidden = cards.length > 0;
}

function renderKanban(cards) {
  const board = $('kanban');
  board.replaceChildren();
  const groups = groupByKanban(cards);
  for (const col of KANBAN_COLUMNS) {
    const list = el('ul', { class: 'kanban__list' });
    for (const c of groups[col]) {
      list.append(
        el(
          'li',
          { class: 'kanban__card' },
          el('span', { class: `tend-badge tend-badge--${c.priority.toLowerCase()}` }, `${c.priority} · ${formatScore(c.score)}`),
          el('p', { class: 'kanban__title' }, c.suggestedTitle),
          el('p', { class: 'muted' }, `${c.format.replaceAll('_', ' ').toLowerCase()} · keyword: ${c.primaryKeyword}`),
          el('a', { href: safeInternalUrl(c.internalUrl) }, 'Link interno sugerido'),
        ),
      );
    }
    board.append(
      el('section', { class: 'kanban__col', 'aria-label': KANBAN_LABELS[col] }, el('h3', {}, `${KANBAN_LABELS[col]} (${groups[col].length})`), list),
    );
  }
}

function renderCanvas(cards) {
  const grid = $('canvas');
  grid.replaceChildren();
  const blocks = groupByCanvas(cards);
  for (const [key, label] of CANVAS_BLOCKS) {
    const list = el('ul');
    for (const line of blocks[key]) list.append(el('li', {}, line));
    if (!blocks[key].length) list.append(el('li', { class: 'muted' }, '—'));
    grid.append(el('section', { class: `bmc__block bmc__block--${key.toLowerCase()}` }, el('h3', {}, label), list));
  }
}

function render() {
  const cards = filterCards(report.cards, currentFilters());
  $('contagem').textContent = `${cards.length} de ${report.cards.length} pautas`;
  renderRanking(cards);
  renderKanban(cards);
  renderCanvas(cards);
}

async function init() {
  try {
    const res = await fetch(DATA_URL, { cache: 'no-cache' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const { report: r, error } = parseReport(await res.json());
    if (error) throw new Error(error);
    report = r;
  } catch (e) {
    $('estado').textContent = 'Não foi possível carregar as tendências agora. Tente novamente mais tarde.';
    $('estado').hidden = false;
    console.error(e);
    return;
  }
  const opts = filterOptions(report.cards);
  fillSelect($('f-categoria'), opts.categorias, CATEGORY_LABELS);
  fillSelect($('f-pais'), opts.paises);
  fillSelect($('f-fonte'), opts.fontes);
  $('filtros').addEventListener('input', render);
  $('filtros').addEventListener('submit', (e) => e.preventDefault());
  $('conteudo-tendencias').hidden = false;
  renderMeta();
  render();
}

init();

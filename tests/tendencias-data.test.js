import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  CANVAS_BLOCKS,
  KANBAN_COLUMNS,
  filterCards,
  filterOptions,
  formatChange,
  formatScore,
  groupByCanvas,
  groupByKanban,
  parseReport,
  safeInternalUrl,
  sortByScore,
} from '../js/tendencias-data.js';

const card = (over) => ({
  id: 'x',
  topic: 'Tema',
  category: 'MERCADO_BR',
  assets: [],
  score: 0.5,
  sources: ['news'],
  countries: ['BR'],
  suggestedTitle: 'Título',
  canvasBlock: 'PROPOSTA_DE_VALOR',
  status: 'BACKLOG',
  priority: 'MEDIA',
  ...over,
});

const cards = [
  card({ id: 'a', score: 0.3, category: 'FII', countries: ['BR'], sources: ['news'], canvasBlock: 'RECURSOS_CHAVE' }),
  card({ id: 'b', score: 0.8, category: 'GEOPOLITICA', countries: ['en', 'BR'], sources: ['wikimedia', 'news'], status: 'PRIORIZADO', canvasBlock: 'CANAIS', suggestedTitle: 'Tarifas' }),
  card({ id: 'c', score: 0.5, category: 'EDUCACAO_FINANCEIRA', countries: ['pt'], sources: ['google-trends'], canvasBlock: 'RELACIONAMENTO' }),
];

test('parseReport rejeita formato inesperado', () => {
  assert.ok(parseReport(null).error);
  assert.ok(parseReport({ cards: [] }).error);
  assert.deepEqual(parseReport({ cards: [], sources: [] }).report, { cards: [], sources: [] });
});

test('sortByScore ordena do maior para o menor sem alterar a entrada', () => {
  assert.deepEqual(sortByScore(cards).map((c) => c.id), ['b', 'c', 'a']);
  assert.equal(cards[0].id, 'a');
});

test('filterCards combina filtros e ignora os vazios', () => {
  assert.equal(filterCards(cards, {}).length, 3);
  assert.deepEqual(filterCards(cards, { pais: 'BR' }).map((c) => c.id), ['a', 'b']);
  assert.deepEqual(filterCards(cards, { fonte: 'news', scoreMin: '0.6' }).map((c) => c.id), ['b']);
  assert.deepEqual(filterCards(cards, { categoria: 'FII', scoreMin: '' }).map((c) => c.id), ['a']);
});

test('groupByKanban tem todas as colunas, ordenadas por score', () => {
  const g = groupByKanban(cards);
  assert.deepEqual(Object.keys(g), KANBAN_COLUMNS);
  assert.deepEqual(g.BACKLOG.map((c) => c.id), ['c', 'a']);
  assert.deepEqual(g.PRIORIZADO.map((c) => c.id), ['b']);
  assert.deepEqual(g.PUBLICADO, []);
});

test('groupByCanvas preenche os 9 blocos', () => {
  const b = groupByCanvas(cards);
  assert.deepEqual(Object.keys(b).sort(), CANVAS_BLOCKS.map(([k]) => k).sort());
  assert.deepEqual(b.CANAIS, ['Tarifas']);
  assert.equal(b.ATIVIDADES_CHAVE[0], 'Produzir: Tarifas');
  assert.ok(b.SEGMENTOS.includes('Investidor de renda passiva (FIIs)'));
  assert.ok(b.FONTES_DE_RECEITA.length > 0);
});

test('filterOptions devolve valores distintos e ordenados', () => {
  const o = filterOptions(cards);
  assert.deepEqual(o.paises, ['BR', 'en', 'pt']);
  assert.deepEqual(o.fontes, ['google-trends', 'news', 'wikimedia']);
});

test('safeInternalUrl só aceita links internos conhecidos', () => {
  assert.equal(safeInternalUrl('cotacoes.html?ticker=PETR4'), 'cotacoes.html?ticker=PETR4');
  assert.equal(safeInternalUrl('tendencias.html'), 'tendencias.html');
  assert.equal(safeInternalUrl('javascript:alert(1)'), './');
  assert.equal(safeInternalUrl('https://evil.example'), './');
  assert.equal(safeInternalUrl(undefined), './');
});

test('formatação pt-BR', () => {
  assert.equal(formatScore(0.6969), '0,70');
  assert.equal(formatChange(0.26), '+0,26%');
  assert.equal(formatChange(-0.8), '-0,80%');
});

test('o JSON de exemplo em data/tendencias segue o contrato do fin-trends-scraper', () => {
  const json = JSON.parse(readFileSync(new URL('../data/tendencias/trends-latest.json', import.meta.url), 'utf8'));
  const { report, error } = parseReport(json);
  assert.equal(error, undefined);
  assert.ok(report.cards.length > 0);
  for (const c of report.cards) {
    assert.ok(KANBAN_COLUMNS.includes(c.status), c.status);
    assert.ok(CANVAS_BLOCKS.some(([k]) => k === c.canvasBlock), c.canvasBlock);
    assert.equal(typeof c.score, 'number');
    assert.ok(Array.isArray(c.sources) && Array.isArray(c.countries) && Array.isArray(c.assets));
  }
});

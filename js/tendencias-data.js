// Funções puras da página Tendências (sem DOM), testadas em tests/tendencias-data.test.js.

export const DATA_URL = 'data/tendencias/trends-latest.json';

export const KANBAN_COLUMNS = ['BACKLOG', 'PRIORIZADO', 'EM_PESQUISA', 'EM_REDACAO', 'REVISAO_SEO', 'PUBLICADO'];

export const KANBAN_LABELS = {
  BACKLOG: 'Backlog',
  PRIORIZADO: 'Priorizado',
  EM_PESQUISA: 'Em pesquisa',
  EM_REDACAO: 'Em redação',
  REVISAO_SEO: 'Revisão SEO',
  PUBLICADO: 'Publicado',
};

// Ordem clássica do Business Model Canvas (grade de 5 colunas + 2 na base).
export const CANVAS_BLOCKS = [
  ['PARCERIAS_CHAVE', 'Parcerias-chave'],
  ['ATIVIDADES_CHAVE', 'Atividades-chave'],
  ['RECURSOS_CHAVE', 'Recursos-chave'],
  ['PROPOSTA_DE_VALOR', 'Proposta de valor'],
  ['RELACIONAMENTO', 'Relacionamento'],
  ['CANAIS', 'Canais'],
  ['SEGMENTOS', 'Segmentos de clientes'],
  ['ESTRUTURA_DE_CUSTOS', 'Estrutura de custos'],
  ['FONTES_DE_RECEITA', 'Fontes de receita'],
];

export const CATEGORY_LABELS = {
  MERCADO_BR: 'Mercado BR',
  FII: 'FIIs',
  ACOES: 'Ações',
  MACRO_GLOBAL: 'Macro global',
  GEOPOLITICA: 'Geopolítica',
  COMMODITIES: 'Commodities',
  CRIPTO: 'Cripto',
  EDUCACAO_FINANCEIRA: 'Educação financeira',
};

const PERSONAS = {
  MERCADO_BR: 'Investidor de ações da B3',
  ACOES: 'Investidor de ações da B3',
  FII: 'Investidor de renda passiva (FIIs)',
  MACRO_GLOBAL: 'Investidor atento ao cenário global',
  GEOPOLITICA: 'Investidor atento ao cenário global',
  COMMODITIES: 'Investidor atento ao cenário global',
  CRIPTO: 'Investidor de criptoativos',
  EDUCACAO_FINANCEIRA: 'Iniciante em investimentos',
};

const STATIC_BLOCKS = {
  PARCERIAS_CHAVE: ['Provedores de dados abertos: Google Trends, Wikimedia, BCB e feeds de notícias'],
  FONTES_DE_RECEITA: ['Anúncios nas páginas de maior tráfego', 'Afiliados de corretoras nas pautas transacionais'],
  ESTRUTURA_DE_CUSTOS: ['Tempo de redação e revisão', 'Infraestrutura gratuita (GitHub Actions + Pages)'],
};

/** Valida o formato mínimo do relatório e devolve { report } ou { error }. */
export function parseReport(json) {
  if (!json || !Array.isArray(json.cards) || !Array.isArray(json.sources)) {
    return { error: 'Relatório de tendências em formato inesperado.' };
  }
  return { report: json };
}

export function sortByScore(cards) {
  return [...cards].sort((a, b) => b.score - a.score || a.id.localeCompare(b.id));
}

/** Filtros vazios (''/undefined) não restringem. */
export function filterCards(cards, { categoria, pais, fonte, scoreMin } = {}) {
  return cards.filter(
    (c) =>
      (!categoria || c.category === categoria) &&
      (!pais || c.countries.includes(pais)) &&
      (!fonte || c.sources.includes(fonte)) &&
      (scoreMin == null || scoreMin === '' || c.score >= Number(scoreMin)),
  );
}

export function groupByKanban(cards) {
  const groups = Object.fromEntries(KANBAN_COLUMNS.map((k) => [k, []]));
  for (const c of sortByScore(cards)) (groups[c.status] ??= []).push(c);
  return groups;
}

/** Cada bloco do Canvas recebe os cards ligados a ele; Segmentos vem das personas das categorias presentes. */
export function groupByCanvas(cards) {
  const blocks = Object.fromEntries(CANVAS_BLOCKS.map(([k]) => [k, []]));
  const sorted = sortByScore(cards);
  for (const c of sorted) blocks[c.canvasBlock]?.push(c.suggestedTitle);
  blocks.ATIVIDADES_CHAVE = sorted.slice(0, 5).map((c) => `Produzir: ${c.suggestedTitle}`);
  blocks.SEGMENTOS = [...new Set(sorted.map((c) => PERSONAS[c.category]).filter(Boolean))];
  for (const [k, lines] of Object.entries(STATIC_BLOCKS)) blocks[k] = [...lines, ...blocks[k]];
  return blocks;
}

/** Valores distintos para popular os filtros. */
export function filterOptions(cards) {
  const uniq = (arr) => [...new Set(arr)].sort((a, b) => a.localeCompare(b));
  return {
    categorias: uniq(cards.map((c) => c.category)),
    paises: uniq(cards.flatMap((c) => c.countries)),
    fontes: uniq(cards.flatMap((c) => c.sources)),
  };
}

/** Só segue links internos relativos conhecidos (o JSON vem de fora do site). */
export function safeInternalUrl(url) {
  return /^(\.\/|cotacoes\.html(\?ticker=[A-Z]{4}\d{1,2})?|tendencias\.html)$/.test(url ?? '') ? url : './';
}

export function formatScore(score) {
  return score.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function formatChange(pct) {
  const s = pct.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return `${pct > 0 ? '+' : ''}${s}%`;
}

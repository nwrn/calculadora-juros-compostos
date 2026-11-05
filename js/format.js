/**
 * Utilitários de formatação e leitura de números no padrão pt-BR.
 */

const currencyFormatter = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
const compactFormatter = new Intl.NumberFormat('pt-BR', { notation: 'compact', maximumFractionDigits: 1 });
const percentFormatter = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 4 });

export const formatCurrency = (value) => currencyFormatter.format(value);
export const formatCompact = (value) => compactFormatter.format(value);
export const formatPercent = (value) => `${percentFormatter.format(value)}%`;

/**
 * Converte texto digitado ("1.234,56", "1234.56", "R$ 1.000") em número.
 * Retorna NaN se não for possível interpretar. String vazia vira 0.
 * @param {string} text
 * @returns {number}
 */
export function parseNumber(text) {
  const clean = String(text).replace(/[R$\s%]/g, '');
  if (clean === '') return 0;
  let normalized = clean;
  if (clean.includes(',')) {
    // Padrão brasileiro: ponto é milhar, vírgula é decimal.
    normalized = clean.replace(/\./g, '').replace(',', '.');
  } else if (/^\d{1,3}(\.\d{3})+$/.test(clean)) {
    // "1.000.000" sem vírgula: pontos de milhar.
    normalized = clean.replace(/\./g, '');
  }
  if (!/^-?\d*\.?\d+$/.test(normalized)) return NaN;
  return Number(normalized);
}

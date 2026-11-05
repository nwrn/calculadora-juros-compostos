/**
 * Renderização da tabela detalhada (mensal ou anual).
 */
import { toYearly } from './calculator.js';
import { formatCurrency } from './format.js';

/**
 * @param {HTMLTableSectionElement} tbody
 * @param {HTMLElement} periodHeader cabeçalho da primeira coluna
 * @param {Array} rows linhas mensais vindas de `simulate`
 * @param {'anos'|'meses'} mode
 */
export function renderTable(tbody, periodHeader, rows, mode) {
  const data = mode === 'anos' ? toYearly(rows) : rows.slice(1);
  periodHeader.textContent = mode === 'anos' ? 'Ano' : 'Mês';

  const fragment = document.createDocumentFragment();
  for (const row of data) {
    const tr = document.createElement('tr');
    const label = mode === 'anos' ? row.year : row.month;
    const cells = [
      label,
      formatCurrency(row.interest),
      formatCurrency(row.invested),
      formatCurrency(row.totalInterest),
      formatCurrency(row.balance),
    ];
    cells.forEach((text, index) => {
      const cell = document.createElement(index === 0 ? 'th' : 'td');
      if (index === 0) cell.scope = 'row';
      cell.textContent = text;
      tr.append(cell);
    });
    fragment.append(tr);
  }
  tbody.replaceChildren(fragment);
}

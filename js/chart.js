/**
 * Gráfico de área empilhada em SVG puro (sem dependências).
 * Camada inferior: total investido. Camada superior: juros acumulados.
 */
import { formatCompact, formatCurrency } from './format.js';

const SVG_NS = 'http://www.w3.org/2000/svg';
const MARGIN = { top: 12, right: 12, bottom: 28, left: 56 };

function el(name, attrs = {}) {
  const node = document.createElementNS(SVG_NS, name);
  for (const [key, value] of Object.entries(attrs)) node.setAttribute(key, value);
  return node;
}

/** Calcula um valor máximo "redondo" e os ticks do eixo Y. */
function niceTicks(max, count = 5) {
  if (max <= 0) return [0, 1];
  const rawStep = max / count;
  const magnitude = Math.pow(10, Math.floor(Math.log10(rawStep)));
  const step = [1, 2, 2.5, 5, 10].map((m) => m * magnitude).find((s) => s >= rawStep);
  const ticks = [];
  for (let v = 0; v <= max + step * 0.001; v += step) ticks.push(v);
  if (ticks[ticks.length - 1] < max) ticks.push(ticks[ticks.length - 1] + step);
  return ticks;
}

function periodLabel(month) {
  if (month === 0) return 'Início';
  const years = Math.floor(month / 12);
  const months = month % 12;
  const parts = [];
  if (years) parts.push(`${years} ${years === 1 ? 'ano' : 'anos'}`);
  if (months) parts.push(`${months} ${months === 1 ? 'mês' : 'meses'}`);
  return parts.join(' e ');
}

/**
 * Cria o gráfico dentro de `container`. Retorna a função `update(rows)`.
 * @param {HTMLElement} container
 */
export function createChart(container) {
  let rows = [];
  const tooltip = document.createElement('div');
  tooltip.className = 'chart__tooltip';
  tooltip.hidden = true;

  const legend = document.createElement('div');
  legend.className = 'chart-legend';
  legend.setAttribute('aria-hidden', 'true');
  legend.innerHTML =
    '<span><i class="dot dot--invested"></i>Total investido</span>' +
    '<span><i class="dot dot--interest"></i>Total em juros</span>';
  container.after(legend);

  function render() {
    container.replaceChildren();
    if (rows.length < 2) return;

    const width = container.clientWidth;
    const height = container.clientHeight;
    const innerW = width - MARGIN.left - MARGIN.right;
    const innerH = height - MARGIN.top - MARGIN.bottom;
    const last = rows[rows.length - 1];
    const ticks = niceTicks(Math.max(...rows.map((r) => r.balance)));
    const yMax = ticks[ticks.length - 1];

    const x = (month) => MARGIN.left + (month / last.month) * innerW;
    const y = (value) => MARGIN.top + innerH - (value / yMax) * innerH;

    const svg = el('svg', { viewBox: `0 0 ${width} ${height}`, 'aria-hidden': 'true' });

    // Grade e eixo Y
    const grid = el('g', { class: 'grid' });
    const axis = el('g', { class: 'axis' });
    for (const tick of ticks) {
      grid.append(el('line', { x1: MARGIN.left, x2: width - MARGIN.right, y1: y(tick), y2: y(tick) }));
      const label = el('text', { x: MARGIN.left - 8, y: y(tick) + 4, 'text-anchor': 'end' });
      label.textContent = formatCompact(tick);
      axis.append(label);
    }

    // Eixo X: até ~6 rótulos, em anos quando o período é longo
    const useYears = last.month >= 24;
    const unit = useYears ? 12 : 1;
    const totalUnits = Math.floor(last.month / unit);
    const stepUnits = Math.max(1, Math.ceil(totalUnits / Math.max(2, Math.floor(innerW / 70))));
    for (let u = 0; u <= totalUnits; u += stepUnits) {
      const label = el('text', { x: x(u * unit), y: height - 8, 'text-anchor': 'middle' });
      label.textContent = u === 0 ? '0' : useYears ? `${u}a` : `${u}m`;
      axis.append(label);
    }

    // Áreas e linhas
    const pts = (fn) => rows.map((r) => `${x(r.month)},${y(fn(r))}`).join(' ');
    const baseline = `${x(last.month)},${y(0)} ${x(0)},${y(0)}`;
    const investedLine = pts((r) => r.invested);
    const totalLine = pts((r) => r.balance);
    const investedReversed = rows.map((r) => `${x(r.month)},${y(r.invested)}`).reverse().join(' ');

    svg.append(
      grid,
      el('polygon', { class: 'area--invested', points: `${investedLine} ${baseline}` }),
      el('polygon', { class: 'area--interest', points: `${totalLine} ${investedReversed}` }),
      el('polyline', { class: 'line--invested', points: investedLine }),
      el('polyline', { class: 'line--total', points: totalLine }),
      axis,
    );

    // Cursor interativo
    const cursor = el('line', { class: 'cursor', y1: MARGIN.top, y2: MARGIN.top + innerH, visibility: 'hidden' });
    const dot = el('circle', { class: 'cursor-dot', r: 4.5, visibility: 'hidden' });
    svg.append(cursor, dot);

    const show = (clientX) => {
      const rect = svg.getBoundingClientRect();
      const px = ((clientX - rect.left) / rect.width) * width;
      const month = Math.round(((px - MARGIN.left) / innerW) * last.month);
      const row = rows[Math.min(Math.max(month, 0), last.month)];
      const cx = x(row.month);
      cursor.setAttribute('x1', cx);
      cursor.setAttribute('x2', cx);
      dot.setAttribute('cx', cx);
      dot.setAttribute('cy', y(row.balance));
      cursor.setAttribute('visibility', 'visible');
      dot.setAttribute('visibility', 'visible');

      tooltip.innerHTML = `
        <strong>${periodLabel(row.month)}</strong>
        <span><i class="dot dot--invested"></i>Investido: ${formatCurrency(row.invested)}</span>
        <span><i class="dot dot--interest"></i>Juros: ${formatCurrency(row.totalInterest)}</span>
        <span>Saldo: <b>${formatCurrency(row.balance)}</b></span>`;
      tooltip.hidden = false;
      const tipW = tooltip.offsetWidth;
      const left = cx + 12 + tipW > width ? cx - 12 - tipW : cx + 12;
      tooltip.style.left = `${Math.max(0, left)}px`;
    };
    const hide = () => {
      cursor.setAttribute('visibility', 'hidden');
      dot.setAttribute('visibility', 'hidden');
      tooltip.hidden = true;
    };

    svg.addEventListener('pointermove', (e) => show(e.clientX));
    svg.addEventListener('pointerdown', (e) => show(e.clientX));
    svg.addEventListener('pointerleave', hide);

    container.append(svg, tooltip);
  }

  new ResizeObserver(() => render()).observe(container);

  return {
    update(newRows) {
      rows = newRows;
      const last = rows[rows.length - 1];
      container.setAttribute(
        'aria-label',
        `Gráfico da evolução do patrimônio: em ${periodLabel(last.month)} o saldo chega a ` +
          `${formatCurrency(last.balance)}, sendo ${formatCurrency(last.invested)} investidos ` +
          `e ${formatCurrency(last.totalInterest)} em juros.`,
      );
      render();
    },
  };
}

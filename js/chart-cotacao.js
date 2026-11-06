const PADDING = { top: 20, right: 16, bottom: 36, left: 60 };

export function renderHistoryChart(container, points) {
  container.innerHTML = '';
  if (!points || points.length < 2) {
    container.innerHTML = '<p class="grafico-vazio">Dados insuficientes para o gráfico.</p>';
    return;
  }

  const draw = () => {
    container.innerHTML = '';
    const W = container.clientWidth || 600;
    const H = 220;
    const iW = W - PADDING.left - PADDING.right;
    const iH = H - PADDING.top - PADDING.bottom;

    const closes = points.map(p => p.close);
    const minV = Math.min(...closes);
    const maxV = Math.max(...closes);
    const rangeV = maxV - minV || 1;
    const pad = rangeV * 0.05;
    const lo = minV - pad;
    const hi = maxV + pad;

    const x = i => (i / (points.length - 1)) * iW;
    const y = v => iH - ((v - lo) / (hi - lo)) * iH;

    const rising = closes[closes.length - 1] >= closes[0];
    const lineColor = rising ? 'var(--interest)' : 'var(--danger)';
    const gradId = `grad-${Math.random().toString(36).slice(2)}`;

    const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${x(i).toFixed(1)},${y(p.close).toFixed(1)}`).join(' ');
    const areaD = `${pathD} L${x(points.length - 1).toFixed(1)},${iH} L0,${iH} Z`;

    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
    svg.setAttribute('width', W);
    svg.setAttribute('height', H);
    svg.setAttribute('role', 'img');
    svg.setAttribute('aria-label', 'Gráfico de preços históricos');

    svg.innerHTML = `
      <defs>
        <linearGradient id="${gradId}" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="${lineColor}" stop-opacity="0.18"/>
          <stop offset="100%" stop-color="${lineColor}" stop-opacity="0.01"/>
        </linearGradient>
      </defs>
      <g transform="translate(${PADDING.left},${PADDING.top})">
        ${yAxisLines(iW, iH, lo, hi)}
        <path d="${areaD}" fill="url(#${gradId})" stroke="none"/>
        <path d="${pathD}" fill="none" stroke="${lineColor}" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>
        ${xAxisLabels(points, iW, iH, x)}
        ${yAxisLabels(iW, iH, lo, hi)}
        <line class="grafico-crosshair-v" x1="-999" x2="-999" y1="0" y2="${iH}" stroke="var(--border)" stroke-width="1" stroke-dasharray="4 3"/>
        <circle class="grafico-dot" cx="-999" cy="-999" r="4" fill="${lineColor}" stroke="var(--surface)" stroke-width="2"/>
      </g>`;

    const tooltip = document.createElement('div');
    tooltip.className = 'grafico-tooltip';
    tooltip.hidden = true;
    container.appendChild(svg);
    container.appendChild(tooltip);

    svg.addEventListener('mousemove', (e) => {
      const rect = svg.getBoundingClientRect();
      const mx = e.clientX - rect.left - PADDING.left;
      const idx = Math.max(0, Math.min(points.length - 1, Math.round((mx / iW) * (points.length - 1))));
      const p = points[idx];
      const px = x(idx);
      const py = y(p.close);

      svg.querySelector('.grafico-crosshair-v').setAttribute('x1', px);
      svg.querySelector('.grafico-crosshair-v').setAttribute('x2', px);
      svg.querySelector('.grafico-dot').setAttribute('cx', px);
      svg.querySelector('.grafico-dot').setAttribute('cy', py);

      tooltip.hidden = false;
      tooltip.innerHTML = `<span class="grafico-tooltip-date">${formatDate(p.date)}</span><span class="grafico-tooltip-price">${formatBRL(p.close)}</span>`;

      const tipW = tooltip.offsetWidth;
      let left = PADDING.left + px + 10;
      if (left + tipW > W - 8) left = PADDING.left + px - tipW - 10;
      tooltip.style.left = `${left}px`;
      tooltip.style.top = `${PADDING.top + py - tooltip.offsetHeight / 2}px`;
    });

    svg.addEventListener('mouseleave', () => {
      tooltip.hidden = true;
      svg.querySelector('.grafico-crosshair-v').setAttribute('x1', '-999');
      svg.querySelector('.grafico-crosshair-v').setAttribute('x2', '-999');
      svg.querySelector('.grafico-dot').setAttribute('cx', '-999');
      svg.querySelector('.grafico-dot').setAttribute('cy', '-999');
    });
  };

  draw();

  const ro = new ResizeObserver(draw);
  ro.observe(container);
  container._roCleanup = () => ro.disconnect();
}

function yAxisLines(iW, iH, lo, hi) {
  const steps = 4;
  return Array.from({ length: steps + 1 }, (_, i) => {
    const yv = (i / steps) * iH;
    return `<line x1="0" x2="${iW}" y1="${yv.toFixed(1)}" y2="${yv.toFixed(1)}" stroke="var(--border)" stroke-width="0.5"/>`;
  }).join('');
}

function yAxisLabels(iW, iH, lo, hi) {
  const steps = 4;
  return Array.from({ length: steps + 1 }, (_, i) => {
    const frac = i / steps;
    const yv = frac * iH;
    const val = hi - frac * (hi - lo);
    return `<text x="-8" y="${(yv + 4).toFixed(1)}" text-anchor="end" class="grafico-axis-label">${formatBRLCompact(val)}</text>`;
  }).join('');
}

function xAxisLabels(points, iW, iH, x) {
  const count = Math.min(6, points.length);
  const step = Math.floor((points.length - 1) / (count - 1));
  return Array.from({ length: count }, (_, i) => {
    const idx = Math.min(i * step, points.length - 1);
    const xv = x(idx);
    return `<text x="${xv.toFixed(1)}" y="${(iH + 20).toFixed(1)}" text-anchor="middle" class="grafico-axis-label">${formatDateShort(points[idx].date)}</text>`;
  }).join('');
}

function formatBRL(v) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);
}

function formatBRLCompact(v) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(v);
}

function formatDate(iso) {
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
}

function formatDateShort(iso) {
  const [, m, d] = iso.split('-');
  return `${d}/${m}`;
}

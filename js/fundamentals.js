const API_BASE = 'http://localhost:8080';

const HIGHLIGHTS = [
  { key: 'pl',  label: 'P/L',  fmt: 'x',   tip: 'Preço/Lucro: quantas vezes o preço cobre o lucro por ação. Quanto menor, mais barata a ação em relação ao lucro.' },
  { key: 'pvp', label: 'P/VP', fmt: 'x',   tip: 'Preço/Valor Patrimonial: compara o preço de mercado com o patrimônio líquido. P/VP < 1 pode indicar subavaliação.' },
  { key: 'dy',  label: 'DY',   fmt: '%',   tip: 'Dividend Yield: retorno em dividendos em relação ao preço atual. Calculado sobre os últimos 12 meses.' },
  { key: 'roe', label: 'ROE',  fmt: '%',   tip: 'Retorno sobre Patrimônio Líquido: mede a eficiência em gerar lucro com o capital dos acionistas.' },
];

const TABS = [
  {
    id: 'valuation',
    label: 'Valuation',
    indicators: [
      { key: 'pl',  label: 'P/L',  fmt: 'x',  tip: 'Preço/Lucro: vezes que o preço cobre o lucro por ação.' },
      { key: 'pvp', label: 'P/VP', fmt: 'x',  tip: 'Preço/Valor Patrimonial: preço vs. patrimônio líquido por ação.' },
      { key: 'dy',  label: 'DY',   fmt: '%',  tip: 'Dividend Yield: dividendos pagos / preço × 100.' },
      { key: 'eps', label: 'LPA',  fmt: 'R$', tip: 'Lucro por Ação: lucro líquido dividido pelo número de ações.' },
      { key: 'beta',label: 'Beta', fmt: 'x',  tip: 'Volatilidade em relação ao mercado. Beta > 1 = mais volátil que o índice.' },
      { key: 'marketCap', label: 'Valor de Mercado', fmt: 'B', tip: 'Capitalização de mercado: preço × total de ações em circulação.' },
    ],
  },
  {
    id: 'rentabilidade',
    label: 'Rentabilidade',
    indicators: [
      { key: 'roe',            label: 'ROE',              fmt: '%', tip: 'Retorno sobre Patrimônio Líquido.' },
      { key: 'roa',            label: 'ROA',              fmt: '%', tip: 'Retorno sobre Ativos: lucro / ativos totais × 100.' },
      { key: 'grossMargin',    label: 'Margem Bruta',     fmt: '%', tip: 'Receita líquida menos custo dos produtos / receita.' },
      { key: 'operatingMargin',label: 'Margem Operacional', fmt: '%', tip: 'Lucro operacional / receita líquida × 100.' },
    ],
  },
  {
    id: 'endividamento',
    label: 'Endividamento',
    indicators: [
      { key: 'debtToEquity', label: 'Dívida/PL', fmt: 'x', tip: 'Dívida total / patrimônio líquido. Indica a alavancagem da empresa.' },
    ],
  },
  {
    id: 'crescimento',
    label: 'Crescimento',
    indicators: [
      { key: 'revenueGrowth',  label: 'Cresc. Receita', fmt: '%', tip: 'Crescimento da receita líquida nos últimos 12 meses.' },
      { key: 'earningsGrowth', label: 'Cresc. Lucro',   fmt: '%', tip: 'Crescimento do lucro líquido nos últimos 12 meses.' },
    ],
  },
];

export async function loadFundamentals(ticker, assetType) {
  if (assetType !== 'stocks') {
    document.getElementById('fundamentals-wrap').hidden = true;
    return;
  }

  const wrap = document.getElementById('fundamentals-wrap');
  wrap.hidden = false;
  wrap.querySelector('#fundamentals-body').innerHTML =
    '<p class="cotacao-loading" style="padding:16px 0">Carregando indicadores<span aria-hidden="true">…</span></p>';
  wrap.querySelector('#fundamentals-company').textContent = '';

  try {
    const res = await fetch(`${API_BASE}/stocks/${encodeURIComponent(ticker)}/fundamentals`);
    if (!res.ok) throw new Error(res.status);
    const data = await res.json();
    renderFundamentals(data);
  } catch {
    wrap.querySelector('#fundamentals-body').innerHTML =
      '<p class="fund-error">Indicadores indisponíveis no momento.</p>';
  }
}

function fmt(value, format) {
  if (value == null) return 'N/D';
  switch (format) {
    case '%':  return value.toFixed(1) + '%';
    case 'x':  return value.toFixed(2) + '×';
    case 'R$': return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
    case 'B': {
      if (Math.abs(value) >= 1e12) return 'R$ ' + (value / 1e12).toFixed(1) + ' tri';
      if (Math.abs(value) >= 1e9)  return 'R$ ' + (value / 1e9).toFixed(1) + ' bi';
      if (Math.abs(value) >= 1e6)  return 'R$ ' + (value / 1e6).toFixed(1) + ' mi';
      return 'R$ ' + value.toFixed(0);
    }
    default: return String(value);
  }
}

function renderFundamentals(data) {
  const wrap = document.getElementById('fundamentals-wrap');

  const companyEl = wrap.querySelector('#fundamentals-company');
  const parts = [data.name, data.sector].filter(Boolean);
  companyEl.textContent = parts.join('  •  ');

  const highlightsHtml = HIGHLIGHTS.map(h => `
    <div class="fund-highlight">
      <span class="fund-highlight__label">
        ${h.label}
        <button class="fund-tip-btn" aria-label="Sobre ${h.label}" data-tip="${escHtml(h.tip)}">?</button>
      </span>
      <span class="fund-highlight__value ${data[h.key] == null ? 'fund-nd' : ''}">${fmt(data[h.key], h.fmt)}</span>
    </div>
  `).join('');

  const activeTab = wrap.querySelector('.fund-tab-btn.fund-tab-btn--active')?.dataset.tab || TABS[0].id;

  const tabBtns = TABS.map(t => `
    <button class="fund-tab-btn ${t.id === activeTab ? 'fund-tab-btn--active' : ''}" data-tab="${t.id}">${t.label}</button>
  `).join('');

  const activeIndicators = TABS.find(t => t.id === activeTab)?.indicators ?? [];
  const gridHtml = renderGrid(activeIndicators, data);

  wrap.querySelector('#fundamentals-body').innerHTML = `
    <div class="fund-highlights">${highlightsHtml}</div>
    <div class="fund-tabs" role="tablist">${tabBtns}</div>
    <div class="fund-grid" id="fund-grid">${gridHtml}</div>
  `;

  wrap.querySelectorAll('.fund-tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      wrap.querySelectorAll('.fund-tab-btn').forEach(b => b.classList.remove('fund-tab-btn--active'));
      btn.classList.add('fund-tab-btn--active');
      const tab = TABS.find(t => t.id === btn.dataset.tab);
      wrap.querySelector('#fund-grid').innerHTML = renderGrid(tab.indicators, data);
      bindTooltips(wrap);
    });
  });

  bindTooltips(wrap);
}

function renderGrid(indicators, data) {
  return indicators.map(ind => `
    <div class="fund-indicator">
      <span class="fund-indicator__label">
        ${ind.label}
        <button class="fund-tip-btn" aria-label="Sobre ${ind.label}" data-tip="${escHtml(ind.tip)}">?</button>
      </span>
      <span class="fund-indicator__value ${data[ind.key] == null ? 'fund-nd' : ''}">${fmt(data[ind.key], ind.fmt)}</span>
    </div>
  `).join('');
}

function bindTooltips(container) {
  container.querySelectorAll('.fund-tip-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const existing = container.querySelector('.fund-popover');
      if (existing && existing.dataset.for === btn.dataset.tip) {
        existing.remove();
        return;
      }
      if (existing) existing.remove();

      const pop = document.createElement('div');
      pop.className = 'fund-popover';
      pop.dataset.for = btn.dataset.tip;
      pop.textContent = btn.dataset.tip;
      btn.insertAdjacentElement('afterend', pop);

      const dismiss = (ev) => {
        if (!pop.contains(ev.target) && ev.target !== btn) {
          pop.remove();
          document.removeEventListener('click', dismiss);
        }
      };
      setTimeout(() => document.addEventListener('click', dismiss), 0);
    });
  });
}

function escHtml(str) {
  return str.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
